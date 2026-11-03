import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SESSION_HINT_COOKIE } from "@/app/lib/auth/session-hint";
import { isMaintenanceOverlayExcludedPath } from "@/app/lib/site-admin/maintenance-paths";
import { fetchMaintenanceEnabledCached } from "@/app/lib/site-admin/maintenance-mode-cache";

function requestMayHaveAuthenticatedSession(request: NextRequest): boolean {
  if (request.cookies.get(SESSION_HINT_COOKIE)?.value === "1") return true;
  return request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token"));
}

/** Sign out non-admin sessions while maintenance is on (login/admin/auth paths exempt). */
export async function tryMaintenanceKickSession(
  request: NextRequest,
  pathname: string,
  _requestHeaders: Headers,
): Promise<NextResponse | null> {
  if (!(await fetchMaintenanceEnabledCached())) return null;
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
  if (!requestMayHaveAuthenticatedSession(request)) {
    return response;
  }
  const kicked = await tryMaintenanceKickSession(request, pathname, requestHeaders);
  return kicked ?? response;
}

/** @deprecated Use fetchMaintenanceEnabledCached — kept for tests or direct reads. */
export async function fetchMaintenanceEnabled(): Promise<boolean> {
  return fetchMaintenanceEnabledCached();
}
