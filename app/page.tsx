import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarketingHome } from "@/app/components/marketing-home";
import { resolveSessionHintForRequest } from "@/app/lib/auth/resolve-session-hint";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { loadLandingPricing } from "@/app/lib/pricing/load-landing-pricing";
import { getLocaleSeoStatus } from "@/app/lib/seo/locale-completeness";
import { buildHomeMetadata } from "@/app/lib/seo/home-metadata";
import { resolveAuthedHomeRedirect } from "@/app/lib/onboarding/resolve-authed-home-server";

export async function generateMetadata(): Promise<Metadata> {
  const { languageCode } = await getServerTranslations();
  return buildHomeMetadata(languageCode);
}

export default async function HomePage() {
  const { userId } = await resolveSessionHintForRequest();

  if (userId) {
    redirect(await resolveAuthedHomeRedirect(userId));
  }

  const { t, languageCode } = await getServerTranslations();
  const status = await getLocaleSeoStatus(languageCode);
  const pricing = await loadLandingPricing(languageCode);
  return (
    <MarketingHome
      t={t}
      languageCode={languageCode}
      translationIncomplete={!status.indexable}
      pricing={pricing}
    />
  );
}
