import Image from "next/image";
import Link from "next/link";
import { ClaimForm } from "@/app/components/claim-form";
import { DemoMarquee } from "@/app/components/demo-marquee";
import { Header } from "@/app/components/header";
import { JsonLd } from "@/app/components/json-ld";
import { LandingFaq } from "@/app/components/landing-faq";
import { LandingPricingSection } from "@/app/components/landing-pricing-section";
import { SiteFooter } from "@/app/components/site-footer";
import type { LanguageCode } from "@/app/lib/i18n/language";
import type { TranslateFn } from "@/app/lib/i18n/server";
import { LANDING_FAQ_ITEMS } from "@/app/lib/landing-faq-items";
import type { LandingPricingData } from "@/app/lib/pricing/load-landing-pricing";
import { localePath } from "@/app/lib/seo/locale-path";
import { absoluteUrl, getPublicSiteUrl } from "@/app/lib/site-url";
import { LANDING_PROFESSION_LINKS } from "@/app/lib/landing-professions";

type MarketingHomeProps = {
  t: TranslateFn;
  languageCode: LanguageCode;
  translationIncomplete?: boolean;
  pricing: LandingPricingData;
};

export function MarketingHome({
  t,
  languageCode,
  translationIncomplete = false,
  pricing,
}: MarketingHomeProps) {
  const site = getPublicSiteUrl();
  const steps = [
    {
      index: "01",
      title: t("landing.step1.title", "Sign up"),
      text: t(
        "landing.step1.text",
        "Name, email and password. Your account is stored securely so you can sign in from any device.",
      ),
    },
    {
      index: "02",
      title: t("landing.step2.title", "Claim your link"),
      text: t("landing.step2.text", "presh.me/yourname becomes your address."),
    },
    {
      index: "03",
      title: t("landing.step3.title", "Build the page"),
      text: t("landing.step3.text", "Profile, links and look. The preview updates right away."),
    },
  ];

  const features = [
    {
      title: t("landing.features.f1.title", "Links and blocks"),
      body: t(
        "landing.features.f1.body",
        "Buttons, text, YouTube, Spotify, images, FAQ, resume and social icons.",
      ),
    },
    {
      title: t("landing.features.f2.title", "Look that fits you"),
      body: t(
        "landing.features.f2.body",
        "Themes, fonts, header layouts and block styles — live preview as you edit.",
      ),
    },
    {
      title: t("landing.features.f3.title", "One address"),
      body: t(
        "landing.features.f3.body",
        "presh.me/your-name. Update content in the studio; the bio link stays the same.",
      ),
    },
  ];

  const uses = LANDING_PROFESSION_LINKS.map((item) => ({
    href: item.href,
    label: t(item.labelKey, item.fallbackLv),
  }));

  const faqEntities = LANDING_FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: t(item.q, item.qFb),
    acceptedAnswer: {
      "@type": "Answer",
      text: t(item.a, item.aFb),
    },
  }));

  return (
    <div className="min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Presh.Me",
              url: site,
              logo: absoluteUrl("/marketing/org-logo.svg"),
            },
            {
              "@type": "WebSite",
              name: "Presh.Me",
              url: site,
              inLanguage: languageCode,
              description: t(
                "seo.home.description",
                "Build a clean link-in-bio page with portfolio, links and contact at one address like presh.me/yourname. Free in open beta.",
              ),
            },
            {
              "@type": "SoftwareApplication",
              name: "Presh.Me",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: site,
              inLanguage: languageCode,
              description: t(
                "seo.home.description",
                "Build a clean link-in-bio page with portfolio, links and contact at one address like presh.me/yourname. Free in open beta.",
              ),
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
                description: t("landing.pricing.free.badge", "Free beta"),
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: faqEntities,
            },
          ],
        }}
      />
      <Header />
      <main>
        {translationIncomplete ? (
          <p className="border-b border-[var(--line)] bg-[var(--paper)] px-5 py-2 text-center text-sm text-[var(--muted)]">
            {t(
              "landing.incomplete.banner",
              "This language is still being translated. Some text may appear in English.",
            )}
          </p>
        ) : null}
        <section className="mx-auto max-w-3xl px-5 pb-10 pt-10 lg:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {t("landing.kicker", "Link in bio · portfolio · digital card")}
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            {t("seo.home.h1", t("landing.title", "Your page. One link. Everything you do."))}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
            {t(
              "landing.subtitle",
              "Presh.Me turns your bio link into a clean personal page — portfolio, links and contact at one address. Claim your link, build the page, publish when you are ready.",
            )}
          </p>
          <div className="mt-8">
            <ClaimForm />
          </div>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
            <Link href={localePath(languageCode, "/link-in-bio")} className="underline-offset-2 hover:underline">
              {t("seo.link_in_bio.h1", "A link in bio page that looks like you")}
            </Link>
            <Link href="/portfolio-website" className="underline-offset-2 hover:underline">
              {t("seo.portfolio.title", "Portfolio website")}
            </Link>
            <Link href="/digital-business-card" className="underline-offset-2 hover:underline">
              {t("seo.card.title", "Digital business card")}
            </Link>
          </p>
        </section>

        <div id="examples">
          <DemoMarquee />
        </div>

        <section id="studio-preview" className="border-b border-[var(--line)] bg-[var(--paper)]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-[-0.03em]">
                {t("landing.studio.title", "Build it in a minute")}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
                {t(
                  "landing.studio.subtitle",
                  "The studio shows a live preview while you edit blocks, themes and your public link — no separate publish step for every tweak.",
                )}
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <Image
                src="/marketing/studio-preview.svg"
                alt={t(
                  "landing.studio.image_alt",
                  "Presh.Me studio: editor on the left and phone page preview on the right",
                )}
                width={960}
                height={520}
                className="h-auto w-full"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="mt-10 border-y border-[var(--line)] bg-white">
          <div className="mx-auto grid max-w-6xl md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.index}
                className="border-[var(--line)] px-5 py-8 md:border-l md:first:border-l-0"
              >
                <p className="font-display text-sm font-bold tracking-[0.14em] text-[var(--accent)]">
                  {step.index}
                </p>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.03em]">{step.title}</h2>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted)]">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="border-b border-[var(--line)] bg-white">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em]">
              {t("landing.features.title", "What’s inside")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
              {t(
                "landing.features.subtitle",
                "Everything you need for a polished public page — without ads in your bio.",
              )}
            </p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {features.map((feature) => (
                <li key={feature.title}>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{feature.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-[var(--line)]">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em]">
              {t("landing.use.title", "Who it’s for")}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t("landing.use.subtitle", "One product — many professions.")}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {uses.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-sm underline-offset-2 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <LandingPricingSection pricing={pricing} />

        <div id="faq">
          <LandingFaq />
        </div>

        <section id="get-started" className="border-t border-[var(--line)] bg-white">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em]">
              {t("landing.cta.final.title", "Claim your link")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
              {t(
                "landing.cta.final.body",
                "presh.me/yourname — build the page and publish when you are ready.",
              )}
            </p>
            <div className="mt-8">
              <ClaimForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
