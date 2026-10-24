import type { Metadata } from "next";
import { AdminPage } from "@/app/components/admin-page";
import { AdminSettingsForm } from "@/app/components/admin-settings-form";

export const metadata: Metadata = { title: "Uzstādījumi" };

export default function AdminSettingsPage() {
  return (
    <AdminPage titleKey="admin.nav.settings" titleFallback="Uzstādījumi" wide>
      <AdminSettingsForm />
    </AdminPage>
  );
}
