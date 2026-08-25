import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createPaymentOrder } from "@/lib/payment-store";
import {
  createCheckoutSignature,
  getWompiPublicKey,
  wompiConfigurationStatus,
} from "@/lib/wompi";
import { whatsappOperationsConfigured } from "@/lib/whatsapp-operations";

const checkoutSchema = z.object({
  orderDescription: z.string().trim().min(4).max(500),
  customerName: z.string().trim().min(3).max(120),
  customerEmail: z.string().trim().email().max(160),
  customerDocument: z.string().trim().regex(/^\d{5,15}$/),
  productValueCop: z.number().int().min(1_000).max(50_000_000),
  deliveryValueCop: z.number().int().min(0).max(1_000_000),
});

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) {
      return Response.json({ error: "Origen no permitido." }, { status: 403 });
    }

    if (
      !wompiConfigurationStatus().configured ||
      !whatsappOperationsConfigured()
    ) {
      return Response.json(
        { error: "La Pasarela Cúku aún no tiene todas sus credenciales seguras." },
        { status: 503 },
      );
    }

    const input = checkoutSchema.parse(await request.json());
    const reference = `CUKU-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const productAmountInCents = input.productValueCop * 100;
    const deliveryAmountInCents = input.deliveryValueCop * 100;
    const amountInCents = productAmountInCents + deliveryAmountInCents;

    await createPaymentOrder({
      reference,
      order_description: input.orderDescription,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_document: input.customerDocument,
      product_amount_cents: productAmountInCents,
      delivery_amount_cents: deliveryAmountInCents,
      total_amount_cents: amountInCents,
      currency: "COP",
    });

    return Response.json({
      currency: "COP",
      amountInCents,
      reference,
      publicKey: getWompiPublicKey(),
      signature: {
        integrity: createCheckoutSignature(reference, amountInCents),
      },
      customerData: {
        email: input.customerEmail,
        fullName: input.customerName,
        legalId: input.customerDocument,
        legalIdType: "CC",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Revisa los datos y valores de la cotización." },
        { status: 400 },
      );
    }
    console.error("No fue posible crear la sesión de Wompi", error);
    return Response.json(
      { error: "No fue posible iniciar el pago de forma segura." },
      { status: 500 },
    );
  }
}
