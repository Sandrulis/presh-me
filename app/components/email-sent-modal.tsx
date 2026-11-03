"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";

const REDIRECT_SECONDS = 10;

export function EmailSentModal({
  open,
  title,
  description,
  body,
  email,
  actionLabel,
  onLeave,
}: {
  open: boolean;
  title: string;
  description?: string;
  body: string;
  email: string;
  actionLabel: string;
  onLeave: () => void;
}) {
  const { t } = useTranslations();
  const titleId = useId();
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);
  const leftRef = useRef(false);
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;

  useEffect(() => {
    if (!open) {
      leftRef.current = false;
      setSeconds(REDIRECT_SECONDS);
      return;
    }
    const timer = window.setInterval(() => {
      if (leftRef.current) return;
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open || seconds > 0 || leftRef.current) return;
    leftRef.current = true;
    onLeaveRef.current();
  }, [open, seconds]);

  if (!open || typeof document === "undefined") return null;

  function leave() {
    if (leftRef.current) return;
    leftRef.current = true;
    onLeaveRef.current();
  }

  const parts = body.split("{email}");

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(14,17,22,0.45)]"
        aria-label={actionLabel}
        onClick={leave}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_24px_60px_rgba(14,17,22,0.2)] sm:p-6"
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          {parts.map((part, index) => (
            <span key={index}>
              {index > 0 ? <span className="font-semibold text-[var(--ink)]">{email}</span> : null}
              {part}
            </span>
          ))}
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          {t("auth.email_sent.redirect_login", "Pāriešana uz pieslēgšanos pēc {seconds} s.", {
            seconds,
          })}
        </p>
        <div className="mt-5 flex justify-end">
          <button type="button" className="btn-ink" onClick={leave}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
