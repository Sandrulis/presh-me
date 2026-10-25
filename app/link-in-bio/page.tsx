import type { Metadata } from "next";
import { IntentLanding } from "@/app/components/intent-landing";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { absoluteUrl, siteOgImageUrl } from "@/app/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const title = t("seo.link_in_bio.title", "Link in bio page builder | Presh.Me").replace(
    /\s*\|\s*Presh\.Me$/i,
    "",
  );
  const description = t(
    "seo.link_in_bio.description",
    "Build a clean link-in-bio page with links, portfolio and contact at one address. Free in open beta.",
  );
  const url = absoluteUrl("/link-in-bio");
  const ogImage = siteOgImageUrl();
  return {
    title: { absolute: `${title} · Presh.Me` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · Presh.Me`,
      description,
      url,
      type: "website",
      siteName: "Presh.Me",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Presh.Me`,
      description,
      images: [ogImage],
    },
  };
}

export default async function LinkInBioPage() {
  const { t } = await getServerTranslations();
  return (
    <IntentLanding
      path="/link-in-bio"
      kicker={t("landing.kicker", "Link in bio · portfolio · digital card")}
      h1={t("seo.link_in_bio.h1", "A link in bio page that looks like you")}
      lead={t(
        "seo.link_in_bio.lead",
        "Stop dumping every link into a messy list. With Presh.Me you get one address for your work, booking, shop and socials — designed as a real mini site.",
      )}
      bullets={[
        t(
          "landing.features.f1.body",
          "Buttons, text, YouTube, Spotify, images, FAQ, resume and social icons.",
        ),
        t(
          "landing.features.f2.body",
          "Themes, fonts, header layouts and block styles — live preview as you edit.",
        ),
        t(
          "landing.features.f3.body",
          "presh.me/your-name. Update content in the studio; the bio link stays the same.",
        ),
      ]}
      related={[
        { href: "/", label: "← Presh.Me" },
        { href: "/portfolio-website", label: t("seo.portfolio_page.title", "Portfolio website") },
        { href: "/digital-business-card", label: t("seo.card_page.title", "Digital business card") },
        { href: "/for/content-creators", label: t("landing.use.creators", "Creators and social profiles") },
      ]}
    />
  );
}
