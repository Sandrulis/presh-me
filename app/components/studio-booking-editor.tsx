"use client";

import { useEffect, useState } from "react";
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
      pageId={page.id}
      pageHandle={page.handle}
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
  pageId,
  pageHandle,
}: {
  block: BookingBlock;
  onChange: (next: BookingBlock) => void;
  pageId: string;
  pageHandle: string;
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

      <BookingCalendarSubscribe pageId={pageId} pageHandle={pageHandle} blockId={block.id} />
    </>
  );
}

function BookingCalendarSubscribe({
  pageId,
  pageHandle,
  blockId,
}: {
  pageId: string;
  pageHandle: string;
  blockId: string;
}) {
  const { t } = useTranslations();
  const [urls, setUrls] = useState<{
    icsUrl: string;
    googleUrl: string;
    appleUrl: string;
    calendarName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const params = new URLSearchParams({ pageId, blockId });
        const res = await fetch(`/api/booking/calendar-link?${params.toString()}`, {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          ok?: boolean;
          icsUrl?: string;
          googleUrl?: string;
          appleUrl?: string;
          calendarName?: string;
        };
        if (
          cancelled ||
          !data.ok ||
          !data.icsUrl ||
          !data.googleUrl ||
          !data.appleUrl ||
          !data.calendarName
        ) {
          return;
        }
        setUrls({
          icsUrl: data.icsUrl,
          googleUrl: data.googleUrl,
          appleUrl: data.appleUrl,
          calendarName: data.calendarName,
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageId, blockId]);

  async function copyLink() {
    if (!urls?.icsUrl) return;
    try {
      await navigator.clipboard.writeText(urls.icsUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }

  return (
    <FieldFrame label={t("studio.booking.calendar_sync", "Kalendāra abonements")}>
      <div className="rounded-xl border border-[var(--line)] bg-white px-3 pb-3 pt-5">
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          {t(
            "studio.booking.calendar_sync_hint",
            "Visas rezervācijas ar e-pastu, laiku un komentāru tavā Google vai Apple kalendārā. Atjauninās automātiski.",
          )}
        </p>
        {urls?.calendarName ? (
          <p className="mt-2 text-xs text-[var(--ink)]">
            {t("studio.booking.calendar_list_name", "Kalendārā parādīsies kā: {name}", {
              name: urls.calendarName,
            })}
          </p>
        ) : null}
        {urls ? (
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={urls.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#c6d8f7] bg-[#f5f8ff] px-3 py-2.5 text-sm font-medium no-underline !text-[#1a4480] hover:bg-[#eaf1fd] hover:!text-[#1a4480]"
            >
              <GoogleCalendarIcon />
              {t("studio.booking.calendar_google", "Pievienot Google Calendar")}
            </a>
            <a
              href={urls.appleUrl}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2c2c2e] bg-[#1d1d1f] px-3 py-2.5 text-sm font-medium leading-none no-underline !text-white hover:bg-[#2c2c2e] hover:!text-white"
            >
              <AppleCalendarIcon className="text-white" />
              {t("studio.booking.calendar_apple", "Pievienot Apple Calendar")}
            </a>
            <button
              type="button"
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                copied
                  ? "border-[#9fd4b0] bg-[#eef8f1] text-[#1a5c32]"
                  : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--accent)]"
              }`}
              onClick={() => void copyLink()}
            >
              {copied ? <CheckIcon /> : <CopyLinkIcon />}
              {copied
                ? t("studio.booking.calendar_copied", "Saite nokopēta")
                : t("studio.booking.calendar_copy", "Kopēt abonēšanas saiti")}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-xs text-[var(--muted)]">{t("common.loading", "Ielādē…")}</p>
        )}
        {!pageHandle.trim() ? (
          <p className="mt-3 text-xs text-amber-700">
            {t("studio.booking.calendar_need_handle", "Publicē lapu ar linku, lai kalendārs strādātu.")}
          </p>
        ) : null}
      </div>
    </FieldFrame>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function AppleCalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 384 512"
      width={15}
      height={18}
      className={`block shrink-0 overflow-visible ${className}`.trim()}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M256.8 74.7c34.4 0 62.3-28.2 62.3-62.6S291.2 0 256.8 0c-34.4 0-62.3 28.2-62.3 62.6 0 34.4 28 62.6 62.3 62.6z" />
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-88.6 103-125.3 1.3-3.9 18.7-68.8 18.7-132.3-.1-2.3-.1-4.7-.1-7.1z" />
    </svg>
  );
}

function CopyLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function weekdayFallback(day: BookingWeekday): string {
  return ["?", "P", "O", "T", "C", "Pk", "S", "Sv"][day] ?? "?";
}
