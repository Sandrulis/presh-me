import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isMaintenanceOverlayExcludedPath } from "@/app/lib/site-admin/maintenance-paths";

export async function fetchMaintenanceEnabled(): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return false;
  try {
    const res = await fetch(`${base}/rest/v1/site_settings?id=eq.1&select=maintenance_mode`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const rows = (await res.json()) as { maintenance_mode?: boolean }[];
    return rows[0]?.maintenance_mode === true;
  } catch {
    return false;
  }
}

/** Sign out non-admin sessions while maintenance is on (login/admin/auth paths exempt). */
export async function tryMaintenanceKickSession(
  request: NextRequest,
  pathname: string,
  _requestHeaders: Headers,
): Promise<NextResponse | null> {
  if (!(await fetchMaintenanceEnabled())) return null;
  if (isMaintenanceOverlayExcludedPath(pathname)) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const home = request.nextUrl.clone();
  home.pathname = "/";
  home.search = "";

  const redirect = NextResponse.redirect(home);

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirect.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_admin === true) return null;

  await supabase.auth.signOut();
  return redirect;
}

export async function withMaintenanceKick(
  request: NextRequest,
  pathname: string,
  requestHeaders: Headers,
  response: NextResponse,
): Promise<NextResponse> {
  const kicked = await tryMaintenanceKickSession(request, pathname, requestHeaders);
  return kicked ?? response;
}
