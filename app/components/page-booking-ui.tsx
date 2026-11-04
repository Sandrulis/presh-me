"use client";

import { useEffect, useMemo, useState } from "react";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import { useAuthTurnstile } from "@/app/lib/auth/use-auth-turnstile";
import {
  availableSlotsForDate,
  listBookableDates,
  monthGrid,
  parseIsoDate,
  resolveBookingSettingsFromBlock,
  todayIsoDateLocal,
} from "@/app/lib/booking/schedule";
import { bookingSlotKey, parseBookingSlotKey } from "@/app/lib/booking/reservation-slot-key";
import type { BookingBlock } from "@/app/lib/types";
import type { Theme } from "@/app/lib/themes";

const BOOKING_DEFAULT_RADIUS = 8;

export function BookingBlockFace({
  block,
  mode,
  theme,
  pageHandle,
  framed = false,
}: {
  block: BookingBlock;
  mode: "live" | "preview";
  theme: Theme;
  pageHandle: string;
  framed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslations();

  const customColor = block.buttonColor?.trim();
  const background = customColor || theme.button;
  const color = customColor ? contrastInk(customColor) : theme.buttonText;
  const radius = Math.max(0, block.buttonBorderRadius ?? BOOKING_DEFAULT_RADIUS);
  const label = block.buttonText?.trim() || t("page.booking.open", "Rezervēt");

  return (
    <>
      <button
        type="button"
        className="block w-full px-4 py-3.5 text-center text-sm font-semibold no-underline"
        style={{
          background,
          color,
          borderRadius: radius,
          border: customColor ? "1px solid transparent" : `1px solid ${theme.buttonBorder ?? "transparent"}`,
        }}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <PageBookingDrawer
        block={block}
        open={open}
        onClose={() => setOpen(false)}
        framed={framed}
        mode={mode}
        pageHandle={pageHandle}
      />
    </>
  );
}

function contrastInk(hex: string): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return "#ffffff";
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#111111" : "#ffffff";
}

