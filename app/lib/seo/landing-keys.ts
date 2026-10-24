/** Keys that must be uniquely translated for a locale to be SEO-indexable. */
export const LANDING_SEO_KEYS = [
  "seo.home.title",
  "seo.home.description",
  "seo.home.h1",
  "seo.portfolio_page.title",
  "seo.portfolio_page.description",
  "seo.portfolio_page.h1",
  "seo.card_page.title",
  "seo.card_page.description",
  "seo.card_page.h1",
  "landing.kicker",
  "landing.title",
  "landing.subtitle",
  "landing.faq.q1",
  "landing.faq.a1",
  "landing.faq.q4",
  "landing.faq.a4",
  "landing.faq.q8",
  "landing.faq.a8",
  "landing.faq.q10",
  "landing.faq.a10",
] as const;

export type LandingSeoKey = (typeof LANDING_SEO_KEYS)[number];
