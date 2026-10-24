"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AdminPage } from "@/app/components/admin-page";
import {
  ConfirmDialog,
  IconActionButton,
  IconTrash,
  ToggleSwitch,
} from "@/app/components/admin-ui";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import { listSiteIntegrations } from "@/app/lib/site-admin/integrations";
import {
  createFrontendModule,
  deleteFrontendModule,
  listFrontendModules,
  moduleLabelKey,
  setFrontendModuleEnabled,
  type SiteFrontendModule,
} from "@/app/lib/site-admin/modules";

export function AdminModulesManager() {
  const { t } = useTranslations();
  const { notices, notify, dismissNotice } = useNotices();
  const [modules, setModules] = useState<SiteFrontendModule[]>([]);
  const [googleOauthOn, setGoogleOauthOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SiteFrontendModule | null>(null);

  function displayModuleLabel(moduleKey: string) {
    const key = moduleLabelKey(moduleKey);
    return key ? t(key, moduleKey) : moduleKey;
  }

  useEffect(() => {
    void (async () => {
      try {
        const [rows, integrations] = await Promise.all([
          listFrontendModules(),
          listSiteIntegrations().catch(() => []),
        ]);
        setModules(rows);
        const google = integrations.find((item) => item.key === "google_oauth");
        setGoogleOauthOn(Boolean(google?.enabled && google.configured));
      } catch (error) {
        notify(
          error instanceof Error ? error.message : t("admin.modules.load_failed", "Neizdevās ielādēt moduļus."),
          "error",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [notify, t]);

  function lockedReason(module: SiteFrontendModule) {
    if (module.moduleKey === "google_sign_in" && !googleOauthOn && !module.isEnabled) {
      return t(
        "admin.modules.locked_google_oauth",
        "Vispirms konfigurē un ieslēdz Google OAuth (Administrācija → Integrācijas).",
      );
    }
    return null;
  }

  async function toggle(module: SiteFrontendModule, enabled: boolean) {
    const locked = lockedReason(module);
    if (enabled && locked) {
      notify(locked, "error");
      return;
    }
    setBusyId(module.id);
    try {
      const saved = await setFrontendModuleEnabled(module.id, enabled);
      setModules((current) => current.map((item) => (item.id === module.id ? saved : item)));
      notify(
        enabled ? t("admin.modules.enabled", "Modulis ieslēgts.") : t("admin.modules.disabled", "Modulis izslēgts."),
        "ok",
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("admin.modules.toggle_failed", "Neizdevās mainīt moduli."),
        "error",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function addModule(event: FormEvent) {
    event.preventDefault();
    const key = newKey.trim().toLowerCase();
    if (!key) {
      notify(t("admin.modules.key_required", "Ievadi moduļa atslēgu."), "error");
      return;
    }
    setBusyId("create");
    try {
      const created = await createFrontendModule(key);
      setModules((current) =>
        [...current, created].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.moduleKey.localeCompare(b.moduleKey),
        ),
      );
      setNewKey("");
      setDrawerOpen(false);
      notify(t("admin.modules.added", "Modulis pievienots."), "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("admin.modules.add_failed", "Neizdevās pievienot moduli."),
        "error",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusyId(target.id);
    try {
      await deleteFrontendModule(target.id);
      setModules((current) => current.filter((item) => item.id !== target.id));
      notify(t("admin.modules.deleted", "Modulis dzēsts."), "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("admin.modules.delete_failed", "Neizdevās dzēst moduli."),
        "error",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminPage
      titleKey="admin.nav.modules"
      titleFallback="Moduļi"
      wide
      actions={
        <button type="button" className="btn-ink shrink-0" onClick={() => setDrawerOpen(true)}>
          {t("admin.modules.add", "+ Pievienot")}
        </button>
      }
    >
      <div className="space-y-4">
        <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
        <p className="text-sm text-[var(--muted)]">
          {t(
            "admin.modules.hint",
            "Frontend moduļi — ieslēdz vai izslēdz funkcijas visā sistēmā. Definē pats savas atslēgas.",
          )}
        </p>

        {loading ? (
          <p className="text-sm text-[var(--muted)]">{t("admin.modules.loading", "Ielādē moduļus...")}</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <ul className="divide-y divide-[var(--line)]">
              {modules.map((module) => {
                const locked = lockedReason(module);
                const busy = busyId === module.id;
                const label = displayModuleLabel(module.moduleKey);
                return (
                  <li key={module.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--ink)]">{label}</p>
                      <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">{module.moduleKey}</p>
                      {locked ? <p className="mt-1 text-xs text-amber-700">{locked}</p> : null}
                    </div>
                    <ToggleSwitch
                      checked={module.isEnabled}
                      disabled={busy || Boolean(locked)}
                      label={t("admin.modules.enable_label", "Ieslēgt {key}", { key: module.moduleKey })}
                      onChange={(checked) => void toggle(module, checked)}
                    />
                    <IconActionButton
                      label={t("actions.delete", "Dzēst")}
                      variant="danger"
                      disabled={busy}
                      onClick={() => setDeleteTarget(module)}
                    >
                      <IconTrash />
                    </IconActionButton>
                  </li>
                );
              })}
              {modules.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">
                  {t("admin.modules.empty", "Nav neviena moduļa.")}
                </li>
              ) : null}
            </ul>
          </div>
        )}

        <AddModuleDrawer
          open={drawerOpen}
          newKey={newKey}
          busy={busyId === "create"}
          onClose={() => {
            if (busyId === "create") return;
            setDrawerOpen(false);
            setNewKey("");
          }}
          onChangeKey={setNewKey}
          onSubmit={(event) => void addModule(event)}
        />

        <ConfirmDialog
          open={deleteTarget !== null}
          title={t("admin.modules.delete_title", "Dzēst moduli?")}
          description={
            deleteTarget
              ? t("admin.modules.delete_body", "Vai dzēst {key}?", { key: deleteTarget.moduleKey })
              : ""
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      </div>
    </AdminPage>
  );
}

function AddModuleDrawer({
  open,
  newKey,
  busy,
  onClose,
  onChangeKey,
  onSubmit,
}: {
  open: boolean;
  newKey: string;
  busy: boolean;
  onClose: () => void;
  onChangeKey: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const { t } = useTranslations();
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const keyHint = t("admin.modules.key_hint", "Tikai a-z, 0-9, ., _, :, -");

  function requestClose() {
    if (!busy && !closing) setClosing(true);
  }

  useEffect(() => {
    if (!open) {
      setClosing(false);
      return;
    }
    setClosing(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel) return;
    const panelAnim = panel.animate(
      closing
        ? [{ transform: "translateX(0)" }, { transform: "translateX(100%)" }]
        : [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
      {
        duration: closing ? 240 : 280,
        easing: closing ? "ease-in" : "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
    const backdropAnim = backdrop?.animate(
      closing ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }],
      { duration: closing ? 200 : 240, easing: "ease", fill: "forwards" },
    );
    if (!closing) {
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
    if (closing) panelAnim.onfinish = () => onCloseRef.current();
    return () => {
      panelAnim.cancel();
      backdropAnim?.cancel();
    };
  }, [closing, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || closing || busy) return;
      event.preventDefault();
      requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, closing, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[85]">
      <button
        ref={backdropRef}
        type="button"
        aria-label={t("actions.close", "Aizvērt")}
        className="absolute inset-0 bg-[var(--ink)]/30"
        style={{ opacity: 0 }}
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute top-0 right-0 bottom-0 z-[1] flex w-[min(22rem,100%)] flex-col border-l border-[var(--line)] bg-white shadow-[-12px_0_40px_rgba(14,17,22,0.08)]"
        style={{ transform: "translateX(100%)" }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-[var(--ink)]">
            {t("admin.modules.new_title", "Jauns modulis")}
          </h2>
          <button type="button" className="btn-line px-3 py-1.5 text-sm" disabled={busy} onClick={requestClose}>
            {t("actions.close", "Aizvērt")}
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 p-5">
          <label className="block">
            <span className="auth-label">{t("admin.modules.key_label", "Moduļa atslēga")}</span>
            <input
              ref={inputRef}
              className="auth-field"
              value={newKey}
              onChange={(event) => onChangeKey(event.target.value)}
              placeholder={t("admin.modules.key_placeholder", "piem. waitlist")}
              pattern="[a-z0-9._:-]+"
              title={keyHint}
              autoComplete="off"
              disabled={busy}
              required
            />
            <p className="mt-1.5 text-xs text-[var(--muted)]">{keyHint}</p>
          </label>
          <div className="mt-auto flex justify-end gap-2 border-t border-[var(--line)] pt-4">
            <button type="button" className="btn-line" disabled={busy} onClick={requestClose}>
              {t("actions.cancel", "Atcelt")}
            </button>
            <button type="submit" className="btn-ink" disabled={busy || !newKey.trim()}>
              {busy ? t("common.loading", "Ielādē...") : t("actions.add", "Pievienot")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
