import "server-only";

import { createClient } from "@/app/lib/supabase/server";
import {
  fetchPrimaryPageForUser,
  resolveEntryPathFromPage,
} from "@/app/lib/onboarding/primary-page";

/** Where a signed-in user should land instead of marketing home. */
export async function resolveAuthedHomeRedirect(userId: string): Promise<"/studio" | "/start"> {
  const supabase = await createClient();
  const page = await fetchPrimaryPageForUser(supabase, userId);
  return resolveEntryPathFromPage(page);
}
