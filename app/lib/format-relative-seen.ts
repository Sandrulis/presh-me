import {
  mergeDisplayPreferences,
  previewDisplayDate,
  type SiteDisplayPreferences,
  type UserDisplayPreferences,
} from "@/app/lib/display-preferences";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;

type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

export function formatRelativeSeen(
  iso: string | null | undefined,
  options: {
    now?: Date;
    t: TranslateFn;
    systemPrefs: SiteDisplayPreferences;
    viewerPrefs?: UserDisplayPreferences | null;
    timeZone?: string;
  },
): string {
  if (!iso) return options.t("admin.users.seen.never", "Nav datu");
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return options.t("admin.users.seen.never", "Nav datu");

  const now = options.now ?? new Date();
  const diff = Math.max(0, now.getTime() - at.getTime());

  if (diff < MINUTE_MS) {
    return options.t("admin.users.seen.just_now", "Tikko");
  }
  if (diff < HOUR_MS) {
    const minutes = Math.max(1, Math.floor(diff / MINUTE_MS));
    return options.t("admin.users.seen.minutes", "{count} min", { count: minutes });
  }
  if (diff < DAY_MS) {
    const hours = Math.max(1, Math.floor(diff / HOUR_MS));
    return options.t("admin.users.seen.hours", "{count} h", { count: hours });
  }
  if (diff < MONTH_MS) {
    const days = Math.max(1, Math.floor(diff / DAY_MS));
    return options.t("admin.users.seen.days", "{count} d", { count: days });
  }

  const merged = mergeDisplayPreferences(options.systemPrefs, options.viewerPrefs);
  const { datetime } = previewDisplayDate({
    ...merged,
    timeZone: options.timeZone || "Europe/Riga",
  }, at);
  return datetime;
}
