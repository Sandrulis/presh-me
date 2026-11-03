"use client";

import { listAdminTodos } from "@/app/lib/admin-todos";
import { EMAIL_TEMPLATE_KINDS } from "@/app/lib/email/templates";
import { parseUmamiShareUrl } from "@/app/lib/integrations/umami/share";
import { isAdminListedLink } from "@/app/lib/onboarding/admin-listed-link";
import { createClient } from "@/app/lib/supabase/client";
import { rowToPortfolio, type PageRow } from "@/app/lib/supabase/map-page";
import type { Onboarding } from "@/app/lib/types";

export type AdminNavCounts = {
  todo: number;
  users: number;
  links: number;
  feedback: number;
  integrations: number;
  modules: number;
  subscriptionPlans: number;
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

const ADMIN_LIST_PAGE_SIZE = 200;

/** Same filter as admin „Linki” list (`listAdminListedPages`). */
async function countAdminListedPages() {
  const supabase = createClient();
  let offset = 0;
  let total = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("pages")
      .select(
        "id, account_id, handle, display_name, published, created_at, updated_at, onboarding:content->onboarding",
      )
      .order("updated_at", { ascending: false })
      .range(offset, offset + ADMIN_LIST_PAGE_SIZE - 1);
    if (error) return total;

    type AdminPageListRow = Omit<PageRow, "content"> & {
      onboarding?: Onboarding | null;
    };

    for (const row of (data ?? []) as AdminPageListRow[]) {
      const content: Record<string, unknown> = {};
      if (row.onboarding != null) content.onboarding = row.onboarding;
      const page = rowToPortfolio({
        id: row.id,
        account_id: row.account_id,
        handle: row.handle,
        display_name: row.display_name,
        published: row.published,
        created_at: row.created_at,
        updated_at: row.updated_at,
        content: Object.keys(content).length ? content : null,
      });
      if (isAdminListedLink(page)) total += 1;
    }

    if ((data ?? []).length < ADMIN_LIST_PAGE_SIZE) break;
    offset += ADMIN_LIST_PAGE_SIZE;
  }

  return total;
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
    subscriptionPlans,
    languages,
    translations,
    umamiRes,
  ] = await Promise.all([
    listAdminTodos(accountId).then((items) => items.filter((item) => !item.isDone).length),
    exactCount("users"),
    countAdminListedPages(),
    exactCount("user_feedback"),
    exactCount("contact_messages"),
    exactCount("site_integrations"),
    exactCount("site_frontend_modules"),
    exactCount("subscription_plans"),
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
    subscriptionPlans,
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
  if (href === "/admin/subscription-plans") return counts.subscriptionPlans;
  if (href === "/admin/languages") return counts.languages;
  if (href === "/admin/translations") return counts.translations;
  if (href === "/admin/email-templates") return counts.emailTemplates;
  if (href === "/admin/umami") return counts.umami;
  return null;
}
