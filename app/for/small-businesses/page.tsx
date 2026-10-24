import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/for/small-businesses",
  title: "One-page site for small businesses",
  description:
    "Hours, menu, maps and booking on one Presh.Me page — a simple public link for cafés and local shops.",
});

export default function Page() {
  return (
    <IntentLanding
      path="/for/small-businesses"
      kicker="Small business"
      h1="A public page for hours, menu and booking"
      lead="When customers ask for “the link”, give them one address with maps, Instagram, ordering and contact — updated from a phone."
      bullets={[
        "Link buttons for maps, menus and delivery apps.",
        "Text blocks for hours and announcements.",
        "No separate hosting stack for a one-page presence.",
      ]}
      related={[
        { href: "/digital-business-card", label: "Digital business card" },
        { href: "/for/barbers", label: "Barbers" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
