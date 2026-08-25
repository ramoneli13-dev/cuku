import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PaymentConfirmation } from "@/components/PaymentConfirmation";

export const metadata: Metadata = {
  title: "Confirmación de pago | Cúku",
  description: "Consulta la confirmación segura de tu pago en Cúku.",
};

export default function PaymentConfirmationPage() {
  return (
    <main className="payment-page">
      <header className="payment-page-header">
        <Link className="brand" href="/" aria-label="Cúku, volver al inicio">
          <span className="brand-symbol">Cú</span>
          <span>Cúku</span>
        </Link>
        <Link className="payment-back" href="/">← Volver al inicio</Link>
      </header>
      <Suspense fallback={<p className="payment-pending">Consultando el pago…</p>}>
        <PaymentConfirmation />
      </Suspense>
    </main>
  );
}
