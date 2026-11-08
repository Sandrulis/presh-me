"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { IconExternal } from "@/app/components/admin-ui";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import type { UserVipTier } from "@/app/lib/billing/user-vip-tier";
import { USER_VIP_TIERS } from "@/app/lib/billing/user-vip-tier";
import {
  EMPTY_USER_DISPLAY_PREFERENCES,
  mergeDisplayPreferences,
  previewDisplayDate,
  siteDisplayFromSettings,
} from "@/app/lib/display-preferences";
import { getSiteSettings, subscribeSiteAdmin } from "@/app/lib/site-admin/store";
import { setAccountVipTier } from "@/app/lib/store";
import type { Account, Portfolio } from "@/app/lib/types";

type AdminSubscriptionSummary = {
  planKey: string | null;
  planName: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
};

const VIP_OPTION_KEYS: Record<UserVipTier, { label: string; hint: string; fallbackLabel: string; fallbackHint: string }> = {
  off: {
    label: "admin.users.vip.off",
    hint: "admin.users.vip.hint_off",
    fallbackLabel: "Izslēgts",
    fallbackHint: "Standarta noteikumi — maksas moduļi tikai ar abonementu.",
  },
  semi_vip: {
    label: "admin.users.vip.semi",
    hint: "admin.users.vip.hint_semi",
    fallbackLabel: "Semi VIP",
    fallbackHint: "Visi maksas moduļi uz vienas lapas; vairāki linki tikai ar abonementu.",
  },
  vip: {
    label: "admin.users.vip.full",
    hint: "admin.users.vip.hint_full",
    fallbackLabel: "VIP",
    fallbackHint: "Visi maksas moduļi, ieskaitot vairākus linkus, bez abonementa.",
  },
};

