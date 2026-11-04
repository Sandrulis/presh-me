"use server";

import { cookies } from "next/headers";
import { revalidateSiteTranslationsCache } from "@/app/lib/i18n/revalidate-translations-cache";
import {
  isLanguageCode,
  LANGUAGE_CHOSEN_COOKIE,
  LANGUAGE_COOKIE,
  languageCookieOptions,
} from "@/app/lib/i18n/language";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export async function setLanguageAction(languageCode: string) {
  if (!isLanguageCode(languageCode)) {
    return;
  }

  const cookieStore = await cookies();
  const options = languageCookieOptions();
  cookieStore.set(LANGUAGE_COOKIE, languageCode, options);
  cookieStore.set(LANGUAGE_CHOSEN_COOKIE, "1", options);

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.rpc("set_current_user_language", {
          p_code: languageCode,
        });
        if (error) {
          console.error("set_current_user_language failed:", error.message);
        }
      }
    } catch (error) {
      console.error(
        "setLanguageAction user update failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  await revalidateSiteTranslationsCache();
}
