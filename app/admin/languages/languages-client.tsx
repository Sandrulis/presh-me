"use client";

import { useState } from "react";
import { AdminLanguagesForm } from "@/app/components/admin-languages-form";
import { AdminPage } from "@/app/components/admin-page";
import { useTranslations } from "@/app/components/translations-provider";

export function AdminLanguagesClient() {
  const { t } = useTranslations();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <AdminPage
      titleKey="admin.nav.languages"
      titleFallback="Valodas"
      wide
      actions={
        <button type="button" className="btn-ink" onClick={() => setCreateOpen(true)}>
          {t("admin.actions.add_plus", "+ Pievienot")}
        </button>
      }
    >
      <AdminLanguagesForm createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </AdminPage>
  );
}
