import { messages } from "@/app/lib/i18n/messages";
import { LANGUAGE_CODES, type LanguageCode } from "@/app/lib/i18n/language";

type Catalog = Record<string, string>;

/** Only lv+en ship in the main client chunk; other langs load on demand (admin). */
const catalogs: Partial<Record<LanguageCode, Catalog>> = {
  lv: messages.lv,
  en: messages.en,
};

let extrasLoaded = false;

async function ensureExtraCatalogs() {
  if (extrasLoaded) return;
  const [
    { ru },
    { de },
    { fr },
    { es },
    { nl },
    { da },
    { no },
    { fi },
    { pl },
    { lt },
    { et },
    { it },
    { sv },
  ] = await Promise.all([
    import("@/app/lib/i18n/messages-ru"),
    import("@/app/lib/i18n/messages-de"),
    import("@/app/lib/i18n/messages-fr"),
    import("@/app/lib/i18n/messages-es"),
    import("@/app/lib/i18n/messages-nl"),
    import("@/app/lib/i18n/messages-da"),
    import("@/app/lib/i18n/messages-no"),
    import("@/app/lib/i18n/messages-fi"),
    import("@/app/lib/i18n/messages-pl"),
    import("@/app/lib/i18n/messages-lt"),
    import("@/app/lib/i18n/messages-et"),
    import("@/app/lib/i18n/messages-it"),
    import("@/app/lib/i18n/messages-sv"),
  ]);
  Object.assign(catalogs, { ru, de, fr, es, nl, da, no, fi, pl, lt, et, it, sv });
  extrasLoaded = true;
}

export async function preloadBundledCatalogs() {
  await ensureExtraCatalogs();
}

export function bundledTranslationKeys(): string[] {
  return Object.keys(messages.lv);
}

export function isBundledTranslationKey(key: string): boolean {
  return key in messages.lv;
}

export function bundledValuesForKey(key: string): Record<string, string> {
  return Object.fromEntries(LANGUAGE_CODES.map((code) => [code, catalogs[code]?.[key] ?? ""]));
}

/** Sync snapshot after preload — for tests / SSR that already loaded. */
export function getLoadedBundledCatalogs(): Partial<Record<LanguageCode, Catalog>> {
  return catalogs;
}
