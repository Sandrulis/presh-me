"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { imageFrame, panLimits } from "@/app/lib/image-frame";

export function ImagePlaceControls({
  x,
  y,
  zoom,
  onChange,
}: {
  x?: number;
  y?: number;
  zoom?: number;
  onChange: (frame: { x: number; y: number; zoom: number }) => void;
}) {
  const { t } = useTranslations();
  const frame = imageFrame(x, y, zoom);
  const limits = panLimits(frame.zoom);
  const locked = limits.min === limits.max;

  return (
    <>
      <RangeField
        label={t("onboarding.horizontal", "Horizontāli")}
        min={limits.min}
        max={limits.max}
        value={frame.x}
        suffix=" %"
        disabled={locked}
        onChange={(next) => onChange(imageFrame(next, frame.y, frame.zoom))}
      />
      <RangeField
        label={t("onboarding.vertical", "Vertikāli")}
        min={limits.min}
        max={limits.max}
        value={frame.y}
        suffix=" %"
        disabled={locked}
        onChange={(next) => onChange(imageFrame(frame.x, next, frame.zoom))}
      />
      <RangeField
        label={t("onboarding.zoom", "Pietuvinājums")}
        min={100}
        max={200}
        value={frame.zoom}
        suffix=" %"
        onChange={(next) => onChange(imageFrame(frame.x, frame.y, next))}
      />
    </>
  );
}

function RangeField({
  label,
  min,
  max,
  value,
  suffix,
  disabled = false,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  suffix: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <label className={`mt-3 block ${disabled ? "opacity-45" : ""}`}>
      <span className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="rounded-md bg-[#eef1f6] px-2 py-0.5 text-[var(--muted)] tabular-nums">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full"
        style={{ "--range-fill": `${fill}%` } as CSSProperties}
      />
    </label>
  );
}
