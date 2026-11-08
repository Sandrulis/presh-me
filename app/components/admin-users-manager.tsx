"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AdminStat,
  ConfirmDialog,
  IconActionButton,
  IconTrash,
} from "@/app/components/admin-ui";
import { AdminLoadMore } from "@/app/components/admin-load-more";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import {
  EMPTY_USER_DISPLAY_PREFERENCES,
  mergeDisplayPreferences,
  previewDisplayDate,
  readUserDisplayPreferences,
  siteDisplayFromSettings,
} from "@/app/lib/display-preferences";
import { formatRelativeSeen } from "@/app/lib/format-relative-seen";
import { countryDisplayName } from "@/app/lib/request-geo";
import { getSiteSettings, refreshSiteAdmin, subscribeSiteAdmin } from "@/app/lib/site-admin/store";
import { AdminUserDetailDrawer } from "@/app/components/admin-user-detail-drawer";
import { isFrontendModuleEnabled } from "@/app/lib/site-admin/modules";
import {
  deleteAccountById,
  getSessionId,
  hydrateSession,
  listAllAccounts,
  listAllPages,
  readSessionAccount,
  setAccountBlocked,
  subscribeStore,
} from "@/app/lib/store";
import type { Account } from "@/app/lib/types";

type AdminSubscriptionSummary = {
  planKey: string | null;
  planName: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
};

