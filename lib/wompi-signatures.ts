import { createHash, timingSafeEqual } from "node:crypto";

type WompiEventPayload = {
  data: Record<string, unknown>;
  signature: {
    properties: string[];
    checksum: string;
  };
  timestamp: number;
};

export function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createWompiIntegritySignature(input: {
  reference: string;
  amountInCents: number;
  integritySecret: string;
}) {
  return sha256(
    `${input.reference}${input.amountInCents}COP${input.integritySecret}`,
  );
}

function readNestedProperty(root: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, root);
}

export function createWompiEventChecksum(
  payload: WompiEventPayload,
  eventsSecret: string,
) {
  const signedValues = payload.signature.properties.map((property) => {
    const value = readNestedProperty(payload.data, property);
    if (value === undefined || value === null) {
      throw new Error(`El evento no incluye la propiedad firmada ${property}.`);
    }
    return String(value);
  });

  return sha256(`${signedValues.join("")}${payload.timestamp}${eventsSecret}`);
}

export function secureChecksumMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "utf8");
  const receivedBuffer = Buffer.from(received.toLowerCase(), "utf8");
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

