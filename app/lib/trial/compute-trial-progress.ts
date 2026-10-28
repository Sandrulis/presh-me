const MS_DAY = 86_400_000;

export type TrialProgress = {
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  ratio: number;
  expired: boolean;
  /** Unix ms when the trial period ends / ended. */
  trialEndMs: number;
  /** 0–1 fill for the segment at index `daysElapsed` (current day). */
  currentSegmentRatio: number;
};

export function computeTrialEndMs(startedAtIso: string, periodDays: number): number | null {
  const startMs = Date.parse(startedAtIso);
  if (!Number.isFinite(startMs)) return null;
  const totalDays = Math.max(1, Math.min(365, Math.floor(periodDays)));
  return startMs + totalDays * MS_DAY;
}

export function computeTrialProgress(
  startedAtIso: string,
  periodDays: number,
  nowMs: number = Date.now(),
): TrialProgress | null {
  const startMs = Date.parse(startedAtIso);
  if (!Number.isFinite(startMs)) return null;

  const totalDays = Math.max(1, Math.min(365, Math.floor(periodDays)));
  const totalMs = totalDays * MS_DAY;
  const endMs = startMs + totalMs;
  const elapsedMs = Math.max(0, nowMs - startMs);
  const ratio = Math.min(1, elapsedMs / totalMs);
  const expired = nowMs >= endMs;
  const daysElapsed = Math.min(totalDays, Math.floor(elapsedMs / MS_DAY));
  const daysRemaining = expired ? 0 : Math.max(0, Math.ceil((endMs - nowMs) / MS_DAY));
  const intoDayMs = elapsedMs % MS_DAY;
  const currentSegmentRatio = expired ? 1 : Math.min(1, intoDayMs / MS_DAY);

  return {
    totalDays,
    daysElapsed,
    daysRemaining,
    ratio,
    expired,
    trialEndMs: endMs,
    currentSegmentRatio,
  };
}
