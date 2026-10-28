"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";
import { formatStorageSize } from "@/app/lib/storage/format-storage-size";
import { getSessionId, getStorageUsage, refreshSessionStorageUsage, subscribeStore } from "@/app/lib/store";

export function StudioStorageMeter({ compact }: { compact: boolean }) {
  const { t } = useTranslations();
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const usage = useSyncExternalStore(subscribeStore, getStorageUsage, () => null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (sessionId) void refreshSessionStorageUsage();
  }, [sessionId]);

  if (!sessionId || !usage) return null;

  const usedLabel = formatStorageSize(usage.bytesUsed);
  const quotaLabel = usage.quotaBytes != null ? formatStorageSize(usage.quotaBytes) : null;
  const ratio =
    usage.quotaBytes != null && usage.quotaBytes > 0
      ? Math.min(1, usage.bytesUsed / usage.quotaBytes)
      : null;

  const summary =
    quotaLabel != null
      ? t("studio.storage.used_of", "{used} no {quota}", { used: usedLabel, quota: quotaLabel })
      : t("studio.storage.used", "{used} izmantots", { used: usedLabel });

  function placeTip() {
    if (!compact || window.matchMedia("(max-width: 699px)").matches) return;
    const rect = tipRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  }

  if (compact) {
    return (
      <>
        <div
          ref={tipRef}
          role="status"
          aria-label={summary}
          className="mt-1 flex h-9 w-full items-center justify-center rounded-xl text-[var(--muted)]"
          onMouseEnter={placeTip}
          onMouseLeave={() => setTip(null)}
          onFocus={placeTip}
          onBlur={() => setTip(null)}
          tabIndex={0}
        >
          <IconStorage />
        </div>
        {tip
          ? createPortal(
              <span
                role="tooltip"
                style={{ top: tip.top, left: tip.left }}
                className="pointer-events-none fixed z-[70] -translate-y-1/2 rounded-md bg-white px-2 py-1 text-xs font-medium whitespace-nowrap text-[var(--ink)] ring-1 ring-[var(--line)]"
              >
                {summary}
              </span>,
              document.body,
            )
          : null}
      </>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5" role="status">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {t("studio.storage.label", "Krātuve")}
      </p>
      <p className="mt-1 text-[13px] font-medium text-[var(--ink)]">{summary}</p>
      {ratio != null ? (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]"
          aria-hidden={ratio >= 1 ? undefined : true}
          aria-valuenow={usage.bytesUsed}
          aria-valuemin={0}
          aria-valuemax={usage.quotaBytes ?? undefined}
          role="progressbar"
        >
          <div
            className={`h-full rounded-full transition-[width] ${ratio >= 1 ? "bg-red-500" : "bg-[var(--ink)]"}`}
            style={{ width: `${Math.max(ratio * 100, usage.bytesUsed > 0 ? 4 : 0)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function IconStorage() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}