function PageBookingDrawer({
  block,
  open,
  onClose,
  framed: _framed,
  mode,
  pageHandle,
}: {
  block: BookingBlock;
  open: boolean;
  onClose: () => void;
  framed?: boolean;
  mode: "live" | "preview";
  pageHandle: string;
}) {
  const { t, languageCode } = useTranslations();
  const turnstile = useAuthTurnstile();
  const settings = useMemo(() => resolveBookingSettingsFromBlock(block), [block]);
  const bookable = useMemo(() => new Set(listBookableDates(settings)), [settings]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reservedSlots, setReservedSlots] = useState<Set<string>>(() => new Set());
  const [reservationsLoading, setReservationsLoading] = useState(false);

  const slotsReady = mode !== "live" || !pageHandle.trim() || !reservationsLoading;

  const datesWithReservations = useMemo(() => {
    const dates = new Set<string>();
    for (const key of reservedSlots) {
      const parsed = parseBookingSlotKey(key);
      if (parsed) dates.add(parsed.date);
    }
    return dates;
  }, [reservedSlots]);

  useEffect(() => {
    if (!open) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setGuestEmail("");
      setComment("");
      setSubmitting(false);
      setSubmitError(null);
      setSubmitSuccess(false);
      setReservedSlots(new Set());
      setReservationsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "live" || !pageHandle.trim()) {
      setReservationsLoading(false);
      return;
    }
    let cancelled = false;
    setReservationsLoading(true);
    void (async () => {
      try {
        const params = new URLSearchParams({
          handle: pageHandle,
          blockId: block.id,
        });
        const response = await fetch(`/api/booking/reservations?${params.toString()}`);
        const payload = (await response.json().catch(() => null)) as {
          ok?: boolean;
          reservations?: { date: string; time: string }[];
        } | null;
        if (cancelled) return;
        if (response.ok && payload?.ok && payload.reservations) {
          setReservedSlots(
            new Set(payload.reservations.map((row) => bookingSlotKey(row.date, row.time))),
          );
        }
      } catch {
        /* ignore — slots still validated on submit */
      } finally {
        if (!cancelled) setReservationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, mode, pageHandle, block.id]);

  const cells = monthGrid(month.year, month.month);
  const slots = selectedDate ? availableSlotsForDate(selectedDate, settings) : [];

  function pickDate(iso: string) {
    if (!bookable.has(iso)) return;
    setSelectedDate(iso);
    setSelectedSlot(null);
    setSubmitError(null);
    setSubmitSuccess(false);
  }

  function pickSlot(slot: string) {
    if (!selectedDate) return;
    if (reservedSlots.has(bookingSlotKey(selectedDate, slot))) return;
    setSelectedSlot(slot);
    setSubmitError(null);
    setSubmitSuccess(false);
  }

  async function submitRequest() {
    if (mode !== "live") return;
    if (!selectedDate || !selectedSlot || !pageHandle.trim()) return;
    if (reservedSlots.has(bookingSlotKey(selectedDate, selectedSlot))) {
      setSubmitError(
        t("errors.booking_slot_unavailable", "Izvēlētais laiks vairs nav pieejams."),
      );
      return;
    }
    const email = guestEmail.trim();
    if (!email) {
      setSubmitError(t("errors.email_invalid", "Ievadi derīgu e-pasta adresi."));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      let turnstileToken: string | undefined;
      if (turnstile.enabled) {
        const token = turnstile.turnstileRef.current?.getToken()?.trim() ?? "";
        if (!token) {
          setSubmitError(t("auth.turnstile.required", "Apstiprini, ka neesi robots."));
          return;
        }
        turnstileToken = token;
      }

      const response = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: pageHandle,
          blockId: block.id,
          date: selectedDate,
          time: selectedSlot,
          email,
          comment: comment.trim() || undefined,
          visitorLanguage: languageCode,
          turnstileToken,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        const key = payload?.error ?? "errors.booking_failed";
        if (key === "auth.turnstile.required" || key === "auth.turnstile.failed") {
          turnstile.turnstileRef.current?.reset();
        }
        const fallback =
          key === "auth.turnstile.required"
            ? "Apstiprini, ka neesi robots."
            : key === "auth.turnstile.failed"
              ? "Botu pārbaude neizdevās. Mēģini vēlreiz."
              : "Neizdevās nosūtīt pieteikumu. Mēģini vēlreiz.";
        setSubmitError(t(key, fallback));
        return;
      }
      setSubmitSuccess(true);
      setReservedSlots((prev) => {
        const next = new Set(prev);
        next.add(bookingSlotKey(selectedDate, selectedSlot));
        return next;
      });
    } catch {
      setSubmitError(t("errors.booking_failed", "Neizdevās nosūtīt pieteikumu. Mēģini vēlreiz."));
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    mode === "live" &&
    Boolean(selectedDate && selectedSlot && guestEmail.trim()) &&
    !submitting &&
    !submitSuccess &&
    !(selectedDate && selectedSlot && reservedSlots.has(bookingSlotKey(selectedDate, selectedSlot)));

  function shiftMonth(delta: number) {
    const next = new Date(month.year, month.month + delta, 1);
    setMonth({ year: next.getFullYear(), month: next.getMonth() });
  }

  const monthLabel = new Intl.DateTimeFormat(languageCode, { month: "long", year: "numeric" }).format(
    new Date(month.year, month.month, 1),
  );

  const drawerTitle = block.buttonText?.trim() || t("page.booking.drawer_title", "Rezervācija");

  return (
    <SideDrawer
      open={open}
      side="left"
      title={drawerTitle}
      hint={t("page.booking.drawer_hint", "Izvēlies dienu un laiku.")}
      onClose={onClose}
      ariaLabel={t("page.booking.drawer_aria", "Rezervācijas kalendārs")}
    >
      <div className="grid gap-5">
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" className="btn-quiet px-2" onClick={() => shiftMonth(-1)} aria-label={t("booking.prev_month", "Iepriekšējais mēnesis")}>
              ‹
            </button>
            <p className="text-sm font-semibold capitalize">{monthLabel}</p>
            <button type="button" className="btn-quiet px-2" onClick={() => shiftMonth(1)} aria-label={t("booking.next_month", "Nākamais mēnesis")}>
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[var(--muted)]">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <span key={d}>{t(`booking.weekday.short.${d}`, weekdayFallback(d))}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((iso, index) => {
              if (!iso) return <span key={`empty-${index}`} />;
              const enabled = bookable.has(iso);
              const isSelected = selectedDate === iso;
              const isToday = iso === todayIsoDateLocal();
              const hasReservations = datesWithReservations.has(iso);
              const dayNumber = parseIsoDate(iso)?.getDate();
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!enabled}
                  onClick={() => pickDate(iso)}
                  className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm ${
                    isSelected
                      ? "bg-[var(--ink)] font-semibold text-white"
                      : enabled
                        ? "bg-[#eef1f6] font-medium text-[var(--ink)] hover:bg-[#e2e7ef]"
                        : "text-[var(--muted)] opacity-40"
                  } ${isToday && !isSelected ? "ring-1 ring-[var(--ink)]/30" : ""}`}
                >
                  <span>{dayNumber}</span>
                  {hasReservations ? (
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${isSelected ? "bg-red-400" : "bg-red-600"}`}
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate ? (
          <div>
            <p className="mb-2 text-sm font-semibold">{formatDayLabel(selectedDate, languageCode)}</p>
            {!slotsReady ? (
              <BookingSlotsLoading label={t("page.booking.slots_loading", "Ielādē laikus…")} />
            ) : slots.length ? (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const reserved =
                    selectedDate && reservedSlots.has(bookingSlotKey(selectedDate, slot));
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={Boolean(reserved)}
                      className={`rounded-xl border px-2 py-2 text-sm font-medium ${
                        reserved
                          ? "cursor-not-allowed border-red-300 bg-red-50 text-red-700"
                          : selectedSlot === slot
                            ? "border-[var(--ink)] bg-[var(--paper)]"
                            : "border-[var(--line)] hover:bg-[var(--paper)]"
                      }`}
                      aria-label={
                        reserved
                          ? t("page.booking.slot_reserved", "Rezervēts: {time}", { time: slot })
                          : slot
                      }
                      onClick={() => pickSlot(slot)}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">{t("page.booking.no_slots", "Šajā dienā nav brīvu laiku.")}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">{t("page.booking.pick_day", "Izvēlies pieejamu dienu.")}</p>
        )}

        {selectedDate && selectedSlot && slotsReady ? (
          <div className="grid gap-4 border-t border-[var(--line)] pt-4">
            <p className="rounded-xl bg-[#eef1f6] px-3 py-2 text-sm text-[var(--ink)]">
              {t("page.booking.selected", "Izvēlēts: {date} {time}", {
                date: formatDayLabel(selectedDate, languageCode),
                time: selectedSlot,
              })}
            </p>

            {submitSuccess ? (
              <p className="rounded-xl border border-[#2f9e57]/30 bg-[#ecfdf3] px-3 py-3 text-sm text-[#166534]" role="status">
                {t(
                  "page.booking.success",
                  "Pieteikums nosūtīts! Pārbaudi e-pastu ar apstiprinājumu.",
                )}
              </p>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[var(--ink)]">
                    {t("page.booking.email_label", "Tavs e-pasts")}
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    className="auth-field"
                    value={guestEmail}
                    disabled={mode !== "live" || submitting}
                    placeholder={t("page.booking.email_placeholder", "tavs@epasts.lv")}
                    onChange={(event) => {
                      setGuestEmail(event.target.value);
                      setSubmitError(null);
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[var(--ink)]">
                    {t("page.booking.comment_label", "Komentārs")}{" "}
                    <span className="font-normal text-[var(--muted)]">
                      ({t("common.optional", "neobligāti")})
                    </span>
                  </span>
                  <textarea
                    className="auth-field min-h-24"
                    value={comment}
                    disabled={mode !== "live" || submitting}
                    placeholder={t(
                      "page.booking.comment_placeholder",
                      "Papildu informācija par pieteikumu…",
                    )}
                    onChange={(event) => setComment(event.target.value)}
                  />
                </label>
                {mode !== "live" ? (
                  <p className="text-sm text-[var(--muted)]">
                    {t("page.booking.preview_disabled", "Pieteikumu var nosūtīt tikai publicētajā lapā.")}
                  </p>
                ) : null}
                {submitError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {submitError}
                  </p>
                ) : null}
                {turnstile.field}
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => void submitRequest()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f9e57] px-4 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <BookingSpinner />
                      {t("page.booking.submitting", "Nosūta…")}
                    </>
                  ) : (
                    <>
                      {t("page.booking.submit", "Pieteikties")}
                      <span aria-hidden className="text-base leading-none">
                        →
                      </span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </SideDrawer>
  );
}

function BookingSpinner() {
  return (
    <span
      className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-white/35 border-t-white"
      aria-hidden
    />
  );
}

function BookingSlotsLoading({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-[var(--muted)]"
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block size-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--ink)]"
        aria-hidden
      />
      {label}
    </div>
  );
}

function formatDayLabel(iso: string, languageCode: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat(languageCode, { weekday: "short", day: "numeric", month: "short" }).format(date);
}

function weekdayFallback(day: number): string {
  return ["?", "P", "O", "T", "C", "Pk", "S", "Sv"][day] ?? "?";
}
