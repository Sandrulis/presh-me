import { cache } from "react";
import { loadMessages } from "@/app/lib/i18n/load-messages";
import { type LanguageCode } from "@/app/lib/i18n/language";
import { getActiveUiLanguages } from "@/app/lib/i18n/server";
import { LANDING_SEO_KEYS } from "@/app/lib/seo/landing-keys";
import { DEFAULT_SEO_LOCALE } from "@/app/lib/seo/locale-path";

export type LocaleSeoStatus = {
  code: LanguageCode;
  translatedPercent: number;
  missingKeys: string[];
  untranslatedKeys: string[];
  indexable: boolean;
};

function scoreAgainstEnglish(
  code: LanguageCode,
  en: Record<string, string>,
  table: Record<string, string>,
): Omit<LocaleSeoStatus, "code" | "indexable"> {
  const missingKeys: string[] = [];
  const untranslatedKeys: string[] = [];
  let ok = 0;
  for (const key of LANDING_SEO_KEYS) {
    const value = table[key]?.trim() ?? "";
    const enValue = en[key]?.trim() ?? "";
    if (!value) {
      missingKeys.push(key);
      continue;
    }
    if (code !== DEFAULT_SEO_LOCALE && enValue && value === enValue) {
      untranslatedKeys.push(key);
      continue;
    }
    ok += 1;
  }
  const total = LANDING_SEO_KEYS.length || 1;
  return {
    translatedPercent: Math.round((ok / total) * 1000) / 10,
    missingKeys,
    untranslatedKeys,
  };
}

export const getLocaleSeoStatus = cache(async function getLocaleSeoStatus(
  code: LanguageCode,
): Promise<LocaleSeoStatus> {
  const en = await loadMessages(DEFAULT_SEO_LOCALE);
  const table = code === DEFAULT_SEO_LOCALE ? en : await loadMessages(code);
  const scored = scoreAgainstEnglish(code, en, table);
  const indexable = scored.translatedPercent >= 100;
  return { code, ...scored, indexable };
});

export const getIndexableSeoLocales = cache(async function getIndexableSeoLocales(): Promise<
  LanguageCode[]
> {
  const active = await getActiveUiLanguages();
  const statuses = await Promise.all(active.map((lang) => getLocaleSeoStatus(lang.code)));
  const indexable = statuses.filter((s) => s.indexable).map((s) => s.code);
  // Always include default EN if active
  if (!indexable.includes(DEFAULT_SEO_LOCALE) && active.some((l) => l.code === DEFAULT_SEO_LOCALE)) {
    return [DEFAULT_SEO_LOCALE, ...indexable];
  }
  // Stable order: en first, then alpha
  return indexable.slice().sort((a, b) => {
    if (a === DEFAULT_SEO_LOCALE) return -1;
    if (b === DEFAULT_SEO_LOCALE) return 1;
    return a.localeCompare(b);
  });
});

export async function getAllLocaleSeoStatuses(): Promise<LocaleSeoStatus[]> {
  const active = await getActiveUiLanguages();
  return Promise.all(active.map((lang) => getLocaleSeoStatus(lang.code)));
}
