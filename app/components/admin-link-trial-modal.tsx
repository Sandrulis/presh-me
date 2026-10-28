"use client";

import { useEffect, useState } from "react";
import { AdminModal, formatAdminDate } from "@/app/components/admin-ui";
import { useTranslations } from "@/app/components/translations-provider";
import { setPageTrialStartedAt } from "@/app/lib/store";
import type { Portfolio } from "@/app/lib/types";

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateInputToIso(date: string): string | null {
  if (!date.trim()) return null;
  const parsed = Date.parse(`${date}T12:00:00.000Z`);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString();
}

type Props = {
  page: Portfolio;
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
};

export function AdminLinkTrialModal({ page, open, onClose, onSaved, onError }: Props) {
  const { t } = useTranslations();
  const [draftDate, setDraftDate] = useState(() => isoToDateInput(page.trialStartedAt));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setDraftDate(isoToDateInput(page.trialStartedAt));
  }, [open, page.id, page.trialStartedAt]);

  async function save(iso: string | null) {
    setBusy(true);
    try {
      const result = await setPageTrialStartedAt(page.id, iso);
      if (!result.ok) {
        onError(result.message);
        return;
      }
      onSaved(t("admin.links.trial.saved", "Trial datums saglabāts."));
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminModal
      open={open}
      title={t("admin.links.trial.modal.title", "Trial periods — /{handle}", { handle: page.handle })}
      onClose={busy ? () => {} : onClose}
    >
      <p className="text-sm text-[var(--muted)]">
        {t(
          "admin.links.trial.modal.hint",
          "Sākuma datums, kad skaitās izmēģinājuma periods. No tā tiek aprēķināta beigu diena pēc sistēmas iestatījuma.",
        )}
      </p>
      <label className="mt-4 block text-sm font-medium text-[var(--ink)]" htmlFor="trial-start-date">
        {t("admin.links.trial.modal.start_label", "Trial sākums")}
      </label>
      <input
        id="trial-start-date"
        type="date"
        className="auth-field mt-2 w-full"
        value={draftDate}
        disabled={busy}
        onChange={(event) => setDraftDate(event.target.value)}
      />
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-line" disabled={busy} onClick={onClose}>
          {t("actions.cancel", "Atcelt")}
        </button>
        {page.trialStartedAt ? (
          <button type="button" className="btn-line" disabled={busy} onClick={() => void save(null)}>
            {t("admin.links.trial.modal.clear", "Noņemt trial")}
          </button>
        ) : null}
        <button
          type="button"
          className="btn-ink"
          disabled={busy || !draftDate.trim()}
          onClick={() => {
            const iso = dateInputToIso(draftDate);
            if (!iso) {
              onError(t("admin.links.trial.invalid_date", "Nederīgs datums."));
              return;
            }
            void save(iso);
          }}
        >
          {t("actions.save", "Saglabāt")}
        </button>
      </div>
      {page.trialStartedAt ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          {t("admin.links.trial.modal.current", "Pašreiz: {date}", {
            date: formatAdminDate(page.trialStartedAt),
          })}
        </p>
      ) : null}
    </AdminModal>
  );
}
