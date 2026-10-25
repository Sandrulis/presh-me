"use client";

import { listAdminTodos } from "@/app/lib/admin-todos";
import { EMAIL_TEMPLATE_KINDS } from "@/app/lib/email/templates";
import { parseUmamiShareUrl } from "@/app/lib/integrations/umami/share";
import { createClient } from "@/app/lib/supabase/client";

export type AdminNavCounts = {
  todo: number;
  users: number;
  links: number;
  feedback: number;
  integrations: number;
  modules: number;
  languages: number;
  translations: number;
  emailTemplates: number;
  umami: number;
};

async function exactCount(table: string) {
  const supabase = createClient();
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function fetchAdminNavCounts(accountId: string): Promise<AdminNavCounts> {
  const supabase = createClient();

  const umamiRow = supabase
    .from("site_integrations")
    .select("is_enabled, configured_account_email")
    .eq("integration_key", "umami")
    .maybeSingle();

  const [
    todos,
    users,
    links,
    feedback,
    contacts,
    integrations,
    modules,
    languages,
    translations,
    umamiRes,
  ] = await Promise.all([
    listAdminTodos(accountId).then((items) => items.filter((item) => !item.isDone).length),
    exactCount("users"),
    exactCount("pages"),
    exactCount("user_feedback"),
    exactCount("contact_messages"),
    exactCount("site_integrations"),
    exactCount("site_frontend_modules"),
    exactCount("site_languages"),
    exactCount("site_translations"),
    umamiRow,
  ]);

  const umamiReady = Boolean(
    umamiRes.data?.is_enabled && parseUmamiShareUrl(umamiRes.data.configured_account_email ?? ""),
  );

  return {
    todo: todos,
    users,
    links,
    feedback: feedback + contacts,
    integrations,
    modules,
    languages,
    translations,
    emailTemplates: EMAIL_TEMPLATE_KINDS.length,
    umami: umamiReady ? 1 : 0,
  };
}

/** Refetch after admin mutations (optional). */
export function countForAdminHref(
  href: string,
  counts: AdminNavCounts,
): number | null {
  if (href === "/admin/settings") return null;
  if (href === "/admin/users") return counts.users;
  if (href === "/admin/links") return counts.links;
  if (href === "/admin/feedback") return counts.feedback;
  if (href === "/admin/integrations") return counts.integrations;
  if (href === "/admin/modules") return counts.modules;
  if (href === "/admin/languages") return counts.languages;
  if (href === "/admin/translations") return counts.translations;
  if (href === "/admin/email-templates") return counts.emailTemplates;
  if (href === "/admin/umami") return counts.umami;
  return null;
}
