"use client";

import { useEffect, useState } from "react";
import {
  ConfirmDialog,
  IconActionButton,
  ToggleSwitch,
} from "@/app/components/admin-ui";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { PasswordInput } from "@/app/components/password-input";
import { useTranslations } from "@/app/components/translations-provider";
import { parseUmamiShareUrl } from "@/app/lib/integrations/umami/share";
import {
  INTEGRATION_META,
  INTEGRATION_META_FALLBACK,
  listSiteIntegrations,
  resetSiteIntegration,
  saveSiteIntegration,
  setSiteIntegrationEnabled,
  type IntegrationMeta,
  type SiteIntegration,
} from "@/app/lib/site-admin/integrations";

const EXPANDED_STORAGE_KEY = "presh.admin.integrations.expanded";

function readExpandedPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const prefs: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") prefs[key] = value;
    }
    return prefs;
  } catch {
    return {};
  }
}

function writeExpandedPrefs(next: Record<string, boolean>) {
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or a full store should not block the toggle.
  }
}

function resolveIntegrationMeta(
  itemKey: string,
  keys: IntegrationMeta,
  t: (key: string, fallback: string, params?: Record<string, string>) => string,
) {
  return {
    title: t(keys.title, itemKey),
    description: t(keys.description, "Sistēmas integrācija."),
    clientIdLabel: t(keys.clientIdLabel, "Client ID"),
    clientSecretLabel: t(keys.clientSecretLabel, "Client Secret"),
    clientIdPlaceholder: keys.clientIdPlaceholder ? t(keys.clientIdPlaceholder, "") : undefined,
    clientSecretHint: keys.clientSecretHint ? t(keys.clientSecretHint, "") : undefined,
  };
}

