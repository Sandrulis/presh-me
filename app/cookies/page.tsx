import type { Metadata } from "next";
import { CookieSettingsLink } from "@/app/components/cookie-settings-link";
import { LegalPage } from "@/app/components/legal-page";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { resolveLegalDocument } from "@/app/lib/legal/resolve-document";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("legal.cookies.title", "Sīkdatņu politika"),
    description: t("legal.cookies.meta", "Kādas sīkdatnes Presh izmanto un kā tās pārvaldīt."),
  };
}

export default async function CookiesPage() {
  const { languageCode } = await getServerTranslations();
  return (
    <LegalPage
      document={resolveLegalDocument("cookies", languageCode)}
      extra={<CookieSettingsLink />}
    />
  );
}
