import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isLanguageCode,
  LANGUAGE_CHOSEN_COOKIE,
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  type LanguageCode,
} from "@/app/lib/i18n/language";
import { DEFAULT_SEO_LOCALE, stripLocalePrefix } from "@/app/lib/seo/locale-path";

const PROTECTED_PREFIXES = [
  "/studio",
  "/start",
  "/settings",
  "/admin",
  "/api/admin",
  "/api/presence",
  "/api/source-preview",
];

/** Unprefixed paths that may be locale-mirrored as `/{locale}{path}`. */
const LOCALIZED_MARKETING_PREFIXES = [
  "/portfolio-website",
  "/digital-business-card",
  "/personal-website",
  "/for",
  "/compare",
  "/terms",
  "/privacy",
  "/cookies",
  "/contact",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/register" || pathname.startsWith("/auth/");
}

function isLocalizedMarketingPath(innerPath: string) {
  if (innerPath === "/") return true;
  return LOCALIZED_MARKETING_PREFIXES.some(
    (prefix) => innerPath === prefix || innerPath.startsWith(`${prefix}/`),
  );
}

function withLocaleCookies(response: NextResponse, locale: LanguageCode) {
  response.cookies.set(LANGUAGE_COOKIE, locale, {
    path: "/",
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  response.cookies.set(LANGUAGE_CHOSEN_COOKIE, "1", {
    path: "/",
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

function localeFromPath(pathname: string): LanguageCode | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg || !isLanguageCode(seg)) return null;
  return seg;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = localeFromPath(pathname);
  const needsAuthWork = isProtectedPath(pathname) || isAuthPage(pathname);

  const requestHeaders = new Headers(request.headers);

  if (pathLocale) {
    const inner = stripLocalePrefix(pathname, pathLocale);
    if (!isLocalizedMarketingPath(inner)) {
      return NextResponse.next();
    }
    requestHeaders.set("x-presh-locale", pathLocale);
    const url = request.nextUrl.clone();
    url.pathname = inner;
    let response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    response = withLocaleCookies(response, pathLocale);
    return response;
  }

  if (pathname === "/") {
    requestHeaders.set("x-presh-locale", DEFAULT_SEO_LOCALE);
  }

  if (!needsAuthWork && pathname !== "/") {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!needsAuthWork) return response;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return response;

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(pathname) && !pathname.startsWith("/api/") && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return response;
}

/**
 * Broad matcher so new LANGUAGE_CODES work without editing this list.
 * Locale detection uses isLanguageCode() at runtime (data-driven).
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|brand/|demos/|marketing/|favicon.ico|.*\\..*).*)",
  ],
};
