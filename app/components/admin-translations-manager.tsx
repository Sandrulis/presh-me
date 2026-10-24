"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ConfirmDialog,
  IconActionButton,
  IconPen,
  IconTrash,
} from "@/app/components/admin-ui";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import {
  deleteSiteTranslation,
  listSiteLanguages,
  listSiteTranslations,
  refreshSiteAdmin,
  resetLandingOverlaysToCatalog,
  subscribeSiteAdmin,
  upsertSiteTranslation,
} from "@/app/lib/site-admin/store";
import type { SiteTranslation } from "@/app/lib/site-admin/types";

type Draft = { key: string; values: Record<string, string> };

function emptyDraft(codes: string[]): Draft {
  return { key: "", values: Object.fromEntries(codes.map((code) => [code, ""])) };
}

export function AdminTranslationsManager({
  createOpen,
  onCreateOpenChange,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const languages = useSyncExternalStore(subscribeSiteAdmin, listSiteLanguages, listSiteLanguages);
  const translations = useSyncExternalStore(subscribeSiteAdmin, listSiteTranslations, listSiteTranslations);
  const { notices, notify, dismissNotice } = useNotices();
  const [query, setQuery] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft([]));
  const [deleteTarget, setDeleteTarget] = useState<SiteTranslation | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    void refreshSiteAdmin();
  }, []);

  const activeLanguages = languages.filter((item) => item.isActive);
  const codes = activeLanguages.map((item) => item.code);

  useEffect(() => {
    if (!createOpen) return;
    setEditingKey(null);
    setDraft(emptyDraft(codes));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset draft when opening create
  }, [createOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return translations;
    return translations.filter((item) => {
      const hay = [item.key, ...Object.values(item.values)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, translations]);

  function openEdit(item: SiteTranslation) {
    setEditingKey(item.key);
    setDraft({
      key: item.key,
      values: Object.fromEntries(codes.map((code) => [code, item.values[code] ?? ""])),
    });
    setEditOpen(true);
  }

  function handleDrawerClosed() {
    onCreateOpenChange(false);
    setEditOpen(false);
    setEditingKey(null);
  }

  const drawerOpen = createOpen || editOpen;
  const isEdit = Boolean(editingKey);

  return (
    <div className="space-y-3">
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />

      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        {t(
          "admin.translations.help",
          "Sarakstā ir sistēmas UI teksti no koda katalogiem. Saglabājot šeit, tiek izveidots DB pārklājums, kas aizstāj kataloga vērtību.",
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-white p-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("admin.translations.search", "Meklēt tulkojumus...")}
          className="auth-field min-w-[12rem] flex-1"
        />
        <button type="button" className="btn-quiet shrink-0" onClick={() => setResetOpen(true)}>
          {t("admin.translations.reset_landing", "Atiestatīt landing pārklājumus")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[var(--paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">{t("common.key", "Key")}</th>
                <th className="px-5 py-3">{t("admin.translations.col.values", "Tulkojumi")}</th>
                <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filtered.map((item) => (
                <tr key={item.key} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-semibold text-[var(--ink)]">{item.key}</p>
                    {item.bundled ? (
                      <p className="mt-1 text-[11px] text-[var(--muted)]">
                        {item.hasOverlay
                          ? t("admin.translations.bundled_overlay", "Kods + DB pārklājums")
                          : t("admin.translations.bundled", "No koda kataloga")}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[var(--muted)]">
                        {t("admin.translations.db_only", "Tikai DB")}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      {activeLanguages.map((language) => (
                        <p key={language.code} className="text-sm text-[var(--muted)]">
                          <span className="font-mono text-xs uppercase text-[var(--muted)]">{language.code}</span>{" "}
                          {item.values[language.code] || "—"}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <IconActionButton label={t("actions.edit", "Labot")} onClick={() => openEdit(item)}>
                        <IconPen />
                      </IconActionButton>
                      {item.hasOverlay || !item.bundled ? (
                        <IconActionButton
                          label={
                            item.bundled
                              ? t("admin.translations.remove_overlay", "Noņemt pārklājumu")
                              : t("actions.delete", "Dzēst")
                          }
                          variant="danger"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <IconTrash />
                        </IconActionButton>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-[var(--muted)]">
                    {t("admin.translations.empty", "Nav atrasts neviens tulkojums.")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <SideDrawer
        open={drawerOpen}
        side="right"
        title={
          isEdit
            ? t("admin.translations.edit", "Labot tulkojumu")
            : t("admin.translations.create", "Jauns tulkojums")
        }
        hint={t("admin.translations.form_hint", "Norādi key un tulkojumu vērtības valodām.")}
        onClose={handleDrawerClosed}
        footer={(close) => (
          <button
            type="button"
            className="btn-ink w-full"
            onClick={() => {
              if (!draft.key.trim()) {
                notify(t("admin.translations.key_required", "Ievadi tulkojuma key."), "error");
                return;
              }
              if (!editingKey && translations.some((item) => item.key === draft.key.trim())) {
                notify(t("admin.translations.exists", "Šāds key jau eksistē."), "error");
                return;
              }
              void upsertSiteTranslation({ key: draft.key, values: draft.values });
              notify(
                editingKey
                  ? t("admin.translations.saved", "Tulkojums saglabāts.")
                  : t("admin.translations.created", "Tulkojums pievienots."),
                "ok",
              );
              close();
            }}
          >
            {t("actions.save", "Saglabāt")}
          </button>
        )}
      >
        <div className="space-y-5">
          <label className="block text-sm font-medium">
            {t("common.key", "Key")}
            <input
              className="auth-field mt-2 w-full"
              value={draft.key}
              disabled={isEdit}
              placeholder="nav.home"
              onChange={(event) => setDraft((current) => ({ ...current, key: event.target.value }))}
            />
          </label>
          <div className="space-y-4">
            {activeLanguages.map((language) => (
              <label key={language.code} className="block text-sm font-medium">
                {language.name}{" "}
                <span className="font-mono text-xs uppercase text-[var(--muted)]">{language.code}</span>
                <textarea
                  className="auth-area mt-2 min-h-[4.5rem] w-full"
                  value={draft.values[language.code] ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      values: { ...current.values, [language.code]: event.target.value },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </div>
      </SideDrawer>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={
          deleteTarget?.bundled
            ? t("admin.translations.remove_overlay_title", "Noņemt pārklājumu?")
            : t("admin.translations.delete_title", "Dzēst tulkojumu?")
        }
        description={
          deleteTarget?.bundled
            ? t(
                "admin.translations.remove_overlay_body",
                "Tiks noņemts DB pārklājums key {key}. Atgriezīsies koda kataloga teksts.",
                { key: deleteTarget?.key ?? "" },
              )
            : t("admin.translations.delete_body", "Vai tiešām dzēst tulkojumu {key}?", {
                key: deleteTarget?.key ?? "",
              })
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const wasBundled = deleteTarget.bundled;
          const key = deleteTarget.key;
          void deleteSiteTranslation(key);
          setDeleteTarget(null);
          notify(
            wasBundled
              ? t("admin.translations.overlay_removed", "Pārklājums noņemts.")
              : t("admin.translations.deleted", "Tulkojums dzēsts."),
            "ok",
          );
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        title={t("admin.translations.reset_landing_title", "Atiestatīt landing pārklājumus?")}
        description={t(
          "admin.translations.reset_landing_body",
          "Tikš dzēsti DB pārklājumi app.name, landing.*, site.meta.* un seo.*. Atgriezīsies koda kataloga teksti (Presh.Me u.c.).",
        )}
        confirmLabel={t("admin.translations.reset_landing_confirm", "Atiestatīt")}
        onClose={() => !resetBusy && setResetOpen(false)}
        onConfirm={() => {
          if (resetBusy) return;
          setResetBusy(true);
          void resetLandingOverlaysToCatalog()
            .then((result) => {
              setResetOpen(false);
              notify(
                t("admin.translations.reset_landing_done", "Noņemti {count} pārklājumi.", {
                  count: result.removed,
                }),
                "ok",
              );
            })
            .catch(() => {
              notify(t("admin.translations.reset_landing_failed", "Atiestatīšana neizdevās."), "error");
            })
            .finally(() => setResetBusy(false));
        }}
      />
    </div>
  );
}
