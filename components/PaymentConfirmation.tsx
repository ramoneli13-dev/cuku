"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type TransactionStatus = "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";

type PaymentResult = {
  status: TransactionStatus;
  reference: string;
  amountInCents: number;
};

function formatCopFromCents(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function PaymentConfirmation() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("id");
  const [result, setResult] = useState<PaymentResult>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transactionId) return;

    let cancelled = false;
    let timeoutId: number | undefined;
    let attempts = 0;

    async function refresh() {
      try {
        const response = await fetch(
          `/api/payments/wompi/status?id=${encodeURIComponent(transactionId ?? "")}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as PaymentResult & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "No pudimos confirmar el pago.");
        if (cancelled) return;
        setResult(payload);
        setError("");
        attempts += 1;
        if (payload.status === "PENDING" && attempts < 30) {
          timeoutId = window.setTimeout(refresh, 2_500);
        }
      } catch (statusError) {
        if (!cancelled) {
          setError(statusError instanceof Error ? statusError.message : "No pudimos confirmar el pago.");
        }
      }
    }

    void refresh();
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [transactionId]);

  if (!transactionId) {
    return (
      <section className="payment-success payment-confirmation-pending" aria-live="polite">
        <div className="payment-success-icon" aria-hidden="true">!</div>
        <h1>Transacción no encontrada</h1>
        <p>No encontramos el identificador necesario para consultar el pago.</p>
        <Link className="button button-light" href="/pagar">Volver al Checkout</Link>
      </section>
    );
  }

  if (result?.status === "APPROVED") {
    return (
      <section className="payment-success" aria-live="polite">
        <div className="payment-success-icon" aria-hidden="true">✓</div>
        <span className="section-kicker">Transacción aprobada</span>
        <h1>¡Pago Recibido por Cúku!</h1>
        <p>Tu pedido ya fue enviado a la central para asignar un repartidor.</p>
        <div className="payment-success-details">
          <span>Total confirmado</span>
          <strong>{formatCopFromCents(result.amountInCents)}</strong>
          <small>Referencia {result.reference}</small>
        </div>
        <Link className="button button-light" href="/">Volver al inicio</Link>
      </section>
    );
  }

  const declined = result && ["DECLINED", "VOIDED", "ERROR"].includes(result.status);
  return (
    <section className="payment-success payment-confirmation-pending" aria-live="polite">
      <div className="payment-success-icon" aria-hidden="true">{declined ? "!" : "…"}</div>
      <span className="section-kicker">Estado del pago</span>
      <h1>{declined ? "Pago no aprobado" : "Confirmando tu pago"}</h1>
      <p>
        {declined
          ? "Transacción declinada. Por favor, intenta con otro método de pago."
          : "Estamos esperando la confirmación firmada de Wompi. No cierres esta pantalla."}
      </p>
      {error && <p className="payment-error" role="alert">{error}</p>}
      {declined && <Link className="button button-light" href="/pagar">Intentar nuevamente</Link>}
    </section>
  );
}
