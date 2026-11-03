"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/app/components/loading-screen";
import { useTranslations } from "@/app/components/translations-provider";
import { ACCOUNT_DELETION_GRACE_DAYS } from "@/app/lib/account/deletion-constants";

export function AccountDeletionConfirmClient() {
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const token = searchParams.get("token")?.trim() ?? "";
  const [phase, setPhase] = useState<"loading" | "ok" | "error">("loading");
  const [messageKey, setMessageKey] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setPhase("error");
      setMessageKey("settings.danger.invalid_token");
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/account/deletion/confirm", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (cancelled) return;
      if (res.ok && data?.ok) {
        setPhase("ok");
        return;
      }
      setPhase("error");
      setMessageKey(data?.message ?? "settings.danger.confirm_failed");
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (phase === "loading") {
    return <LoadingScreen label={t("common.loading", "Ielādē…")} />;
  }

  const errorText = messageKey
    ? t(messageKey, "Neizdevās apstiprināt konta dzēšanu.")
    : t("settings.danger.confirm_failed", "Neizdevās apstiprināt konta dzēšanu.");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--paper)] px-4 py-10">
      {phase === "ok" ? (
        <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 text-center">
          <h1 className="text-lg font-semibold text-[var(--ink)]">
            {t("settings.danger.confirm_success_title", "Konts deaktivizēts")}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t(
              "settings.danger.confirm_success_body",
              "Tavs konts ir neaktīvs. Ja {days} dienu laikā neienāksi, tas tiks dzēsts. Ienākot atkārtoti, dzēšanu var atcelt.",
              { days: String(ACCOUNT_DELETION_GRACE_DAYS) },
            )}
          </p>
          <Link href="/login" className="btn-ink mt-5 inline-flex">
            {t("nav.login", "Pieslēgties")}
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm text-red-600">{errorText}</p>
          <Link href="/settings" className="btn-line mt-4 inline-flex">
            {t("settings.title", "Uzstādījumi")}
          </Link>
        </div>
      )}
    </div>
  );
}
