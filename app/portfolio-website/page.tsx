import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/portfolio-website",
  title: "Portfolio website builder",
  description:
    "Build a clean one-page portfolio on Presh.Me — work samples, links and contact at one URL you share anywhere.",
});

export default function PortfolioWebsitePage() {
  return (
    <IntentLanding
      path="/portfolio-website"
      kicker="Portfolio"
      h1="A portfolio website that fits in one link"
      lead="Show selected work, a short bio and ways to contact you — without maintaining a full multi-page site. Put the link in email signatures, Instagram or proposals."
      bullets={[
        "Image, text, video and resume blocks for case studies and samples.",
        "Themes and fonts so the page matches your craft, not a generic template farm.",
        "One stable address: update the studio; keep the same bio link.",
      ]}
      related={[
        { href: "/", label: "← Presh.Me" },
        { href: "/digital-business-card", label: "Digital business card" },
        { href: "/for/photographers", label: "For photographers" },
        { href: "/for/designers", label: "For designers" },
      ]}
    />
  );
}
