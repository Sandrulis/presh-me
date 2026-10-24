import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/for/content-creators",
  title: "Link in bio for creators",
  description:
    "YouTube, Spotify, shop and socials on one Presh.Me page — a link-in-bio built for creators.",
});

export default function Page() {
  return (
    <IntentLanding
      path="/for/content-creators"
      kicker="Creators"
      h1="All your platforms behind one bio link"
      lead="Point Instagram, TikTok or YouTube to a page that holds your latest video, podcast, shop and newsletter — without stuffing the bio itself."
      bullets={[
        "YouTube, Spotify and link blocks for current drops.",
        "Themes that stay readable on mobile.",
        "Swap featured links anytime; keep the same handle.",
      ]}
      related={[
        { href: "/portfolio-website", label: "Portfolio website" },
        { href: "/compare/linktree", label: "Compare Linktree" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
