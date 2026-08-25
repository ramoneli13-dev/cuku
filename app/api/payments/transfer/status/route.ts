import { getTransferPaymentOrder } from "@/lib/transfer-payment-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference")?.trim() ?? "";
  if (!/^CUKU-T-[A-Za-z0-9-]{8,80}$/.test(reference)) {
    return Response.json({ error: "Referencia inválida." }, { status: 400 });
  }
  try {
    const order = await getTransferPaymentOrder(reference);
    if (!order) return Response.json({ error: "Orden no encontrada." }, { status: 404 });
    return Response.json({
      reference: order.reference,
      status: order.status,
      amountInCents: order.total_amount_cents,
    });
  } catch (error) {
    console.error("No fue posible consultar la transferencia", error);
    return Response.json({ error: "No pudimos consultar el pago todavía." }, { status: 502 });
  }
}
