import { MarketingIntentPage, marketingIntentMetadata } from "@/app/components/marketing-intent-page";
import { MARKETING_INTENT_PAGES } from "@/app/lib/marketing-intent-config";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { buildIntentPageMetadata } from "@/app/lib/seo/intent-page";

const config = MARKETING_INTENT_PAGES["for/personal-trainers"];

export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const meta = marketingIntentMetadata(config, t);
  return buildIntentPageMetadata({ path: config.path, ...meta });
}

export default async function Page() {
  const { t } = await getServerTranslations();
  return <MarketingIntentPage config={config} t={t} />;
}
