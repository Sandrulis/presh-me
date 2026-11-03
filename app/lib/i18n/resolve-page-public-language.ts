import {
  isLanguageCode,
  type LanguageCode,
  type UiLanguageOption,
} from "@/app/lib/i18n/language";

/** Fixed UI language for a public profile page, or null = visitor / system default. */
export function resolvePagePublicLanguageCode(
  raw: string | undefined | null,
  languages: UiLanguageOption[],
): LanguageCode | null {
  const code = raw?.trim().toLowerCase() ?? "";
  if (!code || !isLanguageCode(code)) return null;
  const active = new Set(languages.map((language) => language.code));
  return active.has(code) ? code : null;
}

export function pagePublicLanguageLabel(
  raw: string | undefined | null,
  languages: UiLanguageOption[],
  visitorDefaultLabel: string,
): string {
  const code = resolvePagePublicLanguageCode(raw, languages);
  if (!code) return visitorDefaultLabel;
  return languages.find((language) => language.code === code)?.name ?? code;
}
