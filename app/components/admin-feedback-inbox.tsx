"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AdminStat,
  ConfirmDialog,
  formatAdminDate,
  IconActionButton,
  IconTrash,
} from "@/app/components/admin-ui";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import {
  deleteContactEntry,
  deleteFeedbackEntry,
  listContactEntries,
  listFeedbackEntries,
  refreshFeedbackLists,
  subscribeFeedbackStore,
} from "@/app/lib/feedback/store";
import type { ContactEntry, FeedbackEntry, FeedbackKind } from "@/app/lib/feedback/types";

type FilterId = "all" | FeedbackKind | "contact";

type InboxItem =
  | { source: "feedback"; entry: FeedbackEntry }
  | { source: "contact"; entry: ContactEntry };

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

export function AdminFeedbackInbox() {
  const { t } = useTranslations();
  const feedback = useSyncExternalStore(subscribeFeedbackStore, listFeedbackEntries, () => []);
  const contacts = useSyncExternalStore(subscribeFeedbackStore, listContactEntries, () => []);
  const { notices, notify, dismissNotice } = useNotices();
  const [filter, setFilter] = useState<FilterId>("all");
  const [deleteTarget, setDeleteTarget] = useState<InboxItem | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    void refreshFeedbackLists();
  }, []);

  const filters: { id: FilterId; label: string }[] = [
    { id: "all", label: t("admin.feedback.filter.all", "Visi") },
    { id: "bug", label: t("admin.feedback.filter.bug", "Kļūdas") },
    { id: "suggestion", label: t("admin.feedback.filter.suggestion", "Ieteikumi") },
    { id: "feedback", label: t("admin.feedback.filter.feedback", "Atsauksmes") },
    { id: "contact", label: t("admin.feedback.filter.contact", "Kontakti") },
  ];

  const items = useMemo(() => {
    const feedbackItems: InboxItem[] = feedback.map((entry) => ({ source: "feedback", entry }));
    const contactItems: InboxItem[] = contacts.map((entry) => ({ source: "contact", entry }));
    const merged = [...feedbackItems, ...contactItems].sort((a, b) =>
      b.entry.createdAt.localeCompare(a.entry.createdAt),
    );
    if (filter === "all") return merged;
    if (filter === "contact") return contactItems;
    return feedbackItems.filter((item) => item.source === "feedback" && item.entry.kind === filter);
  }, [contacts, feedback, filter]);

  const counts = {
    all: feedback.length + contacts.length,
    bug: feedback.filter((item) => item.kind === "bug").length,
    suggestion: feedback.filter((item) => item.kind === "suggestion").length,
    feedback: feedback.filter((item) => item.kind === "feedback").length,
    contact: contacts.length,
  };

  function remove() {
    if (!deleteTarget) return;
    if (deleteTarget.source === "feedback") {
      void deleteFeedbackEntry(deleteTarget.entry.id).then(() =>
        notify(t("admin.feedback.deleted", "Ziņojums dzēsts."), "ok"),
      );
    } else {
      void deleteContactEntry(deleteTarget.entry.id).then(() =>
        notify(t("admin.feedback.contact_deleted", "Kontaktu ziņa dzēsta."), "ok"),
      );
    }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-3">
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      <p className="text-sm leading-6 text-[var(--muted)]">
        {t(
          "admin.feedback.hint",
          "Lietotāju kļūdu ziņojumi, ieteikumi, atsauksmes un kontaktu formas. Jauni ieraksti parādās uzreiz pēc nosūtīšanas.",
        )}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <AdminStat label={t("admin.feedback.stat.total", "Kopā")} value={counts.all} />
        <AdminStat label={t("admin.feedback.filter.bug", "Kļūdas")} value={counts.bug} />
        <AdminStat label={t("admin.feedback.filter.suggestion", "Ieteikumi")} value={counts.suggestion} />
        <AdminStat label={t("admin.feedback.filter.feedback", "Atsauksmes")} value={counts.feedback} />
        <AdminStat label={t("admin.feedback.filter.contact", "Kontakti")} value={counts.contact} />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === item.id ? "bg-[var(--ink)] text-white" : "bg-[var(--paper)] text-[var(--ink)]"
            }`}
          >
            {item.label}
            <span className="ml-1.5 tabular-nums opacity-70">{counts[item.id]}</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-[var(--line)] bg-white px-5 py-8 text-center text-sm text-[var(--muted)]">
          {t("admin.feedback.empty", "Nav ziņojumu.")}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) =>
            item.source === "feedback" ? (
              <FeedbackCard
                key={`f-${item.entry.id}`}
                entry={item.entry}
                onDelete={() => setDeleteTarget(item)}
                onPreview={setPreview}
              />
            ) : (
              <ContactCard
                key={`c-${item.entry.id}`}
                entry={item.entry}
                onDelete={() => setDeleteTarget(item)}
              />
            ),
          )}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("admin.feedback.delete.title", "Dzēst ziņojumu?")}
        description={t(
          "admin.feedback.delete.body",
          "Ziņojums tiks neatgriezeniski dzēsts no šī pārlūka krātuves.",
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        onConfirm={remove}
        onClose={() => setDeleteTarget(null)}
      />

      {preview
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-[rgba(14,17,22,0.7)]"
                aria-label={t("actions.close", "Aizvērt")}
                onClick={() => setPreview(null)}
              />
              <div className="relative z-[1] max-h-[90dvh] max-w-[min(48rem,100%)] overflow-hidden rounded-2xl bg-white p-2 shadow-xl">
                <img
                  src={preview}
                  alt={t("admin.feedback.image_alt", "Ziņojuma attēls")}
                  className="max-h-[85dvh] w-auto max-w-full rounded-xl object-contain"
                />
                <button
                  type="button"
                  className="absolute top-3 right-3 grid size-9 place-items-center rounded-lg bg-white/95 text-[var(--ink)] shadow"
                  aria-label={t("actions.close", "Aizvērt")}
                  onClick={() => setPreview(null)}
                >
                  ×
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function FeedbackCard({
  entry,
  onDelete,
  onPreview,
}: {
  entry: FeedbackEntry;
  onDelete: () => void;
  onPreview: (url: string) => void;
}) {
  const { t } = useTranslations();
  const kindLabel = {
    bug: t("admin.feedback.kind.bug", "Kļūda"),
    suggestion: t("admin.feedback.kind.suggestion", "Ieteikums"),
    feedback: t("admin.feedback.kind.feedback", "Atsauksme"),
  }[entry.kind];

  return (
    <li className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{kindLabel}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(entry.createdAt)}</p>
        </div>
        <IconActionButton label={t("actions.delete", "Dzēst")} variant="danger" onClick={onDelete}>
          <IconTrash />
        </IconActionButton>
      </div>
      {entry.title ? <h2 className="mt-2 text-base font-semibold tracking-[-0.02em]">{entry.title}</h2> : null}
      {entry.rating != null ? (
        <p className="mt-1 text-sm font-medium">
          {t("admin.feedback.rating", "Vērtējums: {count}/5", { count: entry.rating })}
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-[var(--ink)]">{entry.body}</p>
      {entry.images.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {entry.images.map((url, index) => (
            <li key={`${entry.id}-${index}`}>
              <button
                type="button"
                onClick={() => onPreview(url)}
                className="overflow-hidden rounded-xl border border-[var(--line)]"
                aria-label={t("admin.feedback.open_image", "Atvērt attēlu {count}", { count: index + 1 })}
              >
                <img src={url} alt="" className="size-20 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 border-t border-[var(--line)] pt-3 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--ink)]">{entry.name || "—"}</p>
        <p>{entry.email}</p>
        <p className="mt-0.5 text-xs">
          {t("admin.feedback.received", "Saņemts {date}", { date: formatAdminDate(entry.createdAt) })}
        </p>
      </div>
    </li>
  );
}

function ContactCard({ entry, onDelete }: { entry: ContactEntry; onDelete: () => void }) {
  const { t } = useTranslations();
  return (
    <li className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t("admin.feedback.filter.contact", "Kontakti")}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(entry.createdAt)}</p>
        </div>
        <IconActionButton label={t("actions.delete", "Dzēst")} variant="danger" onClick={onDelete}>
          <IconTrash />
        </IconActionButton>
      </div>
      <h2 className="mt-2 text-base font-semibold tracking-[-0.02em]">{entry.subject}</h2>
      <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-[var(--ink)]">{entry.message}</p>
      <div className="mt-3 border-t border-[var(--line)] pt-3 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--ink)]">{entry.name}</p>
        <p>{entry.email}</p>
      </div>
    </li>
  );
}
