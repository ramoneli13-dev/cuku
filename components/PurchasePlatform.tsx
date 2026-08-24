"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminMetrics,
  DemoUser,
  ProductOption,
  PurchaseRequest,
  PurchaseStatus,
  ServiceType,
  ZoneConfig,
} from "@/lib/types";

const users: DemoUser[] = [
  { id: "customer-1", name: "Cliente demo", role: "CUSTOMER" },
  { id: "buyer-1", name: "Comprador demo", role: "BUYER" },
  { id: "admin-1", name: "Administrador", role: "ADMIN" },
];

const roleLabels = { CUSTOMER: "Cliente", BUYER: "Comprador", ADMIN: "Administrador" };
const serviceLabels: Record<ServiceType, string> = {
  FOOD: "Comida",
  GROCERIES: "Mercado",
  PHARMACY: "Farmacia",
  BUY_FOR_ME: "Compra por mí",
  PACKAGE: "Paquete",
  ERRAND: "Diligencia",
  PICKUP_DELIVERY: "Recogida y entrega",
  OTHER: "Otro",
};
const statusLabels: Record<PurchaseStatus, string> = {
  OPEN: "Disponible",
  ACCEPTED: "Aceptada",
  OPTIONS_SENT: "Opciones enviadas",
  OPTION_APPROVED: "Compra autorizada",
  PURCHASED: "Comprado",
  PICKED_UP: "Recogido",
  DELIVERED: "Entregado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};
const statusProgress: PurchaseStatus[] = [
  "OPEN",
  "ACCEPTED",
  "OPTIONS_SENT",
  "OPTION_APPROVED",
  "PURCHASED",
  "PICKED_UP",
  "DELIVERED",
  "COMPLETED",
];

type CatalogCategory = "Conjuntos" | "Chaquetas" | "Buzos";

type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CatalogCategory;
  image: string;
};

const modaBuzosProducts: CatalogProduct[] = [
  { id: "conjunto-alta-gama", name: "Conjunto alta gama 1.1", description: "Alta gama importado 1.1", price: 180000, category: "Conjuntos", image: "/catalog/moda-buzos/01-conjunto-alta-gama.svg" },
  { id: "conjunto-dama", name: "Conjunto para dama 1.1", description: "Conjunto en algodón 1.1 importado", price: 160000, category: "Conjuntos", image: "/catalog/moda-buzos/02-conjunto-dama.svg" },
  { id: "chaqueta-nike", name: "Chaqueta Nike 1.1", description: "Chaqueta impermeable 1.1 en súper nailon", price: 120000, category: "Chaquetas", image: "/catalog/moda-buzos/03-chaqueta-nike.svg" },
  { id: "chaqueta-boss", name: "Chaqueta 1.1 Boss", description: "Chaqueta 1.1 impermeable", price: 120000, category: "Chaquetas", image: "/catalog/moda-buzos/04-chaqueta-boss.svg" },
  { id: "conjunto-vioto", name: "Conjunto vioto para dama, caballero y niños", description: "Algodón vioto · tallas M, L, XL y XXL", price: 90000, category: "Conjuntos", image: "/catalog/moda-buzos/05-conjunto-vioto.svg" },
  { id: "buzos-caballero", name: "Buzos para caballero 1.1", description: "Algodón burda 1.1", price: 95000, category: "Buzos", image: "/catalog/moda-buzos/06-buzos-caballero.svg" },
  { id: "buzos-cierre-caballero", name: "Buzos con cierre para caballero", description: "Algodón parchado con cierre y capota", price: 85000, category: "Buzos", image: "/catalog/moda-buzos/07-buzos-cierre-caballero.svg" },
  { id: "buzos-multimarcas", name: "Buzos multimarcas", description: "Algodón parchado licrado", price: 85000, category: "Buzos", image: "/catalog/moda-buzos/08-buzos-multimarcas.svg" },
  { id: "buzo-balaclaba", name: "Buzo balaclava", description: "Buzo balaclava en algodón parchado licrado", price: 120000, category: "Buzos", image: "/catalog/moda-buzos/09-buzo-balaclaba.svg" },
  { id: "buzo-cierre", name: "Buzo con cierre", description: "Buzo con cierre en algodón parchado licrado", price: 85000, category: "Buzos", image: "/catalog/moda-buzos/10-buzo-cierre.svg" },
];

