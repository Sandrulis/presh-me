import type { Metadata } from "next";
import { AdminLanguagesClient } from "@/app/admin/languages/languages-client";

export const metadata: Metadata = { title: "Valodas" };

export default function AdminLanguagesPage() {
  return <AdminLanguagesClient />;
}