export function AdminUserDetailDrawer({
  account,
  pages,
  subscription,
  open,
  busy,
  onClose,
  onError,
  onSuccess,
  formatSeen,
  formatLocation,
  formatRegistered,
}: {
  account: Account | null;
  pages: Portfolio[];
  subscription: AdminSubscriptionSummary | null;
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  formatSeen: (iso: string | null | undefined) => string;
  formatLocation: (row: Account) => string;
  formatRegistered: (iso: string) => string;
}) {
  const { t } = useTranslations();
  const siteSettings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const [draftTier, setDraftTier] = useState<UserVipTier>("off");
  const [saving, setSaving] = useState(false);

  const savedTier = account?.vipTier ?? "off";

  useEffect(() => {
    if (open && account) setDraftTier(savedTier);
  }, [account, open, savedTier]);

  const isDirty = draftTier !== savedTier;
  const accountPages = useMemo(
    () =>
      account
        ? [...pages]
            .filter((page) => page.accountId === account.id)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        : [],
    [account, pages],
  );

  const systemPrefs = useMemo(() => siteDisplayFromSettings(siteSettings), [siteSettings]);
  const viewerPrefs = EMPTY_USER_DISPLAY_PREFERENCES;

  if (!account) return null;

  const title = account.name.trim() || account.email || t("common.user", "Lietotājs");

  async function saveTier() {
    if (!isDirty || saving || busy) return;
    setSaving(true);
    const result = await setAccountVipTier(account!.id, draftTier);
    setSaving(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    onSuccess(t("admin.users.vip.saved", "VIP līmenis saglabāts."));
    onClose();
  }

  function subscriptionLine() {
    if (!subscription) {
      return t("admin.users.detail.subscription_none", "Nav aktīva abonementa.");
    }
    const plan = subscription.planName?.trim() || subscription.planKey || "—";
    const active = subscription.isActive
      ? t("admin.users.detail.subscription_active", "Aktīvs")
      : t("admin.users.detail.subscription_inactive", "Neaktīvs");
    return `${plan} · ${active}`;
  }

  const tierCopy = VIP_OPTION_KEYS[draftTier];

  return (
    <SideDrawer
      open={open}
      side="right"
      title={title}
      hint={account.email || undefined}
      onClose={onClose}
      footer={() => (
        <button
          type="button"
          className="btn-ink w-full"
          disabled={!isDirty || saving || busy}
          onClick={() => void saveTier()}
        >
          {t("actions.save", "Saglabāt")}
        </button>
      )}
    >
      <div className="space-y-6">
        <section className="space-y-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t("admin.users.detail.profile", "Profils")}
          </h3>
          <dl className="space-y-2">
            <DetailRow label={t("common.email", "E-pasts")} value={account.email || "—"} />
            <DetailRow label={t("admin.users.col.registered", "Reģistrēts")} value={formatRegistered(account.createdAt)} />
            <DetailRow label={t("admin.users.col.seen", "Pēdējā aktivitāte")} value={formatSeen(account.lastSeenAt)} />
            <DetailRow label={t("admin.users.col.location", "IP / valsts")} value={formatLocation(account)} />
            <DetailRow
              label={t("admin.users.col.role", "Loma")}
              value={account.isAdmin ? t("roles.admin", "Administrators") : t("roles.user", "Lietotājs")}
            />
            <DetailRow label={t("admin.users.detail.subscription", "Abonements")} value={subscriptionLine()} />
          </dl>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t("admin.users.vip.label", "VIP piekļuve")}
          </h3>
          <VipTierPicker draftTier={draftTier} onChange={setDraftTier} disabled={saving || busy} />
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            {t(tierCopy.hint, tierCopy.fallbackHint)}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t("admin.users.detail.links_title", "Linki ({count})", { count: accountPages.length })}
          </h3>
          {accountPages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{t("admin.users.detail.links_empty", "Nav izveidotu linku.")}</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">
              {accountPages.map((page) => (
                <li key={page.id} className="flex items-start justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--ink)]">{page.displayName.trim() || page.handle}</p>
                    <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">/{page.handle}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {page.published
                        ? t("studio.page.published", "Publicēta")
                        : t("studio.page.unpublished", "Nepubliska")}
                      {" · "}
                      {t("admin.links.col.updated", "Atjaunināts")}:{" "}
                      {previewDisplayDate(
                        {
                          ...mergeDisplayPreferences(systemPrefs, viewerPrefs),
                          timeZone: siteSettings.timezone || "Europe/Riga",
                        },
                        new Date(page.updatedAt),
                      ).date}
                    </p>
                  </div>
                  <Link
                    href={`/${page.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                    aria-label={t("admin.users.detail.open_link", "Atvērt lapu")}
                  >
                    <IconExternal />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </SideDrawer>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="mt-0.5 font-medium text-[var(--ink)]">{value}</dd>
    </div>
  );
}

function VipTierPicker({
  draftTier,
  onChange,
  disabled,
}: {
  draftTier: UserVipTier;
  onChange: (tier: UserVipTier) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslations();
  const shortLabel: Record<UserVipTier, string> = {
    off: t("admin.users.vip.off", "Izslēgts"),
    semi_vip: t("admin.users.vip.semi_short", "Semi"),
    vip: t("admin.users.vip.full", "VIP"),
  };

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-[10px] bg-[#e8edf5] p-1"
      role="radiogroup"
      aria-label={t("admin.users.vip.label", "VIP piekļuve")}
    >
      {USER_VIP_TIERS.map((tier) => {
        const selected = draftTier === tier;
        const copy = VIP_OPTION_KEYS[tier];
        const label = t(copy.label, copy.fallbackLabel);
        return (
          <button
            key={tier}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(tier)}
            className={`min-w-0 rounded-lg px-2 py-2.5 text-center text-sm transition disabled:cursor-not-allowed disabled:opacity-55 ${
              selected
                ? "bg-white font-semibold text-[var(--ink)] shadow-[0_2px_8px_rgba(47,91,255,0.12)] ring-2 ring-[var(--accent)]"
                : "font-medium text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <span className="hidden truncate sm:inline">{label}</span>
            <span className="truncate sm:hidden">{shortLabel[tier]}</span>
          </button>
        );
      })}
    </div>
  );
}
