import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/app/components/loading-screen";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Studija");

const StudioApp = dynamic(
  () => import("@/app/components/studio-app").then((mod) => mod.StudioApp),
  {
    loading: () => (
    <LoadingScreen label="studio.loading" backdrop="app" />
  ),
  },
);

export default function StudioPage() {
  return <StudioApp />;
}
