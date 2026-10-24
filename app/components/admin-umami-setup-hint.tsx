"use client";

import { useTranslations } from "@/app/components/translations-provider";

export function AdminUmamiSetupHint() {
  const { t } = useTranslations();
  return (
    <p className="text-sm text-[var(--muted)]">
      {t(
        "admin.umami.setup",
        "Ieslēdz Umami integrāciju un saglabā koplietošanas saiti (Share URL) sadaļā Integrācijas.",
      )}
    </p>
  );
}
