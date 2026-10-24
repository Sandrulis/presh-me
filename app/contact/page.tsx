import type { Metadata } from "next";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";
import { SupportPageApp } from "@/app/components/support-page-app";

export const metadata: Metadata = privatePageMetadata("Kontakti");

export default function ContactPage() {
  return <SupportPageApp kind="contact" />;
}
