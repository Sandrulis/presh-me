import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/for/coaches",
  title: "Link in bio for coaches",
  description:
    "Programs, booking and testimonials links on one Presh.Me page for coaches and consultants.",
});

export default function Page() {
  return (
    <IntentLanding
      path="/for/coaches"
      kicker="Coaches"
      h1="Programs and booking in one shareable page"
      lead="Lead people from social posts to a clear page: who you help, how to book, and what to expect — without a long website project."
      bullets={[
        "FAQ and text blocks for positioning and offers.",
        "Links to calendars, courses or a lead form.",
        "Keep unpublished drafts off the public URL.",
      ]}
      related={[
        { href: "/for/freelancers", label: "Freelancers" },
        { href: "/personal-website", label: "Personal website" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
