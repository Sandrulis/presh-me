import type { Metadata } from "next";
import { AdminLinksManager } from "@/app/components/admin-links-manager";
import { AdminPage } from "@/app/components/admin-page";

export const metadata: Metadata = { title: "Linki" };

export default function AdminLinksPage() {
  return (
    <AdminPage titleKey="admin.nav.links" titleFallback="Linki" wide>
      <AdminLinksManager />
    </AdminPage>
  );
}
