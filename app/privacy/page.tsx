import type { Metadata } from "next";
import { LegalPage } from "@/app/components/legal-page";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { resolveLegalDocument } from "@/app/lib/legal/resolve-document";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("legal.privacy.title", "Privātuma politika"),
    description: t("legal.privacy.meta", "Kā Presh vāc, glabā un aizsargā tavus datus."),
  };
}

export default async function PrivacyPage() {
  const { languageCode } = await getServerTranslations();
  return <LegalPage document={resolveLegalDocument("privacy", languageCode)} />;
}
