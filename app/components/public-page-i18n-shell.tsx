import type { ReactNode } from "react";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { resolvePagePublicLanguageCode } from "@/app/lib/i18n/resolve-page-public-language";
import { getActiveUiLanguages, getServerTranslations } from "@/app/lib/i18n/server";
import type { Portfolio } from "@/app/lib/types";

/** Nests a fixed-language provider when the page owner chose a public UI language. */
export async function PublicPageI18nShell({
  page,
  children,
}: {
  page: Portfolio;
  children: ReactNode;
}) {
  const languages = await getActiveUiLanguages();
  const forced = resolvePagePublicLanguageCode(page.publicLanguageCode, languages);
  if (!forced) return children;

  const i18n = await getServerTranslations(forced);
  return (
    <TranslationsProvider
      languageCode={i18n.languageCode}
      overlay={i18n.overlay}
      table={i18n.table}
      languages={i18n.languages}
    >
      {children}
    </TranslationsProvider>
  );
}
