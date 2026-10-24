import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Studija");

const StudioApp = dynamic(
  () => import("@/app/components/studio-app").then((mod) => mod.StudioApp),
  {
    loading: () => (
      <div className="grid min-h-[50vh] place-items-center text-sm text-[var(--muted)]">Ielādē studiju…</div>
    ),
  },
);

export default function StudioPage() {
  return <StudioApp />;
}
