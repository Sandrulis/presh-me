import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/for/freelancers",
  title: "Personal page for freelancers",
  description:
    "Services, portfolio links and contact on one Presh.Me page — for freelancers and consultants.",
});

export default function Page() {
  return (
    <IntentLanding
      path="/for/freelancers"
      kicker="Freelancers"
      h1="One page for clients and social bios"
      lead="Stop pasting five different URLs into DMs. Offer services, proof of work and a clear next step from a single address."
      bullets={[
        "Resume and FAQ blocks for common client questions.",
        "Links to calendars, invoices portals or case studies.",
        "Publish when ready — drafts stay private.",
      ]}
      related={[
        { href: "/for/coaches", label: "Coaches" },
        { href: "/personal-website", label: "Personal website" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
