import fs from "fs";
import path from "path";

const root = process.cwd();
const template = (configKey) => `import { MarketingIntentPage, marketingIntentMetadata } from "@/app/components/marketing-intent-page";
import { MARKETING_INTENT_PAGES } from "@/app/lib/marketing-intent-config";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { buildIntentPageMetadata } from "@/app/lib/seo/intent-page";

const config = MARKETING_INTENT_PAGES["${configKey}"];

export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const meta = marketingIntentMetadata(config, t);
  return buildIntentPageMetadata({ path: config.path, ...meta });
}

export default async function Page() {
  const { t } = await getServerTranslations();
  return <MarketingIntentPage config={config} t={t} />;
}
`;

const pages = [
  ["app/for/beauty-professionals/page.tsx", "for/beauty-professionals"],
  ["app/for/coaches/page.tsx", "for/coaches"],
  ["app/for/content-creators/page.tsx", "for/content-creators"],
  ["app/for/designers/page.tsx", "for/designers"],
  ["app/for/freelancers/page.tsx", "for/freelancers"],
  ["app/for/photographers/page.tsx", "for/photographers"],
  ["app/for/small-businesses/page.tsx", "for/small-businesses"],
  ["app/portfolio-website/page.tsx", "portfolio-website"],
  ["app/digital-business-card/page.tsx", "digital-business-card"],
  ["app/personal-website/page.tsx", "personal-website"],
];

for (const [file, key] of pages) {
  fs.writeFileSync(path.join(root, file), template(key));
}