export function PurchasePlatform() {
  const [user, setUser] = useState(users[0]);
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [zones, setZones] = useState<ZoneConfig[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [showForm, setShowForm] = useState(false);
  const [catalogProduct, setCatalogProduct] = useState<CatalogProduct>();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; error?: boolean }>();

  const api = useCallback(
    async <T,>(path: string, options?: RequestInit): Promise<T> => {
      const response = await fetch(path, {
        ...options,
        headers: {
          "content-type": "application/json",
          "x-demo-user-id": user.id,
          ...options?.headers,
        },
      });
      const data = (await response.json()) as T & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No fue posible completar la acción.");
      return data;
    },
    [user.id],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [purchaseData, zoneData] = await Promise.all([
        api<{ purchases: PurchaseRequest[] }>("/api/purchases"),
        api<{ zones: ZoneConfig[] }>("/api/admin/zones"),
      ]);
      setPurchases(purchaseData.purchases);
      setZones(zoneData.zones);
      setSelectedId((current) =>
        current && purchaseData.purchases.some((purchase) => purchase.id === current)
          ? current
          : purchaseData.purchases[0]?.id,
      );
      if (user.role === "ADMIN") {
        const metricData = await api<{ metrics: AdminMetrics }>("/api/admin/metrics");
        setMetrics(metricData.metrics);
      } else {
        setMetrics(null);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "No pudimos cargar la información.", true);
    } finally {
      setLoading(false);
    }
  }, [api, user.role]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selected = useMemo(
    () => purchases.find((purchase) => purchase.id === selectedId),
    [purchases, selectedId],
  );

  function notify(text: string, error = false) {
    setToast({ text, error });
    window.setTimeout(() => setToast(undefined), 3500);
  }

  async function mutate(path: string, body?: unknown, method = "POST") {
    try {
      const data = await api<{ purchase?: PurchaseRequest }>(path, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (data.purchase) setSelectedId(data.purchase.id);
      await load();
      notify("Acción guardada correctamente.");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "No fue posible guardar.", true);
      return false;
    }
  }

  function changeUser(nextUser: DemoUser) {
    setUser(nextUser);
    setSelectedId(undefined);
    setShowForm(false);
    setCatalogProduct(undefined);
  }

  function openPurchaseForm(product?: CatalogProduct) {
    if (user.role !== "CUSTOMER") setUser(users[0]);
    setCatalogProduct(product);
    setShowForm(true);
    window.setTimeout(() => document.querySelector("#panel")?.scrollIntoView({ behavior: "smooth" }), 0);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">Cú</span>
          <div><strong>Cúku</strong><small>Compra por ti · Cúcuta y alrededores</small></div>
        </div>
        <nav className="role-switcher" aria-label="Cambiar rol de demostración">
          {users.map((candidate) => (
            <button
              className={candidate.id === user.id ? "active" : ""}
              key={candidate.id}
              onClick={() => changeUser(candidate)}
              type="button"
            >
              {roleLabels[candidate.role]}
            </button>
          ))}
        </nav>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">Tu ciudad, a tu alcance</span>
          <h1>Lo buscas. <em>Lo encontramos.</em> Te lo llevamos.</h1>
          <p>
            Pide compras o diligencias en cualquier comercio legal, aunque no esté registrado.
            Aprueba el producto y su precio antes de que el comprador gaste tu dinero.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => user.role === "CUSTOMER" ? openPurchaseForm() : document.querySelector("#panel")?.scrollIntoView()} type="button">
              {user.role === "CUSTOMER" ? "+ Crear una compra" : "Ver panel de demostración"}
            </button>
            <span className="btn btn-soft">Cúcuta · Los Patios · Villa del Rosario · El Zulia</span>
          </div>
        </div>
        <div className="hero-card" aria-label="Ejemplo de servicio">
          <div className="hero-card-inner">
            <span className="eyebrow" style={{ color: "#dff6aa" }}>Compra protegida</span>
            <div className="route">
              <span className="route-point">Tú</span><span className="route-line" />
              <span className="route-point">Cú</span><span className="route-line" />
              <span className="route-point">✓</span>
            </div>
            <h3>Camisa blanca · talla M</h3>
            <p>El comprador envía fotos y precios. Tú eliges antes de pagar.</p>
            <div className="mini-total"><span>Presupuesto máximo</span><strong>$120.000</strong></div>
          </div>
        </div>
      </section>

      <ModaBuzosCatalog onOrder={openPurchaseForm} />

      <main className="main-content" id="panel">
        <div className="dashboard-header">
          <div>
            <span className="eyebrow">Modo demostración · {roleLabels[user.role]}</span>
            <h2>{user.role === "ADMIN" ? "Control de operación" : user.role === "BUYER" ? "Solicitudes y entregas" : "Tus compras y diligencias"}</h2>
            <p>Cambia de rol arriba para recorrer el proceso completo.</p>
          </div>
          {user.role === "CUSTOMER" && (
            <button className="btn btn-primary" onClick={() => showForm ? setShowForm(false) : openPurchaseForm()} type="button">
              {showForm ? "Cerrar formulario" : "+ Nueva solicitud"}
            </button>
          )}
        </div>

        {user.role === "ADMIN" ? (
          <AdminPanel metrics={metrics} zones={zones} mutate={mutate} loading={loading} />
        ) : (
          <>
            {showForm && user.role === "CUSTOMER" && (
              <CreatePurchaseForm
                key={catalogProduct?.id ?? "custom-purchase"}
                zones={zones}
                prefill={catalogProduct}
                onCreate={async (body) => {
                  const saved = await mutate("/api/purchases", body);
                  if (saved) {
                    setShowForm(false);
                    setCatalogProduct(undefined);
                  }
                }}
              />
            )}
            <div className="dashboard-grid" style={{ marginTop: showForm ? "1rem" : undefined }}>
              <section className="panel">
                <div className="panel-head"><h3>{user.role === "BUYER" ? "Solicitudes disponibles" : "Mis solicitudes"}</h3><span className="status">{purchases.length}</span></div>
                <div className="order-list">
                  {loading ? <div className="empty">Cargando…</div> : purchases.length === 0 ? <EmptyOrders role={user.role} /> : purchases.map((purchase) => (
                    <button className={`order-card ${purchase.id === selectedId ? "active" : ""}`} key={purchase.id} onClick={() => setSelectedId(purchase.id)} type="button">
                      <div className="order-card-top"><div><h4>{purchase.title}</h4><p>{serviceLabels[purchase.serviceType]} · {zoneName(purchase.zoneId, zones)}</p></div><span className="status">{statusLabels[purchase.status]}</span></div>
                      <p style={{ marginTop: ".6rem" }}>Hasta {cop(purchase.maxBudget)}</p>
                    </button>
                  ))}
                </div>
              </section>
              <section className="panel">
                {selected ? <PurchaseWorkspace purchase={selected} user={user} mutate={mutate} /> : <div className="empty"><div className="empty-icon">⌁</div><strong>Selecciona una solicitud</strong><p>Aquí aparecerán los detalles, opciones, recibo y chat.</p></div>}
              </section>
            </div>
          </>
        )}
      </main>
      {toast && <div className={`toast ${toast.error ? "error" : ""}`} role="status">{toast.text}</div>}
    </div>
  );
}

