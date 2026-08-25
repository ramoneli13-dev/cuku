import "server-only";

import type { PaymentOrder } from "@/lib/payment-store";
import type { TransferPaymentOrder } from "@/lib/transfer-payment-store";

function formatCopFromCents(amountInCents: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

export function whatsappOperationsConfigured() {
  const operationsNumber = process.env.WHATSAPP_OPERATIONS_NUMBER?.trim() ?? "";
  return Boolean(
    process.env.WHATSAPP_CLOUD_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() &&
      /^\d{10,15}$/.test(operationsNumber),
  );
}

export async function notifyApprovedPayment(order: PaymentOrder) {
  const token = process.env.WHATSAPP_CLOUD_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const operationsNumber = process.env.WHATSAPP_OPERATIONS_NUMBER?.trim();
  if (!token || !phoneNumberId || !operationsNumber) {
    throw new Error("La notificación automática de WhatsApp no está configurada.");
  }

  const message = [
    "✅ *PAGO APROBADO — CÚKU*",
    `Referencia: ${order.reference}`,
    `Cliente: ${order.customer_name}`,
    `Pedido: ${order.order_description}`,
    `Producto: ${formatCopFromCents(order.product_amount_cents)}`,
    `Domicilio: ${formatCopFromCents(order.delivery_amount_cents)}`,
    `*Total recibido: ${formatCopFromCents(order.total_amount_cents)}*`,
    `Método: ${order.payment_method_type ?? "Wompi"}`,
    "Asignar a un repartidor antes de despachar.",
  ].join("\n");

  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v23.0";
  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: operationsNumber,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`WhatsApp rechazó el aviso (${response.status}).`);
  }
}

export async function notifyApprovedTransfer(order: TransferPaymentOrder) {
  const token = process.env.WHATSAPP_CLOUD_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const operationsNumber = process.env.WHATSAPP_OPERATIONS_NUMBER?.trim();
  if (!token || !phoneNumberId || !operationsNumber) {
    throw new Error("La notificación automática de WhatsApp no está configurada.");
  }

  const message = [
    "✅ *[PAGO DE TRANSFERENCIA VALIDADO POR BANCO - RETIRAR PEDIDO]*",
    `Referencia Cúku: ${order.reference}`,
    `Transacción bancaria: ${order.bank_transaction_id ?? "Confirmada"}`,
    `Cliente: ${order.customer_name}`,
    `Pedido: ${order.order_description}`,
    `Producto: ${formatCopFromCents(order.product_amount_cents)}`,
    `Domicilio: ${formatCopFromCents(order.delivery_amount_cents)}`,
    `*Total recibido: ${formatCopFromCents(order.total_amount_cents)}*`,
    "La captura fue preanalizada por IA y el abono fue confirmado por la entidad financiera.",
  ].join("\n");

  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v23.0";
  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: operationsNumber,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`WhatsApp rechazó el aviso (${response.status}).`);
  }
}
