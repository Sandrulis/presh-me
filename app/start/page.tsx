import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Sākums");

const OnboardingApp = dynamic(
  () => import("@/app/components/onboarding-app").then((mod) => mod.OnboardingApp),
  {
    loading: () => (
      <div className="grid min-h-[50vh] place-items-center text-sm text-[var(--muted)]">Ielādē…</div>
    ),
  },
);

export default function StartPage() {
  return <OnboardingApp />;
}
