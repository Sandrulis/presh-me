import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/for/designers",
  title: "Portfolio link for designers",
  description:
    "A Presh.Me page for designers — case studies, contact and socials in one shareable address.",
});

export default function Page() {
  return (
    <IntentLanding
      path="/for/designers"
      kicker="Designers"
      h1="Show selected work without a heavy site"
      lead="Ship a focused page for case studies, Behance/Dribbble links and inquiries — styled to feel like you, not a generic bio tool."
      bullets={[
        "Text and image blocks for case-study summaries.",
        "Themes and fonts that stay out of the way of the work.",
        "One link for proposals, social bios and email signatures.",
      ]}
      related={[
        { href: "/portfolio-website", label: "Portfolio website" },
        { href: "/for/freelancers", label: "Freelancers" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
