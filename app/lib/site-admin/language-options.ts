import { LANGUAGE_CODES, NATIVE_LANGUAGE_NAMES } from "@/app/lib/i18n/language";

export const LANGUAGE_OPTIONS = LANGUAGE_CODES.map((code) => ({
  code,
  name: NATIVE_LANGUAGE_NAMES[code],
}));
