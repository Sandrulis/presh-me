import type { Metadata } from "next";
import { LegalPage } from "@/app/components/legal-page";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { resolveLegalDocument } from "@/app/lib/legal/resolve-document";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("legal.terms.title", "Lietošanas noteikumi"),
    description: t(
      "legal.terms.meta",
      "Presh lietošanas noteikumi - saturs, konti un atbildība.",
    ),
  };
}

export default async function TermsPage() {
  const { languageCode } = await getServerTranslations();
  return <LegalPage document={resolveLegalDocument("terms", languageCode)} />;
}
