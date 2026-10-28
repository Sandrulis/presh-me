import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_HINT_COOKIE } from "@/app/lib/auth/session-hint";
import { createClient } from "@/app/lib/supabase/server";

export type ResolvedSessionHint = {
  /** True only when hint cookie was present and Supabase returned a user. */
  sessionHint: boolean;
  /** Hide marketing top nav when SSR confirmed an authenticated user. */
  hideMarketingHeader: boolean;
  userId: string | null;
};

/**
 * When `presh_session=1`, verify auth once. Stale hints are cleared so marketing header stays visible.
 */
export const resolveSessionHintForRequest = cache(async function resolveSessionHintForRequest(): Promise<ResolvedSessionHint> {
  const empty: ResolvedSessionHint = {
    sessionHint: false,
    hideMarketingHeader: false,
    userId: null,
  };

  const cookieStore = await cookies();
  const hintCookie = cookieStore.get(SESSION_HINT_COOKIE)?.value === "1";
  if (!hintCookie) return empty;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      cookieStore.delete(SESSION_HINT_COOKIE);
      return empty;
    }

    return {
      sessionHint: true,
      hideMarketingHeader: true,
      userId: user.id,
    };
  } catch {
    cookieStore.delete(SESSION_HINT_COOKIE);
    return empty;
  }
});