export function AdminUsersManager() {
  const { t, languageCode } = useTranslations();
  const accounts = useSyncExternalStore(subscribeStore, listAllAccounts, () => []);
  const pages = useSyncExternalStore(subscribeStore, listAllPages, () => []);
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const viewer = useSyncExternalStore(subscribeStore, readSessionAccount, () => null);
  const siteSettings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const { notices, notify, dismissNotice } = useNotices();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [detailAccountId, setDetailAccountId] = useState<string | null>(null);
  const [paidPlansModuleEnabled, setPaidPlansModuleEnabled] = useState(false);
  const [subscriptionsByUserId, setSubscriptionsByUserId] = useState<Record<string, AdminSubscriptionSummary>>({});

  useEffect(() => {
    void refreshSiteAdmin();
    void hydrateSession();
    let cancelled = false;
    void isFrontendModuleEnabled("module_paid_plans").then((enabled) => {
      if (!cancelled) setPaidPlansModuleEnabled(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!paidPlansModuleEnabled) {
      setSubscriptionsByUserId({});
      return;
    }
    let cancelled = false;
    void fetch(`/api/admin/subscriptions/summary?lang=${encodeURIComponent(languageCode)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.byUserId) return;
        setSubscriptionsByUserId(data.byUserId as Record<string, AdminSubscriptionSummary>);
      })
      .catch(() => {
        if (!cancelled) setSubscriptionsByUserId({});
      });
    return () => {
      cancelled = true;
    };
  }, [languageCode, paidPlansModuleEnabled, accounts.length]);

  const systemPrefs = useMemo(() => siteDisplayFromSettings(siteSettings), [siteSettings]);
  const viewerPrefs = useMemo(() => {
    if (!viewer) return EMPTY_USER_DISPLAY_PREFERENCES;
    return readUserDisplayPreferences({
      week_start_day: viewer.weekStartDay,
      date_format: viewer.dateFormat,
      date_separator: viewer.dateSeparator,
      time_format: viewer.timeFormat,
      timezone: viewer.timezone,
    });
  }, [viewer]);
  const timeZone = viewerPrefs.timezone?.trim() || siteSettings.timezone || "Europe/Riga";

  const pageCountByAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const page of pages) {
      map.set(page.accountId, (map.get(page.accountId) ?? 0) + 1);
    }
    return map;
  }, [pages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...accounts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (!q) return sorted;
    return sorted.filter((account) => {
      const hay = [account.name, account.email, account.id, account.lastIp, account.lastCountry]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [accounts, query]);

  const adminCount = accounts.filter((account) => account.isAdmin).length;
  const blockedCount = accounts.filter((account) => account.isBlocked).length;
  const detailAccount = detailAccountId
    ? accounts.find((account) => account.id === detailAccountId) ?? null
    : null;

  function formatRegistered(iso: string) {
    const merged = mergeDisplayPreferences(systemPrefs, viewerPrefs);
    return previewDisplayDate({ ...merged, timeZone }, new Date(iso)).date;
  }

  function formatSeen(iso: string | null | undefined) {
    return formatRelativeSeen(iso, {
      t,
      systemPrefs,
      viewerPrefs,
      timeZone,
    });
  }

  function formatLocation(account: Account) {
    const ip = account.lastIp?.trim() || "";
    const country = countryDisplayName(account.lastCountry, languageCode);
    if (ip && country) return `${ip} · ${country}`;
    if (ip) return ip;
    if (country) return country;
    return t("admin.users.location.unknown", "Nezināma");
  }

  async function toggleBlock(account: Account) {
    if (account.id === sessionId) {
      notify(t("admin.users.error.block_self", "Nevar bloķēt savu kontu."), "error");
      return;
    }
    const next = !account.isBlocked;
    setBusyId(account.id);
    const result = await setAccountBlocked(account.id, next);
    setBusyId(null);
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    notify(
      next
        ? t("admin.users.blocked", "Pieeja aizslēgta")
        : t("admin.users.unblocked", "Pieeja atvērta"),
      "ok",
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusyId(target.id);
    const result = await deleteAccountById(target.id);
    setBusyId(null);
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    if (detailAccountId === target.id) setDetailAccountId(null);
    notify(t("admin.users.deleted", "Lietotājs dzēsts."), "ok");
  }

  return (
    <div className="space-y-3">
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStat label={t("admin.users.stat.users", "Lietotāji")} value={accounts.length} />
        <AdminStat label={t("admin.users.stat.admins", "Administratori")} value={adminCount} />
        <AdminStat label={t("admin.users.stat.blocked", "Bloķēti")} value={blockedCount} />
        <AdminStat label={t("admin.users.stat.links", "Linki kopā")} value={pages.length} />
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("admin.users.search", "Meklēt pēc vārda vai e-pasta...")}
          className="auth-field w-full"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[var(--paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">{t("admin.users.col.user", "Lietotājs")}</th>
                <th className="px-5 py-3">{t("admin.users.col.role", "Loma")}</th>
                <th className="px-5 py-3">{t("admin.users.col.links", "Linki")}</th>
                <th className="px-5 py-3">{t("admin.users.col.registered", "Reģistrēts")}</th>
                <th className="px-5 py-3">{t("admin.users.col.seen", "Pēdējā aktivitāte")}</th>
                <th className="px-5 py-3">{t("admin.users.col.location", "IP / valsts")}</th>
                <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filtered.map((account) => {
                const isSelf = account.id === sessionId;
                const busy = busyId === account.id;
                const blocked = account.isBlocked === true;
                return (
                  <tr
                    key={account.id}
                    className={`cursor-pointer align-top hover:bg-[var(--paper)] ${blocked ? "bg-[#faf7f7]" : ""}`}
                    onClick={() => setDetailAccountId(account.id)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--ink)]">{account.name || "—"}</p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">{account.email || account.id}</p>
                      {blocked ? (
                        <p className="mt-1 text-xs font-medium text-[var(--stamp)]">
                          {t("admin.users.blocked", "Pieeja aizslēgta")}
                        </p>
                      ) : null}
                      {!blocked && account.vipTier && account.vipTier !== "off" ? (
                        <p className="mt-1 text-xs font-medium text-[var(--accent)]">
                          {account.vipTier === "vip"
                            ? t("admin.users.vip.full", "VIP")
                            : t("admin.users.vip.semi", "Semi VIP")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      {account.isAdmin ? (
                        <span className="inline-flex rounded-full bg-[var(--paper)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] ring-1 ring-[var(--line)]">
                          {t("roles.admin", "Administrators")}
                        </span>
                      ) : (
                        <span className="text-[var(--muted)]">{t("roles.user", "Lietotājs")}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-[var(--ink)]">
                      {pageCountByAccount.get(account.id) ?? 0}
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">{formatRegistered(account.createdAt)}</td>
                    <td className="px-5 py-4 text-[var(--muted)]">{formatSeen(account.lastSeenAt)}</td>
                    <td className="px-5 py-4 text-[var(--muted)]">
                      <span className="block max-w-[11rem] truncate" title={formatLocation(account)}>
                        {formatLocation(account)}
                      </span>
                    </td>
                    <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <IconActionButton
                          label={
                            blocked
                              ? t("admin.users.action.unblock", "Atvērt pieeju")
                              : t("admin.users.action.block", "Aizslēgt pieeju")
                          }
                          disabled={busy || isSelf}
                          onClick={() => void toggleBlock(account)}
                        >
                          {blocked ? <IconLockClosed /> : <IconLockOpen />}
                        </IconActionButton>
                        <IconActionButton
                          label={t("actions.delete", "Dzēst")}
                          variant="danger"
                          disabled={busy || isSelf}
                          onClick={() => setDeleteTarget(account)}
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
                  <td colSpan={7} className="px-5 py-8 text-center text-[var(--muted)]">
                    {accounts.length === 0
                      ? t("admin.users.empty", "Nav neviena lietotāja.")
                      : t("admin.users.empty_search", "Nav atrasts neviens lietotājs.")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <AdminLoadMore onError={(message) => notify(message, "error")} />

      <AdminUserDetailDrawer
        account={detailAccount}
        pages={pages}
        subscription={detailAccount ? subscriptionsByUserId[detailAccount.id] ?? null : null}
        open={detailAccount !== null}
        busy={detailAccount ? busyId === detailAccount.id : false}
        onClose={() => setDetailAccountId(null)}
        onError={(message) => notify(message, "error")}
        onSuccess={(message) => notify(message, "ok")}
        formatSeen={formatSeen}
        formatLocation={formatLocation}
        formatRegistered={formatRegistered}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("admin.users.delete.title", "Dzēst lietotāju?")}
        description={
          <>
            {t("admin.users.delete.body_prefix", "Vai tiešām dzēst")}{" "}
            <span className="font-semibold text-[var(--ink)]">
              {deleteTarget?.name || deleteTarget?.email || t("common.user", "Lietotājs")}
            </span>
            ? {t("admin.users.delete.body_suffix", "Konts un visas lapas tiks noņemtas.")}
          </>
        }
        confirmLabel={t("actions.delete", "Dzēst")}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function IconLockOpen() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.5-2" strokeLinecap="round" />
    </svg>
  );
}

function IconLockClosed() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}
