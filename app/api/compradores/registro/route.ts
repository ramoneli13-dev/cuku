import { registerWorker, setAuthCookies } from "@/lib/supabase-auth";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = {
      nombreCompleto: clean(body.nombreCompleto),
      telefono: clean(body.telefono),
      tipoVehiculo: clean(body.tipoVehiculo),
      correo: clean(body.correo).toLowerCase(),
      password: clean(body.password),
    };

    if (
      !input.nombreCompleto ||
      !input.telefono ||
      !input.tipoVehiculo ||
      !input.correo ||
      input.password.length < 8
    ) {
      return Response.json(
        { error: "Completa todos los campos y usa una contraseña de al menos 8 caracteres." },
        { status: 400 },
      );
    }

    const session = await registerWorker(input);
    if (session.access_token) await setAuthCookies(session);

    return Response.json(
      {
        message:
          "Tu cuenta está en revisión. Te contactaremos para validar tus documentos antes de activarla.",
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible crear la cuenta.";
    const status = message.includes("configurada") ? 503 : 400;
    return Response.json({ error: message }, { status });
  }
}
