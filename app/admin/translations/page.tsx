import type { Metadata } from "next";
import { AdminTranslationsClient } from "@/app/admin/translations/translations-client";

export const metadata: Metadata = { title: "Tulkojumi" };

export default function AdminTranslationsPage() {
  return <AdminTranslationsClient />;
}
