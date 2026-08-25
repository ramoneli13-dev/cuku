import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  createDirectTransferQr,
  directTransferConfiguration,
} from "@/lib/direct-transfer";
import { createTransferPaymentOrder } from "@/lib/transfer-payment-store";
import { whatsappOperationsConfigured } from "@/lib/whatsapp-operations";

const checkoutSchema = z.object({
  orderDescription: z.string().trim().min(4).max(500),
  customerName: z.string().trim().min(3).max(120),
  customerEmail: z.string().trim().email().max(160),
  productValueCop: z.number().int().min(1_000).max(50_000_000),
  deliveryValueCop: z.number().int().min(0).max(1_000_000),
});

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) {
      return Response.json({ error: "Origen no permitido." }, { status: 403 });
    }

    const configuration = directTransferConfiguration();
    if (
      !configuration.configured ||
      !configuration.aiReview ||
      !configuration.bankConfirmation ||
      !whatsappOperationsConfigured()
    ) {
      return Response.json(
        {
          error:
            "El pago por transferencia permanece desactivado hasta completar QR, IA, confirmación bancaria y operaciones.",
        },
        { status: 503 },
      );
    }

    const input = checkoutSchema.parse(await request.json());
    const reference = `CUKU-T-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const productAmountInCents = input.productValueCop * 100;
    const deliveryAmountInCents = input.deliveryValueCop * 100;
    const totalAmountInCents = productAmountInCents + deliveryAmountInCents;
    const callbackUrl = new URL(
      "/api/payments/transfer/bank-confirmation",
      request.url,
    ).toString();
    const qr = await createDirectTransferQr({
      reference,
      amountInCents: totalAmountInCents,
      callbackUrl,
    });

    await createTransferPaymentOrder({
      reference,
      order_description: input.orderDescription,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      product_amount_cents: productAmountInCents,
      delivery_amount_cents: deliveryAmountInCents,
      total_amount_cents: totalAmountInCents,
      currency: "COP",
      qr_mode: qr.mode,
      provider_payment_id: qr.providerPaymentId,
    });

    return Response.json({
      reference,
      amountInCents: totalAmountInCents,
      currency: "COP",
      qr,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Revisa los datos y valores de la cotización." },
        { status: 400 },
      );
    }
    console.error("No fue posible crear la orden de transferencia", error);
    return Response.json(
      { error: "No fue posible iniciar la transferencia de forma segura." },
      { status: 500 },
    );
  }
}
