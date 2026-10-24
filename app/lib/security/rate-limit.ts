import { createHash } from "node:crypto";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const LOCKOUT_FAILURES = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/** Simple in-memory sliding window (per server instance). */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true };
}

export function clientKeyFromRequest(request: Request, prefix: string): string {
  const headers = request.headers;
  const ip =
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `${prefix}:${ip}`;
}

function emailLockoutKey(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function readAuthLockout(email: string): Promise<RateLimitResult> {
  if (!isSupabaseAdminConfigured()) return { ok: true };
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("auth_lockouts")
      .select("locked_until")
      .eq("email_hash", emailLockoutKey(email))
      .maybeSingle();
    const lockedUntil = (data as { locked_until?: string | null } | null)?.locked_until;
    if (!lockedUntil) return { ok: true };
    const until = new Date(lockedUntil).getTime();
    if (until <= Date.now()) return { ok: true };
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((until - Date.now()) / 1000)),
    };
  } catch {
    return { ok: true };
  }
}

export async function recordAuthFailure(email: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const admin = createAdminClient();
    const key = emailLockoutKey(email);
    const { data } = await admin
      .from("auth_lockouts")
      .select("failure_count, locked_until")
      .eq("email_hash", key)
      .maybeSingle();
    const row = data as { failure_count?: number; locked_until?: string | null } | null;
    const lockedUntil = row?.locked_until ? new Date(row.locked_until).getTime() : 0;
    const lockExpired = lockedUntil > 0 && lockedUntil <= Date.now();
    const previous = lockExpired ? 0 : Number(row?.failure_count) || 0;
    const nextCount = previous + 1;
    const nextLock =
      nextCount >= LOCKOUT_FAILURES ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null;
    await admin.from("auth_lockouts").upsert(
      {
        email_hash: key,
        failure_count: nextCount,
        locked_until: nextLock,
      },
      { onConflict: "email_hash" },
    );
  } catch {
    // Memory rate limit still applies at the route layer.
  }
}

export async function clearAuthFailures(email: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const admin = createAdminClient();
    await admin.from("auth_lockouts").delete().eq("email_hash", emailLockoutKey(email));
  } catch {
    // ignore
  }
}
