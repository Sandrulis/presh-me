"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ConfirmDialog } from "@/app/components/admin-ui";
import { useTranslations } from "@/app/components/translations-provider";
import type { NoticeTone } from "@/app/components/feedback-toast";
import { ACCOUNT_DELETION_GRACE_DAYS } from "@/app/lib/account/deletion-constants";
import {
  EMPTY_USER_DISPLAY_PREFERENCES,
  mergeDisplayPreferences,
  previewDisplayDate,
  siteDisplayFromSettings,
} from "@/app/lib/display-preferences";
import { getSiteSettings, subscribeSiteAdmin } from "@/app/lib/site-admin/store";

type DeletionStatus = {
  pendingEmailConfirm: boolean;
  scheduled: boolean;
  purgeAt: string | null;
  confirmedAt: string | null;
};

export function SettingsDangerZone({
  notify,
}: {
  notify: (text: string, tone?: NoticeTone) => void;
}) {
  const { t } = useTranslations();
  const settings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const display = useMemo(
    () => mergeDisplayPreferences(siteDisplayFromSettings(settings), EMPTY_USER_DISPLAY_PREFERENCES),
    [settings],
  );
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reloadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/account/deletion/status", { credentials: "same-origin" });
      if (!res.ok) {
        setStatus(null);
        return;
      }
      setStatus((await res.json()) as DeletionStatus);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void reloadStatus();
  }, [reloadStatus]);

  const purgeLabel = (() => {
    if (!status?.purgeAt) return "—";
    const ms = Date.parse(status.purgeAt);
    if (!Number.isFinite(ms)) return "—";
    return previewDisplayDate({ ...display, timeZone: "Europe/Riga" }, new Date(ms)).date;
  })();

  async function requestDeletion() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/deletion/request", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !data?.ok) {
        notify(
          data?.message
            ? t(data.message, data.message)
            : t("settings.danger.request_failed", "Neizdevās nosūtīt apstiprinājuma e-pastu."),
          "error",
        );
        return;
      }
      notify(
        t(
          "settings.danger.email_sent",
          "Apstiprinājuma saite nosūtīta uz tavu e-pastu. Atver to un apstiprini dzēšanu.",
        ),
        "ok",
      );
      await reloadStatus();
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  const steps = [
    t(
      "settings.danger.step_request",
      "Nospied „Dzēst kontu” — nosūtīsim apstiprinājuma saiti uz tavu e-pastu.",
    ),
    t(
      "settings.danger.step_confirm",
      "Atver e-pastu un apstiprini — pēc tam konts kļūs neaktīvs (studija un publiskās lapas nedarbosies).",
    ),
    t(
      "settings.danger.step_grace",
      "Ja {days} dienu laikā neienāksi, konts un dati tiks neatgriezeniski dzēsti. Ienākot šajā periodā, dzēšana tiek atcelta un saņemsi e-pastu par atcelšanu.",
      { days: String(ACCOUNT_DELETION_GRACE_DAYS) },
    ),
  ];

  return (
    <>
      <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
        <h2 className="text-sm font-semibold text-[var(--stamp)]">
          {t("settings.danger.title", "Bīstamā zona")}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {t("settings.danger.lead", "Konta dzēšana notiek pakāpeniski un ar e-pasta apstiprinājumu.")}
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--ink)]">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {loadingStatus ? (
          <p className="mt-4 text-sm text-[var(--muted)]">{t("common.loading", "Ielādē…")}</p>
        ) : status?.scheduled ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">{t("settings.danger.scheduled_title", "Dzēšana ir apstiprināta")}</p>
            <p className="mt-1">
              {t("settings.danger.scheduled_body", "Konts ir neaktīvs. Neatgriezeniska dzēšana plānota {date}.", {
                date: purgeLabel,
              })}
            </p>
            <p className="mt-2 text-amber-800">
              {t(
                "settings.danger.scheduled_hint",
                "Ienāc atkārtoti {days} dienu laikā, lai atceltu dzēšanu.",
                { days: String(ACCOUNT_DELETION_GRACE_DAYS) },
              )}
            </p>
          </div>
        ) : status?.pendingEmailConfirm ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            {t(
              "settings.danger.pending_email",
              "Apstiprinājuma e-pasts ir nosūtīts. Atver saiti e-pastā, lai turpinātu.",
            )}
          </p>
        ) : (
          <button
            type="button"
            className="btn-danger mt-4 w-full"
            disabled={busy}
            onClick={() => setConfirmOpen(true)}
          >
            {t("settings.danger.delete_button", "Dzēst kontu")}
          </button>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={t("settings.danger.confirm_title", "Dzēst kontu?")}
        description={
          <p>
            {t(
              "settings.danger.confirm_body",
              "Nosūtīsim apstiprinājuma saiti uz tavu e-pastu. Konts tiks deaktivizēts tikai pēc saites apstiprināšanas.",
            )}
          </p>
        }
        confirmLabel={t("settings.danger.confirm_send", "Nosūtīt e-pastu")}
        busy={busy}
        onClose={() => {
          if (!busy) setConfirmOpen(false);
        }}
        onConfirm={() => void requestDeletion()}
      />
    </>
  );
}
