"use client";

import { useTranslations } from "@/app/components/translations-provider";
import type { EarlyOffer } from "@/app/lib/billing/early-offer";

export function EarlyOfferNote({ offer }: { offer: EarlyOffer | null }) {
  const { t } = useTranslations();
  if (!offer) return null;
  const note =
    offer.note ||
    t("billing.early.default", "Pirmie {users} lietotāji saņem {months} mēnešus bez maksas.", {
      users: offer.users,
      months: offer.months,
    });
  const extendable = offer.extendable
    ? t("billing.early.extendable", "Piedāvājumu var pagarināt.")
    : "";
  return (
    <span className="mt-2 block text-xs leading-relaxed text-[var(--muted)]">
      <span aria-hidden="true">* </span>
      {note}
      {extendable ? ` ${extendable}` : null}
    </span>
  );
}

export function EarlyOfferStar({ show }: { show: boolean }) {
  if (!show) return null;
  return <sup className="ml-0.5 text-[0.65em] leading-none">*</sup>;
}
