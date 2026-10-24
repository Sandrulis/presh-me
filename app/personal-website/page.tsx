import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/personal-website",
  title: "Personal website builder",
  description:
    "Make a simple personal website on Presh.Me — one page for your story, links and contact without hosting complexity.",
});

export default function PersonalWebsitePage() {
  return (
    <IntentLanding
      path="/personal-website"
      kicker="Personal site"
      h1="A personal website without the setup headache"
      lead="If you need a public presence but not a CMS, start with one polished page. Add sections as you grow — still one link to share."
      bullets={[
        "Text, media and FAQ blocks for a clear personal narrative.",
        "Publish when ready; draft stays off the public URL until you flip published.",
        "Same tool as link-in-bio — no second product to learn.",
      ]}
      related={[
        { href: "/", label: "← Presh.Me" },
        { href: "/portfolio-website", label: "Portfolio website" },
        { href: "/digital-business-card", label: "Digital business card" },
      ]}
    />
  );
}
