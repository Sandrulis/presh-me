import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAppEntryPath } from "@/app/lib/onboarding/destination";
import type { Portfolio } from "@/app/lib/types";

type PagePick = { content: unknown };

/** Same page as client store: `users.active_page_id`, else oldest page. */
export async function fetchPrimaryPageForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<PagePick | null> {
  const { data: userRow } = await supabase
    .from("users")
    .select("active_page_id")
    .eq("id", userId)
    .maybeSingle();

  const activeId = userRow?.active_page_id as string | null | undefined;
  if (activeId) {
    const { data: activePage } = await supabase
      .from("pages")
      .select("content")
      .eq("id", activeId)
      .eq("account_id", userId)
      .maybeSingle();
    if (activePage) return activePage as PagePick;
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("content")
    .eq("account_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);
  const page = pages?.[0];
  return page ? (page as PagePick) : null;
}

export function resolveEntryPathFromPage(page: PagePick | null): "/studio" | "/start" {
  return resolveAppEntryPath(page?.content, Boolean(page));
}

export function resolveEntryPathForPortfolio(page: Portfolio | null): "/studio" | "/start" {
  if (!page) return "/start";
  return resolveAppEntryPath({ onboarding: page.onboarding }, true);
}
