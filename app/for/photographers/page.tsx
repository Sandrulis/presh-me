import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/for/photographers",
  title: "Link in bio for photographers",
  description:
    "Share portfolios, booking and socials from one Presh.Me page — built for photographers who need a clean public link.",
});

export default function Page() {
  return (
    <IntentLanding
      path="/for/photographers"
      kicker="Photographers"
      h1="One link for your portfolio and booking"
      lead="Put selected galleries, price lists and contact behind a single URL for Instagram, client emails and QR on printed materials."
      bullets={[
        "Image and gallery-friendly blocks for selected work.",
        "Link buttons for booking, prints or a shop — without ads in your bio.",
        "Update the page in the studio; keep the same handle.",
      ]}
      related={[
        { href: "/portfolio-website", label: "Portfolio website" },
        { href: "/for/designers", label: "Designers" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