export function AdminIntegrationsManager() {
  const { t } = useTranslations();
  const { notices, notify, dismissNotice } = useNotices();
  const [items, setItems] = useState<SiteIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { clientId: string; clientSecret: string; accountEmail: string }>
  >({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [resetKey, setResetKey] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const rows = await listSiteIntegrations();
        setItems(rows);
        const nextDrafts: Record<
          string,
          { clientId: string; clientSecret: string; accountEmail: string }
        > = {};
        const savedExpanded = readExpandedPrefs();
        const nextExpanded: Record<string, boolean> = {};
        for (const row of rows) {
          nextDrafts[row.key] = {
            clientId: row.clientId,
            clientSecret: "",
            accountEmail: row.configuredAccountEmail,
          };
          nextExpanded[row.key] =
            row.key in savedExpanded ? savedExpanded[row.key] : row.configured;
        }
        setDrafts(nextDrafts);
        setExpanded(nextExpanded);
      } catch (error) {
        notify(
          error instanceof Error ? error.message : t("admin.integrations.load_failed", "Neizdevās ielādēt integrācijas."),
          "error",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [notify, t]);

  async function save(key: string) {
    const draft = drafts[key];
    if (!draft) return;
    if (key === "umami" && draft.accountEmail.trim() && !parseUmamiShareUrl(draft.accountEmail)) {
      notify(t("admin.integrations.umami_invalid_url", "Nederīga Umami Share URL."), "error");
      return;
    }
    setBusyKey(key);
    try {
      const keepSecret = draft.clientSecret.trim().length === 0;
      const saved = await saveSiteIntegration({
        key,
        clientId: draft.clientId,
        clientSecret: draft.clientSecret,
        keepSecret,
        configuredAccountEmail:
          key === "umami" || key === "resend" ? draft.accountEmail : undefined,
      });
      setItems((current) => current.map((item) => (item.key === key ? saved : item)));
      setDrafts((current) => ({
        ...current,
        [key]: {
          clientId: saved.clientId,
          clientSecret: "",
          accountEmail: saved.configuredAccountEmail,
        },
      }));
      notify(t("admin.integrations.saved", "Integrācija saglabāta."), "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("admin.integrations.save_failed", "Neizdevās saglabāt."),
        "error",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function toggle(key: string, enabled: boolean) {
    const item = items.find((row) => row.key === key);
    if (!item?.configured && enabled) {
      notify(t("admin.integrations.need_config", "Vispirms saglabā Client ID un Secret."), "error");
      return;
    }
    setBusyKey(key);
    try {
      const saved = await setSiteIntegrationEnabled(key, enabled);
      setItems((current) => current.map((row) => (row.key === key ? saved : row)));
      notify(
        enabled
          ? t("admin.integrations.enabled", "Integrācija ieslēgta.")
          : t("admin.integrations.disabled", "Integrācija izslēgta."),
        "ok",
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("admin.integrations.status_failed", "Neizdevās mainīt statusu."),
        "error",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function confirmReset() {
    if (!resetKey) return;
    const key = resetKey;
    setResetKey(null);
    setBusyKey(key);
    try {
      const saved = await resetSiteIntegration(key);
      setItems((current) => current.map((row) => (row.key === key ? saved : row)));
      setDrafts((current) => ({
        ...current,
        [key]: { clientId: "", clientSecret: "", accountEmail: "" },
      }));
      notify(t("admin.integrations.reset_done", "Integrācija atiestatīta."), "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("admin.integrations.reset_failed", "Neizdevās atiestatīt."),
        "error",
      );
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">{t("admin.integrations.loading", "Ielādē integrācijas...")}</p>;
  }

  return (
    <div className="space-y-4">
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      <p className="text-sm text-[var(--muted)]">
        {t("admin.integrations.hint", "Sistēmas integrācijas. Google OAuth jau var būt aktīvs login/register.")}
      </p>
      {items.map((item) => {
        const metaKeys = INTEGRATION_META[item.key] ?? INTEGRATION_META_FALLBACK;
        const meta = INTEGRATION_META[item.key]
          ? resolveIntegrationMeta(item.key, metaKeys, t)
          : {
              title: item.key,
              description: t(INTEGRATION_META_FALLBACK.description, "Sistēmas integrācija."),
              clientIdLabel: t(INTEGRATION_META_FALLBACK.clientIdLabel, "Client ID"),
              clientSecretLabel: t(INTEGRATION_META_FALLBACK.clientSecretLabel, "Client Secret"),
              clientIdPlaceholder: undefined,
              clientSecretHint: undefined,
            };
        const draft = drafts[item.key] ?? {
          clientId: item.clientId,
          clientSecret: "",
          accountEmail: item.configuredAccountEmail,
        };
        const open = expanded[item.key] ?? false;
        const busy = busyKey === item.key;
        const statusLabel =
          item.enabled && item.configured
            ? t("admin.integrations.status_on", "Ieslēgts")
            : item.configured
              ? t("admin.integrations.status_configured", "Konfigurēts")
              : t("admin.integrations.status_off", "Nav iestatīts");
        return (
          <section
            key={item.key}
            className={`rounded-2xl border bg-white p-5 ${
              item.configured ? "border-emerald-500" : "border-[var(--line)]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold tracking-[-0.02em]">{meta.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      item.enabled && item.configured
                        ? "bg-emerald-50 text-emerald-700"
                        : item.configured
                          ? "bg-amber-50 text-amber-800"
                          : "bg-[var(--paper)] text-[var(--muted)]"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{meta.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={item.enabled}
                  disabled={busy || !item.configured}
                  tone="green"
                  label={t("admin.integrations.enable_label", "Ieslēgt {name}", { name: meta.title })}
                  onChange={(checked) => void toggle(item.key, checked)}
                />
                <IconActionButton
                  label={open ? t("actions.collapse", "Sakļaut") : t("actions.expand", "Izvērst")}
                  onClick={() =>
                    setExpanded((current) => {
                      const next = { ...current, [item.key]: !open };
                      writeExpandedPrefs(next);
                      return next;
                    })
                  }
                >
                  <IconChevron className={open ? "rotate-180" : ""} />
                </IconActionButton>
              </div>
            </div>

            {open ? (
              <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-5">
                <label className="block">
                  <span className="auth-label">{meta.clientIdLabel}</span>
                  <input
                    className="auth-field"
                    value={draft.clientId}
                    disabled={busy}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [item.key]: { ...draft, clientId: event.target.value },
                      }))
                    }
                    placeholder={meta.clientIdPlaceholder ?? (item.key === "resend" ? "hello@presh.me" : "")}
                    autoComplete="off"
                  />
                </label>
                <label className="block">
                  <span className="auth-label">{meta.clientSecretLabel}</span>
                  <PasswordInput
                    value={draft.clientSecret}
                    onChange={(value) =>
                      setDrafts((current) => ({
                        ...current,
                        [item.key]: { ...draft, clientSecret: value },
                      }))
                    }
                    autoComplete="new-password"
                  />
                  <span className="auth-hint">
                    {meta.clientSecretHint
                      ? meta.clientSecretHint
                      : item.hasSecret
                        ? t("admin.integrations.secret_keep", "Atstāj tukšu, ja secret nemaini.")
                        : t("admin.integrations.secret_required", "Obligāts, lai konfigurētu integrāciju.")}
                  </span>
                </label>
                {item.key === "resend" ? (
                  <label className="block">
                    <span className="auth-label">{t("admin.integrations.reply_to_email", "Reply-To e-pasts")}</span>
                    <input
                      className="auth-field"
                      value={draft.accountEmail}
                      disabled={busy}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.key]: { ...draft, accountEmail: event.target.value },
                        }))
                      }
                      placeholder="hello@presh.me"
                      autoComplete="off"
                    />
                  </label>
                ) : null}
                {item.key === "umami" ? (
                  <label className="block">
                    <span className="auth-label">{t("admin.integrations.share_url", "Share URL")}</span>
                    <input
                      className="auth-field"
                      value={draft.accountEmail}
                      disabled={busy}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.key]: { ...draft, accountEmail: event.target.value },
                        }))
                      }
                      placeholder="https://cloud.umami.is/share/…"
                      autoComplete="off"
                    />
                    <span className="auth-hint">
                      {t(
                        "admin.integrations.umami_share_hint",
                        "Koplietošanas saite no Umami — adminā rādīs analitiku.",
                      )}
                    </span>
                  </label>
                ) : null}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="btn-auth min-w-0 flex-1 px-4"
                    style={{ width: "auto" }}
                    disabled={busy}
                    onClick={() => void save(item.key)}
                  >
                    {busy ? t("common.loading", "Ielādē...") : t("actions.save", "Saglabāt")}
                  </button>
                  <button
                    type="button"
                    className="btn-line h-12 shrink-0 px-4 text-sm text-[var(--stamp)]"
                    disabled={busy || !item.configured}
                    onClick={() => setResetKey(item.key)}
                  >
                    {t("admin.integrations.reset", "Atiestatīt")}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        );
      })}

      <ConfirmDialog
        open={resetKey !== null}
        title={t("admin.integrations.reset_title", "Atiestatīt integrāciju?")}
        description={t(
          "admin.integrations.reset_body",
          "Client ID, Secret un ieslēgtais statuss tiks notīrīti.",
        )}
        confirmLabel={t("actions.reset", "Atiestatīt")}
        onClose={() => setResetKey(null)}
        onConfirm={() => void confirmReset()}
      />
    </div>
  );
}

function IconChevron({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 transition-transform ${className}`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
