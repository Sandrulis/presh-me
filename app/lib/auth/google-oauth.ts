import { createServerClient } from "@supabase/ssr";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { getSupabasePublicEnv } from "@/app/lib/supabase/env";

export const GOOGLE_OAUTH_COOKIE = "presh-google-oauth";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export type GoogleOAuthState = {
  nonce: string;
  from: "login" | "register";
};

type GoogleProfile = {
  email: string;
  name: string;
};

type GoogleCredentials = { clientId: string; clientSecret: string };

function envGoogleCredentials(): GoogleCredentials | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret || clientId.includes("YOUR_")) return null;
  return { clientId, clientSecret };
}

export async function readGoogleOAuthCredentials(): Promise<GoogleCredentials | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_integrations")
      .select("client_id, client_secret, is_configured, is_enabled")
      .eq("integration_key", "google_oauth")
      .maybeSingle();
    const clientId = data?.client_id?.trim() ?? "";
    let clientSecret = data?.client_secret?.trim() ?? "";
    if (clientSecret) {
      try {
        const { decryptSecret } = await import("@/app/lib/security/secrets");
        clientSecret = decryptSecret(clientSecret);
      } catch {
        /* plaintext legacy */
      }
    }
    if (data?.is_enabled && data.is_configured && clientId && clientSecret) {
      return { clientId, clientSecret };
    }
  } catch {
    // Fall through to env.
  }
  return envGoogleCredentials();
}

export async function isGoogleOAuthConfigured() {
  return (await readGoogleOAuthCredentials()) !== null;
}

export async function isGoogleSignInModuleEnabled() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_frontend_modules")
      .select("is_enabled")
      .eq("module_key", "google_sign_in")
      .maybeSingle();
    if (data && data.is_enabled === false) return false;
  } catch {
    // Module table missing — allow.
  }
  return true;
}

export function publicRequestOrigin(request: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (site) return site;
  const url = new URL(request.url);
  return url.origin;
}

export function googleRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}

export function googleOAuthCookieOptions(maxAge: number) {
  const secure =
    process.env.NODE_ENV === "production" ||
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    maxAge,
  };
}

export function createGoogleOAuthState(from: "login" | "register"): GoogleOAuthState {
  return { nonce: randomBytes(16).toString("hex"), from };
}

export function serializeGoogleOAuthState(state: GoogleOAuthState) {
  return `v1.${state.nonce}.${state.from}`;
}

export function parseGoogleOAuthState(raw: string | null | undefined): GoogleOAuthState | null {
  if (!raw) return null;
  const [version, nonce, from] = raw.split(".");
  if (version !== "v1" || !nonce || nonce.length !== 32) return null;
  if (from !== "login" && from !== "register") return null;
  return { nonce, from };
}

export function googleOAuthStatesMatch(cookie: GoogleOAuthState | null, stateParam: string | null) {
  if (!cookie || !stateParam) return false;
  return cookie.nonce === stateParam;
}

export async function buildGoogleAuthorizeUrl(origin: string, nonce: string) {
  const credentials = await readGoogleOAuthCredentials();
  if (!credentials) return null;
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state: nonce,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCode(origin: string, code: string) {
  const credentials = await readGoogleOAuthCredentials();
  if (!credentials) return null;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as { access_token?: string } | null;
  if (!response.ok || !payload?.access_token) return null;
  return payload.access_token;
}

async function fetchProfile(accessToken: string): Promise<GoogleProfile | null> {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as {
    email?: string;
    verified_email?: boolean;
    name?: string;
    given_name?: string;
  } | null;
  const email = payload?.email?.trim().toLowerCase() ?? "";
  if (!email || payload?.verified_email === false) return null;
  const name =
    payload?.name?.trim() ||
    payload?.given_name?.trim() ||
    email.split("@")[0] ||
    "User";
  return { email, name };
}

function userAlreadyExists(message: string) {
  const text = message.toLowerCase();
  return text.includes("already") || text.includes("registered") || text.includes("exists");
}

function unusedHandle() {
  return `lapa${randomBytes(4).toString("hex")}`;
}

function readRequestCookies(request: Request) {
  return (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => {
      const index = part.indexOf("=");
      if (index <= 0) return null;
      return {
        name: decodeURIComponent(part.slice(0, index).trim()),
        value: decodeURIComponent(part.slice(index + 1).trim()),
      };
    })
    .filter((cookie): cookie is { name: string; value: string } => cookie !== null);
}

function authErrorPath(from: "login" | "register", reason: "google" | "blocked" = "google") {
  const base = from === "register" ? "/register" : "/login";
  return `${base}?error=${reason}`;
}

export function clearGoogleOAuthCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_OAUTH_COOKIE, "", { ...googleOAuthCookieOptions(0), maxAge: 0 });
  return response;
}

