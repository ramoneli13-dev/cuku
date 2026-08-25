"use client";

import Link from "next/link";
import Image, { type ImageLoaderProps } from "next/image";
import { FormEvent, useEffect, useState } from "react";

type TransferStatus =
  | "AWAITING_TRANSFER"
  | "OCR_PROCESSING"
  | "AWAITING_BANK_CONFIRMATION"
  | "MANUAL_REVIEW"
  | "DUPLICATE_PROOF"
  | "APPROVED"
  | "REJECTED";

type TransferConfiguration = {
  configured: boolean;
  dynamicQr: boolean;
  aiReview: boolean;
  bankConfirmation: boolean;
  operationsNotification: boolean;
};

type TransferSession = {
  reference: string;
  amountInCents: number;
  currency: "COP";
  qr: {
    mode: "dynamic" | "official-static";
    qrImageUrl: string;
    expiresAt: string | null;
  };
};

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

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function officialQrLoader({ src }: ImageLoaderProps) {
  return src;
}

export function DirectTransferCheckout() {
  const [configuration, setConfiguration] = useState<TransferConfiguration | null>(null);
  const [productValue, setProductValue] = useState("");
  const [deliveryValue, setDeliveryValue] = useState("8000");
  const [session, setSession] = useState<TransferSession>();
  const [status, setStatus] = useState<TransferStatus>();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const productValueCop = numericValue(productValue);
  const deliveryValueCop = numericValue(deliveryValue);
  const total = productValueCop + deliveryValueCop;

  useEffect(() => {
    fetch("/api/payments/transfer/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: TransferConfiguration) => setConfiguration(data))
      .catch(() =>
        setConfiguration({
          configured: false,
          dynamicQr: false,
          aiReview: false,
          bankConfirmation: false,
          operationsNotification: false,
        }),
      );
  }, []);

  async function readStatus(reference: string) {
    const response = await fetch(
      `/api/payments/transfer/status?reference=${encodeURIComponent(reference)}`,
      { cache: "no-store" },
    );
    const payload = (await response.json()) as {
      status?: TransferStatus;
      error?: string;
    };
    if (!response.ok || !payload.status) {
      throw new Error(payload.error ?? "No pudimos consultar el pago.");
    }
    setStatus(payload.status);
    return payload.status;
  }

  async function pollForBankConfirmation(reference: string) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const current = await readStatus(reference);
      if (current === "APPROVED" || current === "REJECTED") return;
      await wait(4_000);
    }
  }

  async function createTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!configuration?.configured) {
      setError("El sistema espera las credenciales oficiales del comercio para habilitar cobros.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/payments/transfer/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderDescription: String(form.get("orderDescription") ?? ""),
          customerName: String(form.get("customerName") ?? ""),
          customerEmail: String(form.get("customerEmail") ?? ""),
          productValueCop,
          deliveryValueCop,
        }),
      });
      const payload = (await response.json()) as TransferSession & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No fue posible generar el QR.");
      setSession(payload);
      setStatus("AWAITING_TRANSFER");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible iniciar el pago.");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      form.set("reference", session.reference);
      form.set("aiConsent", form.get("aiConsent") === "on" ? "true" : "false");
      const response = await fetch("/api/payments/transfer/proof", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        status?: TransferStatus;
        message?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "No fue posible analizar la imagen.");
      if (payload.status) setStatus(payload.status);
      setMessage(payload.message ?? "Comprobante recibido.");
      if (payload.status === "AWAITING_BANK_CONFIRMATION") {
        void pollForBankConfirmation(session.reference).catch(() => undefined);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible subir el comprobante.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "APPROVED" && session) {
    return (
      <section className="payment-success" aria-live="polite">
        <div className="payment-success-icon" aria-hidden="true">✓</div>
        <span className="section-kicker">Transferencia confirmada por la entidad</span>
        <h1>¡Pago Recibido por Cúku!</h1>
        <p>Tu pedido ya fue enviado a la central de mensajeros.</p>
        <div className="payment-success-details">
          <span>Total confirmado</span>
          <strong>{formatCop(session.amountInCents / 100)}</strong>
          <small>Referencia {session.reference}</small>
        </div>
        <Link className="button button-light" href="/">Volver al inicio</Link>
      </section>
    );
  }

  return (
    <section className="payment-gateway" aria-labelledby="payment-title">
      <div className="payment-intro">
        <span className="section-kicker">Transferencia directa</span>
        <h1 id="payment-title">Pago Cúku</h1>
        <p>
          Transfiere desde Bre-B, Nequi o DaviPlata. Cúku no agrega comisión al
          total cotizado y nunca solicita tu clave bancaria.
        </p>
        <div className="payment-methods" aria-label="Opciones de transferencia">
          <span>Bre-B</span><span>Nequi</span><span>DaviPlata</span><span>0% extra Cúku</span>
        </div>
        {configuration && (
          <div className={configuration.configured ? "gateway-status ready" : "gateway-status pending"}>
            <i aria-hidden="true" />
            {configuration.configured
              ? configuration.dynamicQr
                ? "QR dinámico y conciliación bancaria activos"
                : "QR oficial y conciliación bancaria activos"
              : "Activación pendiente de credenciales comerciales"}
          </div>
        )}
        <p className="transfer-security-note">
          La IA solo lee el comprobante. El despacho se habilita cuando la entidad
          financiera confirma que el dinero ingresó realmente.
        </p>
      </div>

      {!session ? (
        <form className="payment-form" onSubmit={createTransfer}>
          <div className="payment-breakdown">
            <h2>Resumen del cobro</h2>
            <label>
              <span>Valor del producto</span>
              <span className="money-field"><i>$</i><input aria-label="Valor del producto en pesos colombianos" inputMode="numeric" min="1000" onChange={(event) => setProductValue(event.target.value)} placeholder="0" required type="number" value={productValue} /><small>COP</small></span>
            </label>
            <label>
              <span>Domicilio Cúku</span>
              <span className="money-field"><i>$</i><input aria-label="Valor del domicilio en pesos colombianos" inputMode="numeric" min="0" onChange={(event) => setDeliveryValue(event.target.value)} required type="number" value={deliveryValue} /><small>COP</small></span>
            </label>
            <div className="payment-total"><span>Total a transferir</span><strong>{formatCop(total)}</strong></div>
          </div>
          <label className="payment-field payment-field-wide">
            <span>Resumen del pedido</span>
            <textarea name="orderDescription" placeholder="Ej. Camisa blanca talla M" required rows={3} />
          </label>
          <div className="payment-fields-grid">
            <label className="payment-field"><span>Nombre completo</span><input autoComplete="name" name="customerName" required /></label>
            <label className="payment-field"><span>Correo electrónico</span><input autoComplete="email" name="customerEmail" required type="email" /></label>
          </div>
          {error && <p className="payment-error" role="alert">{error}</p>}
          <button className="button payment-submit" disabled={submitting || total < 1_000 || configuration?.configured !== true} type="submit">
            {submitting ? "Generando QR…" : `Generar QR por ${formatCop(total)}`}<span aria-hidden="true">→</span>
          </button>
          <p className="payment-legal">No se aceptan capturas como confirmación final del abono.</p>
        </form>
      ) : (
        <form className="payment-form transfer-proof-form" onSubmit={uploadProof}>
          <div className="transfer-qr-card">
            <span className="section-kicker">Escanea desde tu aplicación financiera</span>
            {/* La imagen debe ser un QR oficial emitido por el banco o billetera. */}
            <Image
              alt={`Código QR oficial para pagar ${formatCop(session.amountInCents / 100)}`}
              height={260}
              loader={officialQrLoader}
              src={session.qr.qrImageUrl}
              unoptimized
              width={260}
            />
            <strong>{formatCop(session.amountInCents / 100)}</strong>
            <small>Referencia: {session.reference}</small>
          </div>
          <ol className="transfer-steps">
            <li>Escanea el QR y confirma que el receptor sea Cúku.</li>
            <li>Transfiere exactamente {formatCop(session.amountInCents / 100)}.</li>
            <li>Guarda el comprobante y súbelo aquí.</li>
          </ol>
          <label className="payment-field transfer-file-field">
            <span>Sube la captura de pantalla de tu comprobante de transferencia</span>
            <input accept="image/jpeg,image/png,image/webp" name="proof" required type="file" />
          </label>
          <label className="transfer-consent">
            <input name="aiConsent" required type="checkbox" />
            <span>Autorizo el análisis automático de esta imagen para extraer monto, estado y número de comprobante.</span>
          </label>
          {message && <p className="payment-pending" role="status">{message}</p>}
          {error && <p className="payment-error" role="alert">{error}</p>}
          {status === "MANUAL_REVIEW" && <p className="payment-error">El pedido no será despachado hasta terminar la revisión.</p>}
          {status === "REJECTED" && <p className="payment-error">La entidad no confirmó esta transferencia. Revisa el pago antes de intentar nuevamente.</p>}
          <button className="button payment-submit" disabled={submitting || status === "APPROVED"} type="submit">
            {submitting ? "Analizando comprobante…" : "Subir y verificar comprobante"}<span aria-hidden="true">→</span>
          </button>
          <button className="transfer-status-button" onClick={() => void readStatus(session.reference)} type="button">Consultar estado bancario</button>
        </form>
      )}
    </section>
  );
}
