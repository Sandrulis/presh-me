import { IntentLanding } from "@/app/components/intent-landing";
import type { MarketingIntentConfig } from "@/app/lib/marketing-intent-config";
import type { ServerTranslations } from "@/app/lib/i18n/server";

const BULLET_FALLBACKS: Record<string, [string, string, string]> = {
  "intent.portfolio_website": [
    "Image, text, video and resume blocks for case studies and samples.",
    "Themes and fonts so the page matches your craft, not a generic template farm.",
    "One stable address: update the studio; keep the same bio link.",
  ],
  "intent.digital_business_card": [
    "Profile, services links, phone/email and social icons in one place.",
    "Update hours or offers in the studio — the card link stays the same.",
    "Works on mobile first; visitors need no app.",
  ],
  "intent.personal_website": [
    "Text, media and FAQ blocks for a clear personal narrative.",
    "Publish when ready; draft stays off the public URL until you flip published.",
    "Same tool as link-in-bio — no second product to learn.",
  ],
  "intent.for_barbers": [
    "Buttons for booking apps, WhatsApp or phone.",
    "Photo and text blocks for services and hours.",
    "Share as a bio link or QR at the chair.",
  ],
  "intent.for_beauty_professionals": [
    "Service menus and booking links in one tap.",
    "Before/after or gallery blocks for social proof.",
    "QR at reception; same link in Instagram bio.",
  ],
  "intent.for_coaches": [
    "Clear offer, testimonials and booking in one flow.",
    "FAQ and text blocks for programs and boundaries.",
    "One link from posts, stories and email signature.",
  ],
  "intent.for_content_creators": [
    "YouTube, Spotify and link blocks for current drops.",
    "Themes that stay readable on mobile.",
    "Swap featured links anytime; keep the same handle.",
  ],
  "intent.for_designers": [
    "Case study blocks plus links to Behance or Dribbble.",
    "Typography and themes that feel on-brand.",
    "One URL for proposals, bio and email footer.",
  ],
  "intent.for_freelancers": [
    "Services, proof and contact without five DM links.",
    "Resume or project blocks for quick credibility.",
    "Update offers in the studio; bio link unchanged.",
  ],
  "intent.for_photographers": [
    "Image and gallery-friendly blocks for selected work.",
    "Link buttons for booking, prints or a shop — without ads in your bio.",
    "Update the page in the studio; keep the same handle.",
  ],
  "intent.for_dentists": [
    "Buttons for booking systems, WhatsApp or phone.",
    "Text and FAQ blocks for services and hours.",
    "Share as a bio link or QR at reception.",
  ],
  "intent.for_auto_service": [
    "Buttons for booking, WhatsApp or a call to the shop.",
    "Text blocks for services, tires and diagnostics.",
    "Share as a bio link or QR at the entrance.",
  ],
  "intent.for_personal_trainers": [
    "Clear offer, plans and sign-up in one flow.",
    "FAQ and text blocks for sessions and boundaries.",
    "One link from posts, stories and email signature.",
  ],
  "intent.for_massage_therapists": [
    "Service menu and booking links in one tap.",
    "Text and image blocks for relaxation and proof.",
    "QR in the studio; same link in Instagram bio.",
  ],
  "intent.for_home_services": [
    "Buttons for emergency calls, WhatsApp or phone — including after hours.",
    "Text blocks for services, areas and pricing.",
    "Share as a bio link or QR on a van sticker.",
  ],
  "intent.for_real_estate": [
    "Links to newest listings and featured properties.",
    "Consultation and booking buttons in one flow.",
    "One URL for cards, Instagram and print materials.",
  ],
  "intent.for_cafes": [
    "Menu link or PDF and seasonal dishes together.",
    "Table booking and ordering buttons customers actually use.",
    "Edit from your phone; guests always get the latest link.",
  ],
  "intent.for_small_businesses": [
    "Maps, hours, menu PDF and ordering links together.",
    "Instagram and phone buttons customers actually use.",
    "Edit from your phone; customers always get the latest link.",
  ],
};

const PAGE_COPY_FALLBACKS: Record<
  string,
  { kicker: string; h1: string; lead: string; metaTitle: string; metaDescription: string }
