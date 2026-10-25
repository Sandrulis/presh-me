import { isLanguageCode, type LanguageCode } from "@/app/lib/i18n/language";
import { DEFAULT_SEO_LOCALE } from "@/app/lib/seo/localized-slugs";

/** Retired comparison landing slugs (no public pages until campaigns). */
const RETIRED_COMPARE_PAGE_SLUGS = new Set(["linktree", "liinks"]);

const COMPARE_SEGMENT: Partial<Record<LanguageCode, string>> = {
  en: "compare",
  lv: "salidzinajums",
  de: "vergleich",
  fr: "comparer",
  es: "comparar",
  nl: "vergelijken",
  da: "sammenlign",
  no: "sammenlign",
  fi: "vertaa",
  pl: "porownanie",
  lt: "palyginti",
  et: "vordlus",
  it: "confronta",
  sv: "jamfor",
  ru: "sravnenie",
};

function homeForLocale(locale: LanguageCode | null): string {
  if (!locale || locale === DEFAULT_SEO_LOCALE) return "/";
  return `/${locale}`;
}

/**
 * Legacy compare URLs → locale home (302). Keeps reserved `compare` paths out of marketing slugs.
 */
export function retiredCompareHomePath(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const parts = normalized.split("/").filter(Boolean);

  if (parts[0] === "compare") {
    if (parts.length === 1) return "/";
    if (parts.length === 2 && RETIRED_COMPARE_PAGE_SLUGS.has(parts[1])) return "/";
  }

  if (parts.length === 3 && isLanguageCode(parts[0])) {
    const locale = parts[0];
    const segment = parts[1];
    const slug = parts[2];
    if (!RETIRED_COMPARE_PAGE_SLUGS.has(slug)) return null;
    const expected = COMPARE_SEGMENT[locale] ?? "compare";
    if (segment === expected) return homeForLocale(locale);
  }

  return null;
}
