"use client";

import type { BillingInterval } from "@/app/lib/billing/billing-interval";

const active =
  "rounded-md bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_1px_3px_rgba(14,17,22,0.08)]";
const inactive =
  "rounded-md px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--ink)]";

export function BillingIntervalToggle({
  value,
  onChange,
  monthlyLabel,
  annualLabel,
  ariaLabel,
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
  monthlyLabel: string;
  annualLabel: string;
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex rounded-[10px] bg-[#f1f5f9] p-1"
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={value === "month" ? active : inactive}
        aria-pressed={value === "month"}
        onClick={() => onChange("month")}
      >
        {monthlyLabel}
      </button>
      <button
        type="button"
        className={value === "year" ? active : inactive}
        aria-pressed={value === "year"}
        onClick={() => onChange("year")}
      >
        {annualLabel}
      </button>
    </div>
  );
}
