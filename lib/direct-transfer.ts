import "server-only";

import { verifyDirectTransferSignature } from "@/lib/direct-transfer-signature";

export type DirectTransferQr = {
  mode: "dynamic" | "official-static";
  qrImageUrl: string;
  providerPaymentId: string | null;
  expiresAt: string | null;
};

function validImageUrl(value: string) {
  if (value.startsWith("data:image/")) return value;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function directTransferConfiguration() {
  const dynamicQr = Boolean(
    process.env.DIRECT_TRANSFER_QR_API_URL?.trim() &&
      process.env.DIRECT_TRANSFER_QR_API_TOKEN?.trim(),
  );
  const staticQr = validImageUrl(
    process.env.DIRECT_TRANSFER_QR_IMAGE_URL?.trim() ?? "",
  );
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const webhookSecret = process.env.DIRECT_TRANSFER_WEBHOOK_SECRET?.trim() ?? "";

  return {
    configured:
      (dynamicQr || staticQr) &&
      Boolean(supabaseUrl?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    dynamicQr,
    aiReview: Boolean(process.env.OPENAI_API_KEY?.trim()),
    bankConfirmation: webhookSecret.length >= 32,
  };
}

export async function createDirectTransferQr(input: {
  reference: string;
  amountInCents: number;
  callbackUrl: string;
}): Promise<DirectTransferQr> {
  const endpoint = process.env.DIRECT_TRANSFER_QR_API_URL?.trim();
  const token = process.env.DIRECT_TRANSFER_QR_API_TOKEN?.trim();

  if (endpoint && token) {
    const response = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: input.reference,
        amount: input.amountInCents / 100,
        amountInCents: input.amountInCents,
        currency: "COP",
        callbackUrl: input.callbackUrl,
      }),
    });
    if (!response.ok) {
      throw new Error(`El proveedor del QR rechazó la solicitud (${response.status}).`);
    }
    const payload = (await response.json()) as {
      qrImageUrl?: string;
      providerPaymentId?: string;
      expiresAt?: string;
    };
    if (!payload.qrImageUrl || !validImageUrl(payload.qrImageUrl)) {
      throw new Error("El proveedor no devolvió una imagen QR válida.");
    }
    return {
      mode: "dynamic",
      qrImageUrl: payload.qrImageUrl,
      providerPaymentId: payload.providerPaymentId?.slice(0, 180) ?? null,
      expiresAt: payload.expiresAt ?? null,
    };
  }

  const qrImageUrl = process.env.DIRECT_TRANSFER_QR_IMAGE_URL?.trim() ?? "";
  if (!validImageUrl(qrImageUrl)) {
    throw new Error("Falta configurar el QR oficial de la cuenta de Cúku.");
  }
  return {
    mode: "official-static",
    qrImageUrl,
    providerPaymentId: null,
    expiresAt: null,
  };
}

export function verifyBankConfirmationSignature(input: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
}) {
  return verifyDirectTransferSignature({
    ...input,
    secret: process.env.DIRECT_TRANSFER_WEBHOOK_SECRET?.trim(),
  });
}
