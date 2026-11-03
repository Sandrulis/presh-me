"use server";

import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { getUmamiShareUrl } from "@/app/lib/integrations/umami/config";
import {
  parseUmamiShareUrl,
  type UmamiMetric,
  type UmamiPoint,
  type UmamiRange,
  type UmamiReportResult,
} from "@/app/lib/integrations/umami/share";

const RANGES: Record<UmamiRange, { ms: number; unit: "hour" | "day" }> = {
  "24h": { ms: 24 * 60 * 60 * 1000, unit: "hour" },
  "7d": { ms: 7 * 24 * 60 * 60 * 1000, unit: "day" },
  "30d": { ms: 30 * 24 * 60 * 60 * 1000, unit: "day" },
  "90d": { ms: 90 * 24 * 60 * 60 * 1000, unit: "day" },
};

function isRange(value: string): value is UmamiRange {
  return value === "24h" || value === "7d" || value === "30d" || value === "90d";
}

function timezoneOrDefault(value: string): string {
  if (value.length > 80) return "Europe/Riga";
  try {
    Intl.DateTimeFormat("en", { timeZone: value });
    return value;
  } catch {
    return "Europe/Riga";
  }
}

function numberField(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function metrics(value: unknown, limit: number): UmamiMetric[] {
  if (!Array.isArray(value)) return [];
  const rows: UmamiMetric[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as { x?: unknown; y?: unknown };
    if (typeof row.x !== "string" || typeof row.y !== "number") continue;
    rows.push({ label: row.x, value: row.y });
    if (rows.length >= limit) break;
  }
  return rows;
}

function series(value: unknown): UmamiPoint[] {
  if (!value || typeof value !== "object") return [];
  const body = value as { pageviews?: unknown; sessions?: unknown };
  const views = new Map<string, number>();
  const sessions = new Map<string, number>();
  if (Array.isArray(body.pageviews)) {
    for (const item of body.pageviews) {
      if (!item || typeof item !== "object") continue;
      const row = item as { x?: unknown; y?: unknown };
      if (typeof row.x === "string" && typeof row.y === "number") views.set(row.x, row.y);
    }
  }
  if (Array.isArray(body.sessions)) {
    for (const item of body.sessions) {
      if (!item || typeof item !== "object") continue;
      const row = item as { x?: unknown; y?: unknown };
      if (typeof row.x === "string" && typeof row.y === "number") sessions.set(row.x, row.y);
    }
  }
  const keys = [...new Set([...views.keys(), ...sessions.keys()])].sort();
  return keys.map((at) => ({
    at,
    pageviews: views.get(at) ?? 0,
    sessions: sessions.get(at) ?? 0,
  }));
}

async function umamiGet(gateway: string, path: string, token: string): Promise<unknown> {
  const response = await fetch(`${gateway}${path}`, {
    headers: {
      accept: "application/json",
      "x-umami-share-token": token,
      "x-umami-share-context": "1",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error("umami");
  return response.json();
}

async function currentUserIsAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.is_admin === true;
}

async function fetchUmamiReportFromShare(
  share: NonNullable<ReturnType<typeof parseUmamiShareUrl>>,
  range: UmamiRange,
  timezone: string,
): Promise<UmamiReportResult> {
  const window = RANGES[range];
  const endAt = Date.now();
  const startAt = endAt - window.ms;
  const zone = timezoneOrDefault(timezone);
  const query = `startAt=${startAt}&endAt=${endAt}&timezone=${encodeURIComponent(zone)}`;

  try {
    const opened = await fetch(`${share.gateway}/share/${share.slug}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!opened.ok) return { ok: false, error: "umami.error.load" };
    const shareBody = (await opened.json()) as { token?: unknown; websiteId?: unknown };
    if (typeof shareBody.token !== "string" || typeof shareBody.websiteId !== "string") {
      return { ok: false, error: "umami.error.load" };
    }
    const token = shareBody.token;
    const websiteId = shareBody.websiteId;
    const [website, statsBody, viewsBody, activeBody, pages, referrers, browsers, systems, devices, countries] =
      await Promise.all([
        umamiGet(share.gateway, `/websites/${websiteId}`, token),
        umamiGet(share.gateway, `/websites/${websiteId}/stats?${query}`, token),
        umamiGet(share.gateway, `/websites/${websiteId}/pageviews?${query}&unit=${window.unit}`, token),
        umamiGet(share.gateway, `/websites/${websiteId}/active`, token),
        umamiGet(share.gateway, `/websites/${websiteId}/metrics?${query}&type=path&limit=12`, token),
        umamiGet(share.gateway, `/websites/${websiteId}/metrics?${query}&type=referrer&limit=8`, token),
        umamiGet(share.gateway, `/websites/${websiteId}/metrics?${query}&type=browser&limit=8`, token),
        umamiGet(share.gateway, `/websites/${websiteId}/metrics?${query}&type=os&limit=8`, token),
        umamiGet(share.gateway, `/websites/${websiteId}/metrics?${query}&type=device&limit=8`, token),
        umamiGet(share.gateway, `/websites/${websiteId}/metrics?${query}&type=country&limit=8`, token),
      ]);
    const site = website && typeof website === "object" ? (website as { name?: unknown; domain?: unknown }) : {};
    const stats = statsBody && typeof statsBody === "object" ? (statsBody as Record<string, unknown>) : {};
    const previous =
      stats.comparison && typeof stats.comparison === "object"
        ? (stats.comparison as Record<string, unknown>)
        : {};
    const active = activeBody && typeof activeBody === "object" ? (activeBody as { visitors?: unknown }) : {};
    return {
      ok: true,
      report: {
        name: typeof site.name === "string" ? site.name : "",
        domain: typeof site.domain === "string" ? site.domain : "",
        shareUrl: share.url,
        active: typeof active.visitors === "number" ? active.visitors : 0,
        pageviews: numberField(stats, "pageviews"),
        visitors: numberField(stats, "visitors"),
        visits: numberField(stats, "visits"),
        bounces: numberField(stats, "bounces"),
        totalTime: numberField(stats, "totaltime"),
        previous: {
          pageviews: numberField(previous, "pageviews"),
          visitors: numberField(previous, "visitors"),
          visits: numberField(previous, "visits"),
          bounces: numberField(previous, "bounces"),
          totalTime: numberField(previous, "totaltime"),
        },
        series: series(viewsBody),
        pages: metrics(pages, 12),
        referrers: metrics(referrers, 8),
        browsers: metrics(browsers, 8),
        systems: metrics(systems, 8),
        devices: metrics(devices, 8),
        countries: metrics(countries, 8),
      },
    };
  } catch {
    return { ok: false, error: "umami.error.load" };
  }
}

export async function loadUmamiReport(
  range: string,
  timezone: string,
): Promise<UmamiReportResult> {
  if (!(await currentUserIsAdmin())) return { ok: false, error: "umami.error.load" };
  if (!isRange(range)) return { ok: false, error: "umami.error.load" };
  const shareUrl = await getUmamiShareUrl();
  const share = shareUrl ? parseUmamiShareUrl(shareUrl) : null;
  if (!share) return { ok: false, error: "umami.unavailable" };
  return fetchUmamiReportFromShare(share, range, timezone);
}

export async function loadPageOwnerUmamiReport(
  pageId: string,
  range: string,
  timezone: string,
): Promise<UmamiReportResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "umami.error.load" };
  if (!isRange(range)) return { ok: false, error: "umami.error.load" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "umami.error.load" };

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).maybeSingle();
  const isAdmin = profile?.is_admin === true;

  const { userCanUseFrontendModuleOrAdmin } = await import("@/app/lib/modules/user-module-access");
  if (!(await userCanUseFrontendModuleOrAdmin(user.id, "module_umami", isAdmin))) {
    return { ok: false, error: "umami.error.load" };
  }

  const { data: row } = await supabase
    .from("pages")
    .select("account_id, content")
    .eq("id", pageId)
    .maybeSingle();
  if (!row || row.account_id !== user.id) return { ok: false, error: "umami.error.load" };

  const content = (row.content ?? {}) as { umamiShareUrl?: string };
  const shareRaw = (content.umamiShareUrl ?? "").trim();
  const share = shareRaw ? parseUmamiShareUrl(shareRaw) : null;
  if (!share) return { ok: false, error: "umami.unavailable" };

  return fetchUmamiReportFromShare(share, range, timezone);
}
