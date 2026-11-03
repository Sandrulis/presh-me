import {
  isValidBookingBlockId,
  isValidBookingHandle,
} from "@/app/lib/booking/booking-input-limits";
import { formatBookingDateLabel } from "@/app/lib/booking/format-booking-date";
import {
  availableSlotsForDate,
  resolveBookingSettingsFromBlock,
} from "@/app/lib/booking/schedule";
import {
  isGuestBookingEmail,
  normalizeGuestBookingEmail,
} from "@/app/lib/booking/validate-guest-email";
import { normalizeHandle } from "@/app/lib/handles";
import { sendNotificationEmail } from "@/app/lib/email/send-templated";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/app/lib/i18n/language";
import { profileCanonicalUrl } from "@/app/lib/seo/public-page";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { rowToPortfolio, type PageRow } from "@/app/lib/supabase/map-page";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { shouldRedirectPublicProfileAway } from "@/app/lib/trial/public-trial-access";
import type { BookingBlock } from "@/app/lib/types";
import { isResendEnabled } from "@/app/lib/integrations/resend/client";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_SLOT = /^\d{2}:\d{2}$/;
const MAX_COMMENT = 2000;

const DETAIL_LABEL_FALLBACK = {
  date: { lv: "Datums", en: "Date" },
  time: { lv: "Laiks", en: "Time" },
  email: { lv: "E-pasts", en: "Email" },
  comment: { lv: "Komentārs", en: "Comment" },
} as const;

const COMMENT_PREFIX_FALLBACK = {
  lv: "Tavs komentārs:",
  en: "Your comment:",
};

export type SubmitBookingRequestInput = {
  handle: string;
  blockId: string;
  date: string;
  time: string;
  email: string;
  comment?: string;
  visitorLanguage?: string | null;
};

