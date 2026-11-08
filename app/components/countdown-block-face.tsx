"use client";

import { useEffect, useState } from "react";
import {
  contrastInk,
  countdownEndTimestamp,
  countdownRemaining,
  type CountdownRemaining,
} from "@/app/lib/countdown-block";
import { useTranslations } from "@/app/components/translations-provider";
import type { CountdownBlock } from "@/app/lib/types";
import type { Theme } from "@/app/lib/themes";

const DIGIT_ROW_EM = 1.25;

export function CountdownBlockFace({
  block,
  theme,
}: {
  block: CountdownBlock;
  theme: Theme;
}) {
  const { t } = useTranslations();
  const endMs = countdownEndTimestamp(block);
  const [remaining, setRemaining] = useState<CountdownRemaining | null>(
    endMs !== null ? countdownRemaining(endMs) : null,
  );

  useEffect(() => {
    if (endMs === null) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(countdownRemaining(endMs));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endMs, block.endsAt, block.startsAt, block.durationHours, block.durationMinutes, block.endMode]);

  const background = block.color || theme.button;
  const color = block.color ? contrastInk(block.color) : theme.buttonText;
  const radius = Math.max(0, block.borderRadius ?? 8);
  const title = block.title.trim() || t("studio.block_type.countdown.label", "Atpakaļskaitīšana");
  const description = block.description?.trim();

  if (endMs === null || !remaining) return null;

  return (
    <div
      className="w-full px-4 py-4 text-center"
      style={{
        background,
        color,
        borderRadius: radius,
        border: block.color ? "1px solid transparent" : `1px solid ${theme.buttonBorder ?? "transparent"}`,
      }}
    >
      <p className="text-base font-semibold">{title}</p>
      {description ? <p className="mt-1 text-sm opacity-80">{description}</p> : null}
      {remaining.expired ? (
        <p className="mt-3 text-sm font-medium opacity-90">{t("studio.blocks.countdown.ended", "Laiks ir beidzies")}</p>
      ) : (
        <div className="mt-3 grid grid-cols-4 gap-2">
          <CountdownUnit
            value={remaining.days}
            minDigits={2}
            label={t("studio.blocks.countdown.unit.days", "Dienas")}
            color={color}
          />
          <CountdownUnit
            value={remaining.hours}
            minDigits={2}
            label={t("studio.blocks.countdown.unit.hours", "Stundas")}
            color={color}
          />
          <CountdownUnit
            value={remaining.minutes}
            minDigits={2}
            label={t("studio.blocks.countdown.unit.minutes", "Minūtes")}
            color={color}
          />
          <CountdownUnit
            value={remaining.seconds}
            minDigits={2}
            label={t("studio.blocks.countdown.unit.seconds", "Sekundes")}
            color={color}
          />
        </div>
      )}
    </div>
  );
}

function CountdownUnit({
  value,
  minDigits,
  label,
  color,
}: {
  value: number;
  minDigits: number;
  label: string;
  color: string;
}) {
  const safe = Math.max(0, value);
  const digits = Math.max(minDigits, String(safe).length);
  const display = String(safe).padStart(digits, "0");

  return (
    <div className="min-w-0">
      <p
        className="flex justify-center text-xl font-bold tabular-nums"
        style={{ color }}
        aria-label={display}
      >
        <RollingDigits value={display} color={color} />
      </p>
      <p className="mt-0.5 truncate text-[0.65rem] uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}

function RollingDigits({ value, color }: { value: string; color: string }) {
  return (
    <span className="inline-flex items-baseline">
      {value.split("").map((ch, index) => (
        <RollingDigit key={`${index}-${value.length}`} digit={Number(ch)} color={color} />
      ))}
    </span>
  );
}

function RollingDigit({ digit, color }: { digit: number; color: string }) {
  const d = Number.isFinite(digit) ? Math.max(0, Math.min(9, digit)) : 0;
  return (
    <span
      className="relative inline-block overflow-hidden align-bottom"
      style={{ height: `${DIGIT_ROW_EM}em`, width: "0.62em" }}
      aria-hidden="true"
    >
      <span
        className="countdown-digit-roller block motion-reduce:transition-none"
        style={{
          color,
          transform: `translateY(-${d * DIGIT_ROW_EM}em)`,
          transition: "transform 0.45s cubic-bezier(0.33, 1, 0.45, 1)",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="block text-center font-bold tabular-nums"
            style={{ height: `${DIGIT_ROW_EM}em`, lineHeight: `${DIGIT_ROW_EM}em` }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}
