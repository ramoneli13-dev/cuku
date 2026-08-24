type IconName = "search" | "shield" | "delivery";

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

export function PurchasePlatform() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Cúku, ir al inicio">
          <span className="brand-symbol">Cú</span>
          <span>Cúku</span>
        </a>
        <nav className="nav-links" aria-label="Navegación principal">
          <a href="#beneficios">Beneficios</a>
          <a href="#como-funciona">Cómo funciona</a>
        </nav>
        <a className="button button-small" href="#comenzar">Comenzar</a>
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
              <a className="button button-primary" href="#comenzar">
                Pedir con Cúku <span aria-hidden="true">→</span>
              </a>
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
          <a
            className="button button-light"
            href="https://wa.me/573224565714"
            target="_blank"
            rel="noreferrer"
          >
            Crear mi pedido <span aria-hidden="true">→</span>
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
    </div>
  );
}
