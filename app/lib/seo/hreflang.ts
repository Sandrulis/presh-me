import type { Metadata } from "next";
import type { LanguageCode } from "@/app/lib/i18n/language";
import { getIndexableSeoLocales } from "@/app/lib/seo/locale-completeness";
import {
  absoluteLocaleUrl,
  DEFAULT_SEO_LOCALE,
  localePath,
  ogLocaleTag,
} from "@/app/lib/seo/locale-path";
import { absoluteUrl } from "@/app/lib/site-url";

export async function hreflangAlternatesForLocale(
  locale: LanguageCode,
  path = "/",
): Promise<NonNullable<Metadata["alternates"]>> {
  const indexable = await getIndexableSeoLocales();
  const languages: Record<string, string> = {
    "x-default": absoluteLocaleUrl(DEFAULT_SEO_LOCALE, path),
  };
  for (const code of indexable) {
    languages[code] = absoluteLocaleUrl(code, path);
  }
  return {
    canonical: absoluteLocaleUrl(locale, path),
    languages,
  };
}

export async function openGraphLocales(
  locale: LanguageCode,
): Promise<{ locale: string; alternateLocale: string[] }> {
  const indexable = await getIndexableSeoLocales();
  return {
    locale: ogLocaleTag(locale),
    alternateLocale: indexable.filter((code) => code !== locale).map(ogLocaleTag),
  };
}

/** @deprecated Prefer hreflangAlternatesForLocale — kept for gradual migration. */
export function hreflangAlternates(path = "/"): NonNullable<Metadata["alternates"]> {
  return {
    canonical: absoluteUrl(localePath(DEFAULT_SEO_LOCALE, path)),
    languages: {
      "x-default": absoluteUrl(localePath(DEFAULT_SEO_LOCALE, path)),
      en: absoluteUrl(localePath("en", path)),
    },
  };
}
