import { z } from "zod";
import { verifyBankConfirmationSignature } from "@/lib/direct-transfer";
import {
  getTransferPaymentOrder,
  updateTransferPaymentOrder,
} from "@/lib/transfer-payment-store";
import { notifyApprovedTransfer } from "@/lib/whatsapp-operations";

const confirmationSchema = z.object({
  reference: z.string().regex(/^CUKU-T-[A-Za-z0-9-]{8,80}$/),
  providerTransactionId: z.string().min(4).max(180),
  amountInCents: z.number().int().positive(),
  currency: z.literal("COP"),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (
    !verifyBankConfirmationSignature({
      rawBody,
      timestamp: request.headers.get("x-cuku-timestamp"),
      signature: request.headers.get("x-cuku-signature"),
    })
  ) {
    return Response.json({ error: "Firma bancaria inválida." }, { status: 401 });
  }

  try {
    const event = confirmationSchema.parse(JSON.parse(rawBody));
    const order = await getTransferPaymentOrder(event.reference);
    if (!order) return Response.json({ error: "Orden no encontrada." }, { status: 404 });
    if (
      order.total_amount_cents !== event.amountInCents ||
      order.currency !== event.currency
    ) {
      return Response.json({ error: "Monto o moneda no coinciden." }, { status: 409 });
    }

    if (event.status === "REJECTED") {
      await updateTransferPaymentOrder(event.reference, {
        status: "REJECTED",
        bank_transaction_id: event.providerTransactionId,
      });
      return Response.json({ received: true });
    }

    await updateTransferPaymentOrder(event.reference, {
      status: "APPROVED",
      bank_transaction_id: event.providerTransactionId,
    });
    const approvedOrder = {
      ...order,
      status: "APPROVED" as const,
      bank_transaction_id: event.providerTransactionId,
    };
    if (!order.operations_notified_at) {
      await notifyApprovedTransfer(approvedOrder);
      await updateTransferPaymentOrder(event.reference, {
        operations_notified_at: new Date().toISOString(),
      });
    }
    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Evento bancario inválido." }, { status: 400 });
    }
    console.error("Falló la confirmación bancaria", error);
    return Response.json({ error: "No fue posible conciliar el evento." }, { status: 500 });
  }
}
