type Rgb = readonly [number, number, number];

const GREEN: Rgb = [22, 163, 74];
const YELLOW: Rgb = [202, 138, 4];
const RED: Rgb = [220, 38, 38];

function lerpRgb(from: Rgb, to: Rgb, t: number): Rgb {
  const u = Math.min(1, Math.max(0, t));
  return [
    Math.round(from[0] + (to[0] - from[0]) * u),
    Math.round(from[1] + (to[1] - from[1]) * u),
    Math.round(from[2] + (to[2] - from[2]) * u),
  ];
}

function rgbCss(rgb: Rgb): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/** 0 = trial start (green), 1 = trial end (red). */
export function trialPhaseColor(phase: number): string {
  const t = Math.min(1, Math.max(0, phase));
  if (t <= 0.5) {
    return rgbCss(lerpRgb(GREEN, YELLOW, t / 0.5));
  }
  return rgbCss(lerpRgb(YELLOW, RED, (t - 0.5) / 0.5));
}

/** Krāsa visam aizpildītajam progresam: 0 = zaļš, 0.5 = dzeltens, 1 = sarkans. */
export function trialProgressFillColor(progressRatio: number): string {
  return trialPhaseColor(progressRatio);
}
