import type { CountdownBlock } from "@/app/lib/types";

export function contrastInk(hex: string): string {
  const value = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return "#ffffff";
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function countdownDateTimeParts(endsAt?: string): { date: string; time: string } {
  if (!endsAt?.trim()) return { date: "", time: "12:00" };
  const d = new Date(endsAt);
  if (!Number.isFinite(d.getTime())) return { date: "", time: "12:00" };
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

export function countdownCombineDateTime(date: string, time: string): string {
  if (!date.trim()) return "";
  const t = time.trim() || "00:00";
  const parsed = new Date(`${date.trim()}T${t}`);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : "";
}

export function clampCountdownDuration(hours: number, minutes: number): { hours: number; minutes: number } {
  const h = Math.max(0, Math.min(999, Math.round(hours)));
  const m = Math.max(0, Math.min(59, Math.round(minutes)));
  if (m === 60) {
    return { hours: h + 1, minutes: 0 };
  }
  return { hours: h, minutes: m };
}

/** Atgriež beigu laiku ms vai null, ja nav derīga konfigurācija. */
export function countdownEndTimestamp(block: CountdownBlock, now = Date.now()): number | null {
  if (block.endMode === "datetime") {
    if (!block.endsAt?.trim()) return null;
    const t = Date.parse(block.endsAt);
    return Number.isFinite(t) ? t : null;
  }
  const { hours, minutes } = clampCountdownDuration(block.durationHours ?? 0, block.durationMinutes ?? 0);
  if (hours === 0 && minutes === 0) return null;
  const durationMs = (hours * 60 + minutes) * 60_000;
  const startRaw = block.startsAt ? Date.parse(block.startsAt) : now;
  const start = Number.isFinite(startRaw) ? startRaw : now;
  return start + durationMs;
}

export function countdownIsConfigured(block: CountdownBlock): boolean {
  return countdownEndTimestamp(block) !== null;
}

export type CountdownRemaining = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

export function countdownRemaining(endMs: number, now = Date.now()): CountdownRemaining {
  const totalMs = Math.max(0, endMs - now);
  const expired = endMs <= now;
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { totalMs, days, hours, minutes, seconds, expired };
}