> = {
  "intent.portfolio_website": {
    kicker: "Portfolio",
    h1: "A portfolio website that fits in one link",
    lead:
      "Show selected work, a short bio and ways to contact you — without maintaining a full multi-page site. Put the link in email signatures, Instagram or proposals.",
    metaTitle: "Portfolio website builder",
    metaDescription:
      "Build a clean one-page portfolio on Presh.Me — work samples, links and contact at one URL you share anywhere.",
  },
  "intent.digital_business_card": {
    kicker: "Digital card",
    h1: "A digital business card people actually open",
    lead:
      "Replace a stack of paper cards with one page: who you are, what you offer, and how to reach you. Share the link or print a QR to the same address.",
    metaTitle: "Digital business card",
    metaDescription:
      "Create a digital business card on Presh.Me — name, services, booking and socials in one page you share as a link or QR.",
  },
  "intent.personal_website": {
    kicker: "Personal site",
    h1: "A personal website without the setup headache",
    lead:
      "If you need a public presence but not a CMS, start with one polished page. Add sections as you grow — still one link to share.",
    metaTitle: "Personal website builder",
    metaDescription:
      "Make a simple personal website on Presh.Me — one page for your story, links and contact without hosting complexity.",
  },
  "intent.for_barbers": {
    kicker: "Barbers",
    h1: "Booking and socials in one shop link",
    lead:
      "Clients should not hunt through stories for your booking URL. One page holds booking, price list, Instagram and location.",
    metaTitle: "Link in bio for barbers",
    metaDescription:
      "Booking, Instagram and shop links on one Presh.Me page — a practical digital card for barbers.",
  },
  "intent.for_beauty_professionals": {
    kicker: "Beauty",
    h1: "Services and booking without bio chaos",
    lead:
      "Keep menus, booking and before/after links on one page clients can open from Instagram or a QR at reception.",
    metaTitle: "Link in bio for beauty professionals",
    metaDescription:
      "Services, booking and gallery links on one Presh.Me page for salons and beauty pros.",
  },
  "intent.for_coaches": {
    kicker: "Coaches",
    h1: "Programs and booking in one shareable page",
    lead:
      "Lead people from social posts to a clear page: who you help, how to book, and what to expect — without a long website project.",
    metaTitle: "Link in bio for coaches",
    metaDescription:
      "Programs, booking and FAQs on one Presh.Me page — built for coaches and consultants.",
  },
  "intent.for_content_creators": {
    kicker: "Creators",
    h1: "All your platforms behind one bio link",
    lead:
      "Point Instagram, TikTok or YouTube to a page that holds your latest video, podcast, shop and newsletter — without stuffing the bio itself.",
    metaTitle: "Link in bio for creators",
    metaDescription:
      "YouTube, Spotify, shop and socials on one Presh.Me page — a link-in-bio built for creators.",
  },
  "intent.for_designers": {
    kicker: "Designers",
    h1: "Show selected work without a heavy site",
    lead:
      "Ship a focused page for case studies, Behance/Dribbble links and inquiries — styled to feel like you, not a generic bio tool.",
    metaTitle: "Link in bio for designers",
    metaDescription:
      "Portfolio highlights and contact on one Presh.Me page — for designers who want a clean public link.",
  },
  "intent.for_freelancers": {
    kicker: "Freelancers",
    h1: "One page for clients and social bios",
    lead:
      "Stop pasting five different URLs into DMs. Offer services, proof of work and a clear next step from a single address.",
    metaTitle: "Link in bio for freelancers",
    metaDescription:
      "Services, portfolio and contact on one Presh.Me page — a simple link for freelancers.",
  },
  "intent.for_photographers": {
    kicker: "Photographers",
    h1: "One link for your portfolio and booking",
    lead:
      "Put selected galleries, price lists and contact behind a single URL for Instagram, client emails and QR on printed materials.",
    metaTitle: "Link in bio for photographers",
    metaDescription:
      "Share portfolios, booking and socials from one Presh.Me page — built for photographers who need a clean public link.",
  },
  "intent.for_dentists": {
    kicker: "Dentists",
    h1: "Booking and contact in one clinic link",
    lead:
      "Patients should not hunt through stories for your booking URL. One page holds booking, prices, Instagram and location.",
    metaTitle: "Link in bio for dentists",
    metaDescription:
      "Booking, Instagram and clinic links on one Presh.Me page for dentists.",
  },
  "intent.for_auto_service": {
    kicker: "Auto service",
    h1: "Booking and contact in one shop link",
    lead:
      "Customers should not hunt through stories for your booking URL. One page holds appointments, prices, Instagram and directions.",
    metaTitle: "Link in bio for auto shops",
    metaDescription:
      "Booking, Instagram and service links on one Presh.Me page for garages and auto service.",
  },
  "intent.for_personal_trainers": {
    kicker: "Personal trainers",
    h1: "Programs and sign-up in one shareable link",
    lead:
      "Lead people from social posts to a clear page: who you coach, how to sign up and what to expect — without a long website project.",
    metaTitle: "Link in bio for personal trainers",
    metaDescription:
      "Programs, sign-up and FAQs on one Presh.Me page for personal trainers.",
  },
  "intent.for_massage_therapists": {
    kicker: "Massage therapists",
    h1: "Booking and services in one calm link",
    lead:
      "Clients should not hunt through stories for your booking URL. One page holds appointments, service menu, Instagram and location.",
    metaTitle: "Link in bio for massage therapists",
    metaDescription:
      "Booking, services and contact on one Presh.Me page for massage therapists.",
  },
  "intent.for_home_services": {
    kicker: "Trades",
    h1: "Emergency call and pricing in one field link",
    lead:
      "Homeowners should not chase five numbers in your bio. One page holds emergency booking, services, phone and location.",
    metaTitle: "Link in bio for electricians and plumbers",
    metaDescription:
      "Emergency call, services and contact on one Presh.Me page for home trades.",
  },
  "intent.for_real_estate": {
    kicker: "Real estate",
    h1: "Listings and consultation in one agent link",
    lead:
      "Buyers should not lose your latest listings in story highlights. One page holds new properties, consultation booking and contact.",
    metaTitle: "Link in bio for real estate agents",
    metaDescription:
      "Listings, consultation and contact on one Presh.Me page for agents.",
  },
  "intent.for_cafes": {
    kicker: "Cafés",
    h1: "Menu and table booking in one restaurant link",
    lead:
      "Guests should not ask for the menu link every week. One page holds the menu, table booking, hours, Instagram and maps.",
    metaTitle: "Link in bio for cafés and restaurants",
    metaDescription:
      "Menu, reservations and socials on one Presh.Me page for food and drink businesses.",
  },
  "intent.for_small_businesses": {
    kicker: "Small business",
    h1: "A public page for hours, menu and booking",
    lead:
      "When customers ask for “the link”, give them one address with maps, Instagram, ordering and contact — updated from a phone.",
    metaTitle: "Link in bio for small businesses",
    metaDescription:
      "Hours, menu, maps and socials on one Presh.Me page — a practical link for local businesses.",
  },
};

export function marketingIntentMetadata(
  config: MarketingIntentConfig,
  t: ServerTranslations["t"],
) {
  const copy = PAGE_COPY_FALLBACKS[config.prefix];
  return {
    title: t(`${config.prefix}.meta_title`, copy.metaTitle),
    description: t(`${config.prefix}.meta_description`, copy.metaDescription),
  };
}

export function MarketingIntentPage({
  config,
  t,
}: {
  config: MarketingIntentConfig;
  t: ServerTranslations["t"];
}) {
  const copy = PAGE_COPY_FALLBACKS[config.prefix];
  const bullets = BULLET_FALLBACKS[config.prefix];
  return (
    <IntentLanding
      path={config.path}
      kicker={t(`${config.prefix}.kicker`, copy.kicker)}
      h1={t(`${config.prefix}.h1`, copy.h1)}
      lead={t(`${config.prefix}.lead`, copy.lead)}
      bullets={[
        t(`${config.prefix}.bullet1`, bullets[0]),
        t(`${config.prefix}.bullet2`, bullets[1]),
        t(`${config.prefix}.bullet3`, bullets[2]),
      ]}
      related={config.related.map((item) => ({
        href: item.href,
        label: t(item.labelKey, item.labelFallback),
      }))}
    />
  );
}
