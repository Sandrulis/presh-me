"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ConfirmDialog,
  IconActionButton,
  IconPen,
  IconTrash,
  ToggleSwitch,
} from "@/app/components/admin-ui";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import { LANGUAGE_OPTIONS } from "@/app/lib/site-admin/language-options";
import {
  createSiteLanguage,
  deleteSiteLanguage,
  listSiteLanguages,
  refreshSiteAdmin,
  setDefaultSiteLanguage,
  setSiteLanguageActive,
  subscribeSiteAdmin,
  updateSiteLanguageName,
} from "@/app/lib/site-admin/store";
import type { SiteLanguage } from "@/app/lib/site-admin/types";

export function AdminLanguagesForm({
  createOpen,
  onCreateOpenChange,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const languages = useSyncExternalStore(subscribeSiteAdmin, listSiteLanguages, listSiteLanguages);
  const { notices, notify, dismissNotice } = useNotices();

  useEffect(() => {
    void refreshSiteAdmin();
  }, []);

  const [selectedCode, setSelectedCode] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [editTarget, setEditTarget] = useState<SiteLanguage | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SiteLanguage | null>(null);

  const existing = new Set(languages.map((item) => item.code));
  const createOptions = LANGUAGE_OPTIONS.filter((option) => !existing.has(option.code));
  const selected = LANGUAGE_OPTIONS.find((option) => option.code === selectedCode);

  function closeCreate() {
    onCreateOpenChange(false);
    setSelectedCode("");
    setMakeDefault(false);
  }

  function closeEdit() {
    setEditTarget(null);
    setEditName("");
  }

  return (
    <div className="space-y-6">
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[var(--paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">{t("admin.languages.col.language", "Valoda")}</th>
                <th className="px-5 py-3">{t("admin.languages.col.code", "Kods")}</th>
                <th className="px-5 py-3">{t("admin.languages.col.active", "Aktīva")}</th>
                <th className="px-5 py-3">{t("admin.languages.col.default", "Noklusējuma")}</th>
                <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {languages.map((language) => (
                <tr key={language.code}>
                  <td className="px-5 py-4 font-semibold text-[var(--ink)]">{language.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-[var(--muted)]">{language.code}</td>
                  <td className="px-5 py-4">
                    <ToggleSwitch
                      checked={language.isActive}
                      label={t("admin.languages.active_label", "{name} aktīva", { name: language.name })}
                      onChange={(next) => {
                        if (!next && language.isDefault) {
                          notify(t("admin.languages.default_deactivate", "Noklusējuma valodu nevar deaktivizēt."), "error");
                          return;
                        }
                        void setSiteLanguageActive(language.code, next);
                        notify(t("admin.languages.status_saved", "Valodas statuss saglabāts."), "ok");
                      }}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <ToggleSwitch
                      checked={language.isDefault}
                      label={t("admin.languages.default_label", "{name} noklusējuma", { name: language.name })}
                      onChange={(next) => {
                        if (!next) return;
                        void setDefaultSiteLanguage(language.code);
                        notify(t("admin.languages.default_saved", "Noklusējuma valoda saglabāta."), "ok");
                      }}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <IconActionButton
                        label={t("actions.edit", "Labot")}
                        onClick={() => {
                          setEditTarget(language);
                          setEditName(language.name);
                        }}
                      >
                        <IconPen />
                      </IconActionButton>
                      <IconActionButton
                        label={
                          language.isDefault
                            ? t("admin.languages.delete_default_disabled", "Noklusējuma valodu nevar dzēst")
                            : t("actions.delete", "Dzēst")
                        }
                        variant="danger"
                        disabled={language.isDefault}
                        onClick={() => setDeleteTarget(language)}
                      >
                        <IconTrash />
                      </IconActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SideDrawer
        open={createOpen}
        side="right"
        title={t("admin.languages.new", "Jauna valoda")}
        hint={t("admin.languages.new_hint", "Pievieno sistēmas UI valodu, piemēram de, fr vai ru.")}
        onClose={closeCreate}
        footer={(close) => (
          <button
            type="button"
            className="btn-ink w-full"
            disabled={!selected}
            onClick={() => {
              if (!selected) {
                notify(t("admin.languages.pick_error", "Izvēlies valodu."), "error");
                return;
              }
              void createSiteLanguage({ code: selected.code, name: selected.name, isDefault: makeDefault });
              notify(t("admin.languages.added", "Valoda pievienota."), "ok");
              close();
            }}
          >
            {t("actions.add", "Pievienot")}
          </button>
        )}
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            {t("admin.languages.col.language", "Valoda")}
            <select
              value={selectedCode}
              onChange={(event) => setSelectedCode(event.target.value)}
              className="auth-field mt-2 w-full"
            >
              <option value="">{t("admin.languages.pick", "Izvēlies valodu")}</option>
              {createOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.code.toUpperCase()} — {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm">
            {t("admin.languages.col.default", "Noklusējuma")}
            <ToggleSwitch
              checked={makeDefault}
              label={t("admin.languages.make_default", "Jauno valodu iestatīt kā noklusējuma")}
              onChange={setMakeDefault}
            />
          </label>
        </div>
      </SideDrawer>

      <SideDrawer
        open={editTarget !== null}
        side="right"
        title={t("admin.languages.edit", "Labot valodu")}
        onClose={closeEdit}
        footer={(close) => (
          <button
            type="button"
            className="btn-ink w-full"
            disabled={!editName.trim() || editName.trim() === editTarget?.name}
            onClick={() => {
              if (!editTarget) return;
              void updateSiteLanguageName(editTarget.code, editName);
              notify(t("admin.languages.saved", "Valoda saglabāta."), "ok");
              close();
            }}
          >
            {t("actions.save", "Saglabāt")}
          </button>
        )}
      >
        <label className="block text-sm font-medium">
          {t("admin.languages.name", "Nosaukums")}
          <input
            className="auth-field mt-2 w-full"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </label>
      </SideDrawer>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("admin.languages.delete.title", "Dzēst valodu?")}
        description={t(
          "admin.languages.delete.body",
          "Vai tiešām dzēst valodu {name}? Šīs valodas tulkojumu vērtības tiks noņemtas.",
          { name: deleteTarget?.name ?? "" },
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void deleteSiteLanguage(deleteTarget.code);
          setDeleteTarget(null);
          notify(t("admin.languages.deleted", "Valoda dzēsta."), "ok");
        }}
      />
    </div>
  );
}
