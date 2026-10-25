import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  hasExplicitLanguageChoice,
  isLanguageCode,
  LANGUAGE_CHOSEN_COOKIE,
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  type LanguageCode,
} from "@/app/lib/i18n/language";
import {
  isUnprefixedMarketingPath,
  resolveMarketingLocaleRoute,
} from "@/app/lib/seo/marketing-middleware";
import { DEFAULT_SEO_LOCALE } from "@/app/lib/seo/locale-path";
import { retiredCompareHomePath } from "@/app/lib/seo/retired-compare-paths";

const PROTECTED_PREFIXES = [
  "/studio",
  "/start",
  "/settings",
  "/admin",
  "/api/admin",
  "/api/presence",
  "/api/source-preview",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/register" || pathname.startsWith("/auth/");
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

/** Explicit UI language cookie (same priority as unprefixed `/` marketing). */
function localeFromChosenCookie(request: NextRequest): LanguageCode | null {
  if (!hasExplicitLanguageChoice(request.cookies.get(LANGUAGE_CHOSEN_COOKIE)?.value)) {
    return null;
  }
  const raw = request.cookies.get(LANGUAGE_COOKIE)?.value;
  if (!raw || !isLanguageCode(raw)) return null;
  return raw;
}

function unprefixedMarketingLocale(request: NextRequest): LanguageCode {
  return localeFromChosenCookie(request) ?? DEFAULT_SEO_LOCALE;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const retiredCompareTarget = retiredCompareHomePath(pathname);
  if (retiredCompareTarget) {
    const url = request.nextUrl.clone();
    url.pathname = retiredCompareTarget;
    return NextResponse.redirect(url, 302);
  }

  const pathLocale = localeFromPath(pathname);
  const needsAuthWork = isProtectedPath(pathname) || isAuthPage(pathname);

  const requestHeaders = new Headers(request.headers);

  if (pathLocale) {
    const route = resolveMarketingLocaleRoute(request, pathname, pathLocale);
    if (route?.kind === "redirect") {
      return withLocaleCookies(route.response, pathLocale);
    }
    if (route?.kind === "rewrite") {
      requestHeaders.set("x-presh-locale", pathLocale);
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = route.canonicalPath;
      let response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
      response = withLocaleCookies(response, pathLocale);
      return response;
    }
    if (pathname === `/${pathLocale}` || pathname === `/${pathLocale}/`) {
      requestHeaders.set("x-presh-locale", pathLocale);
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/";
      let response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
      response = withLocaleCookies(response, pathLocale);
      return response;
    }
    return NextResponse.next();
  }

  if (!pathLocale && isUnprefixedMarketingPath(pathname)) {
    requestHeaders.set("x-presh-locale", unprefixedMarketingLocale(request));
  }

  if (!needsAuthWork && pathname !== "/") {
    return NextResponse.next({ request: { headers: requestHeaders } });
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
