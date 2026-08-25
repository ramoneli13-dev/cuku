import type { Metadata } from "next";
import Link from "next/link";
import { CukuPaymentGateway } from "@/components/CukuPaymentGateway";

export const metadata: Metadata = {
  title: "Pasarela Cúku | Pago seguro",
  description: "Paga tu pedido de Cúku en pesos colombianos con Wompi.",
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
      <CukuPaymentGateway />
    </main>
  );
}