function ModaBuzosCatalog({ onOrder }: { onOrder: (product: CatalogProduct) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | CatalogCategory>("Todos");
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return modaBuzosProducts.filter((product) => {
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesQuery = !normalizedQuery || `${product.name} ${product.description}`.toLocaleLowerCase("es").includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <section className="catalog-section" aria-labelledby="moda-buzos-title">
      <div className="catalog-heading">
        <div>
          <span className="eyebrow">Tienda local destacada</span>
          <h2 id="moda-buzos-title">Catálogo MODA BUZOS</h2>
          <p>Elige tu prenda y Cúku coordina la compra y la entrega en Cúcuta y alrededores.</p>
        </div>
        <a className="btn btn-outline" href="https://wa.me/c/573224565714" target="_blank" rel="noreferrer">Ver catálogo original ↗</a>
      </div>

      <div className="catalog-tools">
        <label className="catalog-search">
          <span>Buscar</span>
          <input aria-label="Buscar prendas" onChange={(event) => setQuery(event.target.value)} placeholder="Buzo, chaqueta, conjunto…" type="search" value={query} />
        </label>
        <div className="catalog-filters" aria-label="Filtrar por categoría">
          {(["Todos", "Conjuntos", "Chaquetas", "Buzos"] as const).map((option) => (
            <button aria-pressed={category === option} className={category === option ? "active" : ""} key={option} onClick={() => setCategory(option)} type="button">{option}</button>
          ))}
        </div>
      </div>

      {filteredProducts.length ? (
        <div className="catalog-grid">
          {filteredProducts.map((product) => (
            <article className="catalog-card" key={product.id}>
              <div className="catalog-image">
                <Image alt={`${product.name} de MODA BUZOS`} height={422} sizes="(max-width: 640px) 82vw, (max-width: 980px) 42vw, 24vw" src={product.image} unoptimized width={337} />
                <span>{product.category}</span>
              </div>
              <div className="catalog-card-body">
                <div className="catalog-card-title"><h3>{product.name}</h3><strong>{cop(product.price)}</strong></div>
                <p>{product.description}</p>
                <button className="btn btn-primary" onClick={() => onOrder(product)} type="button">Pedir con Cúku</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="catalog-empty">No encontramos prendas con ese término.</div>
      )}
      <p className="catalog-note">Precios tomados del catálogo de MODA BUZOS. Cúku confirmará disponibilidad, talla, color y precio final antes de comprar.</p>
    </section>
  );
}

function EmptyOrders({ role }: { role: DemoUser["role"] }) {
  return <div className="empty"><div className="empty-icon">🛍</div><strong>{role === "BUYER" ? "Aún no hay solicitudes" : "Crea tu primera compra"}</strong><p>{role === "BUYER" ? "Cuando un cliente publique una, aparecerá aquí." : "Describe libremente lo que necesitas."}</p></div>;
}

function CreatePurchaseForm({ zones, onCreate, prefill }: { zones: ZoneConfig[]; onCreate: (body: unknown) => Promise<void>; prefill?: CatalogProduct }) {
  const [searchStore, setSearchStore] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const files = form.getAll("referenceImages").filter((value): value is File => value instanceof File && value.size > 0).slice(0, 3);
    const referenceImages = await Promise.all(files.map(fileToDataUrl));
    await onCreate({
      serviceType: form.get("serviceType"),
      title: form.get("title"),
      description: form.get("description"),
      businessName: searchStore ? "" : form.get("businessName"),
      businessAddress: searchStore ? "" : form.get("businessAddress"),
      doesNotKnowStore: searchStore,
      product: form.get("product"),
      size: form.get("size"),
      color: form.get("color"),
      brand: form.get("brand"),
      quantity: Number(form.get("quantity")),
      maxBudget: Number(form.get("maxBudget")),
      specialInstructions: form.get("specialInstructions"),
      referenceImages,
      deliveryAddress: form.get("deliveryAddress"),
      zoneId: form.get("zoneId"),
      distanceKm: Number(form.get("distanceKm")),
      tip: Number(form.get("tip")),
    });
    setSaving(false);
  }

  return (
    <section className="panel">
      <div className="panel-head"><div><h3>Nueva solicitud · Compra por mí</h3><span className="helper">Un comprador verá la solicitud y podrá aceptarla.</span></div><span className="status">Paso 1</span></div>
      <form className="panel-body" onSubmit={submit}>
        {prefill && <div className="catalog-prefill"><Image alt={prefill.name} height={84} src={prefill.image} unoptimized width={68} /><div><span className="status">Seleccionado del catálogo</span><strong>{prefill.name}</strong><small>{cop(prefill.price)} · MODA BUZOS</small></div></div>}
        <div className="form-grid">
          <div className="field"><label htmlFor="serviceType">Tipo de servicio</label><select id="serviceType" name="serviceType" defaultValue="BUY_FOR_ME">{Object.entries(serviceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="field"><label htmlFor="title">Título corto</label><input defaultValue={prefill ? `Comprar ${prefill.name}` : undefined} id="title" name="title" placeholder="Camisa blanca para evento" required /></div>
          <div className="field full"><label htmlFor="description">¿Qué necesitas?</label><textarea defaultValue={prefill ? `Comprar ${prefill.name} de MODA BUZOS. ${prefill.description}. Confirmar disponibilidad antes de comprar.` : undefined} id="description" name="description" placeholder="Ve a este almacén y busca una camisa blanca talla M, máximo 120.000 COP." required /></div>
          <div className="field full"><label className="check"><input checked={searchStore} onChange={(event) => setSearchStore(event.target.checked)} type="checkbox" />No sé dónde comprarlo; quiero que el comprador busque opciones.</label></div>
          {!searchStore && <><div className="field"><label htmlFor="businessName">Nombre del negocio</label><input defaultValue={prefill ? "MODA BUZOS" : undefined} id="businessName" name="businessName" required placeholder="Nombre del almacén" /></div><div className="field"><label htmlFor="businessAddress">Dirección o ubicación</label><input defaultValue={prefill ? "Cúcuta" : undefined} id="businessAddress" name="businessAddress" placeholder="Centro Comercial Ventura Plaza" /></div></>}
          <div className="field"><label htmlFor="product">Producto</label><input defaultValue={prefill?.name} id="product" name="product" required placeholder="Camisa manga larga" /></div>
          <div className="field"><label htmlFor="brand">Marca opcional</label><input id="brand" name="brand" placeholder="Sin preferencia" /></div>
          <div className="field"><label htmlFor="size">Talla</label><input id="size" name="size" placeholder="M / 38 / 9 US" /></div>
          <div className="field"><label htmlFor="color">Color</label><input id="color" name="color" placeholder="Blanco" /></div>
          <div className="field"><label htmlFor="quantity">Cantidad</label><input id="quantity" name="quantity" type="number" min="1" max="50" defaultValue="1" required /></div>
          <div className="field"><label htmlFor="maxBudget">Presupuesto máximo (COP)</label><input id="maxBudget" name="maxBudget" type="number" min="1000" step="1000" defaultValue={prefill?.price ?? 120000} required /></div>
          <div className="field full"><label htmlFor="specialInstructions">Instrucciones especiales</label><textarea defaultValue={prefill ? "Confirmar talla, color, disponibilidad y precio final. Producto visto en el catálogo de MODA BUZOS." : undefined} id="specialInstructions" name="specialInstructions" placeholder="Llamar al llegar, no aceptar imitaciones…" /></div>
          <div className="field full"><label htmlFor="referenceImages">Fotos de referencia (máximo 3)</label><input accept="image/*" id="referenceImages" name="referenceImages" type="file" multiple /><span className="helper">Solo sirven de referencia; el comprador enviará fotos reales antes de comprar.</span></div>
          <div className="field"><label htmlFor="zoneId">Zona de entrega</label><select id="zoneId" name="zoneId">{zones.filter((zone) => zone.active).map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></div>
          <div className="field"><label htmlFor="distanceKm">Distancia estimada (km)</label><input id="distanceKm" name="distanceKm" type="number" min="0" max="150" step="0.5" defaultValue="5" required /></div>
          <div className="field full"><label htmlFor="deliveryAddress">Dirección de entrega</label><input id="deliveryAddress" name="deliveryAddress" required placeholder="Barrio, calle, número y referencia" /></div>
          <div className="field"><label htmlFor="tip">Propina opcional (COP)</label><input id="tip" name="tip" type="number" min="0" step="1000" defaultValue="0" /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" disabled={saving} type="submit">{saving ? "Creando…" : "Publicar solicitud"}</button></div>
      </form>
    </section>
  );
}

function PurchaseWorkspace({ purchase, user, mutate }: { purchase: PurchaseRequest; user: DemoUser; mutate: (path: string, body?: unknown, method?: string) => Promise<boolean> }) {
  const progress = statusProgress.indexOf(purchase.status);
  return (
    <div className="workspace">
      <div className="workspace-hero">
        <div className="workspace-hero-top">
          <div><span className="status">{statusLabels[purchase.status]}</span><h3>{purchase.title}</h3><p>{purchase.description}</p></div>
          {user.role === "BUYER" && purchase.status === "OPEN" && <button className="btn btn-primary" onClick={() => mutate(`/api/purchases/${purchase.id}/accept`)} type="button">Aceptar solicitud</button>}
        </div>
        <div className="detail-grid">
          <div className="detail"><small>Producto</small><strong>{purchase.product} · {purchase.quantity} unidad(es)</strong></div>
          <div className="detail"><small>Preferencias</small><strong>{[purchase.brand, purchase.color, purchase.size].filter(Boolean).join(" · ") || "Sin preferencia"}</strong></div>
          <div className="detail"><small>Comercio</small><strong>{purchase.doesNotKnowStore ? "El comprador debe buscarlo" : purchase.businessName}</strong></div>
        </div>
        <div className="timeline" aria-label={`Progreso: ${statusLabels[purchase.status]}`}>{statusProgress.slice(0, 7).map((status, index) => <span className={`timeline-step ${index <= progress ? "done" : ""}`} key={status} />)}</div>
      </div>
      <div className="workspace-columns">
        <div style={{ display: "grid", gap: "1rem" }}>
          <CostPanel purchase={purchase} />
          <OptionsPanel purchase={purchase} user={user} mutate={mutate} />
          <FlowActions purchase={purchase} user={user} mutate={mutate} />
        </div>
        <ChatPanel purchase={purchase} user={user} mutate={mutate} />
      </div>
    </div>
  );
}

function CostPanel({ purchase }: { purchase: PurchaseRequest }) {
  const costs = purchase.costs;
  return <section className="subpanel"><div className="subpanel-title"><h4>Costos separados</h4><span className="status">Presupuesto {cop(purchase.maxBudget)}</span></div><div className="subpanel-content cost-list"><Cost label="Costo real del producto" value={costs.productCost} /><Cost label="Tarifa del comprador" value={costs.buyerFee} /><Cost label="Tarifa de entrega" value={costs.deliveryFee} /><Cost label="Servicio de plataforma" value={costs.platformFee} /><Cost label="Propina" value={costs.tip} /><div className="cost-row total"><span>Total</span><span>{cop(costs.total)}</span></div></div></section>;
}

function Cost({ label, value }: { label: string; value: number }) { return <div className="cost-row"><span>{label}</span><strong>{cop(value)}</strong></div>; }

function OptionsPanel({ purchase, user, mutate }: { purchase: PurchaseRequest; user: DemoUser; mutate: (path: string, body?: unknown) => Promise<boolean> }) {
  return <section className="subpanel"><div className="subpanel-title"><h4>Opciones encontradas</h4><span className="status">{purchase.options.length}</span></div><div className="subpanel-content">
    {purchase.options.length > 0 && <div className="option-list">{purchase.options.map((option) => <OptionCard key={option.id} option={option} purchase={purchase} user={user} mutate={mutate} />)}</div>}
    {purchase.options.length === 0 && <p className="helper">El comprador todavía no ha enviado opciones.</p>}
    {user.role === "BUYER" && ["ACCEPTED", "OPTIONS_SENT"].includes(purchase.status) && <OptionForm purchaseId={purchase.id} mutate={mutate} />}
  </div></section>;
}

function OptionCard({ option, purchase, user, mutate }: { option: ProductOption; purchase: PurchaseRequest; user: DemoUser; mutate: (path: string, body?: unknown) => Promise<boolean> }) {
  const overage = Math.max(0, option.price - purchase.maxBudget);
  return <article className={`option ${option.decision.toLowerCase()}`}><div className="option-head"><div><h5>{option.productName}</h5><p>{option.businessName} · {option.details}</p></div><strong>{cop(option.price)}</strong></div>{option.imageUrl && <a className="helper" href={option.imageUrl} target="_blank" rel="noreferrer">Ver fotografía ↗</a>}{overage > 0 && option.decision === "PENDING" && <div className="budget-alert">El precio supera tu presupuesto en <strong>{cop(overage)}</strong>. Solo se comprará si lo apruebas expresamente.</div>}{user.role === "CUSTOMER" && option.decision === "PENDING" && purchase.status === "OPTIONS_SENT" && <div className="option-actions"><button className="btn btn-primary" onClick={() => mutate(`/api/purchases/${purchase.id}/options/${option.id}/decision`, { decision: "APPROVE", approveOverage: overage > 0 })} type="button">{overage > 0 ? `Aprobar +${cop(overage)}` : "Aprobar"}</button><button className="btn btn-outline" onClick={() => mutate(`/api/purchases/${purchase.id}/options/${option.id}/decision`, { decision: "SEARCH_ANOTHER", approveOverage: false })} type="button">Buscar otra</button><button className="btn btn-danger" onClick={() => mutate(`/api/purchases/${purchase.id}/options/${option.id}/decision`, { decision: "REJECT", approveOverage: false })} type="button">Rechazar</button></div>}</article>;
}

function OptionForm({ purchaseId, mutate }: { purchaseId: string; mutate: (path: string, body?: unknown) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const image = form.get("image");
    const saved = await mutate(`/api/purchases/${purchaseId}/options`, { businessName: form.get("businessName"), productName: form.get("productName"), price: Number(form.get("price")), details: form.get("details"), imageUrl: image instanceof File && image.size ? await fileToDataUrl(image) : "" });
    if (saved) setOpen(false);
  }
  return <div style={{ marginTop: ".8rem" }}>{!open ? <button className="btn btn-outline" onClick={() => setOpen(true)} type="button">+ Enviar opción al cliente</button> : <form className="form-grid" onSubmit={submit}><div className="field"><label>Comercio</label><input name="businessName" required /></div><div className="field"><label>Producto</label><input name="productName" required /></div><div className="field"><label>Precio (COP)</label><input name="price" type="number" min="1000" step="1000" required /></div><div className="field"><label>Foto encontrada</label><input accept="image/*" name="image" type="file" /></div><div className="field full"><label>Detalles</label><input name="details" placeholder="Talla, color, disponibilidad…" required /></div><div className="form-actions field full"><button className="btn btn-soft" onClick={() => setOpen(false)} type="button">Cancelar</button><button className="btn btn-primary" type="submit">Enviar al cliente</button></div></form>}</div>;
}

function FlowActions({ purchase, user, mutate }: { purchase: PurchaseRequest; user: DemoUser; mutate: (path: string, body?: unknown) => Promise<boolean> }) {
  if (user.role === "BUYER" && purchase.status === "OPTION_APPROVED") return <ReceiptForm purchase={purchase} mutate={mutate} />;
  if (user.role === "BUYER" && purchase.status === "PURCHASED") return <section className="subpanel"><div className="subpanel-content"><button className="btn btn-primary" onClick={() => mutate(`/api/purchases/${purchase.id}/pickup`)} type="button">Marcar producto como recogido</button></div></section>;
  if (user.role === "BUYER" && purchase.status === "PICKED_UP") return <section className="subpanel"><div className="subpanel-content"><button className="btn btn-primary" onClick={() => mutate(`/api/purchases/${purchase.id}/deliver`)} type="button">Marcar como entregado</button></div></section>;
  if (user.role === "CUSTOMER" && purchase.status === "DELIVERED") return <section className="subpanel"><div className="subpanel-content"><button className="btn btn-primary" onClick={() => mutate(`/api/purchases/${purchase.id}/confirm`)} type="button">Confirmar que recibí el producto</button></div></section>;
  if (purchase.receipt) return <section className="subpanel"><div className="subpanel-title"><h4>Recibo de compra</h4><span className="status">Guardado</span></div><div className="subpanel-content"><p style={{ margin: 0 }}><strong>{purchase.receipt.businessName}</strong> · {cop(purchase.receipt.finalPrice)}</p><a className="helper" href={purchase.receipt.imageUrl} target="_blank" rel="noreferrer">Ver fotografía del recibo ↗</a></div></section>;
  return null;
}

function ReceiptForm({ purchase, mutate }: { purchase: PurchaseRequest; mutate: (path: string, body?: unknown) => Promise<boolean> }) {
  const approved = purchase.options.find((option) => option.id === purchase.selectedOptionId);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const image = form.get("receiptImage"); if (!(image instanceof File) || !image.size) return; await mutate(`/api/purchases/${purchase.id}/purchase`, { businessName: form.get("businessName"), finalPrice: Number(form.get("finalPrice")), imageUrl: await fileToDataUrl(image) }); }
  return <section className="subpanel"><div className="subpanel-title"><h4>Registrar compra y recibo</h4><span className="status">Máximo aprobado {cop(approved?.price ?? 0)}</span></div><form className="subpanel-content form-grid" onSubmit={submit}><div className="field"><label>Comercio</label><input name="businessName" defaultValue={approved?.businessName} required /></div><div className="field"><label>Precio final (COP)</label><input name="finalPrice" type="number" min="1000" max={approved?.price} defaultValue={approved?.price} required /></div><div className="field full"><label>Fotografía del recibo</label><input accept="image/*" name="receiptImage" type="file" required /></div><div className="form-actions field full"><button className="btn btn-primary" type="submit">Confirmar compra</button></div></form></section>;
}

function ChatPanel({ purchase, user, mutate }: { purchase: PurchaseRequest; user: DemoUser; mutate: (path: string, body?: unknown) => Promise<boolean> }) {
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const text = String(form.get("message") ?? ""); if (!text.trim()) return; const saved = await mutate(`/api/purchases/${purchase.id}/messages`, { text, type: "TEXT" }); if (saved) event.currentTarget.reset(); }
  return <section className="subpanel chat"><div className="messages">{purchase.messages.map((message) => <div className={`message ${message.senderId === user.id ? "mine" : ""} ${message.type === "SYSTEM" ? "system" : ""}`} key={message.id}>{message.text}{message.imageUrl && <><br /><a href={message.imageUrl} target="_blank" rel="noreferrer">Ver imagen</a></>}<small>{message.type === "SYSTEM" ? "Actualización del pedido" : message.senderRole === "CUSTOMER" ? "Cliente" : message.senderRole === "BUYER" ? "Comprador" : "Administración"}</small></div>)}</div><form className="chat-form" onSubmit={submit}><input name="message" placeholder="Escribe dentro del pedido…" aria-label="Mensaje" /><button className="btn btn-dark" type="submit">Enviar</button></form></section>;
}

function AdminPanel({ metrics, zones, mutate, loading }: { metrics: AdminMetrics | null; zones: ZoneConfig[]; mutate: (path: string, body?: unknown, method?: string) => Promise<boolean>; loading: boolean }) {
  if (loading || !metrics) return <section className="panel"><div className="empty">Cargando operación…</div></section>;
  return <><section className="admin-grid"><Metric label="Solicitudes" value={String(metrics.purchaseRequests)} /><Metric label="Completadas" value={String(metrics.completedPurchases)} /><Metric label="Valor de productos" value={cop(metrics.totalProductValue)} /><Metric label="Ingresos por tarifas" value={cop(metrics.feeRevenue)} /><Metric label="Comisiones" value={cop(metrics.commissionRevenue)} /><Metric label="Compradores activos" value={String(metrics.activeBuyers)} /><Metric label="Zona principal" value={metrics.demandByZone[0]?.zone ?? "Sin datos"} /><Metric label="Categoría principal" value={metrics.demandByCategory[0] ? serviceLabels[metrics.demandByCategory[0].category] : "Sin datos"} /></section><section className="panel" style={{ marginTop: "1rem" }}><div className="panel-head"><div><h3>Zonas, tarifas y horarios</h3><span className="helper">Los cambios se aplican a solicitudes nuevas.</span></div></div><div className="panel-body zones">{zones.map((zone) => <ZoneForm key={zone.id} zone={zone} mutate={mutate} />)}</div></section></>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><small>{label}</small><strong>{value}</strong></div>; }

function ZoneForm({ zone, mutate }: { zone: ZoneConfig; mutate: (path: string, body?: unknown, method?: string) => Promise<boolean> }) {
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await mutate("/api/admin/zones", { id: zone.id, active: form.get("active") === "on", baseFee: Number(form.get("baseFee")), perKmFee: Number(form.get("perKmFee")), remoteSurcharge: Number(form.get("remoteSurcharge")), serviceStart: form.get("serviceStart"), serviceEnd: form.get("serviceEnd") }, "PATCH"); }
  return <form className="zone-row" onSubmit={submit}><div><strong>{zone.name}</strong><label className="check" style={{ marginTop: ".45rem", padding: ".45rem" }}><input defaultChecked={zone.active} name="active" type="checkbox" />Zona activa</label></div><SmallField label="Tarifa base" name="baseFee" value={zone.baseFee} /><SmallField label="Por km" name="perKmFee" value={zone.perKmFee} /><SmallField label="Recargo lejano" name="remoteSurcharge" value={zone.remoteSurcharge} /><SmallField label="Inicio" name="serviceStart" type="time" value={zone.serviceStart} /><SmallField label="Cierre" name="serviceEnd" type="time" value={zone.serviceEnd} /><button className="btn btn-outline" type="submit">Guardar</button></form>;
}

function SmallField({ label, name, value, type = "number" }: { label: string; name: string; value: string | number; type?: string }) { return <div className="field"><label>{label}</label><input defaultValue={value} min={type === "number" ? 0 : undefined} name={name} type={type} /></div>; }

function zoneName(id: string, zones: ZoneConfig[]) { return zones.find((zone) => zone.id === id)?.name ?? id; }
function cop(value: number) { return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value); }
function fileToDataUrl(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("No se pudo leer la imagen.")); reader.readAsDataURL(file); }); }
