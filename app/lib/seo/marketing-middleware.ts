import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { LanguageCode } from "@/app/lib/i18n/language";
import {
  canonicalMarketingPath,
  isCanonicalMarketingPath,
  isMarketingPublicPath,
  localizedMarketingPath,
  normalizeMarketingPath,
} from "@/app/lib/seo/localized-slugs";
import { DEFAULT_SEO_LOCALE } from "@/app/lib/seo/localized-slugs";
import { localeFromPathname, localePath, stripLocalePrefix } from "@/app/lib/seo/locale-path";

export function isLocalizedMarketingInnerPath(innerPath: string, locale: LanguageCode): boolean {
  const normalized = normalizeMarketingPath(innerPath);
  if (normalized === "/") return true;
  if (isCanonicalMarketingPath(normalized)) return true;
  return canonicalMarketingPath(locale, normalized) !== null;
}

export type MarketingLocaleRoute =
  | { kind: "redirect"; response: NextResponse }
  | { kind: "rewrite"; canonicalPath: string };

/** Locale-prefixed public marketing URL → rewrite to canonical app path or redirect to proper slug. */
export function resolveMarketingLocaleRoute(
  request: NextRequest,
  pathname: string,
  pathLocale: LanguageCode,
): MarketingLocaleRoute | null {
  const inner = normalizeMarketingPath(stripLocalePrefix(pathname, pathLocale));
  if (!isLocalizedMarketingInnerPath(inner, pathLocale)) {
    return null;
  }

  const canonical =
    canonicalMarketingPath(pathLocale, inner) ??
    (isCanonicalMarketingPath(inner) ? inner : null);
  if (!canonical) {
    return null;
  }

  const expectedLocalized = localizedMarketingPath(pathLocale, canonical);
  if (inner !== expectedLocalized) {
    const url = request.nextUrl.clone();
    url.pathname = localePath(pathLocale, canonical);
    return { kind: "redirect", response: NextResponse.redirect(url, 308) };
  }

  return { kind: "rewrite", canonicalPath: canonical };
}

export function isUnprefixedMarketingPath(pathname: string): boolean {
  const normalized = normalizeMarketingPath(pathname);
  if (normalized === "/") return true;
  if (localeFromPathname(pathname)) return false;
  return isMarketingPublicPath(normalized, DEFAULT_SEO_LOCALE);
}
