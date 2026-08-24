import { loginWorker, setAuthCookies } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { correo?: string; password?: string };
    const correo = body.correo?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!correo || !password) {
      return Response.json({ error: "Ingresa tu correo y contraseña." }, { status: 400 });
    }

    const session = await loginWorker(correo, password);
    await setAuthCookies(session);
    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Correo o contraseña incorrectos.";
    const status = message.includes("configurada") ? 503 : 401;
    return Response.json({ error: message }, { status });
  }
}
