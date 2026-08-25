export const WOMPI_PERCENTAGE_FEE_BPS = 349;
export const WOMPI_FIXED_FEE_COP = 900;

export function calculateCheckoutAmounts(productValueCop: number, deliveryValueCop: number) {
  const subtotalCop = productValueCop + deliveryValueCop;
  const processingFeeCop =
    subtotalCop > 0
      ? Math.ceil((subtotalCop * WOMPI_PERCENTAGE_FEE_BPS) / 10_000) + WOMPI_FIXED_FEE_COP
      : 0;

  return {
    productValueCop,
    deliveryValueCop,
    subtotalCop,
    processingFeeCop,
    totalCop: subtotalCop + processingFeeCop,
  };
}
