"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BrandingImageField } from "@/app/components/branding-image-field";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { ConfirmDialog, ToggleSwitch } from "@/app/components/admin-ui";
import { useTranslations } from "@/app/components/translations-provider";
import {
  getSiteSettings,
  refreshSiteAdmin,
  saveSiteSettings,
  subscribeSiteAdmin,
} from "@/app/lib/site-admin/store";
import type {
  SiteDateFormat,
  SiteDateSeparator,
  SiteSettings,
  SiteTimeFormat,
  WeekStartDay,
} from "@/app/lib/site-admin/types";
import { revalidateMaintenanceModeCache } from "@/app/lib/site-admin/revalidate-maintenance";
import { COMMON_TIMEZONES } from "@/app/lib/display-preferences";

const fieldClass = "auth-field mt-2 w-full";
const labelClass = "text-sm font-medium text-[var(--ink)]";
const hintClass = "mt-1.5 text-xs text-[var(--muted)]";

const DATE_FORMAT_KEYS: { id: SiteDateFormat; key: string; fallback: string }[] = [
  { id: "Y-m-d", key: "admin.settings.date_fmt_Y_m_d", fallback: "YYYY-MM-DD (2026-10-24)" },
  { id: "d-m-Y", key: "admin.settings.date_fmt_d_m_Y", fallback: "DD-MM-YYYY (24-10-2026)" },
  { id: "d/m/Y", key: "admin.settings.date_fmt_d_slash_m_Y", fallback: "DD/MM/YYYY (24/10/2026)" },
  { id: "m/d/Y", key: "admin.settings.date_fmt_m_slash_d_Y", fallback: "MM/DD/YYYY (10/24/2026)" },
  { id: "d.m.Y", key: "admin.settings.date_fmt_d_dot_m_Y", fallback: "DD.MM.YYYY (24.10.2026)" },
];

const DATE_SEPARATOR_KEYS: { id: SiteDateSeparator; key: string; fallback: string }[] = [
  { id: ".", key: "admin.settings.sep_dot", fallback: "Punkts (.)" },
  { id: "-", key: "admin.settings.sep_dash", fallback: "Defise (-)" },
  { id: "/", key: "admin.settings.sep_slash", fallback: "Slīpsvītra (/)" },
  { id: " ", key: "admin.settings.sep_space", fallback: "Atstarpe" },
];

