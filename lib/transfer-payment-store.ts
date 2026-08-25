import "server-only";

export type TransferPaymentStatus =
  | "AWAITING_TRANSFER"
  | "OCR_PROCESSING"
  | "AWAITING_BANK_CONFIRMATION"
  | "MANUAL_REVIEW"
  | "DUPLICATE_PROOF"
  | "APPROVED"
  | "REJECTED";

export type TransferPaymentOrder = {
  reference: string;
  order_description: string;
  customer_name: string;
  customer_email: string;
  product_amount_cents: number;
  delivery_amount_cents: number;
  total_amount_cents: number;
  currency: "COP";
  status: TransferPaymentStatus;
  qr_mode: "dynamic" | "official-static";
  provider_payment_id: string | null;
  proof_sha256: string | null;
  proof_receipt_number: string | null;
  proof_amount_cop: number | null;
  proof_status: string | null;
  proof_confidence: number | null;
  proof_analysis: Record<string, unknown> | null;
  bank_transaction_id: string | null;
  operations_notified_at: string | null;
};

function configuration() {
  const url = (
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Falta configurar Supabase para conciliar transferencias.");
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

export async function createTransferPaymentOrder(
  order: Omit<
    TransferPaymentOrder,
    | "status"
    | "proof_sha256"
    | "proof_receipt_number"
    | "proof_amount_cop"
    | "proof_status"
    | "proof_confidence"
    | "proof_analysis"
    | "bank_transaction_id"
    | "operations_notified_at"
  >,
) {
  await request<TransferPaymentOrder[]>("cuku_transfer_payment_orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(order),
  });
}

export async function getTransferPaymentOrder(reference: string) {
  const query = new URLSearchParams({
    reference: `eq.${reference}`,
    select: "*",
    limit: "1",
  });
  const rows = await request<TransferPaymentOrder[]>(
    `cuku_transfer_payment_orders?${query.toString()}`,
  );
  return rows[0] ?? null;
}

export async function proofHashExists(hash: string, exceptReference: string) {
  const query = new URLSearchParams({
    proof_sha256: `eq.${hash}`,
    reference: `neq.${exceptReference}`,
    select: "reference",
    limit: "1",
  });
  const rows = await request<Array<{ reference: string }>>(
    `cuku_transfer_payment_orders?${query.toString()}`,
  );
  return rows.length > 0;
}

export async function proofReceiptExists(receiptNumber: string, exceptReference: string) {
  const query = new URLSearchParams({
    proof_receipt_number: `eq.${receiptNumber}`,
    reference: `neq.${exceptReference}`,
    select: "reference",
    limit: "1",
  });
  const rows = await request<Array<{ reference: string }>>(
    `cuku_transfer_payment_orders?${query.toString()}`,
  );
  return rows.length > 0;
}

export async function updateTransferPaymentOrder(
  reference: string,
  updates: Partial<TransferPaymentOrder>,
) {
  const query = new URLSearchParams({ reference: `eq.${reference}` });
  await request<TransferPaymentOrder[]>(
    `cuku_transfer_payment_orders?${query.toString()}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
    },
  );
}
