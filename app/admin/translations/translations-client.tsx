"use client";

import { useState } from "react";
import { AdminPage } from "@/app/components/admin-page";
import { AdminTranslationsManager } from "@/app/components/admin-translations-manager";
import { useTranslations } from "@/app/components/translations-provider";

export function AdminTranslationsClient() {
  const { t } = useTranslations();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <AdminPage
      titleKey="admin.nav.translations"
      titleFallback="Tulkojumi"
      wide
      actions={
        <button type="button" className="btn-ink" onClick={() => setCreateOpen(true)}>
          {t("admin.actions.add_plus", "+ Pievienot")}
        </button>
      }
    >
      <AdminTranslationsManager createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </AdminPage>
  );
}
