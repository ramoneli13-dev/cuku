import { getPaymentOrder, updatePaymentOrder } from "@/lib/payment-store";
import { getWompiTransaction } from "@/lib/wompi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id || id.length > 120) {
    return Response.json({ error: "Transacción inválida." }, { status: 400 });
  }

  try {
    const transaction = await getWompiTransaction(id);
    const order = await getPaymentOrder(transaction.reference);
    if (
      !order ||
      order.total_amount_cents !== transaction.amount_in_cents ||
      transaction.currency !== "COP"
    ) {
      return Response.json(
        { error: "La transacción no coincide con una orden válida de Cúku." },
        { status: 409 },
      );
    }

    await updatePaymentOrder({
      reference: transaction.reference,
      status: transaction.status,
      transactionId: transaction.id,
      paymentMethodType: transaction.payment_method_type,
    });

    return Response.json({
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
      amountInCents: transaction.amount_in_cents,
    });
  } catch (error) {
    console.error("No fue posible consultar la transacción", error);
    return Response.json(
      { error: "No pudimos confirmar el estado del pago todavía." },
      { status: 502 },
    );
  }
}

