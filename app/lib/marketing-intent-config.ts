/** Canonical path + i18n key prefix (`intent.*`) for marketing intent landings. */
export type MarketingIntentConfig = {
  path: string;
  prefix: string;
  related: { href: string; labelKey: string; labelFallback: string }[];
};

export const MARKETING_INTENT_PAGES: Record<string, MarketingIntentConfig> = {
  "portfolio-website": {
    path: "/portfolio-website",
    prefix: "intent.portfolio_website",
    related: [
      { href: "/", labelKey: "intent.common.back_presh", labelFallback: "← Presh.Me" },
      { href: "/digital-business-card", labelKey: "seo.card.title", labelFallback: "Digital business card" },
      { href: "/for/photographers", labelKey: "intent.for_photographers.kicker", labelFallback: "Photographers" },
      { href: "/for/designers", labelKey: "intent.for_designers.kicker", labelFallback: "Designers" },
    ],
  },
  "digital-business-card": {
    path: "/digital-business-card",
    prefix: "intent.digital_business_card",
    related: [
      { href: "/", labelKey: "intent.common.back_presh", labelFallback: "← Presh.Me" },
      { href: "/for/barbers", labelKey: "intent.for_barbers.nav", labelFallback: "For barbers" },
      { href: "/for/small-businesses", labelKey: "intent.for_small_businesses.nav", labelFallback: "For small businesses" },
      { href: "/portfolio-website", labelKey: "seo.portfolio.title", labelFallback: "Portfolio website" },
    ],
  },
  "personal-website": {
    path: "/personal-website",
    prefix: "intent.personal_website",
    related: [
      { href: "/", labelKey: "intent.common.back_presh", labelFallback: "← Presh.Me" },
      { href: "/portfolio-website", labelKey: "seo.portfolio.title", labelFallback: "Portfolio website" },
      { href: "/digital-business-card", labelKey: "seo.card.title", labelFallback: "Digital business card" },
    ],
  },
  "for/barbers": {
    path: "/for/barbers",
    prefix: "intent.for_barbers",
    related: [
      { href: "/digital-business-card", labelKey: "seo.card.title", labelFallback: "Digital business card" },
      { href: "/for/beauty-professionals", labelKey: "intent.for_beauty_professionals.kicker", labelFallback: "Beauty" },
      { href: "/", labelKey: "common.home", labelFallback: "Home" },
    ],
  },
  "for/beauty-professionals": {
    path: "/for/beauty-professionals",
    prefix: "intent.for_beauty_professionals",
    related: [
      { href: "/digital-business-card", labelKey: "seo.card.title", labelFallback: "Digital business card" },
      { href: "/for/barbers", labelKey: "intent.for_barbers.kicker", labelFallback: "Barbers" },
      { href: "/", labelKey: "common.home", labelFallback: "Home" },
    ],
  },
  "for/coaches": {
    path: "/for/coaches",
    prefix: "intent.for_coaches",
    related: [
      { href: "/personal-website", labelKey: "intent.personal_website.kicker", labelFallback: "Personal site" },
      { href: "/digital-business-card", labelKey: "seo.card.title", labelFallback: "Digital business card" },
      { href: "/", labelKey: "common.home", labelFallback: "Home" },
    ],
  },
  "for/content-creators": {
    path: "/for/content-creators",
    prefix: "intent.for_content_creators",
    related: [
      { href: "/portfolio-website", labelKey: "seo.portfolio.title", labelFallback: "Portfolio website" },
      { href: "/link-in-bio", labelKey: "intent.common.link_in_bio", labelFallback: "Link in bio" },
      { href: "/", labelKey: "common.home", labelFallback: "Home" },
    ],
  },
  "for/designers": {
    path: "/for/designers",
    prefix: "intent.for_designers",
    related: [
      { href: "/portfolio-website", labelKey: "seo.portfolio.title", labelFallback: "Portfolio website" },
      { href: "/for/photographers", labelKey: "intent.for_photographers.kicker", labelFallback: "Photographers" },
      { href: "/", labelKey: "common.home", labelFallback: "Home" },
    ],
  },
  "for/freelancers": {
    path: "/for/freelancers",
    prefix: "intent.for_freelancers",
    related: [
      { href: "/portfolio-website", labelKey: "seo.portfolio.title", labelFallback: "Portfolio website" },
      { href: "/digital-business-card", labelKey: "seo.card.title", labelFallback: "Digital business card" },
      { href: "/", labelKey: "common.home", labelFallback: "Home" },
    ],
  },
  "for/photographers": {
    path: "/for/photographers",
    prefix: "intent.for_photographers",
    related: [
      { href: "/portfolio-website", labelKey: "seo.portfolio.title", labelFallback: "Portfolio website" },
      { href: "/for/designers", labelKey: "intent.for_designers.kicker", labelFallback: "Designers" },
      { href: "/", labelKey: "common.home", labelFallback: "Home" },
    ],
  },
  "for/small-businesses": {
    path: "/for/small-businesses",
    prefix: "intent.for_small_businesses",
    related: [
      { href: "/digital-business-card", labelKey: "seo.card.title", labelFallback: "Digital business card" },
      { href: "/for/barbers", labelKey: "intent.for_barbers.kicker", labelFallback: "Barbers" },
      { href: "/", labelKey: "common.home", labelFallback: "Home" },
    ],
  },
};