export function AdminSettingsForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const saved = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const [draft, setDraft] = useState<SiteSettings>(saved);
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);
  const { notices, notify, dismissNotice } = useNotices();

  useEffect(() => {
    void refreshSiteAdmin();
  }, []);

  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const timezoneOptions =
    draft.timezone && !(COMMON_TIMEZONES as readonly string[]).includes(draft.timezone)
      ? [draft.timezone, ...COMMON_TIMEZONES]
      : [...COMMON_TIMEZONES];

  function patch<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const imageInvalid = () => notify(t("admin.settings.image_invalid", "Augšupielādē attēlu līdz 1.5 MB."), "error");

  async function persistMaintenanceMode(maintenanceMode: boolean) {
    setMaintenanceBusy(true);
    try {
      await saveSiteSettings({ ...saved, maintenanceMode });
      await revalidateMaintenanceModeCache();
      setDraft((current) => ({ ...current, maintenanceMode }));
      notify(
        maintenanceMode
          ? t("admin.settings.maintenance_enabled", "Apkopes režīms ieslēgts.")
          : t("admin.settings.maintenance_disabled", "Apkopes režīms izslēgts."),
        "ok",
      );
      router.refresh();
    } catch {
      notify(t("admin.settings.save_failed", "Neizdevās saglabāt."), "error");
    } finally {
      setMaintenanceBusy(false);
    }
  }

  function onMaintenanceToggle(next: boolean) {
    if (maintenanceBusy) return;
    if (next) {
      setMaintenanceConfirmOpen(true);
      return;
    }
    void persistMaintenanceMode(false);
  }

  return (
    <div className="space-y-4">
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      <ConfirmDialog
        open={maintenanceConfirmOpen}
        busy={maintenanceBusy}
        confirmTone="default"
        title={t("admin.settings.maintenance_confirm_title", "Ieslēgt apkopes režīmu?")}
        description={t(
          "admin.settings.maintenance_confirm_body",
          "Publiskā mājaslapa tiks aizsegta ar blur un paziņojumu. Pieslēgties varēs tikai administrators. Vai turpināt?",
        )}
        confirmLabel={t("admin.settings.maintenance_confirm_action", "Ieslēgt apkopi")}
        onClose={() => {
          if (!maintenanceBusy) setMaintenanceConfirmOpen(false);
        }}
        onConfirm={() => {
          void persistMaintenanceMode(true).then(() => setMaintenanceConfirmOpen(false));
        }}
      />
      <form
        className="rounded-2xl border border-[var(--line)] bg-white p-5 md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!dirty) return;
          void saveSiteSettings(draft).then(async () => {
            await revalidateMaintenanceModeCache();
            notify(t("admin.settings.saved", "Sistēmas uzstādījumi saglabāti."), "ok");
            router.refresh();
          });
        }}
      >
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/60 p-4">
            <div className="min-w-0 flex-1">
              <p className={labelClass}>{t("admin.settings.maintenance_mode", "Apkopes režīms")}</p>
              <p className={hintClass}>
                {t(
                  "admin.settings.maintenance_mode_hint",
                  "Slēdz publisko mājaslapu: blur un paziņojums apmeklētājiem. /login paliek atvērts — pieslēgties var tikai administrators.",
                )}
              </p>
            </div>
            <ToggleSwitch
              checked={saved.maintenanceMode}
              disabled={maintenanceBusy}
              label={t("admin.settings.maintenance_mode", "Apkopes režīms")}
              onChange={onMaintenanceToggle}
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/60 p-4">
            <p className="text-sm font-semibold text-[var(--ink)]">{t("admin.settings.billing", "Abonements")}</p>
            <div className="max-w-xs">
              <label htmlFor="trialPeriodDays" className={labelClass}>
                {t("admin.settings.trial_period_days", "Izmēģinājuma periods")}
              </label>
              <span className="auth-field-suffix-wrap mt-2">
                <input
                  id="trialPeriodDays"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={365}
                  className="auth-field w-full"
                  value={draft.trialPeriodDays}
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (!Number.isFinite(parsed)) return;
                    patch("trialPeriodDays", Math.min(365, Math.max(1, parsed)));
                  }}
                />
                <span className="auth-field-suffix" aria-hidden="true">
                  {t("admin.settings.trial_period_days_unit", "dienas")}
                </span>
              </span>
              <p className={hintClass}>
                {t(
                  "admin.settings.trial_period_days_hint",
                  "Cik dienas jauns lietotājs var izmantot trial pirms maksas plāna (kad billing būs ieslēgts).",
                )}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="systemName" className={labelClass}>
              {t("admin.settings.system_name", "Sistēmas nosaukums")}
            </label>
            <input
              id="systemName"
              className={fieldClass}
              value={draft.systemName}
              onChange={(event) => patch("systemName", event.target.value)}
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/60 p-4">
            <p className="text-sm font-semibold text-[var(--ink)]">{t("admin.settings.branding", "Zīmols")}</p>
            <p className={hintClass}>{t("admin.settings.branding_hint", "Logo un favicon. Paziņojumu favicon rādās pārlūkcilnē, kad sistēmā ir atvērts uzdevums vai cits brīdinājums.")}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <BrandingImageField
                id="logoUrl"
                label={t("admin.settings.logo", "Logo")}
                hint={t("admin.settings.logo_hint", "PNG, SVG, JPG līdz 1.5 MB. Rāda galvenē.")}
                value={draft.logoUrl}
                onChange={(logoUrl) => patch("logoUrl", logoUrl)}
                onInvalid={imageInvalid}
              />
              <BrandingImageField
                id="faviconUrl"
                label={t("admin.settings.favicon", "Favicon")}
                hint={t("admin.settings.favicon_hint", "ICO, PNG vai SVG līdz 1.5 MB. Parastā cilnes ikona.")}
                value={draft.faviconUrl}
                onChange={(faviconUrl) => patch("faviconUrl", faviconUrl)}
                onInvalid={imageInvalid}
              />
              <BrandingImageField
                id="notificationFaviconUrl"
                label={t("admin.settings.notification_favicon", "Favicon ar badge")}
                hint={t("admin.settings.notification_favicon_hint", "Rādās, kad ir paziņojums vai jaunums (piem. atvērti admin todo).")}
                value={draft.notificationFaviconUrl}
                onChange={(notificationFaviconUrl) => patch("notificationFaviconUrl", notificationFaviconUrl)}
                onInvalid={imageInvalid}
              />
            </div>
          </div>

          <div>
            <label htmlFor="legalEmail" className={labelClass}>
              {t("admin.settings.legal_email", "Juridiskais e-pasts")}
            </label>
            <input
              id="legalEmail"
              type="email"
              className={fieldClass}
              value={draft.legalEmail}
              onChange={(event) => patch("legalEmail", event.target.value)}
            />
            <p className={hintClass}>{t("admin.settings.legal_email_hint", "Rāda privātuma politikā un noteikumos saziņai par datiem.")}</p>
          </div>

          <div>
            <label htmlFor="legalEntityName" className={labelClass}>
              {t("admin.settings.legal_entity_name", "Juridiskās personas nosaukums")}
            </label>
            <input
              id="legalEntityName"
              className={fieldClass}
              value={draft.legalEntityName}
              onChange={(event) => patch("legalEntityName", event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="legalEntityRegNo" className={labelClass}>
                {t("admin.settings.legal_reg_no", "Reģistrācijas numurs")}
              </label>
              <input
                id="legalEntityRegNo"
                className={fieldClass}
                value={draft.legalEntityRegNo}
                onChange={(event) => patch("legalEntityRegNo", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="legalEntityAddress" className={labelClass}>
                {t("admin.settings.legal_address", "Juridiskā adrese")}
              </label>
              <input
                id="legalEntityAddress"
                className={fieldClass}
                value={draft.legalEntityAddress}
                onChange={(event) => patch("legalEntityAddress", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/60 p-4">
            <p className="text-sm font-semibold text-[var(--ink)]">{t("admin.settings.datetime", "Datums un laiks")}</p>
            <div>
              <label htmlFor="timezone" className={labelClass}>
                {t("admin.settings.timezone", "Laika josla")}
              </label>
              <select
                id="timezone"
                className={fieldClass}
                value={draft.timezone}
                onChange={(event) => patch("timezone", event.target.value)}
              >
                {timezoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dateFormat" className={labelClass}>
                  {t("admin.settings.date_format", "Datuma formāts")}
                </label>
                <select
                  id="dateFormat"
                  className={fieldClass}
                  value={draft.dateFormat}
                  onChange={(event) => patch("dateFormat", event.target.value as SiteDateFormat)}
                >
                  {DATE_FORMAT_KEYS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {t(item.key, item.fallback)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dateSeparator" className={labelClass}>
                  {t("admin.settings.date_separator", "Datuma atdalītājs")}
                </label>
                <select
                  id="dateSeparator"
                  className={fieldClass}
                  value={draft.dateSeparator}
                  onChange={(event) => patch("dateSeparator", event.target.value as SiteDateSeparator)}
                >
                  {DATE_SEPARATOR_KEYS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {t(item.key, item.fallback)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="timeFormat" className={labelClass}>
                  {t("admin.settings.time_format", "Laika formāts")}
                </label>
                <select
                  id="timeFormat"
                  className={fieldClass}
                  value={draft.timeFormat}
                  onChange={(event) => patch("timeFormat", event.target.value as SiteTimeFormat)}
                >
                  <option value="24">{t("admin.settings.time_24", "24 stundas")}</option>
                  <option value="12">{t("admin.settings.time_12", "12 stundas (AM/PM)")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="weekStart" className={labelClass}>
                  {t("admin.settings.week_start", "Nedēļas sākums")}
                </label>
                <select
                  id="weekStart"
                  className={fieldClass}
                  value={draft.weekStartDay}
                  onChange={(event) => patch("weekStartDay", event.target.value as WeekStartDay)}
                >
                  <option value="monday">{t("admin.settings.week_monday", "Pirmdiena")}</option>
                  <option value="sunday">{t("admin.settings.week_sunday", "Svētdiena")}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end border-t border-[var(--line)] pt-5">
          <button type="submit" className="btn-ink" disabled={!dirty}>
            {t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>
    </div>
  );
}
