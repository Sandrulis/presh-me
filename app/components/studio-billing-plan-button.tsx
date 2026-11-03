"use client";

import type { ReactNode } from "react";

function IconPlans({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M5 7h14v10H5V7Z" strokeLinejoin="round" />
      <path d="M8 11h8M8 14h5" strokeLinecap="round" />
      <path d="M8 5.5V4M16 5.5V4" strokeLinecap="round" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? "size-4"}`}
      aria-hidden="true"
    />
  );
}

function IconUndo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 7H5v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 11a7 7 0 1 0 2.05-4.95L5 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconXCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
    </svg>
  );
}

/** Full-width billing actions — same radius/padding as `.btn-ink` / `.btn-line` in globals.css */
const billingBtn = "mt-2 w-full";

export function StudioBillingPlanButton({
  children,
  onClick,
  className = "",
  loading = false,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  loading?: boolean;
}) {
  return (
    <button type="button" className={`btn-ink ${billingBtn} ${className}`} disabled={loading} onClick={onClick}>
      {loading ? (
        <IconSpinner className="size-[1.125rem] shrink-0 border-white/40 border-t-white" />
      ) : (
        <IconPlans className="h-[1.125rem] w-[1.125rem] shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
}

export function StudioBillingCancelButton({
  children,
  onClick,
  loading = false,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button type="button" className={`btn-danger ${billingBtn} ${className}`} disabled={loading} onClick={onClick}>
      {loading ? (
        <IconSpinner className="size-[1.125rem] shrink-0 border-white/40 border-t-white" />
      ) : (
        <IconXCircle className="h-[1.125rem] w-[1.125rem] shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
}

export function StudioBillingResumeButton({
  children,
  onClick,
  loading = false,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button type="button" className={`btn-success ${billingBtn} ${className}`} disabled={loading} onClick={onClick}>
      {loading ? (
        <IconSpinner className="size-[1.125rem] shrink-0 border-white/40 border-t-white" />
      ) : (
        <IconUndo className="h-[1.125rem] w-[1.125rem] shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
}
