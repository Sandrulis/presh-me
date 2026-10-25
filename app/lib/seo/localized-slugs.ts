import { isLanguageCode, LANGUAGE_CODES, type LanguageCode } from "@/app/lib/i18n/language";

/** Keep in sync with `locale-path.ts` — avoid import cycle with `localePath()`. */
export const DEFAULT_SEO_LOCALE: LanguageCode = "en";

function localeFromPathname(pathname: string): LanguageCode | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg || !isLanguageCode(seg)) return null;
  return seg;
}

function stripLocalePrefix(pathname: string, locale: LanguageCode): string {
  if (locale === DEFAULT_SEO_LOCALE) return pathname;
  if (pathname === `/${locale}`) return "/";
  if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1) || "/";
  return pathname;
}

/** Internal (filesystem) marketing paths — always English segments. */
export const MARKETING_CANONICAL_PATHS = [
  "/",
  "/link-in-bio",
  "/portfolio-website",
  "/digital-business-card",
  "/personal-website",
  "/for/photographers",
  "/for/designers",
  "/for/barbers",
  "/for/beauty-professionals",
  "/for/freelancers",
  "/for/content-creators",
  "/for/small-businesses",
  "/for/coaches",
  "/terms",
  "/privacy",
  "/cookies",
  "/contact",
] as const;

export type MarketingCanonicalPath = (typeof MARKETING_CANONICAL_PATHS)[number];

const CANONICAL_SET = new Set<string>(MARKETING_CANONICAL_PATHS);

function pick(map: Partial<Record<LanguageCode, string>>, locale: LanguageCode, fallback: string) {
  return map[locale] ?? map[DEFAULT_SEO_LOCALE] ?? fallback;
}

const FOR_SEGMENT: Partial<Record<LanguageCode, string>> = {
  en: "for",
  lv: "priek",
  de: "fuer",
  fr: "pour",
  es: "para",
  nl: "voor",
  da: "for",
  no: "for",
  fi: "kohde",
  pl: "dla",
  lt: "skirta",
  et: "jaoks",
  it: "per",
  sv: "for",
  ru: "dlya",
};

const ROOT_SEGMENT: Record<string, Partial<Record<LanguageCode, string>>> = {
  "link-in-bio": {
    lv: "link-bio",
    de: "link-in-bio",
    pl: "link-w-bio",
  },
  "portfolio-website": {
    lv: "portfolio-majaslapa",
    de: "portfolio-website",
    pl: "strona-portfolio",
  },
  "digital-business-card": {
    lv: "digitala-vizitkarte",
    de: "digitale-visitenkarte",
    pl: "wizytowka-cyfrowa",
  },
  "personal-website": {
    lv: "personala-majaslapa",
    de: "persoenliche-website",
    pl: "strona-osobista",
  },
  terms: { lv: "noteikumi", de: "nutzungsbedingungen", pl: "regulamin" },
  privacy: { lv: "privatums", de: "datenschutz", pl: "prywatnosc" },
  cookies: { lv: "sikdatnes", de: "cookies", pl: "cookies" },
  contact: { lv: "kontakti", de: "kontakt", pl: "kontakt" },
};

const FOR_AUDIENCE: Record<string, Partial<Record<LanguageCode, string>>> = {
  photographers: { lv: "fotografiem", de: "fotografen", pl: "fotografow" },
  designers: { lv: "dizaineriem", de: "designer", pl: "projektantow" },
  barbers: { lv: "friziereiem", de: "friseure", pl: "fryzjerow" },
  "beauty-professionals": { lv: "skaistumam", de: "beauty", pl: "beauty" },
  freelancers: { lv: "brivniekiem", de: "freelancer", pl: "freelancerow" },
  "content-creators": { lv: "satura-veidotajiem", de: "creator", pl: "tworcow" },
  "small-businesses": { lv: "mazajiem-uznemumiem", de: "kleinunternehmen", pl: "malych-firm" },
  coaches: { lv: "treneriem", de: "coaches", pl: "coachow" },
};

export function normalizeMarketingPath(path: string): string {
  if (!path || path === "/") return "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function isCanonicalMarketingPath(path: string): boolean {
  return CANONICAL_SET.has(normalizeMarketingPath(path));
}

/** Public path segments for a locale (no `/{locale}` prefix). EN uses canonical English segments. */
export function localizedMarketingPath(locale: LanguageCode, canonical: string): string {
  const c = normalizeMarketingPath(canonical);
  if (c === "/") return "/";

  const parts = c.split("/").filter(Boolean);
  if (parts.length === 1) {
    const root = ROOT_SEGMENT[parts[0]];
    if (root) return `/${pick(root, locale, parts[0])}`;
    return c;
  }

  if (parts[0] === "for" && parts.length === 2) {
    const audience = FOR_AUDIENCE[parts[1]];
    return `/${pick(FOR_SEGMENT, locale, "for")}/${pick(audience ?? {}, locale, parts[1])}`;
  }

  return c;
}

const localizedToCanonicalByLocale = new Map<LanguageCode, Map<string, string>>();

function buildReverseMaps() {
  for (const locale of LANGUAGE_CODES) {
    const map = new Map<string, string>();
    for (const canonical of MARKETING_CANONICAL_PATHS) {
      if (canonical === "/") continue;
      const localized = localizedMarketingPath(locale, canonical);
      map.set(localized, canonical);
      if (locale === DEFAULT_SEO_LOCALE) {
        map.set(canonical, canonical);
      }
    }
    localizedToCanonicalByLocale.set(locale, map);
  }
}

buildReverseMaps();

export function canonicalMarketingPath(locale: LanguageCode, publicPath: string): string | null {
  const normalized = normalizeMarketingPath(publicPath);
  if (isCanonicalMarketingPath(normalized)) {
    return normalized;
  }
  return localizedToCanonicalByLocale.get(locale)?.get(normalized) ?? null;
}

export function isMarketingPublicPath(publicPath: string, locale?: LanguageCode): boolean {
  const normalized = normalizeMarketingPath(publicPath);
  if (isCanonicalMarketingPath(normalized)) return true;
  if (locale) return canonicalMarketingPath(locale, normalized) !== null;
  for (const code of LANGUAGE_CODES) {
    if (canonicalMarketingPath(code, normalized)) return true;
  }
  return false;
}

/** First URL segment of localized marketing paths (reserve from user handles). */
export function marketingLocalizedFirstSegments(): string[] {
  const segments = new Set<string>();
  for (const locale of LANGUAGE_CODES) {
    for (const canonical of MARKETING_CANONICAL_PATHS) {
      if (canonical === "/") continue;
      const localized = localizedMarketingPath(locale, canonical);
      const first = localized.split("/").filter(Boolean)[0];
      if (first) segments.add(first);
    }
  }
  return [...segments];
}

export function parseMarketingPathname(pathname: string): {
  locale: LanguageCode | null;
  canonical: string;
} | null {
  const locale = localeFromPathname(pathname);
  const inner = locale ? stripLocalePrefix(pathname, locale) : pathname;
  const effectiveLocale = locale ?? DEFAULT_SEO_LOCALE;
  const canonical =
    canonicalMarketingPath(effectiveLocale, inner) ??
    (isCanonicalMarketingPath(inner) ? inner : null);
  if (!canonical) return null;
  return { locale, canonical };
}

/** True if pathname is a marketing route (canonical or localized). */
export function isAnyMarketingPathname(pathname: string): boolean {
  return parseMarketingPathname(pathname) !== null;
}
