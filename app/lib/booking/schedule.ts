import type { PageContent } from "@/app/lib/types";

/** ISO weekday: Monday = 1 … Sunday = 7 */
export type BookingWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type BookingSettings = {
  workDays: BookingWeekday[];
  dayStart: string;
  dayEnd: string;
  sessionMinutes: number;
  horizonDays: number;
};

const DEFAULT_WORK_DAYS: BookingWeekday[] = [1, 2, 3, 4, 5];

export function resolveBookingSettings(page: PageContent): BookingSettings {
  const rawDays = page.bookingWorkDays ?? DEFAULT_WORK_DAYS;
  const workDays = rawDays.filter((d): d is BookingWeekday => d >= 1 && d <= 7);
  const sessionMinutes = clamp(page.bookingSessionMinutes ?? 60, 15, 480);
  return {
    workDays: workDays.length ? workDays : DEFAULT_WORK_DAYS,
    dayStart: normalizeTime(page.bookingDayStart ?? "09:00", "09:00"),
    dayEnd: normalizeTime(page.bookingDayEnd ?? "17:00", "17:00"),
    sessionMinutes,
    horizonDays: clamp(page.bookingHorizonDays ?? 42, 7, 90),
  };
}

/** Booking iestatījumi no bloka (studija / publiskā lapa). */
export function resolveBookingSettingsFromBlock(block: {
  workDays?: number[];
  dayStart?: string;
  dayEnd?: string;
  sessionMinutes?: number;
  horizonDays?: number;
}): BookingSettings {
  const rawDays = block.workDays ?? DEFAULT_WORK_DAYS;
  const workDays = rawDays.filter((d): d is BookingWeekday => d >= 1 && d <= 7);
  const sessionMinutes = clamp(block.sessionMinutes ?? 60, 15, 480);
  return {
    workDays: workDays.length ? workDays : DEFAULT_WORK_DAYS,
    dayStart: normalizeTime(block.dayStart ?? "09:00", "09:00"),
    dayEnd: normalizeTime(block.dayEnd ?? "17:00", "17:00"),
    sessionMinutes,
    horizonDays: clamp(block.horizonDays ?? 42, 7, 90),
  };
}

export function isoWeekday(date: Date): BookingWeekday {
  const d = date.getDay();
  return (d === 0 ? 7 : d) as BookingWeekday;
}

export function todayIsoDateLocal(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return todayIsoDateLocal(date);
}

export function isBookingWorkDay(iso: string, settings: BookingSettings): boolean {
  const date = parseIsoDate(iso);
  if (!date) return false;
  return settings.workDays.includes(isoWeekday(date));
}

export function listBookableDates(settings: BookingSettings, now = new Date()): string[] {
  const start = todayIsoDateLocal(now);
  const end = addDaysIso(start, settings.horizonDays - 1);
  const out: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    if (isBookingWorkDay(cursor, settings)) out.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return out;
}

export function sessionStartTimes(settings: BookingSettings): string[] {
  const startMin = parseTimeToMinutes(settings.dayStart);
  const endMin = parseTimeToMinutes(settings.dayEnd);
  const step = settings.sessionMinutes;
  if (startMin == null || endMin == null || step <= 0 || startMin >= endMin) return [];
  const slots: string[] = [];
  for (let t = startMin; t + step <= endMin; t += step) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

export function availableSlotsForDate(iso: string, settings: BookingSettings, now = new Date()): string[] {
  if (!isBookingWorkDay(iso, settings)) return [];
  const all = sessionStartTimes(settings);
  const today = todayIsoDateLocal(now);
  if (iso !== today) return all;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return all.filter((slot) => {
    const start = parseTimeToMinutes(slot);
    return start != null && start >= nowMinutes;
  });
}

export function monthGrid(year: number, monthIndex: number): (string | null)[] {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const startPad = (isoWeekday(first) + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let day = 1; day <= last.getDate(); day++) {
    const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push(iso);
  }
  return cells;
}

function normalizeTime(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return fallback;
  const h = clamp(Number(match[1]), 0, 23);
  const m = clamp(Number(match[2]), 0, 59);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
