import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/app/lib/supabase/env";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { interpolate } from "@/app/lib/i18n/interpolate";
import { loadMessages } from "@/app/lib/i18n/load-messages";
import {
  DEFAULT_LANGUAGE,
  hasExplicitLanguageChoice,
  isLanguageCode,
  LANGUAGE_CHOSEN_COOKIE,
  LANGUAGE_COOKIE,
  matchAcceptLanguage,
  NATIVE_LANGUAGE_NAMES,
  resolveLanguageCode,
  sortSwitcherLanguages,
  type LanguageCode,
  type UiLanguageOption,
} from "@/app/lib/i18n/language";

export type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

export type ServerTranslations = {
  languageCode: LanguageCode;
  overlay: Record<string, string>;
  table: Record<string, string>;
  languages: UiLanguageOption[];
  t: TranslateFn;
};

async function fetchActiveLanguages(): Promise<UiLanguageOption[]> {
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

export const getActiveUiLanguages = cache(async function getActiveUiLanguages(): Promise<
  UiLanguageOption[]
> {
  return sortSwitcherLanguages(await fetchActiveLanguages());
});

export const getRequestLanguageCode = cache(async function getRequestLanguageCode(): Promise<LanguageCode> {
  const languages = await getActiveUiLanguages();
  const activeCodes = new Set(languages.map((language) => language.code));
  const systemDefault = resolveLanguageCode(
    languages.find((language) => language.isDefault)?.code ?? DEFAULT_LANGUAGE,
  );

  function pick(value: string | null | undefined): LanguageCode | null {
    if (!value || !isLanguageCode(value) || !activeCodes.has(value)) return null;
    return value;
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const fromPath = pick(headerStore.get("x-presh-locale"));
  if (fromPath) return fromPath;

  const explicitCookie = hasExplicitLanguageChoice(
    cookieStore.get(LANGUAGE_CHOSEN_COOKIE)?.value,
  )
    ? pick(cookieStore.get(LANGUAGE_COOKIE)?.value)
    : null;
  const fromBrowser = pick(
    matchAcceptLanguage(headerStore.get("accept-language"), activeCodes),
  );

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("language_code")
          .eq("id", user.id)
          .maybeSingle();
        // Explicit cookie wins over profile so a just-chosen language applies
        // even if the profile RPC lags or fails.
        return (
          explicitCookie ??
          pick(data?.language_code as string | undefined) ??
          fromBrowser ??
          systemDefault
        );
      }
    } catch {
      /* guest path */
    }
  }

  return explicitCookie ?? fromBrowser ?? systemDefault;
});

export const getServerTranslations = cache(async function getServerTranslations(
  forcedLanguage?: LanguageCode,
): Promise<ServerTranslations> {
  const languageCode = forcedLanguage ?? (await getRequestLanguageCode());
  const languages = await getActiveUiLanguages();
  const table = await loadMessages(languageCode);

  const overlay: Record<string, string> = {};
  if (isSupabaseAdminConfigured()) {
    try {
      const admin = createAdminClient();
      const { data } = await admin.from("site_translations").select("translation_key, values");
      if (data) {
        for (const row of data) {
          const values = row.values as Record<string, string> | null;
          const value = values?.[languageCode]?.trim();
          if (value) overlay[row.translation_key] = value;
        }
      }
    } catch {
      /* ignore overlay */
    }
  }

  return {
    languageCode,
    overlay,
    table,
    languages,
    t(key, fallback, params) {
      const fromOverlay = overlay[key]?.trim();
      return interpolate(fromOverlay || table[key] || fallback, params);
    },
  };
});
