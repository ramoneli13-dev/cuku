import "server-only";

import {
  createWompiEventChecksum,
  createWompiIntegritySignature,
  secureChecksumMatch,
} from "@/lib/wompi-signatures";

export type WompiTransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "VOIDED"
  | "ERROR";

export type WompiTransaction = {
  id: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  customer_email?: string;
  payment_method_type?: string;
  status: WompiTransactionStatus;
};

export type WompiWebhookPayload = {
  event: string;
  data: {
    transaction?: WompiTransaction;
    [key: string]: unknown;
  };
  environment: "test" | "prod";
  signature: {
    properties: string[];
    checksum: string;
  };
  timestamp: number;
  sent_at: string;
};

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta configurar ${name}.`);
  return value;
}

export function wompiConfigurationStatus() {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY?.trim() ?? "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET?.trim() ?? "";
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET?.trim() ?? "";
  const isProduction = publicKey.startsWith("pub_prod_");
  const isSandbox = publicKey.startsWith("pub_test_");
  const matchingIntegritySecret = isProduction
    ? integritySecret.startsWith("prod_integrity_")
    : isSandbox && integritySecret.startsWith("test_integrity_");
  const matchingEventsSecret = isProduction
    ? eventsSecret.startsWith("prod_events_")
    : isSandbox && eventsSecret.startsWith("test_events_");
  const requirements = {
    publicKey: isProduction || isSandbox,
    integritySecret: matchingIntegritySecret,
    eventsSecret: matchingEventsSecret,
    paymentStore: Boolean(
      (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim() &&
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    ),
  };
  return {
    configured: Object.values(requirements).every(Boolean),
    environment: isProduction ? "production" : "sandbox",
    requirements,
  } as const;
}

export function createCheckoutSignature(reference: string, amountInCents: number) {
  return createWompiIntegritySignature({
    reference,
    amountInCents,
    integritySecret: requiredEnvironment("WOMPI_INTEGRITY_SECRET"),
  });
}

export function getWompiPublicKey() {
  return requiredEnvironment("NEXT_PUBLIC_WOMPI_PUBLIC_KEY");
}

export function verifyWompiWebhook(
  payload: WompiWebhookPayload,
  headerChecksum: string | null,
) {
  const expected = createWompiEventChecksum(
    payload,
    requiredEnvironment("WOMPI_EVENTS_SECRET"),
  );
  const received = headerChecksum ?? payload.signature.checksum;
  return secureChecksumMatch(expected, received);
}

export function wompiApiBase() {
  return getWompiPublicKey().startsWith("pub_prod_")
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";
}

export async function getWompiTransaction(id: string) {
  const response = await fetch(
    `${wompiApiBase()}/transactions/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  const payload = (await response.json().catch(() => ({}))) as {
    data?: WompiTransaction;
  };
  if (!response.ok || !payload.data) {
    throw new Error("No fue posible consultar la transacción en Wompi.");
  }
  return payload.data;
}
