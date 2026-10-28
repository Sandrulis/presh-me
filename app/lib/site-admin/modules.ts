"use client";

import { createClient } from "@/app/lib/supabase/client";

export type SiteFrontendModule = {
  id: string;
  moduleKey: string;
  isEnabled: boolean;
  sortOrder: number;
};

/** i18n keys for known modules — resolve with `t()` in UI. */
export const KNOWN_MODULE_LABEL_KEYS: Record<string, string> = {
  google_sign_in: "admin.modules.known.google_sign_in",
  public_claim: "admin.modules.known.public_claim",
  support_forms: "admin.modules.known.support_forms",
  module_multisites: "admin.modules.known.module_multisites",
  module_trail: "admin.modules.known.module_trail",
};

/** @deprecated Use KNOWN_MODULE_LABEL_KEYS + `t()` in components. */
export const KNOWN_MODULE_LABELS = KNOWN_MODULE_LABEL_KEYS;

/** true only when a row exists and is_enabled. Missing key = off. */
export async function isFrontendModuleEnabled(moduleKey: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("site_frontend_modules")
    .select("is_enabled")
    .eq("module_key", moduleKey)
    .maybeSingle();
  return data?.is_enabled === true;
}

type ModuleRow = {
  id: string;
  module_key: string;
  is_enabled: boolean;
  sort_order: number;
};

function mapRow(row: ModuleRow): SiteFrontendModule {
  return {
    id: row.id,
    moduleKey: row.module_key,
    isEnabled: row.is_enabled,
    sortOrder: row.sort_order,
  };
}

export function moduleLabelKey(key: string) {
  return KNOWN_MODULE_LABEL_KEYS[key] ?? null;
}

/** @deprecated Use `moduleLabelKey` + `t()` in components. */
export function moduleLabel(key: string) {
  return KNOWN_MODULE_LABEL_KEYS[key] ?? key;
}

export async function listFrontendModules(): Promise<SiteFrontendModule[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .select("id, module_key, is_enabled, sort_order")
    .order("sort_order", { ascending: true })
    .order("module_key", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as ModuleRow[]).map(mapRow);
}

export async function setFrontendModuleEnabled(id: string, enabled: boolean) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .update({ is_enabled: enabled })
    .eq("id", id)
    .select("id, module_key, is_enabled, sort_order")
    .single();
  if (error) throw error;
  return mapRow(data as ModuleRow);
}

export async function createFrontendModule(moduleKey: string) {
  const key = moduleKey.trim().toLowerCase();
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("site_frontend_modules")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = ((existing?.sort_order as number | undefined) ?? 0) + 10;
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .insert({ module_key: key, is_enabled: false, sort_order: sortOrder })
    .select("id, module_key, is_enabled, sort_order")
    .single();
  if (error) throw error;
  return mapRow(data as ModuleRow);
}

export async function deleteFrontendModule(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("site_frontend_modules").delete().eq("id", id);
  if (error) throw error;
}