export async function submitBookingRequest(
  input: SubmitBookingRequestInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.booking_unavailable" };
  }
  if (!(await isResendEnabled())) {
    return { ok: false, error: "errors.booking_email_disabled" };
  }

  const handle = normalizeHandle(input.handle);
  const blockId = input.blockId?.trim() ?? "";
  const date = input.date?.trim() ?? "";
  const time = input.time?.trim() ?? "";
  const guestEmailRaw = input.email ?? "";
  const comment = (input.comment ?? "").trim().slice(0, MAX_COMMENT);

  if (!isValidBookingHandle(handle) || !isValidBookingBlockId(blockId)) {
    return { ok: false, error: "errors.booking_invalid" };
  }
  if (!ISO_DATE.test(date) || !TIME_SLOT.test(time)) {
    return { ok: false, error: "errors.booking_invalid" };
  }
  if (!isGuestBookingEmail(guestEmailRaw)) {
    return { ok: false, error: "errors.email_invalid" };
  }
  const guestEmail = normalizeGuestBookingEmail(guestEmailRaw);

  const admin = createAdminClient();
  const { data: pageRow, error: pageError } = await admin
    .from("pages")
    .select("id, account_id, handle, display_name, published, content, created_at, updated_at")
    .eq("handle", handle)
    .maybeSingle();
  if (pageError || !pageRow) {
    return { ok: false, error: "errors.booking_page_not_found" };
  }

  const page = rowToPortfolio(pageRow as PageRow);
  if (await shouldRedirectPublicProfileAway(page)) {
    return { ok: false, error: "errors.booking_page_not_found" };
  }

  const block = page.blocks.find(
    (item): item is BookingBlock => item.type === "booking" && item.id === blockId,
  );
  if (!block) {
    return { ok: false, error: "errors.booking_invalid" };
  }

  const settings = resolveBookingSettingsFromBlock(block);
  const slots = availableSlotsForDate(date, settings);
  if (!slots.includes(time)) {
    return { ok: false, error: "errors.booking_slot_unavailable" };
  }

  const { data: existingSlot } = await admin
    .from("page_booking_reservations")
    .select("id")
    .eq("page_id", pageRow.id as string)
    .eq("block_id", blockId)
    .eq("booking_date", date)
    .eq("booking_time", time)
    .maybeSingle();
  if (existingSlot?.id) {
    return { ok: false, error: "errors.booking_slot_unavailable" };
  }

  const { data: ownerRow, error: ownerError } = await admin
    .from("users")
    .select("email, language_code")
    .eq("id", pageRow.account_id as string)
    .maybeSingle();
  const ownerEmail = (ownerRow?.email as string | undefined)?.trim().toLowerCase() ?? "";
  if (ownerError || !ownerEmail) {
    return { ok: false, error: "errors.booking_owner_email_missing" };
  }

  const ownerLang =
    ownerRow?.language_code && isLanguageCode(String(ownerRow.language_code))
      ? String(ownerRow.language_code)
      : DEFAULT_LANGUAGE;
  const visitorLang =
    input.visitorLanguage && isLanguageCode(input.visitorLanguage)
      ? input.visitorLanguage
      : DEFAULT_LANGUAGE;

  const pageName = page.displayName.trim() || handle;
  const formattedDateOwner = formatBookingDateLabel(date, ownerLang);
  const formattedDateGuest = formatBookingDateLabel(date, visitorLang);
  const profileUrl = profileCanonicalUrl(handle);

  const ownerCommentLine = comment
    ? `${detailLabel("comment", ownerLang)}:\n${comment}`
    : "";
  const guestCommentLine = comment
    ? `${commentPrefix(visitorLang)} ${comment}`
    : "";

  const ownerDetails = [
    { label: detailLabel("date", ownerLang), value: formattedDateOwner },
    { label: detailLabel("time", ownerLang), value: time },
    { label: detailLabel("email", ownerLang), value: guestEmail },
    ...(comment ? [{ label: detailLabel("comment", ownerLang), value: comment }] : []),
  ];

  const { data: reservationRow, error: reserveError } = await admin
    .from("page_booking_reservations")
    .insert({
      page_id: pageRow.id as string,
      block_id: blockId,
      booking_date: date,
      booking_time: time,
      guest_email: guestEmail,
      comment,
    })
    .select("id")
    .maybeSingle();

  if (reserveError?.code === "23505") {
    return { ok: false, error: "errors.booking_slot_unavailable" };
  }
  if (reserveError || !reservationRow?.id) {
    console.error("submitBookingRequest reserve", reserveError?.message);
    return { ok: false, error: "errors.booking_failed" };
  }

  const reservationId = String(reservationRow.id);

  async function releaseReservation() {
    await admin.from("page_booking_reservations").delete().eq("id", reservationId);
  }

  const ownerSent = await sendNotificationEmail({
    kind: "booking_owner",
    to: ownerEmail,
    languageCode: ownerLang,
    params: {
      page: pageName,
      date: formattedDateOwner,
      time,
      email: guestEmail,
      comment: comment || "—",
      comment_line: ownerCommentLine,
      link: profileUrl,
    },
    details: ownerDetails,
  });
  if (!ownerSent.ok) {
    await releaseReservation();
    return ownerSent;
  }

  const guestSent = await sendNotificationEmail({
    kind: "booking_guest",
    to: guestEmail,
    languageCode: visitorLang,
    params: {
      page: pageName,
      date: formattedDateGuest,
      time,
      email: guestEmail,
      comment: comment || "",
      comment_line: guestCommentLine,
      link: profileUrl,
    },
    details: [
      { label: detailLabel("date", visitorLang), value: formattedDateGuest },
      { label: detailLabel("time", visitorLang), value: time },
      ...(comment ? [{ label: detailLabel("comment", visitorLang), value: comment }] : []),
    ],
  });
  if (!guestSent.ok) {
    await releaseReservation();
    return guestSent;
  }

  return { ok: true };
}

function detailLabel(field: keyof typeof DETAIL_LABEL_FALLBACK, languageCode: string): string {
  const pack = DETAIL_LABEL_FALLBACK[field];
  return pack[languageCode as keyof typeof pack] || pack.en;
}

function commentPrefix(languageCode: string): string {
  return COMMENT_PREFIX_FALLBACK[languageCode as keyof typeof COMMENT_PREFIX_FALLBACK] || COMMENT_PREFIX_FALLBACK.en;
}
