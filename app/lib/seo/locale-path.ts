import { isLanguageCode, type LanguageCode } from "@/app/lib/i18n/language";
import { absoluteUrl } from "@/app/lib/site-url";

/** Default marketing language lives at `/`. */
export const DEFAULT_SEO_LOCALE: LanguageCode = "en";

export function localeHomePath(locale: LanguageCode): string {
  return locale === DEFAULT_SEO_LOCALE ? "/" : `/${locale}`;
}

export function localePath(locale: LanguageCode, path = "/"): string {
  const clean = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_SEO_LOCALE) return clean || "/";
  return `/${locale}${clean}`;
}

export function absoluteLocaleUrl(locale: LanguageCode, path = "/"): string {
  return absoluteUrl(localePath(locale, path));
}

/** Open Graph locale tags — keep `no` (not `nb`) to match html lang / hreflang. */
export function ogLocaleTag(locale: LanguageCode): string {
  const map: Partial<Record<LanguageCode, string>> = {
    en: "en_US",
    lv: "lv_LV",
    ru: "ru_RU",
    de: "de_DE",
    fr: "fr_FR",
    es: "es_ES",
    nl: "nl_NL",
    da: "da_DK",
    no: "no_NO",
    fi: "fi_FI",
    pl: "pl_PL",
    lt: "lt_LT",
    et: "et_EE",
    it: "it_IT",
    sv: "sv_SE",
  };
  return map[locale] ?? `${locale}_${locale.toUpperCase()}`;
}

/** First path segment if it is a language code. */
export function localeFromPathname(pathname: string): LanguageCode | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg || !isLanguageCode(seg)) return null;
  return seg;
}

/** Strip `/{locale}` prefix for internal rewrite targets. */
export function stripLocalePrefix(pathname: string, locale: LanguageCode): string {
  if (locale === DEFAULT_SEO_LOCALE) return pathname;
  if (pathname === `/${locale}`) return "/";
  if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1) || "/";
  return pathname;
}
