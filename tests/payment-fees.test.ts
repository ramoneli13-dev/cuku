import { describe, expect, it } from "vitest";
import { calculateCheckoutAmounts } from "@/lib/payment-fees";

describe("tarifa del Checkout", () => {
  it("suma producto, domicilio, 3,49% y 900 COP", () => {
    expect(calculateCheckoutAmounts(75_000, 8_000)).toEqual({
      productValueCop: 75_000,
      deliveryValueCop: 8_000,
      subtotalCop: 83_000,
      processingFeeCop: 3_797,
      totalCop: 86_797,
    });
  });

  it("no cobra tarifa cuando no hay subtotal", () => {
    expect(calculateCheckoutAmounts(0, 0).processingFeeCop).toBe(0);
  });
});
