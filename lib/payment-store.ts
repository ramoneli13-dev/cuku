import "server-only";

import type { WompiTransactionStatus } from "@/lib/wompi";

export type PaymentOrder = {
  reference: string;
  order_description: string;
  customer_name: string;
  customer_email: string;
  customer_document: string;
  product_amount_cents: number;
  delivery_amount_cents: number;
  total_amount_cents: number;
  currency: "COP";
  status: WompiTransactionStatus;
  wompi_transaction_id: string | null;
  payment_method_type: string | null;
  operations_notified_at: string | null;
};

function configuration() {
  const url = (
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para conciliar pagos.",
    );
  }
  return { url, key };
}

async function request<T>(path: string, init: RequestInit = {}) {
  const { url, key } = configuration();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase rechazó la conciliación (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function createPaymentOrder(
  order: Omit<
    PaymentOrder,
    | "status"
    | "wompi_transaction_id"
    | "payment_method_type"
    | "operations_notified_at"
  >,
) {
  await request<PaymentOrder[]>("cuku_payment_orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(order),
  });
}

export async function getPaymentOrder(reference: string) {
  const query = new URLSearchParams({
    reference: `eq.${reference}`,
    select: "*",
    limit: "1",
  });
  const rows = await request<PaymentOrder[]>(
    `cuku_payment_orders?${query.toString()}`,
  );
  return rows[0] ?? null;
}

export async function updatePaymentOrder(input: {
  reference: string;
  status: WompiTransactionStatus;
  transactionId: string;
  paymentMethodType?: string;
}) {
  const query = new URLSearchParams({ reference: `eq.${input.reference}` });
  await request<PaymentOrder[]>(`cuku_payment_orders?${query.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      status: input.status,
      wompi_transaction_id: input.transactionId,
      payment_method_type: input.paymentMethodType ?? null,
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function markOperationsNotified(reference: string) {
  const query = new URLSearchParams({ reference: `eq.${reference}` });
  await request<PaymentOrder[]>(`cuku_payment_orders?${query.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      operations_notified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
}

