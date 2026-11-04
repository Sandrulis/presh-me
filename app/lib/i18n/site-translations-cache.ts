import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import {
  isLanguageCode,
  NATIVE_LANGUAGE_NAMES,
  sortSwitcherLanguages,
  type LanguageCode,
  type UiLanguageOption,
} from "@/app/lib/i18n/language";

export const SITE_TRANSLATIONS_OVERLAY_TAG = "site-translations-overlay";
export const SITE_LANGUAGES_TAG = "site-languages";

/** translation_key → values per language code */
type OverlayRows = Record<string, Record<string, string>>;

async function fetchTranslationOverlayRows(): Promise<OverlayRows> {
  if (!isSupabaseAdminConfigured()) return {};
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("site_translations").select("translation_key, values");
    const rows: OverlayRows = {};
    for (const row of data ?? []) {
      const key = row.translation_key as string;
      rows[key] = (row.values as Record<string, string> | null) ?? {};
    }
    return rows;
  } catch {
    return {};
  }
}

const getCachedOverlayRows = unstable_cache(
  fetchTranslationOverlayRows,
  ["site-translations-overlay-rows"],
  { revalidate: 300, tags: [SITE_TRANSLATIONS_OVERLAY_TAG] },
);

export async function getCachedTranslationOverlayForLanguage(
  languageCode: LanguageCode,
): Promise<Record<string, string>> {
  const rows = await getCachedOverlayRows();
  const overlay: Record<string, string> = {};
  for (const [key, values] of Object.entries(rows)) {
    const value = values[languageCode]?.trim();
    if (value) overlay[key] = value;
  }
  return overlay;
}

async function fetchActiveLanguagesFromDb(): Promise<UiLanguageOption[]> {
  if (!isSupabaseAdminConfigured()) {
    return Object.entries(NATIVE_LANGUAGE_NAMES).map(([code, name], index) => ({
      code: code as LanguageCode,
      name,
      isDefault: index === 0,
    }));
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("site_languages")
      .select("code, name, is_active, is_default, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data?.length) {
      return [
        { code: "lv", name: NATIVE_LANGUAGE_NAMES.lv, isDefault: true },
        { code: "en", name: NATIVE_LANGUAGE_NAMES.en },
      ];
    }
    return data.flatMap((row) =>
      isLanguageCode(row.code)
        ? [
            {
              code: row.code,
              name: row.name || NATIVE_LANGUAGE_NAMES[row.code],
              isDefault: !!row.is_default,
            },
          ]
        : [],
    );
  } catch {
    return [
      { code: "lv", name: NATIVE_LANGUAGE_NAMES.lv, isDefault: true },
      { code: "en", name: NATIVE_LANGUAGE_NAMES.en },
    ];
  }
}

export const getCachedActiveUiLanguagesFromDb = unstable_cache(
  async () => sortSwitcherLanguages(await fetchActiveLanguagesFromDb()),
  ["site-languages-active"],
  { revalidate: 300, tags: [SITE_LANGUAGES_TAG] },
);