export async function completeGoogleSignIn(
  request: Request,
  origin: string,
  code: string,
  state: GoogleOAuthState,
) {
  const fail = () => clearGoogleOAuthCookie(NextResponse.redirect(`${origin}${authErrorPath(state.from)}`));
  const env = getSupabasePublicEnv();
  if (!env || !(await isGoogleOAuthConfigured())) return fail();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return fail();
  }

  const accessToken = await exchangeCode(origin, code);
  if (!accessToken) return fail();
  const profile = await fetchProfile(accessToken);
  if (!profile) return fail();

  const created = await admin.auth.admin.createUser({
    email: profile.email,
    password: randomBytes(24).toString("base64url"),
    email_confirm: true,
    user_metadata: { name: profile.name, provider: "google" },
  });

  let userId = created.data.user?.id ?? "";
  let isNew = Boolean(created.data.user);
  if (!userId) {
    if (!created.error || !userAlreadyExists(created.error.message)) return fail();
    const existing = await admin.auth.admin.generateLink({ type: "magiclink", email: profile.email });
    userId = existing.data.user?.id ?? "";
    isNew = false;
    if (!userId) return fail();
  }

  const { data: existingProfile } = await admin
    .from("users")
    .select("id, is_blocked")
    .eq("id", userId)
    .maybeSingle();
  if (existingProfile?.is_blocked === true) {
    return clearGoogleOAuthCookie(
      NextResponse.redirect(`${origin}${authErrorPath(state.from, "blocked")}`),
    );
  }
  if (!existingProfile) {
    const { error: insertError } = await admin.from("users").insert({
      id: userId,
      email: profile.email,
      name: profile.name,
    });
    if (insertError) {
      if (isNew) await admin.auth.admin.deleteUser(userId);
      return fail();
    }
  } else {
    await admin.from("users").update({ email: profile.email, name: profile.name }).eq("id", userId);
  }

  const { data: pages } = await admin
    .from("pages")
    .select("id, content")
    .eq("account_id", userId)
    .limit(1);
  let needsOnboarding = true;
  if (!pages?.length) {
    const handle = unusedHandle();
    const { data: pageRow, error: pageError } = await admin
      .from("pages")
      .insert({
        account_id: userId,
        handle,
        display_name: profile.name,
        published: false,
        content: {
          bio: "",
          avatarUrl: null,
          themeId: "stamp",
          socials: [],
          blocks: [],
        },
      })
      .select("id")
      .single();
    if (pageError || !pageRow) {
      if (isNew) await admin.auth.admin.deleteUser(userId);
      return fail();
    }
    await admin.from("users").update({ active_page_id: pageRow.id }).eq("id", userId);
  } else {
    const onboarding = (pages[0].content as { onboarding?: { finished?: boolean } } | null)?.onboarding;
    needsOnboarding = !onboarding || onboarding.finished === false;
  }

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email: profile.email });
  const tokenHash = link.data?.properties?.hashed_token?.trim() ?? "";
  if (link.error || !tokenHash) return fail();

  const destination = needsOnboarding ? "/start" : "/studio";
  const redirectResponse = NextResponse.redirect(`${origin}${destination}`);
  const requestCookies = readRequestCookies(request);
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, {
            path: options?.path ?? "/",
            maxAge: options?.maxAge,
            expires: options?.expires,
            httpOnly: options?.httpOnly ?? false,
            secure: options?.secure,
            sameSite: options?.sameSite === "none" || options?.sameSite === "strict" ? options.sameSite : "lax",
          });
        });
      },
    },
  });
  const verified = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (verified.error || !verified.data.session) return fail();
  return clearGoogleOAuthCookie(redirectResponse);
}
