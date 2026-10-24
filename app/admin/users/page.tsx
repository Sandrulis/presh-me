import type { Metadata } from "next";
import { AdminPage } from "@/app/components/admin-page";
import { AdminUsersManager } from "@/app/components/admin-users-manager";

export const metadata: Metadata = { title: "Lietotāji" };

export default function AdminUsersPage() {
  return (
    <AdminPage titleKey="admin.nav.users" titleFallback="Lietotāji" wide>
      <AdminUsersManager />
    </AdminPage>
  );
}
