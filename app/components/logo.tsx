"use client";

import Link from "next/link";
import { BRAND_MARK_P_PATH } from "@/app/lib/site-admin/branding";

/** Square ink mark with “P” — same as studio sidebar. */
export function BrandMarkIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[9px] bg-[var(--ink)] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4">
        <path d={BRAND_MARK_P_PATH} fill="#f4f6fb" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  showLabel = true,
  labelClassName = "",
  className = "",
  onClick,
  ariaLabel = "presh",
}: {
  href?: string;
  showLabel?: boolean;
  labelClassName?: string;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={showLabel ? undefined : ariaLabel}
      onClick={onClick}
      className={`inline-flex min-w-0 items-center gap-2 no-underline ${className}`}
    >
      <BrandMarkIcon />
      {showLabel ? (
        <span
          className={`min-w-0 truncate font-display text-base font-bold tracking-[-0.04em] text-[var(--ink)] ${labelClassName}`}
        >
          presh
        </span>
      ) : null}
    </Link>
  );
}
