import { redirect } from "next/navigation";
import Link from "next/link";
import { BuyerDashboard } from "@/components/BuyerDashboard";
import { getAuthenticatedWorker } from "@/lib/supabase-auth";

export default async function BuyerDashboardPage() {
  const worker = await getAuthenticatedWorker();
  if (!worker) redirect("/compradores/login");

  if (!worker.profile.cuenta_aprobada) {
    return (
      <main className="blocked-page">
        <section className="blocked-card">
          <span className="blocked-icon" aria-hidden="true">⌛</span>
          <span className="section-kicker">Cuenta en revisión</span>
          <h1>Tu cuenta aún no ha sido verificada por el equipo de Cúku Cúcuta</h1>
          <p>
            Validaremos tus datos y documentos antes de habilitar pedidos.
            Te contactaremos al número registrado.
          </p>
          <Link className="button button-secondary" href="/">Volver al inicio</Link>
        </section>
      </main>
    );
  }

  return (
    <BuyerDashboard
      name={worker.profile.nombre_completo}
      vehicle={worker.profile.tipo_vehiculo}
    />
  );
}
