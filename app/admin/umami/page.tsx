import type { Metadata } from "next";
import { AdminPage } from "@/app/components/admin-page";
import { AdminUmamiDashboard } from "@/app/components/admin-umami-dashboard";
import { AdminUmamiSetupHint } from "@/app/components/admin-umami-setup-hint";
import { getUmamiShareUrl } from "@/app/lib/integrations/umami/config";

export const metadata: Metadata = { title: "Umami" };

export default async function AdminUmamiPage() {
  const shareUrl = await getUmamiShareUrl();
  return (
    <AdminPage title="Umami" wide>
      {shareUrl ? <AdminUmamiDashboard /> : <AdminUmamiSetupHint />}
    </AdminPage>
  );
}
