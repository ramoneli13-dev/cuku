"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Order = {
  id: string;
  zone: string;
  title: string;
  pickup: string;
  delivery: string;
  earning: string;
  distance: string;
};

const sampleOrders: Order[] = [
  {
    id: "CU-1048",
    zone: "Caobos",
    title: "Comprar regalo y tarjeta",
    pickup: "Ventura Plaza",
    delivery: "Barrio Caobos",
    earning: "$18.000",
    distance: "3,2 km",
  },
  {
    id: "CU-1049",
    zone: "Centro",
    title: "Recoger pedido de papelería",
    pickup: "Centro de Cúcuta",
    delivery: "La Riviera",
    earning: "$15.500",
    distance: "4,1 km",
  },
  {
    id: "CU-1050",
    zone: "Los Patios",
    title: "Compra rápida de mercado",
    pickup: "Supermercado local",
    delivery: "Los Patios",
    earning: "$22.000",
    distance: "6,8 km",
  },
];

export function BuyerDashboard({
  name,
  vehicle,
}: {
  name: string;
  vehicle: string;
}) {
  const router = useRouter();
  const [acceptedId, setAcceptedId] = useState<string>();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/compradores/logout", { method: "POST" });
    router.push("/compradores/login");
    router.refresh();
  }

  return (
    <main className="worker-dashboard">
      <header className="worker-header">
        <div className="brand">
          <span className="brand-symbol">Cú</span>
          <span>Cúku Compradores</span>
        </div>
        <button className="dashboard-logout" disabled={loggingOut} onClick={logout} type="button">
          {loggingOut ? "Saliendo…" : "Cerrar sesión"}
        </button>
      </header>

      <section className="worker-welcome">
        <div>
          <span className="section-kicker">Pedidos disponibles</span>
          <h1>Hola, {name.split(" ")[0]}</h1>
          <p>{vehicle} · Cúcuta</p>
        </div>
        <span className="online-chip"><i /> Disponible</span>
      </section>

      <div className="orders-list">
        {sampleOrders.map((order) => {
          const accepted = acceptedId === order.id;
          return (
            <article className={accepted ? "street-order accepted" : "street-order"} key={order.id}>
              <div className="street-order-top">
                <span className="zone-chip">{order.zone}</span>
                <small>{order.id}</small>
              </div>
              <h2>{order.title}</h2>
              <div className="route-list">
                <p><i className="pickup-dot" /><span><small>Recogida</small>{order.pickup}</span></p>
                <p><i className="delivery-dot" /><span><small>Entrega</small>{order.delivery}</span></p>
              </div>
              <div className="order-compensation">
                <div><small>Tu ingreso</small><strong>{order.earning}</strong></div>
                <div><small>Distancia</small><strong>{order.distance}</strong></div>
                <button
                  className="button button-primary"
                  disabled={Boolean(acceptedId)}
                  onClick={() => setAcceptedId(order.id)}
                  type="button"
                >
                  {accepted ? "Pedido aceptado ✓" : "Aceptar pedido"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
