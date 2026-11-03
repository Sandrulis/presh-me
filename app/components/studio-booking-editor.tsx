"use client";

import { ColorPicker } from "@/app/components/color-picker";
import { RangeRow } from "@/app/components/block-style-fields";
import { FieldFrame } from "@/app/components/field-frame";
import { StudioGroup } from "@/app/components/studio-nav";
import { useTranslations } from "@/app/components/translations-provider";
import type { BookingWeekday } from "@/app/lib/booking/schedule";
import type { BookingBlock, Portfolio } from "@/app/lib/types";

const SESSION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

type Props = {
  page: Portfolio;
  update: (patch: Partial<Portfolio>) => void;
  /** Iekš Blocks redaktora — bez StudioGroup apvalka un ievada hinta. */
  embedded?: boolean;
};

/** @deprecated Booking tagad ir bloks — lieto BookingBlockFields. */
export function StudioBookingEditor({ page, update, embedded = false }: Props) {
  const booking = page.blocks.find((block): block is BookingBlock => block.type === "booking");
  if (!booking) return null;
  const fields = (
    <BookingBlockFields
      block={booking}
      onChange={(next) =>
        update({
          blocks: page.blocks.map((item) => (item.id === booking.id ? next : item)),
        })
      }
    />
  );
  if (embedded) return <div className="grid gap-3">{fields}</div>;
  return <StudioGroup>{fields}</StudioGroup>;
}

export function BookingBlockFields({
  block,
  onChange,
}: {
  block: BookingBlock;
  onChange: (next: BookingBlock) => void;
}) {
  const { t } = useTranslations();
  const workDays = new Set(block.workDays ?? [1, 2, 3, 4, 5]);

  function toggleDay(day: BookingWeekday) {
    const next = new Set(workDays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    const ordered = ([1, 2, 3, 4, 5, 6, 7] as BookingWeekday[]).filter((d) => next.has(d));
    onChange({ ...block, workDays: ordered.length ? ordered : [1] });
  }

  return (
    <>
      <FieldFrame label={t("studio.booking.workdays", "Darba dienas")}>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4, 5, 6, 7] as BookingWeekday[]).map((day) => (
            <button
              key={day}
              type="button"
              aria-pressed={workDays.has(day)}
              className={`min-w-[2.75rem] rounded-lg border px-2 py-2 text-sm font-medium ${
                workDays.has(day)
                  ? "border-[var(--ink)] bg-[var(--paper)]"
                  : "border-[var(--line)] text-[var(--muted)]"
              }`}
              onClick={() => toggleDay(day)}
            >
              {t(`booking.weekday.short.${day}`, weekdayFallback(day))}
            </button>
          ))}
        </div>
      </FieldFrame>

      <div className="grid gap-3 min-[480px]:grid-cols-2">
        <FieldFrame label={t("studio.booking.day_start", "Sākums")}>
          <input
            className="auth-field"
            type="time"
            value={block.dayStart ?? "09:00"}
            onChange={(event) => onChange({ ...block, dayStart: event.target.value })}
          />
        </FieldFrame>
        <FieldFrame label={t("studio.booking.day_end", "Beigas")}>
          <input
            className="auth-field"
            type="time"
            value={block.dayEnd ?? "17:00"}
            onChange={(event) => onChange({ ...block, dayEnd: event.target.value })}
          />
        </FieldFrame>
      </div>

      <FieldFrame label={t("studio.booking.session", "Sesijas ilgums")}>
        <select
          className="auth-field"
          value={block.sessionMinutes ?? 60}
          onChange={(event) => onChange({ ...block, sessionMinutes: Number(event.target.value) })}
        >
          {SESSION_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {t("studio.booking.session_minutes", "{minutes} min", { minutes: String(minutes) })}
            </option>
          ))}
        </select>
      </FieldFrame>

      <FieldFrame label={t("studio.booking.button_text", "Pogas teksts")}>
        <input
          className="auth-field"
          autoFocus
          value={block.buttonText ?? ""}
          maxLength={40}
          placeholder={t("page.booking.open", "Rezervēt")}
          onChange={(event) => onChange({ ...block, buttonText: event.target.value })}
        />
      </FieldFrame>

      <div>
        <p className="mb-2 text-sm font-medium">{t("studio.style.button_look", "Pogas izskats")}</p>
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <p className="mb-2 text-sm text-[var(--muted)]">{t("onboarding.color", "Krāsa")}</p>
            <ColorPicker
              label={t("onboarding.color", "Krāsa")}
              value={block.buttonColor ?? "#111111"}
              onChange={(buttonColor) => onChange({ ...block, buttonColor })}
            />
          </div>
          <div className="min-w-0 flex-1">
            <RangeRow
              label={t("onboarding.avatar_radius", "Noapaļojums")}
              min={0}
              max={40}
              value={block.buttonBorderRadius ?? 8}
              suffix=" px"
              onChange={(buttonBorderRadius) => onChange({ ...block, buttonBorderRadius })}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function weekdayFallback(day: BookingWeekday): string {
  return ["?", "P", "O", "T", "C", "Pk", "S", "Sv"][day] ?? "?";
}
