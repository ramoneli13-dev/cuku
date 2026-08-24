"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "register" | "login";

export function BuyerAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch(
        mode === "register"
          ? "/api/compradores/registro"
          : "/api/compradores/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "No fue posible continuar.");

      if (mode === "register") {
        setSuccess(
          result.message ??
            "Tu cuenta está en revisión. Te contactaremos antes de activarla.",
        );
        event.currentTarget.reset();
      } else {
        router.push("/compradores/dashboard");
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible continuar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Link className="brand auth-brand" href="/">
        <span className="brand-symbol">Cú</span>
        <span>Cúku</span>
      </Link>
      <section className="auth-card">
        <span className="section-kicker">
          {mode === "register" ? "Únete a Cúku" : "Acceso de compradores"}
        </span>
        <h1>
          {mode === "register"
            ? "Trabaja recorriendo Cúcuta"
            : "Bienvenido de nuevo"}
        </h1>
        <p>
          {mode === "register"
            ? "Crea tu perfil. Nuestro equipo validará tus datos antes de habilitar los pedidos."
            : "Ingresa con el correo y la contraseña de tu cuenta de comprador."}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                <span>Nombre completo</span>
                <input
                  autoComplete="name"
                  name="nombreCompleto"
                  placeholder="Tu nombre y apellido"
                  required
                />
              </label>
              <div className="auth-field-grid">
                <label>
                  <span>Teléfono</span>
                  <input
                    autoComplete="tel"
                    inputMode="tel"
                    name="telefono"
                    placeholder="+57 300 000 0000"
                    required
                  />
                </label>
                <label>
                  <span>Tipo de vehículo</span>
                  <select defaultValue="" name="tipoVehiculo" required>
                    <option disabled value="">Seleccionar</option>
                    <option value="Moto">Moto</option>
                    <option value="Bicicleta">Bicicleta</option>
                    <option value="Carro">Carro</option>
                    <option value="A pie">A pie</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>
              </div>
            </>
          )}

          <label>
            <span>Correo electrónico</span>
            <input
              autoComplete="email"
              name="correo"
              placeholder="nombre@correo.com"
              required
              type="email"
            />
          </label>
          <label>
            <span>Contraseña</span>
            <input
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={8}
              name="password"
              placeholder="Mínimo 8 caracteres"
              required
              type="password"
            />
          </label>

          <button className="button button-primary auth-submit" disabled={loading} type="submit">
            {loading
              ? "Procesando…"
              : mode === "register"
                ? "Crear mi cuenta"
                : "Iniciar sesión"}
          </button>
          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          {success && <p className="auth-message auth-success" role="status">{success}</p>}
        </form>

        <div className="auth-switch">
          {mode === "register" ? (
            <p>¿Ya tienes una cuenta? <Link href="/compradores/login">Inicia sesión</Link></p>
          ) : (
            <p>¿Quieres trabajar con Cúku? <Link href="/compradores/registro">Regístrate</Link></p>
          )}
        </div>
      </section>
      <Link className="auth-back" href="/">← Volver al inicio</Link>
    </div>
  );
}
