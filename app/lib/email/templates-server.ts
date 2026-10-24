"use server";

import {
  EMAIL_TEMPLATE_KINDS,
  FOOTER_FALLBACK,
  TEMPLATE_KEYS,
  emptyDraft,
  fallbackButton,
  fallbackFor,
  type EmailTemplateDraft,
  type EmailTemplateKind,
} from "@/app/lib/email/templates";
import { LANGUAGE_CODES } from "@/app/lib/i18n/language";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/app/lib/supabase/env";
import { isResendEnabled } from "@/app/lib/integrations/resend/client";

async function assertAdmin() {
  if (!isSupabaseConfigured()) throw new Error("Nav sesijas.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nav sesijas.");
  const { data } = await supabase.from("users").select("is_admin").eq("id", user.id).maybeSingle();
  if (!data?.is_admin) throw new Error("Nav pieejas.");
}

export async function listEmailTemplateDrafts(): Promise<{
  resendEnabled: boolean;
  languages: { code: string; name: string; isDefault: boolean }[];
  templates: EmailTemplateDraft[];
}> {
  await assertAdmin();
  const resendEnabled = await isResendEnabled();
  if (!isSupabaseAdminConfigured()) {
    return {
      resendEnabled,
      languages: [
        { code: "lv", name: "Latviešu", isDefault: true },
        { code: "en", name: "English", isDefault: false },
      ],
      templates: EMAIL_TEMPLATE_KINDS.map((kind) => seedDraft(kind, ["lv", "en"])),
    };
  }

  const admin = createAdminClient();
  const [{ data: languages }, { data: translations }] = await Promise.all([
    admin
      .from("site_languages")
      .select("code, name, is_active, is_default")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    admin.from("site_translations").select("translation_key, values"),
  ]);

  const langRows = (languages ?? [])
    .map((row) => ({
      code: row.code as string,
      name: row.name as string,
      isDefault: Boolean(row.is_default),
    }))
    .filter((row) => LANGUAGE_CODES.includes(row.code as (typeof LANGUAGE_CODES)[number]));
  const sortedLanguages = sortEmailLanguages(langRows);
  const codes = sortedLanguages.length
    ? sortedLanguages.map((row) => row.code)
    : ["lv", "en"];
  const byKey = new Map(
    ((translations ?? []) as { translation_key: string; values: Record<string, string> | null }[]).map(
      (row) => [row.translation_key, row.values ?? {}],
    ),
  );

  const templates = EMAIL_TEMPLATE_KINDS.map((kind) => {
    const keys = TEMPLATE_KEYS[kind];
    const subjects = { ...(byKey.get(keys.subjectKey) ?? {}) };
    const bodies = { ...(byKey.get(keys.bodyKey) ?? {}) };
    const buttons = { ...(byKey.get(keys.buttonKey) ?? {}) };
    for (const code of codes) {
      if (!subjects[code]?.trim()) subjects[code] = fallbackFor(kind, "subject", code);
      if (!bodies[code]?.trim()) bodies[code] = fallbackFor(kind, "body", code);
      if (!buttons[code]?.trim()) buttons[code] = fallbackButton(kind, code);
    }
    return {
      kind,
      subjectKey: keys.subjectKey,
      bodyKey: keys.bodyKey,
      buttonKey: keys.buttonKey,
      subjects,
      bodies,
      buttons,
    };
  });

  return {
    resendEnabled,
    languages: sortedLanguages.length
      ? sortedLanguages
      : [
          { code: "lv", name: "Latviešu", isDefault: true },
          { code: "en", name: "English", isDefault: false },
        ],
    templates,
  };
}

function sortEmailLanguages(
  languages: { code: string; name: string; isDefault: boolean }[],
): { code: string; name: string; isDefault: boolean }[] {
  const defaultLanguage =
    languages.find((language) => language.isDefault) ??
    languages.find((language) => language.code === "lv") ??
    languages[0];
  const rest = languages
    .filter((language) => language.code !== defaultLanguage?.code)
    .slice()
    .sort((left, right) =>
      left.name.localeCompare(right.name, defaultLanguage?.code ?? "lv", { sensitivity: "base" }),
    );
  return defaultLanguage ? [defaultLanguage, ...rest] : rest;
}

function seedDraft(kind: EmailTemplateKind, codes: string[]): EmailTemplateDraft {
  const draft = emptyDraft(kind);
  for (const code of codes) {
    draft.subjects[code] = fallbackFor(kind, "subject", code);
    draft.bodies[code] = fallbackFor(kind, "body", code);
    draft.buttons[code] = fallbackButton(kind, code);
  }
  return draft;
}

export async function saveEmailTemplateDrafts(
  templates: EmailTemplateDraft[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await assertAdmin();
    if (!isSupabaseAdminConfigured()) {
      return { ok: false, message: "Admin DB nav konfigurēta." };
    }
    const admin = createAdminClient();
    for (const template of templates) {
      const rows = [
        { translation_key: template.subjectKey, values: template.subjects },
        { translation_key: template.bodyKey, values: template.bodies },
        { translation_key: template.buttonKey, values: template.buttons },
      ];
      for (const row of rows) {
        const { error } = await admin.from("site_translations").upsert(
          {
            translation_key: row.translation_key,
            values: row.values,
          },
          { onConflict: "translation_key" },
        );
        if (error) return { ok: false, message: error.message };
      }
    }
    const footer: Record<string, string> = {};
    for (const code of LANGUAGE_CODES) {
      footer[code] = FOOTER_FALLBACK[code] || FOOTER_FALLBACK.en;
    }
    await admin.from("site_translations").upsert(
      { translation_key: "email.footer_hint", values: footer },
      { onConflict: "translation_key" },
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Neizdevās saglabāt." };
  }
}
