import type { Metadata } from "next";
import { AdminIntegrationsManager } from "@/app/components/admin-integrations-manager";
import { AdminPage } from "@/app/components/admin-page";

export const metadata: Metadata = { title: "Integrācijas" };

export default function AdminIntegrationsPage() {
  return (
    <AdminPage titleKey="admin.nav.integrations" titleFallback="Integrācijas" wide>
      <AdminIntegrationsManager />
    </AdminPage>
  );
}
