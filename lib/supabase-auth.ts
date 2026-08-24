import "server-only";

import { cookies } from "next/headers";

const ACCESS_COOKIE = "cuku_access_token";
const REFRESH_COOKIE = "cuku_refresh_token";

type SupabaseUser = {
  id: string;
  email?: string;
};

type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: SupabaseUser;
};

export type WorkerProfile = {
  id: string;
  auth_user_id: string;
  nombre_completo: string;
  telefono: string;
  tipo_vehiculo: string;
  correo: string;
  cuenta_aprobada: boolean;
};

function configuration() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("La autenticación de compradores aún no está configurada.");
  }

  return { url: url.replace(/\/$/, ""), key };
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const { url, key } = configuration();
  const response = await fetch(`${url}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken ?? key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    msg?: string;
    message?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.msg ??
        data.message ??
        data.error_description ??
        "No fue posible completar la autenticación.",
    );
  }

  return data;
}

export async function registerWorker(input: {
  nombreCompleto: string;
  telefono: string;
  tipoVehiculo: string;
  correo: string;
  password: string;
}) {
  return supabaseRequest<AuthSession>(
    "/auth/v1/signup",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.correo,
        password: input.password,
        data: {
          nombre_completo: input.nombreCompleto,
          telefono: input.telefono,
          tipo_vehiculo: input.tipoVehiculo,
        },
      }),
    },
  );
}

export async function loginWorker(correo: string, password: string) {
  return supabaseRequest<AuthSession>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: correo, password }),
  });
}

export async function setAuthCookies(session: AuthSession) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: session.expires_in,
  });
  cookieStore.set(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getAuthenticatedWorker(): Promise<{
  user: SupabaseUser;
  profile: WorkerProfile;
} | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const user = await supabaseRequest<SupabaseUser>("/auth/v1/user", {}, token);
    const query = new URLSearchParams({
      auth_user_id: `eq.${user.id}`,
      select:
        "id,auth_user_id,nombre_completo,telefono,tipo_vehiculo,correo,cuenta_aprobada",
      limit: "1",
    });
    const profiles = await supabaseRequest<WorkerProfile[]>(
      `/rest/v1/trabajadores?${query.toString()}`,
      {},
      token,
    );
    if (!profiles[0]) return null;
    return { user, profile: profiles[0] };
  } catch {
    return null;
  }
}
