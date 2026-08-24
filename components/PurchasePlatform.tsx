"use client";

import { FormEvent, useEffect, useState } from "react";

type IconName = "search" | "shield" | "delivery";

// Número operativo de Cúku. Cámbialo aquí cuando se defina la línea oficial.
const CUKU_WHATSAPP_NUMBER = "573224565714";
const MODA_BUZOS_WHATSAPP_NUMBER = "573224565714";
const MODA_BUZOS_CATALOG_URL = "https://wa.me/c/573224565714";

function FeatureIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
        <path d="M8.5 11h5M11 8.5v5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
        <path d="m9.3 12 1.8 1.8 3.8-4" />
      </>
    ),
    delivery: (
      <>
        <path d="M3 6h11v11H3zM14 10h3l4 4v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
  };

  return (
    <span className="feature-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {paths[name]}
      </svg>
    </span>
  );
}

const features: Array<{ icon: IconName; title: string; description: string }> = [
  {
    icon: "search",
    title: "Encuentra lo que necesitas",
    description:
      "Pide cualquier producto legal de tiendas, mercados y comercios locales, incluso si no venden en línea.",
  },
  {
    icon: "shield",
    title: "Tú apruebas la compra",
    description:
      "Recibe opciones, fotografías y precios reales. Nada se compra sin tu autorización.",
  },
  {
    icon: "delivery",
    title: "Recíbelo donde estés",
    description:
      "Coordinamos la compra y la entrega en Cúcuta y sus municipios cercanos de forma clara y segura.",
  },
];

const modaBuzosProducts = [
  {
    name: "Buzo Premium",
    category: "Buzos",
    price: "$75.000",
    shortLabel: "BU",
  },
  {
    name: "Chaqueta Urbana",
    category: "Chaquetas",
    price: "$120.000",
    shortLabel: "CH",
  },
  {
    name: "Conjunto Impermeable",
    category: "Conjuntos deportivos",
    price: "$145.000",
    shortLabel: "CI",
  },
  {
    name: "Rompevientos Liviano",
    category: "Rompevientos",
    price: "$95.000",
    shortLabel: "RO",
  },
];

