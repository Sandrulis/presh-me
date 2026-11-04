import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { interpolate } from "@/app/lib/i18n/interpolate";
import { loadMessages } from "@/app/lib/i18n/load-messages";
import {
  getCachedActiveUiLanguagesFromDb,
  getCachedTranslationOverlayForLanguage,
} from "@/app/lib/i18n/site-translations-cache";
import {
  DEFAULT_LANGUAGE,
  hasExplicitLanguageChoice,
  isLanguageCode,
  LANGUAGE_CHOSEN_COOKIE,
  LANGUAGE_COOKIE,
  matchAcceptLanguage,
  resolveLanguageCode,
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

export const getActiveUiLanguages = cache(async function getActiveUiLanguages(): Promise<
  UiLanguageOption[]
> {
  return getCachedActiveUiLanguagesFromDb();
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
  const overlay = await getCachedTranslationOverlayForLanguage(languageCode);

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
