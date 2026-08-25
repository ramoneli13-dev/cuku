import { createHash } from "node:crypto";
import { analyzeTransferReceipt } from "@/lib/receipt-vision";
import {
  getTransferPaymentOrder,
  proofHashExists,
  proofReceiptExists,
  updateTransferPaymentOrder,
} from "@/lib/transfer-payment-store";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasValidMagicBytes(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  return (
    type === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export async function POST(request: Request) {
  let reference = "";
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) {
      return Response.json({ error: "Origen no permitido." }, { status: 403 });
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_IMAGE_BYTES + 300_000) {
      return Response.json({ error: "La imagen supera 4 MB." }, { status: 413 });
    }

    const form = await request.formData();
    reference = String(form.get("reference") ?? "").trim();
    const consent = form.get("aiConsent") === "true";
    const file = form.get("proof");
    if (!/^CUKU-T-[A-Za-z0-9-]{8,80}$/.test(reference)) {
      return Response.json({ error: "Referencia inválida." }, { status: 400 });
    }
    if (!consent) {
      return Response.json(
        { error: "Necesitamos tu autorización para analizar el comprobante." },
        { status: 400 },
      );
    }
    if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { error: "Sube una imagen JPG, PNG o WebP válida." },
        { status: 400 },
      );
    }
    if (file.size < 1_000 || file.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "La imagen debe pesar entre 1 KB y 4 MB." }, { status: 400 });
    }

    const order = await getTransferPaymentOrder(reference);
    if (!order) return Response.json({ error: "Orden no encontrada." }, { status: 404 });
    if (order.status === "APPROVED") {
      return Response.json({ status: "APPROVED", reference });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasValidMagicBytes(bytes, file.type)) {
      return Response.json({ error: "El contenido no coincide con una imagen válida." }, { status: 400 });
    }
    const proofHash = createHash("sha256").update(bytes).digest("hex");
    if (await proofHashExists(proofHash, reference)) {
      await updateTransferPaymentOrder(reference, {
        status: "DUPLICATE_PROOF",
        proof_sha256: proofHash,
      });
      return Response.json(
        { error: "Este comprobante ya fue usado en otra orden.", status: "DUPLICATE_PROOF" },
        { status: 409 },
      );
    }

    await updateTransferPaymentOrder(reference, {
      status: "OCR_PROCESSING",
      proof_sha256: proofHash,
    });
    const analysis = await analyzeTransferReceipt({
      bytes,
      mimeType: file.type,
      expectedAmountCop: order.total_amount_cents / 100,
      expectedReference: reference,
    });
    const normalizedReceiptNumber = analysis.receiptNumber
      ?.replace(/[^A-Za-z0-9-]/g, "")
      .slice(0, 120) || null;
    if (
      normalizedReceiptNumber &&
      (await proofReceiptExists(normalizedReceiptNumber, reference))
    ) {
      await updateTransferPaymentOrder(reference, {
        status: "DUPLICATE_PROOF",
        proof_receipt_number: normalizedReceiptNumber,
        proof_amount_cop: analysis.amountCop,
        proof_status: analysis.status,
        proof_confidence: analysis.confidence,
        proof_analysis: analysis,
      });
      return Response.json(
        {
          error: "Este número de comprobante ya pertenece a otra orden.",
          status: "DUPLICATE_PROOF",
        },
        { status: 409 },
      );
    }
    const amountMatches = analysis.amountCop === order.total_amount_cents / 100;
    const looksComplete =
      analysis.isTransferReceipt &&
      analysis.status === "SUCCESSFUL" &&
      analysis.confidence >= 0.75 &&
      analysis.suspiciousSignals.length === 0 &&
      Boolean(normalizedReceiptNumber);
    const status =
      amountMatches && looksComplete
        ? "AWAITING_BANK_CONFIRMATION"
        : "MANUAL_REVIEW";

    await updateTransferPaymentOrder(reference, {
      status,
      proof_receipt_number: normalizedReceiptNumber,
      proof_amount_cop: analysis.amountCop,
      proof_status: analysis.status,
      proof_confidence: analysis.confidence,
      proof_analysis: analysis,
    });

    return Response.json({
      reference,
      status,
      analysis: {
        amountMatches,
        receiptNumberFound: Boolean(normalizedReceiptNumber),
        visibleStatus: analysis.status,
      },
      message:
        status === "AWAITING_BANK_CONFIRMATION"
          ? "Comprobante leído. Esperando confirmación directa de la entidad financiera."
          : "El comprobante requiere revisión antes de aprobar el pedido.",
    });
  } catch (error) {
    console.error("No fue posible analizar el comprobante", error);
    if (reference) {
      try {
        await updateTransferPaymentOrder(reference, { status: "MANUAL_REVIEW" });
      } catch {
        // La respuesta principal no debe ocultarse por un segundo fallo de persistencia.
      }
    }
    return Response.json(
      { error: "No pudimos analizar el comprobante. Quedó pendiente de revisión." },
      { status: 502 },
    );
  }
}
