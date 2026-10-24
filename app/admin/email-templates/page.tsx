import type { Metadata } from "next";
import { AdminEmailTemplatesForm } from "@/app/components/admin-email-templates-form";
import { AdminPage } from "@/app/components/admin-page";
import { listEmailTemplateDrafts } from "@/app/lib/email/templates-server";

export const metadata: Metadata = { title: "E-pasta dizaini" };

export default async function AdminEmailTemplatesPage() {
  const data = await listEmailTemplateDrafts();
  return (
    <AdminPage titleKey="admin.nav.email_templates" titleFallback="E-pasta dizaini" wide>
      <AdminEmailTemplatesForm
        resendEnabled={data.resendEnabled}
        initialTemplates={data.templates}
        languages={data.languages}
      />
    </AdminPage>
  );
}
