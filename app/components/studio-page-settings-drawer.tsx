"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/app/components/admin-ui";
import { FieldFrame } from "@/app/components/field-frame";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import { LINK_UNAVAILABLE, linkFieldError, normalizeHandle } from "@/app/lib/handles";
import { checkHandleAvailable, deletePageById, isHandleTaken, readSessionPages } from "@/app/lib/store";
import type { Portfolio } from "@/app/lib/types";

type Props = {
  open: boolean;
  page: Portfolio;
  onClose: () => void;
  update: (patch: Partial<Portfolio>) => void;
  onSavedLink: () => void;
  onError: (message: string) => void;
};

function syncHandleStatus(raw: string, pageId: string, currentHandle: string) {
  const invalid = linkFieldError(raw);
  const value = normalizeHandle(raw);
  if (!invalid && value === currentHandle) {
    return { value, message: null as string | null, needsRemote: false };
  }
  const taken = !invalid && isHandleTaken(value, pageId);
  const message = invalid ?? (taken ? LINK_UNAVAILABLE : null);
  return {
    value,
    message,
    needsRemote: message === null && value !== currentHandle,
  };
}

export function StudioPageSettingsDrawer({ open, page, onClose, update, onSavedLink, onError }: Props) {
  const router = useRouter();
  const { t } = useTranslations();
  const [handleDraft, setHandleDraft] = useState(page.handle);
  const [remoteFree, setRemoteFree] = useState<boolean | null>(null);
  const [remoteChecking, setRemoteChecking] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHandleDraft(page.handle);
    setRemoteFree(null);
    setRemoteChecking(false);
  }, [open, page.handle]);

  const sync = useMemo(
    () => syncHandleStatus(handleDraft, page.id, page.handle),
    [handleDraft, page.handle, page.id],
  );

  useEffect(() => {
    if (!open || !sync.needsRemote) {
      setRemoteFree(null);
      setRemoteChecking(false);
      return;
    }
    let cancelled = false;
    setRemoteChecking(true);
    setRemoteFree(null);
    const timer = window.setTimeout(() => {
      void checkHandleAvailable(sync.value, page.id).then((available) => {
        if (cancelled) return;
        setRemoteFree(available);
        setRemoteChecking(false);
      });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, sync.needsRemote, sync.value, page.id]);

  const linkFree = sync.message === null && (!sync.needsRemote || remoteFree === true);
  const linkDirty = normalizeHandle(handleDraft) !== page.handle;
  const statusMessage = sync.message
    ?? (remoteChecking
      ? t("studio.page_settings.link_checking", "Pārbauda pieejamību…")
      : sync.needsRemote && remoteFree === false
        ? LINK_UNAVAILABLE
        : linkFree && linkDirty
          ? t("studio.page_settings.link_available", "Links ir pieejams.")
          : null);

  async function saveLink() {
    if (!linkFree || !linkDirty) return;
    setSavingLink(true);
    try {
      const available = await checkHandleAvailable(sync.value, page.id);
      if (!available) {
        onError(LINK_UNAVAILABLE);
        setRemoteFree(false);
        return;
      }
      update({ handle: sync.value });
      setHandleDraft(sync.value);
      onSavedLink();
    } finally {
      setSavingLink(false);
    }
  }

  async function deletePage() {
    setDeleting(true);
    try {
      await deletePageById(page.id);
      setConfirmDeleteOpen(false);
      onClose();
      const remaining = readSessionPages();
      router.replace(remaining.length === 0 ? "/start" : "/studio");
    } catch {
      onError(t("studio.page_settings.delete_failed", "Neizdevās dzēst lapu."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <SideDrawer
        open={open}
        side="left"
        title={t("studio.info.settings", "Settings")}
        hint={t(
          "studio.page_settings.drawer_hint",
          "Maini publisko linku un, ja vajag, dzēs šo lapu.",
        )}
        onClose={onClose}
        ariaLabel={t("studio.page_settings.drawer_aria", "Lapas iestatījumi")}
      >
        <div className="space-y-6">
          <div>
            <FieldFrame label={t("onboarding.link.label", "Links")}>
              <span
                className="auth-handle"
                data-invalid={linkFree ? undefined : "true"}
                data-valid={linkFree && linkDirty ? "true" : undefined}
              >
                <span className="shrink-0 pl-3 text-sm text-[var(--muted)]">presh.me/</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 text-[0.95rem] outline-none"
                  value={handleDraft}
                  aria-invalid={!linkFree}
                  onChange={(event) => setHandleDraft(event.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </span>
            </FieldFrame>
            {statusMessage ? (
              <p
                className={`mt-2 text-sm ${linkFree ? "text-emerald-700" : "text-[var(--stamp)]"}`}
                role="status"
              >
                {statusMessage}
              </p>
            ) : null}
            <button
              type="button"
              className="btn-ink mt-3 w-full"
              disabled={!linkFree || !linkDirty || savingLink || remoteChecking}
              onClick={() => void saveLink()}
            >
              {savingLink
                ? t("common.loading", "Ielādē…")
                : t("studio.save_link", "Saglabāt linku")}
            </button>
          </div>

          <section className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--stamp)]">
              {t("studio.page_settings.danger.title", "Bīstamā zona")}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t(
                "studio.page_settings.danger.lead",
                "Neatgriezeniski dzēš šo lapu, tās saturu un publisko linku. Konts paliek aktīvs.",
              )}
            </p>
            <button
              type="button"
              className="btn-danger mt-3 w-full"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              {t("studio.page_settings.danger.delete_button", "Dzēst lapu")}
            </button>
          </section>
        </div>
      </SideDrawer>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t("studio.page_settings.danger.confirm_title", "Dzēst lapu?")}
        description={t(
          "studio.page_settings.danger.confirm_body",
          "Vai tiešām dzēst /{handle}? Šo darbību nevar atsaukt.",
          { handle: page.handle },
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        busy={deleting}
        onClose={() => {
          if (!deleting) setConfirmDeleteOpen(false);
        }}
        onConfirm={() => void deletePage()}
      />
    </>
  );
}