export function PurchasePlatform() {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    if (!orderModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOrderModalOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [orderModalOpen]);

  function openOrderModal() {
    setOrderSent(false);
    setOrderModalOpen(true);
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const order = String(form.get("order") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const message = `Hola Cúku, mi nombre es ${name} y necesito: ${order}. Mi WhatsApp es ${phone}.`;
    const url = `https://wa.me/${CUKU_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    setOrderSent(true);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Cúku, ir al inicio">
          <span className="brand-symbol">Cú</span>
          <span>Cúku</span>
        </a>
        <nav className="nav-links" aria-label="Navegación principal">
          <a href="#beneficios">Beneficios</a>
          <a href="#tienda-aliada">Tienda aliada</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="/compradores/registro">Quiero ser Comprador</a>
        </nav>
        <button className="button button-small" onClick={openOrderModal} type="button">
          Comenzar
        </button>
      </header>

      <main>
        <section className="hero-section" id="inicio">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" />
              Disponible en Cúcuta y alrededores
            </div>
            <h1>
              Todo Cúcuta,
              <span> a un pedido de distancia.</span>
            </h1>
            <p className="hero-description">
              Dinos qué necesitas. Un comprador local lo encuentra, te muestra
              las opciones y te lo entrega donde estés.
            </p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={openOrderModal} type="button">
                Pedir con Cúku <span aria-hidden="true">→</span>
              </button>
              <a className="button button-secondary" href="#beneficios">Conocer más</a>
            </div>
            <div className="trust-row" aria-label="Ventajas del servicio">
              <span>✓ Precio aprobado por ti</span>
              <span>✓ Comercios locales</span>
              <span>✓ Entrega coordinada</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Vista de un pedido en Cúku">
            <div className="visual-glow" />
            <div className="order-card">
              <div className="order-top">
                <div>
                  <span className="order-label">Tu solicitud</span>
                  <strong>Camisa blanca · talla M</strong>
                </div>
                <span className="live-badge">En búsqueda</span>
              </div>
              <div className="progress-track"><span /></div>
              <div className="option-card">
                <div className="option-image">
                  <svg viewBox="0 0 80 80" aria-hidden="true">
                    <path d="M27 18 14 25l7 15 7-4v27h24V36l7 4 7-15-13-7-5 7H32l-5-7Z" />
                  </svg>
                </div>
                <div className="option-copy">
                  <span>Opción encontrada</span>
                  <strong>Camisa clásica de algodón</strong>
                  <small>Disponible · Entrega hoy</small>
                </div>
                <strong className="option-price">$89.900</strong>
              </div>
              <div className="approval-row">
                <div className="buyer">
                  <span className="buyer-avatar">JM</span>
                  <div>
                    <small>Comprador asignado</small>
                    <strong>José M.</strong>
                  </div>
                </div>
                <span className="approved-chip">Listo para aprobar</span>
              </div>
            </div>
            <div className="floating-note">
              <span>✓</span>
              <div>
                <strong>Compra protegida</strong>
                <small>Siempre tienes el control</small>
              </div>
            </div>
          </div>
        </section>


        <section className="partner-store-section" id="tienda-aliada">
          <div className="partner-store-heading">
            <div>
              <span className="section-kicker">Tienda aliada · Cúcuta</span>
              <h2>Compra directo en MODA BUZOS (C.C. Alejandrina)</h2>
              <p>
                Explora los mejores buzos, chaquetas, rompevientos y conjuntos
                deportivos premium en Cúcuta. Elige tu estilo y te lo llevamos
                hoy mismo a tu casa.
              </p>
            </div>
            <span className="partner-badge">Aliado Cúku</span>
          </div>

          <div className="partner-product-grid">
            {modaBuzosProducts.map((product, index) => {
              const message =
                `Hola MODA BUZOS, vi su catálogo en la app de Cúku y quiero pedir el producto: ${product.name}`;
              const whatsappUrl =
                `https://wa.me/${MODA_BUZOS_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

              return (
                <article className="partner-product-card" key={product.name}>
                  <div
                    className={`partner-product-image partner-product-image-${index + 1}`}
                    aria-label={`Espacio para foto de ${product.name}`}
                  >
                    <span>{product.shortLabel}</span>
                    <small>Foto próximamente</small>
                  </div>
                  <div className="partner-product-copy">
                    <span>{product.category}</span>
                    <h3>{product.name}</h3>
                    <strong>{product.price} COP</strong>
                  </div>
                  <a
                    className="button partner-whatsapp-button"
                    href={whatsappUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Pedir por WhatsApp <span aria-hidden="true">↗</span>
                  </a>
                </article>
              );
            })}
          </div>

          <div className="partner-catalog-action">
            <div>
              <strong>¿Quieres ver todos los estilos disponibles?</strong>
              <span>Explora tallas, colores y referencias directamente con la tienda.</span>
            </div>
            <a
              className="button button-primary partner-catalog-button"
              href={MODA_BUZOS_CATALOG_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Ver catálogo completo en WhatsApp <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <section className="features-section" id="beneficios">
          <div className="section-heading">
            <span className="section-kicker">Simple de principio a fin</span>
            <h2>Comprar en tu ciudad nunca fue tan fácil.</h2>
            <p>
              Cúku conecta tus necesidades con personas que conocen la ciudad y
              pueden resolverlas por ti.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <FeatureIcon name={feature.icon} />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="steps-section" id="como-funciona">
          <div className="steps-copy">
            <span className="section-kicker">Cómo funciona</span>
            <h2>De tu mensaje a tu puerta.</h2>
            <p>
              Un proceso transparente para que sepas qué compras, cuánto pagas
              y quién lleva tu pedido.
            </p>
          </div>
          <ol className="steps-list">
            <li>
              <span>01</span>
              <div>
                <strong>Cuéntanos qué buscas</strong>
                <p>Describe el producto, presupuesto y lugar de entrega.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Elige y aprueba</strong>
                <p>Compara fotografías, disponibilidad y precio.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Recibe tu pedido</strong>
                <p>Coordinamos la compra y la entrega contigo.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="cta-section" id="comenzar">
          <div>
            <span className="section-kicker">Tu ciudad se mueve contigo</span>
            <h2>¿Qué necesitas hoy?</h2>
            <p>
              Ropa, mercado, farmacia, regalos o una diligencia especial. Cúku
              lo busca por ti.
            </p>
          </div>
          <button
            className="button button-light"
            onClick={openOrderModal}
            type="button"
          >
            Crear mi pedido <span aria-hidden="true">→</span>
          </button>
        </section>

        <section className="recruitment-section">
          <div className="recruitment-icon" aria-hidden="true">↗</div>
          <div>
            <span className="section-kicker">Trabaja con nosotros</span>
            <h2>Gana ingresos extra recorriendo Cúcuta</h2>
            <p>
              Conviértete en comprador local de Cúku. Elige tus horarios y ayuda
              a tus vecinos.
            </p>
          </div>
          <a className="button button-secondary" href="/compradores/registro">
            Registrarme para trabajar
          </a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-symbol">Cú</span>
          <div>
            <strong>Cúku</strong>
            <small>Tu ciudad, a tu alcance.</small>
          </div>
        </div>
        <p>© 2026 Cúku. Todos los derechos reservados.</p>
        <nav aria-label="Redes sociales">
          <a href="#instagram">Instagram</a>
          <a href="#facebook">Facebook</a>
          <a href="#terminos">Términos</a>
        </nav>
      </footer>

      {orderModalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOrderModalOpen(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="order-modal-title"
            aria-modal="true"
            className="order-modal"
            role="dialog"
          >
            <button
              aria-label="Cerrar formulario"
              className="modal-close"
              onClick={() => setOrderModalOpen(false)}
              type="button"
            >
              ×
            </button>
            <span className="section-kicker">Crear pedido</span>
            <h2 id="order-modal-title">¿Qué compramos por ti?</h2>
            <p>Cuéntanos lo que necesitas y continuaremos contigo por WhatsApp.</p>
            <form onSubmit={submitOrder}>
              <label>
                <span>¿Qué necesitas que compremos por ti?</span>
                <textarea
                  name="order"
                  placeholder="Ejemplo: una camisa blanca, talla M, máximo $100.000"
                  required
                  rows={4}
                />
              </label>
              <div className="modal-fields">
                <label>
                  <span>Tu nombre</span>
                  <input name="name" autoComplete="name" placeholder="Nombre completo" required />
                </label>
                <label>
                  <span>Tu número de WhatsApp</span>
                  <input
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+57 300 000 0000"
                    required
                  />
                </label>
              </div>
              <button className="button button-primary modal-submit" type="submit">
                Continuar por WhatsApp <span aria-hidden="true">→</span>
              </button>
              {orderSent && (
                <p className="form-success" role="status">
                  Abrimos WhatsApp con tu pedido listo para enviar.
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
