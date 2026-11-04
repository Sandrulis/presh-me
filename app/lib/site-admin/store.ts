"use client";

import { createClient } from "@/app/lib/supabase/client";
import {
  bundledTranslationKeys,
  bundledValuesForKey,
  isBundledTranslationKey,
  preloadBundledCatalogs,
} from "@/app/lib/i18n/bundled-catalog";
import { normalizeBrandImageUrl } from "@/app/lib/site-admin/branding";
import { saveSiteSettingsServer } from "@/app/lib/site-admin/site-settings-server";
import type {
  SiteAdminStore,
  SiteLanguage,
  SiteSettings,
  SiteTranslation,
} from "@/app/lib/site-admin/types";

const listeners = new Set<() => void>();

let cache: SiteAdminStore = {
  languages: [],
  translations: [],
  settings: {
    systemName: "Presh",
    legalEmail: "hello@presh.me",
    legalEntityName: "",
    legalEntityRegNo: "",
    legalEntityAddress: "",
    timezone: "Europe/Riga",
    dateFormat: "d.m.Y",
    dateSeparator: ".",
    timeFormat: "24",
    weekStartDay: "monday",
    logoUrl: null,
    faviconUrl: null,
    notificationFaviconUrl: null,
    maintenanceMode: false,
    trialPeriodDays: 14,
    updatedAt: "",
  },
};

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeSiteAdmin(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function defaultSettings(): SiteSettings {
  return {
    systemName: "Presh",
    legalEmail: "hello@presh.me",
    legalEntityName: "",
    legalEntityRegNo: "",
    legalEntityAddress: "",
    timezone: "Europe/Riga",
    dateFormat: "d.m.Y",
    dateSeparator: ".",
    timeFormat: "24",
    weekStartDay: "monday",
    logoUrl: null,
    faviconUrl: null,
    notificationFaviconUrl: null,
    maintenanceMode: false,
    trialPeriodDays: 14,
    updatedAt: new Date().toISOString(),
  };
}

export function getSiteAdminStore(): SiteAdminStore {
  return cache;
}

let languagesSnap: SiteLanguage[] = [];
let languagesKey = "";

export function listSiteLanguages(): SiteLanguage[] {
  const key = cache.languages
    .map((item) => `${item.code}:${item.name}:${item.isActive}:${item.isDefault}:${item.sortOrder}`)
    .join("|");
  if (key === languagesKey) return languagesSnap;
  languagesSnap = [...cache.languages].sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
  languagesKey = key;
  return languagesSnap;
}

let translationsSnap: SiteTranslation[] = [];
let translationsKey = "";

export function listSiteTranslations(): SiteTranslation[] {
  const key = cache.translations
    .map(
      (item) =>
        `${item.key}:${item.bundled ? "1" : "0"}:${item.hasOverlay ? "1" : "0"}:${JSON.stringify(item.values)}`,
    )
    .join("|");
  if (key === translationsKey) return translationsSnap;
  translationsSnap = [...cache.translations].sort((a, b) => a.key.localeCompare(b.key));
  translationsKey = key;
  return translationsSnap;
}

function mergeTranslations(
  languages: SiteLanguage[],
  dbRows: { key: string; values: Record<string, string> }[],
): SiteTranslation[] {
  const languageCodes = languages.map((language) => language.code);
  const overlays = new Map(dbRows.map((row) => [row.key, row.values]));
  const keys = new Set([...bundledTranslationKeys(), ...overlays.keys()]);

  return [...keys]
    .sort((left, right) => left.localeCompare(right))
    .map((key) => {
      const stored = overlays.get(key) ?? {};
      const bundled = bundledValuesForKey(key);
      // Non-empty DB overlay wins; otherwise use the code catalog.
      const values = Object.fromEntries(
        languageCodes.map((code) => {
          const overlay = stored[code];
          if (typeof overlay === "string" && overlay.trim()) return [code, overlay];
          return [code, bundled[code] ?? ""];
        }),
      );
      return {
        key,
        values,
        bundled: isBundledTranslationKey(key),
        hasOverlay: overlays.has(key),
      };
    });
}

export function getSiteSettings(): SiteSettings {
  return cache.settings;
}

export async function refreshSiteAdmin() {
  await preloadBundledCatalogs();
  const supabase = createClient();
  const [langRes, trRes, settingsRes] = await Promise.all([
    supabase.from("site_languages").select("*").order("sort_order", { ascending: true }),
    supabase.from("site_translations").select("*").order("translation_key", { ascending: true }),
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const languages: SiteLanguage[] = (langRes.data ?? []).map((row) => ({
    code: row.code as string,
    name: row.name as string,
    isActive: Boolean(row.is_active),
    isDefault: Boolean(row.is_default),
    sortOrder: Number(row.sort_order ?? 0),
  }));

  const dbTranslations = (trRes.data ?? []).map((row) => ({
    key: row.translation_key as string,
    values: (row.values as Record<string, string>) ?? {},
  }));

  const settingsRow = settingsRes.data;
  const settings: SiteSettings = settingsRow
    ? {
        systemName: settingsRow.system_name as string,
        legalEmail: settingsRow.legal_email as string,
        legalEntityName: settingsRow.legal_entity_name as string,
        legalEntityRegNo: settingsRow.legal_entity_reg_no as string,
        legalEntityAddress: settingsRow.legal_entity_address as string,
        timezone: settingsRow.timezone as string,
        dateFormat: settingsRow.date_format as SiteSettings["dateFormat"],
        dateSeparator: settingsRow.date_separator as SiteSettings["dateSeparator"],
        timeFormat: settingsRow.time_format as SiteSettings["timeFormat"],
        weekStartDay: settingsRow.week_start_day as SiteSettings["weekStartDay"],
        logoUrl: normalizeBrandImageUrl(settingsRow.logo_url),
        faviconUrl: normalizeBrandImageUrl(settingsRow.favicon_url),
        notificationFaviconUrl: normalizeBrandImageUrl(settingsRow.notification_favicon_url),
        maintenanceMode: settingsRow.maintenance_mode === true,
        trialPeriodDays: Number(settingsRow.trial_period_days ?? 14),
        updatedAt: settingsRow.updated_at as string,
      }
    : defaultSettings();

  const nextLanguages = languages.length ? languages : defaultLanguages();
  cache = {
    languages: nextLanguages,
    translations: mergeTranslations(nextLanguages, dbTranslations),
    settings,
  };
  languagesKey = "";
  translationsKey = "";
  emit();
}

function defaultLanguages(): SiteLanguage[] {
  return [
    { code: "lv", name: "Latviešu", isActive: true, isDefault: true, sortOrder: 0 },
    { code: "en", name: "English", isActive: true, isDefault: false, sortOrder: 1 },
  ];
}

export async function createSiteLanguage(input: {
  code: string;
  name: string;
  isDefault?: boolean;
}): Promise<SiteLanguage[]> {
  const supabase = createClient();
  const sortOrder = cache.languages.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
  if (input.isDefault) {
    await supabase.from("site_languages").update({ is_default: false }).neq("code", input.code);
  }
  await supabase.from("site_languages").insert({
    code: input.code,
    name: input.name,
    is_active: true,
    is_default: Boolean(input.isDefault),
    sort_order: sortOrder,
  });
  await refreshSiteAdmin();
  return listSiteLanguages();
}

export async function updateSiteLanguageName(code: string, name: string): Promise<SiteLanguage[]> {
  const supabase = createClient();
  await supabase.from("site_languages").update({ name: name.trim() || code }).eq("code", code);
  await refreshSiteAdmin();
  return listSiteLanguages();
}

export async function setSiteLanguageActive(code: string, isActive: boolean): Promise<SiteLanguage[]> {
  const target = cache.languages.find((item) => item.code === code);
  if (!target || (!isActive && target.isDefault)) return listSiteLanguages();
  const supabase = createClient();
  await supabase.from("site_languages").update({ is_active: isActive }).eq("code", code);
  await refreshSiteAdmin();
  return listSiteLanguages();
}

export async function setDefaultSiteLanguage(code: string): Promise<SiteLanguage[]> {
  const supabase = createClient();
  await supabase.from("site_languages").update({ is_default: false }).neq("code", code);
  await supabase.from("site_languages").update({ is_default: true, is_active: true }).eq("code", code);
  await refreshSiteAdmin();
  return listSiteLanguages();
}

export async function deleteSiteLanguage(code: string): Promise<SiteLanguage[]> {
  const target = cache.languages.find((item) => item.code === code);
  if (!target || target.isDefault) return listSiteLanguages();
  const supabase = createClient();
  await supabase.from("site_languages").delete().eq("code", code);
  // Only rewrite DB overlay rows (bundled catalog keys without overlay stay in code).
  const overlays = cache.translations.filter((item) => item.hasOverlay);
  for (const item of overlays) {
    const values = { ...item.values };
    delete values[code];
    await supabase.from("site_translations").upsert({ translation_key: item.key, values });
  }
  await refreshSiteAdmin();
  return listSiteLanguages();
}

export async function upsertSiteTranslation(input: {
  key: string;
  values: Record<string, string>;
}): Promise<SiteTranslation[]> {
  const key = input.key.trim();
  if (!key) return listSiteTranslations();
  const supabase = createClient();
  await supabase.from("site_translations").upsert({ translation_key: key, values: input.values });
  await refreshSiteAdmin();
  return listSiteTranslations();
}

export async function deleteSiteTranslation(key: string): Promise<SiteTranslation[]> {
  const supabase = createClient();
  await supabase.from("site_translations").delete().eq("translation_key", key);
  await refreshSiteAdmin();
  return listSiteTranslations();
}

/** Remove DB overlays for landing / brand / SEO so code catalog is the source of truth. */
export async function resetLandingOverlaysToCatalog(): Promise<{ removed: number }> {
  const prefixes = ["landing.", "site.meta.", "seo."];
  const keys = cache.translations
    .filter(
      (item) =>
        item.hasOverlay &&
        (item.key === "app.name" || prefixes.some((prefix) => item.key.startsWith(prefix))),
    )
    .map((item) => item.key);
  if (!keys.length) return { removed: 0 };
  const supabase = createClient();
  const { error } = await supabase.from("site_translations").delete().in("translation_key", keys);
  if (error) throw error;
  await refreshSiteAdmin();
  return { removed: keys.length };
}

export async function saveSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const next = { ...cache.settings, ...patch, updatedAt: new Date().toISOString() };
  await saveSiteSettingsServer(next);
  await refreshSiteAdmin();
  return getSiteSettings();
}
