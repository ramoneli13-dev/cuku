import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyDirectTransferSignature(input: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secret: string | undefined;
  now?: number;
}) {
  if (!input.secret || !input.timestamp || !input.signature) return false;
  const timestamp = Number(input.timestamp);
  if (!Number.isFinite(timestamp)) return false;
  const timestampMs = timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
  if (Math.abs((input.now ?? Date.now()) - timestampMs) > 5 * 60_000) return false;

  const expected = createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.rawBody}`)
    .digest("hex");
  const received = input.signature.replace(/^sha256=/, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}
