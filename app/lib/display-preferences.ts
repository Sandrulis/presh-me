import type {
  SiteDateFormat,
  SiteDateSeparator,
  SiteSettings,
  SiteTimeFormat,
  WeekStartDay,
} from "@/app/lib/site-admin/types";

export type SiteDisplayPreferences = {
  weekStartDay: WeekStartDay;
  dateFormat: SiteDateFormat;
  dateSeparator: SiteDateSeparator;
  timeFormat: SiteTimeFormat;
};

/** null = sistēmas noklusējums no site_settings. */
export type UserDisplayPreferences = {
  weekStartDay: WeekStartDay | null;
  dateFormat: SiteDateFormat | null;
  dateSeparator: SiteDateSeparator | null;
  timeFormat: SiteTimeFormat | null;
  timezone: string | null;
};

export const EMPTY_USER_DISPLAY_PREFERENCES: UserDisplayPreferences = {
  weekStartDay: null,
  dateFormat: null,
  dateSeparator: null,
  timeFormat: null,
  timezone: null,
};

export function siteDisplayFromSettings(settings: SiteSettings): SiteDisplayPreferences {
  return {
    weekStartDay: settings.weekStartDay,
    dateFormat: settings.dateFormat,
    dateSeparator: settings.dateSeparator,
    timeFormat: settings.timeFormat,
  };
}

export function readUserDisplayPreferences(row: {
  week_start_day?: string | null;
  date_format?: string | null;
  date_separator?: string | null;
  time_format?: string | null;
  timezone?: string | null;
}): UserDisplayPreferences {
  const timezone = row.timezone?.trim() ?? "";
  return {
    weekStartDay: isWeekStart(row.week_start_day) ? row.week_start_day : null,
    dateFormat: isDateFormat(row.date_format) ? row.date_format : null,
    dateSeparator: isDateSeparator(row.date_separator) ? row.date_separator : null,
    timeFormat: isTimeFormat(row.time_format) ? row.time_format : null,
    timezone: timezone.length > 0 ? timezone : null,
  };
}

export function mergeDisplayPreferences(
  system: SiteDisplayPreferences,
  user: UserDisplayPreferences | null | undefined,
): SiteDisplayPreferences {
  if (!user) return system;
  return {
    weekStartDay: user.weekStartDay ?? system.weekStartDay,
    dateFormat: user.dateFormat ?? system.dateFormat,
    dateSeparator: user.dateSeparator ?? system.dateSeparator,
    timeFormat: user.timeFormat ?? system.timeFormat,
  };
}

export function userDisplayPreferencesEqual(a: UserDisplayPreferences, b: UserDisplayPreferences) {
  return (
    a.weekStartDay === b.weekStartDay &&
    a.dateFormat === b.dateFormat &&
    a.dateSeparator === b.dateSeparator &&
    a.timeFormat === b.timeFormat &&
    a.timezone === b.timezone
  );
}

export function previewDisplayDate(
  prefs: SiteDisplayPreferences & { timeZone: string },
  at = new Date(),
) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: prefs.timeZone || "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: prefs.timeFormat === "12",
  }).formatToParts(at);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const y = get("year");
  const m = get("month");
  const d = get("day");
  const sep = prefs.dateSeparator;
  let date = "";
  switch (prefs.dateFormat) {
    case "Y-m-d":
      date = [y, m, d].join(sep === " " ? "-" : sep || "-");
      break;
    case "m/d/Y":
      date = [m, d, y].join(sep === " " ? "/" : sep || "/");
      break;
    case "d-m-Y":
      date = [d, m, y].join(sep === " " ? "-" : sep || "-");
      break;
    case "d/m/Y":
      date = [d, m, y].join(sep === " " ? "/" : sep || "/");
      break;
    case "d.m.Y":
    default:
      date = [d, m, y].join(sep || ".");
      break;
  }

  const hour = get("hour");
  const minute = get("minute");
  const dayPeriod = get("dayPeriod");
  const time =
    prefs.timeFormat === "12"
      ? `${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ""}`
      : `${hour}:${minute}`;

  return { date, time, datetime: `${date} ${time}` };
}

function isWeekStart(value: unknown): value is WeekStartDay {
  return value === "monday" || value === "sunday";
}

function isDateFormat(value: unknown): value is SiteDateFormat {
  return (
    value === "Y-m-d" ||
    value === "d-m-Y" ||
    value === "d/m/Y" ||
    value === "m/d/Y" ||
    value === "d.m.Y"
  );
}

function isDateSeparator(value: unknown): value is SiteDateSeparator {
  return value === "." || value === "-" || value === "/" || value === " ";
}

function isTimeFormat(value: unknown): value is SiteTimeFormat {
  return value === "12" || value === "24";
}

export const COMMON_TIMEZONES = [
  "Europe/Riga",
  "Europe/Vilnius",
  "Europe/Tallinn",
  "Europe/Helsinki",
  "Europe/Stockholm",
  "Europe/Berlin",
  "Europe/London",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
] as const;
