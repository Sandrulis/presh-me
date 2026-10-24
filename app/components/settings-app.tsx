"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { LoadingScreen } from "@/app/components/loading-screen";
import { MfaSettingsCard } from "@/app/components/mfa-settings-card";
import { useTranslations } from "@/app/components/translations-provider";
import { requestEmailChangeAction } from "@/app/lib/auth/register-action";
import {
  COMMON_TIMEZONES,
  EMPTY_USER_DISPLAY_PREFERENCES,
  mergeDisplayPreferences,
  previewDisplayDate,
  readUserDisplayPreferences,
  siteDisplayFromSettings,
  userDisplayPreferencesEqual,
  type UserDisplayPreferences,
} from "@/app/lib/display-preferences";
import {
  getSessionId,
  isStoreReady,
  readSessionAccount,
  saveSessionDisplayPreferences,
  subscribeStore,
  updateSessionAccountName,
} from "@/app/lib/store";
import {
  getSiteSettings,
  refreshSiteAdmin,
  subscribeSiteAdmin,
} from "@/app/lib/site-admin/store";
import type {
  SiteDateFormat,
  SiteDateSeparator,
  SiteTimeFormat,
  WeekStartDay,
} from "@/app/lib/site-admin/types";

const fieldClass = "auth-field mt-2 w-full";
const labelClass = "text-sm font-medium text-[var(--ink)]";
const hintClass = "mt-1.5 text-xs text-[var(--muted)]";

const DATE_FORMATS: { id: SiteDateFormat; key: string; fallback: string }[] = [
  { id: "Y-m-d", key: "admin.settings.date_fmt_Y_m_d", fallback: "YYYY-MM-DD (2026-10-24)" },
  { id: "d-m-Y", key: "admin.settings.date_fmt_d_m_Y", fallback: "DD-MM-YYYY (24-10-2026)" },
  { id: "d/m/Y", key: "admin.settings.date_fmt_d_slash_m_Y", fallback: "DD/MM/YYYY (24/10/2026)" },
  { id: "m/d/Y", key: "admin.settings.date_fmt_m_slash_d_Y", fallback: "MM/DD/YYYY (10/24/2026)" },
  { id: "d.m.Y", key: "admin.settings.date_fmt_d_dot_m_Y", fallback: "DD.MM.YYYY (24.10.2026)" },
];

const DATE_SEPARATORS: { id: SiteDateSeparator; key: string; fallback: string }[] = [
  { id: ".", key: "admin.settings.sep_dot", fallback: "Punkts (.)" },
  { id: "-", key: "admin.settings.sep_dash", fallback: "Defise (-)" },
  { id: "/", key: "admin.settings.sep_slash", fallback: "Slīpsvītra (/)" },
  { id: " ", key: "admin.settings.sep_space", fallback: "Atstarpe" },
];

function accountToPrefs(account: NonNullable<ReturnType<typeof readSessionAccount>>): UserDisplayPreferences {
  return readUserDisplayPreferences({
    week_start_day: account.weekStartDay,
    date_format: account.dateFormat,
    date_separator: account.dateSeparator,
    time_format: account.timeFormat,
    timezone: account.timezone,
  });
}

