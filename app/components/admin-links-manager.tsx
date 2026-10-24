"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  AdminStat,
  ConfirmDialog,
  formatAdminDate,
  IconActionButton,
  IconExternal,
  IconTrash,
  ToggleSwitch,
} from "@/app/components/admin-ui";
import { AdminLoadMore } from "@/app/components/admin-load-more";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import {
  deletePageById,
  listAdminListedPages,
  listAllAccounts,
  setPagePublished,
  subscribeStore,
} from "@/app/lib/store";

export function AdminLinksManager() {
  const { t } = useTranslations();
  const pages = useSyncExternalStore(subscribeStore, listAdminListedPages, () => []);
  const accounts = useSyncExternalStore(subscribeStore, listAllAccounts, () => []);
  const { notices, notify, dismissNotice } = useNotices();
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const accountById = useMemo(() => new Map(accounts.map((item) => [item.id, item])), [accounts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((page) => {
      const owner = accountById.get(page.accountId);
      const hay = [page.handle, page.displayName, owner?.name, owner?.email].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [accountById, pages, query]);

  const publishedCount = pages.filter((page) => page.published).length;
  const deleteTarget = deleteId ? pages.find((page) => page.id === deleteId) ?? null : null;

  return (
    <div className="space-y-3">
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <AdminStat label={t("admin.nav.links", "Linki")} value={pages.length} />
        <AdminStat label={t("admin.links.stat.published", "Publicēti")} value={publishedCount} />
        <AdminStat
          label={t("admin.links.stat.unpublished", "Nepublicēti")}
          value={pages.length - publishedCount}
        />
      </div>
      <p className="text-sm text-[var(--muted)]">
        {t(
          "admin.links.hint",
          "Rāda tikai pabeigtus linkus (pēc onboarding). Kamēr lietotājs vēl veido lapu, šeit nerādās.",
        )}
      </p>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("admin.links.search", "Meklēt pēc linka, vārda vai e-pasta...")}
          className="auth-field w-full"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[var(--paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">{t("admin.links.col.link", "Links")}</th>
                <th className="px-5 py-3">{t("admin.links.col.owner", "Īpašnieks")}</th>
                <th className="px-5 py-3">{t("admin.links.col.published", "Publicēts")}</th>
                <th className="px-5 py-3">{t("admin.links.col.updated", "Atjaunināts")}</th>
                <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filtered.map((page) => {
                const owner = accountById.get(page.accountId);
                return (
                  <tr key={page.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--ink)]">/{page.handle}</p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">{page.displayName || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[var(--ink)]">{owner?.name || "—"}</p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">{owner?.email || page.accountId}</p>
                    </td>
                    <td className="px-5 py-4">
                      <ToggleSwitch
                        checked={page.published}
                        label={t("admin.links.publish_label", "Publicēt /{handle}", {
                          handle: page.handle,
                        })}
                        onChange={(published) => {
                          void setPagePublished(page.id, published);
                          notify(
                            published
                              ? t("admin.links.published", "Links publicēts.")
                              : t("admin.links.hidden", "Links paslēpts."),
                            "ok",
                          );
                        }}
                      />
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">{formatAdminDate(page.updatedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/${page.handle}`}
                          target="_blank"
                          className="grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                          title={t("admin.links.open", "Atvērt lapu")}
                          aria-label={t("admin.links.open", "Atvērt lapu")}
                        >
                          <IconExternal />
                        </Link>
                        <IconActionButton
                          label={t("actions.delete", "Dzēst")}
                          variant="danger"
                          onClick={() => setDeleteId(page.id)}
                        >
                          <IconTrash />
                        </IconActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[var(--muted)]">
                    {pages.length === 0
                      ? t("admin.links.empty", "Nav neviena pabeigta linka.")
                      : t("admin.links.empty_search", "Nav atrasts neviens links.")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <AdminLoadMore onError={(message) => notify(message, "error")} />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("admin.links.delete.title", "Dzēst linku?")}
        description={t(
          "admin.links.delete.body",
          "Vai tiešām dzēst /{handle}? Lietotājs varēs sākt jaunu onboarding no /start.",
          { handle: deleteTarget?.handle ?? "" },
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void deletePageById(deleteTarget.id);
          setDeleteId(null);
          notify(t("admin.links.deleted", "Links dzēsts."), "ok");
        }}
      />
    </div>
  );
}
