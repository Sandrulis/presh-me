import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/for/beauty-professionals",
  title: "Link in bio for beauty professionals",
  description:
    "Services, booking and Instagram in one Presh.Me page for beauty and wellness pros.",
});

export default function Page() {
  return (
    <IntentLanding
      path="/for/beauty-professionals"
      kicker="Beauty"
      h1="Services and booking without bio chaos"
      lead="Keep menus, booking and before/after links on one page clients can open from Instagram or a QR at reception."
      bullets={[
        "Links for booking, price lists and product shops.",
        "Image blocks for selected work — keep private drafts unpublished.",
        "Mobile-first layout for phones in the waiting area.",
      ]}
      related={[
        { href: "/for/barbers", label: "Barbers" },
        { href: "/digital-business-card", label: "Digital business card" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
