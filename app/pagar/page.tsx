import type { Metadata } from "next";
import Link from "next/link";
import { DirectTransferCheckout } from "@/components/DirectTransferCheckout";

export const metadata: Metadata = {
  title: "Pago Cúku | Transferencia directa",
  description: "Paga tu pedido de Cúku mediante transferencia directa en pesos colombianos.",
};

export default function PaymentPage() {
  return (
    <main className="payment-page">
      <header className="payment-page-header">
        <Link className="brand" href="/" aria-label="Cúku, volver al inicio">
          <span className="brand-symbol">Cú</span>
          <span>Cúku</span>
        </Link>
        <Link className="payment-back" href="/">← Volver al inicio</Link>
      </header>
      <DirectTransferCheckout />
    </main>
  );
}
