import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/digital-business-card",
  title: "Digital business card",
  description:
    "Create a digital business card on Presh.Me — name, services, booking and socials in one page you share as a link or QR.",
});

export default function DigitalBusinessCardPage() {
  return (
    <IntentLanding
      path="/digital-business-card"
      kicker="Digital card"
      h1="A digital business card people actually open"
      lead="Replace a stack of paper cards with one page: who you are, what you offer, and how to reach you. Share the link or print a QR to the same address."
      bullets={[
        "Profile, services links, phone/email and social icons in one place.",
        "Update hours or offers in the studio — the card link stays the same.",
        "Works on mobile first; visitors need no app.",
      ]}
      related={[
        { href: "/", label: "← Presh.Me" },
        { href: "/for/barbers", label: "For barbers" },
        { href: "/for/small-businesses", label: "For small businesses" },
        { href: "/portfolio-website", label: "Portfolio website" },
      ]}
    />
  );
}
