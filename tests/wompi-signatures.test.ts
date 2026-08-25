import { describe, expect, it } from "vitest";
import {
  createWompiEventChecksum,
  createWompiIntegritySignature,
  secureChecksumMatch,
} from "@/lib/wompi-signatures";

describe("firmas de Wompi", () => {
  it("genera la firma de integridad con referencia, monto, COP y secreto", () => {
    expect(
      createWompiIntegritySignature({
        reference: "sk8-438k4-xmxm392-sn2m",
        amountInCents: 2_490_000,
        integritySecret: "integrity-secret",
      }),
    ).toBe("f7c4f6698d1081cf77c96368f86447ad5946f29bde45f4bbf62519b3bf7f353f");
  });

  it("respeta el orden dinámico de las propiedades del webhook", () => {
    const checksum = createWompiEventChecksum(
      {
        data: {
          transaction: {
            id: "1234-1610641025-49201",
            status: "APPROVED",
            amount_in_cents: 4_490_000,
          },
        },
        signature: {
          properties: [
            "transaction.id",
            "transaction.status",
            "transaction.amount_in_cents",
          ],
          checksum: "",
        },
        timestamp: 1_530_291_411,
      },
      "events-secret",
    );

    expect(checksum.toUpperCase()).toBe(
      "648B3D902B2D71CF6C5265945EF5C30FB11FA58895CAC93C82CA37D40BA20C8E",
    );
    expect(secureChecksumMatch(checksum, checksum.toUpperCase())).toBe(true);
    expect(secureChecksumMatch(checksum, "0".repeat(64))).toBe(false);
  });
});
