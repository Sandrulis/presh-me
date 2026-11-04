"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { SITE_LANGUAGES_TAG, SITE_TRANSLATIONS_OVERLAY_TAG } from "@/app/lib/i18n/site-translations-cache";

export async function revalidateSiteTranslationsCache() {
  revalidateTag(SITE_TRANSLATIONS_OVERLAY_TAG, "max");
  revalidateTag(SITE_LANGUAGES_TAG, "max");
  revalidatePath("/", "layout");
}
