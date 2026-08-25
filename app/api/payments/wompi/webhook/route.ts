import {
  getPaymentOrder,
  markOperationsNotified,
  updatePaymentOrder,
} from "@/lib/payment-store";
import {
  verifyWompiWebhook,
  wompiConfigurationStatus,
  type WompiWebhookPayload,
} from "@/lib/wompi";
import {
  notifyApprovedPayment,
  whatsappOperationsConfigured,
} from "@/lib/whatsapp-operations";

export async function POST(request: Request) {
  let payload: WompiWebhookPayload;
  try {
    payload = (await request.json()) as WompiWebhookPayload;
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  try {
    if (!verifyWompiWebhook(payload, request.headers.get("x-event-checksum"))) {
      return Response.json({ error: "Firma de evento inválida." }, { status: 401 });
    }

    const configuredEnvironment = wompiConfigurationStatus().environment;
    const expectedEnvironment =
      configuredEnvironment === "production" ? "prod" : "test";
    if (payload.environment !== expectedEnvironment) {
      return Response.json({ error: "Ambiente de Wompi incorrecto." }, { status: 409 });
    }

    if (payload.event !== "transaction.updated" || !payload.data.transaction) {
      return Response.json({ received: true });
    }

    const transaction = payload.data.transaction;
    const order = await getPaymentOrder(transaction.reference);
    if (!order) return Response.json({ received: true });

    if (
      transaction.currency !== "COP" ||
      order.total_amount_cents !== transaction.amount_in_cents
    ) {
      console.error("Evento Wompi con monto o moneda discordante", {
        reference: transaction.reference,
        transactionId: transaction.id,
      });
      return Response.json({ error: "Conciliación inválida." }, { status: 409 });
    }

    await updatePaymentOrder({
      reference: transaction.reference,
      status: transaction.status,
      transactionId: transaction.id,
      paymentMethodType: transaction.payment_method_type,
    });

    if (
      transaction.status === "APPROVED" &&
      !order.operations_notified_at &&
      whatsappOperationsConfigured()
    ) {
      const approvedOrder = {
        ...order,
        status: transaction.status,
        wompi_transaction_id: transaction.id,
        payment_method_type: transaction.payment_method_type ?? null,
      };
      await notifyApprovedPayment(approvedOrder);
      await markOperationsNotified(transaction.reference);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Error procesando webhook de Wompi", error);
    return Response.json(
      { error: "El evento no pudo procesarse." },
      { status: 500 },
    );
  }
}
