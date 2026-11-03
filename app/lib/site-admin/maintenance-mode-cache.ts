/** Matches `getCachedMaintenanceMode` revalidate (seconds). */
const MAINTENANCE_CACHE_TTL_MS = 15_000;

let cached: { value: boolean; expiresAt: number } | null = null;

export function invalidateMaintenanceModeEdgeCache() {
  cached = null;
}

async function fetchMaintenanceEnabledFromNetwork(): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return false;
  try {
    const res = await fetch(`${base}/rest/v1/site_settings?id=eq.1&select=maintenance_mode`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      next: { revalidate: 15, tags: ["maintenance-mode"] },
    });
    if (!res.ok) return false;
    const rows = (await res.json()) as { maintenance_mode?: boolean }[];
    return rows[0]?.maintenance_mode === true;
  } catch {
    return false;
  }
}

/** Short-lived cache for middleware — avoids Supabase REST on every request. */
export async function fetchMaintenanceEnabledCached(): Promise<boolean> {
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return cached.value;
  }
  const value = await fetchMaintenanceEnabledFromNetwork();
  cached = { value, expiresAt: now + MAINTENANCE_CACHE_TTL_MS };
  return value;
}
