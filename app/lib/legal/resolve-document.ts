import {
  COOKIES_DOCUMENT,
  PRIVACY_DOCUMENT,
  TERMS_DOCUMENT,
  type LegalDocKind,
  type LegalDocument,
} from "@/app/lib/legal/documents";
import {
  COOKIES_DOCUMENT_EN,
  PRIVACY_DOCUMENT_EN,
  TERMS_DOCUMENT_EN,
} from "@/app/lib/legal/documents-en";

/** LV source docs; non-lv UIs use English until more locales are authored. */
export function resolveLegalDocument(kind: LegalDocKind, languageCode: string): LegalDocument {
  if (languageCode === "lv") {
    if (kind === "terms") return TERMS_DOCUMENT;
    if (kind === "privacy") return PRIVACY_DOCUMENT;
    return COOKIES_DOCUMENT;
  }
  if (kind === "terms") return TERMS_DOCUMENT_EN;
  if (kind === "privacy") return PRIVACY_DOCUMENT_EN;
  return COOKIES_DOCUMENT_EN;
}
