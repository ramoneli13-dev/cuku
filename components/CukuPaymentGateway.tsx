"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { calculateCheckoutAmounts } from "@/lib/payment-fees";

type GatewayConfig = {
  configured: boolean;
  environment: "sandbox" | "production";
  whatsappNotifications: boolean;
};

type CheckoutSession = {
  currency: "COP";
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature: { integrity: string };
  redirectUrl: string;
  customerData: {
    email: string;
    fullName: string;
    legalId: string;
    legalIdType: "CC";
  };
};

declare global {
  interface Window {
    WidgetCheckout?: new (configuration: CheckoutSession) => {
      open: (callback: (result: { transaction: { id: string } }) => void) => void;
    };
  }
}

function formatCop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function numericValue(value: string) {
  const parsed = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CukuPaymentGateway() {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [gateway, setGateway] = useState<GatewayConfig | null>(null);
  const [productValue, setProductValue] = useState("");
  const [deliveryValue, setDeliveryValue] = useState("8000");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const productValueCop = numericValue(productValue);
  const deliveryValueCop = numericValue(deliveryValue);
  const amounts = calculateCheckoutAmounts(productValueCop, deliveryValueCop);

  useEffect(() => {
    fetch("/api/payments/wompi/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: GatewayConfig) => setGateway(data))
      .catch(() =>
        setGateway({
          configured: false,
          environment: "sandbox",
          whatsappNotifications: false,
        }),
      );
  }, []);

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!gateway?.configured) {
      setError("La pasarela aún espera las credenciales seguras del comercio.");
      return;
    }
    if (!scriptReady || !window.WidgetCheckout) {
      setError("El checkout seguro todavía está cargando. Intenta de nuevo en unos segundos.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/payments/wompi/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderDescription: String(form.get("orderDescription") ?? ""),
          customerName: String(form.get("customerName") ?? ""),
          customerEmail: String(form.get("customerEmail") ?? ""),
          customerDocument: String(form.get("customerDocument") ?? ""),
          productValueCop,
          deliveryValueCop,
        }),
      });
      const session = (await response.json()) as CheckoutSession & { error?: string };
      if (!response.ok) throw new Error(session.error ?? "No fue posible iniciar el pago.");

      const checkout = new window.WidgetCheckout(session);
      checkout.open(({ transaction }) => {
        router.push(
          `/pagar/confirmacion?id=${encodeURIComponent(transaction.id)}`,
        );
      });
      setSubmitting(false);
    } catch (submitError) {
      setSubmitting(false);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No fue posible iniciar el pago.",
      );
    }
  }

  return (
    <section className="payment-gateway" aria-labelledby="payment-title">
      <Script
        onError={() => setError("No se pudo cargar el checkout seguro de Wompi.")}
        onLoad={() => setScriptReady(true)}
        src="https://checkout.wompi.co/widget.js"
        strategy="afterInteractive"
      />

      <div className="payment-intro">
        <span className="section-kicker">Checkout protegido</span>
        <h1 id="payment-title">Pasarela Cúku</h1>
        <p>
          Paga la cotización confirmada por operaciones. Wompi procesa tus datos
          financieros; Cúku nunca almacena números de tarjeta ni claves bancarias.
        </p>
        <div className="payment-methods" aria-label="Métodos disponibles en Wompi">
          <span>Tarjetas</span>
          <span>PSE</span>
          <span>Nequi</span>
          <span>DaviPlata</span>
        </div>
        {gateway && (
          <div className={gateway.configured ? "gateway-status ready" : "gateway-status pending"}>
            <i aria-hidden="true" />
            {gateway.configured
              ? `Pasarela lista en ${gateway.environment === "production" ? "producción" : "sandbox"}`
              : "Activación pendiente de credenciales del comercio"}
          </div>
        )}
      </div>

      <form className="payment-form" onSubmit={submitPayment}>
        <div className="payment-breakdown">
          <h2>Resumen del cobro</h2>
          <label>
            <span>Valor del producto</span>
            <span className="money-field">
              <i>$</i>
              <input
                aria-label="Valor del producto en pesos colombianos"
                inputMode="numeric"
                min="1000"
                name="productValue"
                onChange={(event) => setProductValue(event.target.value)}
                placeholder="0"
                required
                type="number"
                value={productValue}
              />
              <small>COP</small>
            </span>
          </label>
          <label>
            <span>Domicilio Cúku</span>
            <span className="money-field">
              <i>$</i>
              <input
                aria-label="Valor del domicilio en pesos colombianos"
                inputMode="numeric"
                min="0"
                name="deliveryValue"
                onChange={(event) => setDeliveryValue(event.target.value)}
                required
                type="number"
                value={deliveryValue}
              />
              <small>COP</small>
            </span>
          </label>
          <div className="payment-total">
            <span>Subtotal</span>
            <strong>{formatCop(amounts.subtotalCop)}</strong>
          </div>
          <div className="payment-fee-row">
            <span>Procesamiento (3,49% + $900)</span>
            <strong>{formatCop(amounts.processingFeeCop)}</strong>
          </div>
          <div className="payment-total payment-grand-total">
            <span>Total a pagar</span>
            <strong>{formatCop(amounts.totalCop)}</strong>
          </div>
        </div>

        <label className="payment-field payment-field-wide">
          <span>Resumen del pedido</span>
          <textarea
            name="orderDescription"
            placeholder="Ej. Camisa blanca talla M aprobada por WhatsApp"
            required
            rows={3}
          />
        </label>
        <div className="payment-fields-grid">
          <label className="payment-field">
            <span>Nombre completo</span>
            <input autoComplete="name" name="customerName" required />
          </label>
          <label className="payment-field">
            <span>Correo electrónico</span>
            <input autoComplete="email" name="customerEmail" required type="email" />
          </label>
          <label className="payment-field payment-field-wide">
            <span>Cédula</span>
            <input
              autoComplete="off"
              inputMode="numeric"
              maxLength={15}
              minLength={5}
              name="customerDocument"
              pattern="[0-9]{5,15}"
              required
            />
          </label>
        </div>

        {error && <p className="payment-error" role="alert">{error}</p>}
        <button
          className="button payment-submit"
          disabled={submitting || amounts.subtotalCop < 1_000 || gateway?.configured !== true}
          type="submit"
        >
          {submitting ? "Abriendo pago seguro…" : `Continuar y pagar ${formatCop(amounts.totalCop)}`}
          <span aria-hidden="true">→</span>
        </button>
        <p className="payment-wallet-note">
          Wompi mostrará automáticamente los métodos de pago habilitados para tu
          comercio y compatibles con el dispositivo.
        </p>
        <p className="payment-legal">
          El pedido solo se despacha después de que el webhook firmado confirme
          el estado APROBADO.
        </p>
      </form>
    </section>
  );
}
