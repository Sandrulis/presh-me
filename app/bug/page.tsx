import type { Metadata } from "next";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";
import { SupportPageApp } from "@/app/components/support-page-app";

export const metadata: Metadata = privatePageMetadata("Atrast kļūdu?");

export default function BugPage() {
  return <SupportPageApp kind="bug" />;
}
