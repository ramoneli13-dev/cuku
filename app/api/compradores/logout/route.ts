import { clearAuthCookies, getAccessToken } from "@/lib/supabase-auth";

export async function POST() {
  const token = await getAccessToken();
  if (token) {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && key) {
      await fetch(`${url.replace(/\/$/, "")}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
  }
  await clearAuthCookies();
  return Response.json({ ok: true });
}