export function SettingsApp({ mfaReason = null }: { mfaReason?: string | null }) {
  const router = useRouter();
  const { t } = useTranslations();
  const ready = useSyncExternalStore(subscribeStore, isStoreReady, () => false);
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const account = useSyncExternalStore(subscribeStore, readSessionAccount, () => null);
  const siteSettings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const { notices, notify, dismissNotice } = useNotices();

  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [prefs, setPrefs] = useState<UserDisplayPreferences>(EMPTY_USER_DISPLAY_PREFERENCES);
  const [savedPrefs, setSavedPrefs] = useState<UserDisplayPreferences>(EMPTY_USER_DISPLAY_PREFERENCES);
  const [pendingProfile, setPendingProfile] = useState(false);
  const [pendingDisplay, setPendingDisplay] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [pendingEmail, setPendingEmail] = useState(false);

  useEffect(() => {
    if (ready && !sessionId) router.replace("/login");
  }, [ready, sessionId, router]);

  useEffect(() => {
    void refreshSiteAdmin();
  }, []);

  useEffect(() => {
    if (!account) return;
    setName(account.name);
    setSavedName(account.name);
    setEmailDraft(account.email);
    const next = accountToPrefs(account);
    setPrefs(next);
    setSavedPrefs(next);
  }, [account]);

  const systemDefaults = useMemo(() => siteDisplayFromSettings(siteSettings), [siteSettings]);
  const profileDirty = name.trim() !== savedName.trim();
  const displayDirty = !userDisplayPreferencesEqual(prefs, savedPrefs);

  const preview = useMemo(() => {
    const merged = mergeDisplayPreferences(systemDefaults, prefs);
    return previewDisplayDate({
      ...merged,
      timeZone: prefs.timezone?.trim() || siteSettings.timezone || "Europe/Riga",
    });
  }, [prefs, siteSettings.timezone, systemDefaults]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profileDirty || pendingProfile) return;
    setPendingProfile(true);
    const result = await updateSessionAccountName(name);
    setPendingProfile(false);
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    setSavedName(name.trim());
    notify(t("settings.profile.saved", "Profils saglabāts."), "ok");
  }

  async function saveDisplay(event: FormEvent) {
    event.preventDefault();
    if (!displayDirty || pendingDisplay) return;
    setPendingDisplay(true);
    const result = await saveSessionDisplayPreferences(prefs);
    setPendingDisplay(false);
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    setSavedPrefs(prefs);
    notify(t("settings.display.saved", "Attēlojuma uzstādījumi saglabāti."), "ok");
  }

  if (!ready || !sessionId || !account) {
    return <LoadingScreen />;
  }

  function systemDefaultLabel(current: string) {
    return t("settings.display.system_default", "Sistēmas noklusējums ({value})", { value: current });
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-lg px-5 py-10">
        <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em]">
          {t("settings.title", "Uzstādījumi")}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t("settings.subtitle", "Tavs profils un datumu attēlojuma iestatījumi.")}
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-[var(--line)] bg-white px-5 py-5">
            <p className="text-sm font-semibold text-[var(--ink)]">{account.name || "—"}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{account.email || "—"}</p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              {t("settings.language.title", "Valoda")}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t("settings.language.hint", "Sistēmas saskarnes valoda.")}
            </p>
            <div className="mt-4">
              <LanguageSwitcher variant="stacked" />
            </div>
          </div>

          <MfaSettingsCard
            isAdmin={account.isAdmin === true}
            mfaReason={mfaReason}
            notify={notify}
          />

          <form onSubmit={(event) => void saveProfile(event)} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              {t("settings.profile.title", "Personīgā informācija")}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t("settings.profile.hint", "Vārds, kas redzams studijā un adminā.")}
            </p>
            <label className="mt-5 block">
              <span className={labelClass}>{t("common.name", "Vārds")}</span>
              <input
                className={fieldClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="mt-4 block">
              <span className={labelClass}>{t("common.email", "E-pasts")}</span>
              <input
                className={fieldClass}
                type="email"
                value={emailDraft}
                onChange={(event) => setEmailDraft(event.target.value)}
                autoComplete="email"
              />
              <p className={hintClass}>
                {t(
                  "settings.profile.email_change_hint",
                  "Mainot e-pastu, nosūtīsim apstiprinājuma saiti uz jauno adresi (Resend).",
                )}
              </p>
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
              <button
                type="button"
                className="btn-line px-3 py-2 text-sm"
                disabled={
                  pendingEmail ||
                  emailDraft.trim().toLowerCase() === account.email.trim().toLowerCase()
                }
                onClick={() => {
                  void (async () => {
                    setPendingEmail(true);
                    const result = await requestEmailChangeAction({
                      newEmail: emailDraft,
                      name: account.name,
                    });
                    setPendingEmail(false);
                    if (!result.ok) {
                      notify(result.message, "error");
                      return;
                    }
                    notify(
                      t(
                        "settings.profile.email_change_sent",
                        "Apstiprinājuma saite nosūtīta uz jauno e-pastu.",
                      ),
                      "ok",
                    );
                  })();
                }}
              >
                {pendingEmail
                  ? t("common.loading", "Ielādē...")
                  : t("settings.profile.email_change", "Mainīt e-pastu")}
              </button>
              <button type="submit" className="btn-ink" disabled={!profileDirty || pendingProfile}>
                {pendingProfile
                  ? t("common.loading", "Ielādē...")
                  : t("actions.save", "Saglabāt")}
              </button>
            </div>
          </form>

          <form onSubmit={(event) => void saveDisplay(event)} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--ink)]">
                  {t("settings.display.title", "Datumi un laiks")}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {t(
                    "settings.display.hint",
                    "Tukšs lauks nozīmē sistēmas noklusējumu no admin uzstādījumiem.",
                  )}
                </p>
              </div>
              <button
                type="button"
                className="btn-line px-3 py-2 text-sm"
                disabled={pendingDisplay}
                onClick={() => setPrefs(EMPTY_USER_DISPLAY_PREFERENCES)}
              >
                {t("settings.display.reset", "Atiestatīt")}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className={labelClass}>
                  {t("settings.display.week_start", "Nedēļas sākuma diena")}
                </span>
                <select
                  className={fieldClass}
                  value={prefs.weekStartDay ?? ""}
                  onChange={(event) =>
                    setPrefs({
                      ...prefs,
                      weekStartDay: (event.target.value || null) as WeekStartDay | null,
                    })
                  }
                >
                  <option value="">
                    {systemDefaultLabel(
                      systemDefaults.weekStartDay === "sunday"
                        ? t("settings.display.sunday", "Svētdiena")
                        : t("settings.display.monday", "Pirmdiena"),
                    )}
                  </option>
                  <option value="monday">{t("settings.display.monday", "Pirmdiena")}</option>
                  <option value="sunday">{t("settings.display.sunday", "Svētdiena")}</option>
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>{t("settings.display.date_format", "Datuma formāts")}</span>
                  <select
                    className={fieldClass}
                    value={prefs.dateFormat ?? ""}
                    onChange={(event) =>
                      setPrefs({
                        ...prefs,
                        dateFormat: (event.target.value || null) as SiteDateFormat | null,
                      })
                    }
                  >
                    <option value="">{systemDefaultLabel(systemDefaults.dateFormat)}</option>
                    {DATE_FORMATS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {t(item.key, item.fallback)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>{t("settings.display.date_separator", "Datuma atdalītājs")}</span>
                  <select
                    className={fieldClass}
                    value={prefs.dateSeparator ?? ""}
                    onChange={(event) =>
                      setPrefs({
                        ...prefs,
                        dateSeparator: (event.target.value || null) as SiteDateSeparator | null,
                      })
                    }
                  >
                    <option value="">{systemDefaultLabel(systemDefaults.dateSeparator)}</option>
                    {DATE_SEPARATORS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {t(item.key, item.fallback)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>{t("settings.display.time_format", "Laika formāts")}</span>
                  <select
                    className={fieldClass}
                    value={prefs.timeFormat ?? ""}
                    onChange={(event) =>
                      setPrefs({
                        ...prefs,
                        timeFormat: (event.target.value || null) as SiteTimeFormat | null,
                      })
                    }
                  >
                    <option value="">
                      {systemDefaultLabel(
                        systemDefaults.timeFormat === "12"
                          ? t("settings.display.hours_12", "12 stundas (AM/PM)")
                          : t("settings.display.hours_24", "24 stundas"),
                      )}
                    </option>
                    <option value="24">{t("settings.display.hours_24", "24 stundas")}</option>
                    <option value="12">{t("settings.display.hours_12", "12 stundas (AM/PM)")}</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>{t("settings.display.timezone", "Laika josla")}</span>
                  <select
                    className={fieldClass}
                    value={prefs.timezone ?? ""}
                    onChange={(event) =>
                      setPrefs({
                        ...prefs,
                        timezone: event.target.value || null,
                      })
                    }
                  >
                    <option value="">{systemDefaultLabel(siteSettings.timezone || "Europe/Riga")}</option>
                    {COMMON_TIMEZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-1 rounded-xl bg-[var(--paper)] p-3 text-xs text-[var(--muted)]">
                <p className="font-medium text-[var(--ink)]">
                  {t("settings.display.preview", "Priekšskatījums")}
                </p>
                <p>{t("settings.display.preview_date", "Datums: {value}", { value: preview.date })}</p>
                <p>{t("settings.display.preview_time", "Laiks: {value}", { value: preview.time })}</p>
                <p>
                  {t("settings.display.preview_datetime", "Datums un laiks: {value}", {
                    value: preview.datetime,
                  })}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-[var(--line)] pt-4">
              <button type="submit" className="btn-ink" disabled={!displayDirty || pendingDisplay}>
                {pendingDisplay
                  ? t("common.loading", "Ielādē...")
                  : t("actions.save", "Saglabāt")}
              </button>
            </div>
          </form>
        </div>
      </main>
    </AppShell>
  );
}
