import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyDirectTransferSignature } from "@/lib/direct-transfer-signature";

describe("confirmación bancaria de transferencias", () => {
  it("acepta una firma HMAC vigente y rechaza un cuerpo alterado", () => {
    const secret = "un-secreto-de-prueba-con-longitud-segura";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const rawBody = JSON.stringify({ reference: "CUKU-T-123", amountInCents: 8300000 });
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    expect(verifyDirectTransferSignature({ rawBody, timestamp, signature, secret })).toBe(true);
    expect(
      verifyDirectTransferSignature({
        rawBody: rawBody.replace("8300000", "8300001"),
        timestamp,
        signature,
        secret,
      }),
    ).toBe(false);
  });

  it("rechaza eventos antiguos", () => {
    const secret = "un-secreto-de-prueba-con-longitud-segura";
    const timestamp = String(Math.floor((Date.now() - 10 * 60_000) / 1000));
    const rawBody = "{}";
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    expect(verifyDirectTransferSignature({ rawBody, timestamp, signature, secret })).toBe(false);
  });
});
