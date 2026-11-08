"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";

export function SideDrawer({
  open,
  title,
  hint,
  children,
  footer,
  onClose,
  ariaLabel,
  nested = false,
  side = "left",
}: {
  open: boolean;
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode | ((close: () => void) => ReactNode);
  onClose: () => void;
  ariaLabel?: string;
  nested?: boolean;
  /** Admin drawers open from the right edge; studio option drawers stay left. */
  side?: "left" | "right";
}) {
  const { t } = useTranslations();
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const fromOffscreen = side === "right" ? "translateX(100%)" : "translateX(-100%)";

  function requestClose() {
    if (!closing) setClosing(true);
  }

  useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel) return;
    const panelAnim = panel.animate(
      closing
        ? [{ transform: "translateX(0)" }, { transform: fromOffscreen }]
        : [{ transform: fromOffscreen }, { transform: "translateX(0)" }],
      {
        duration: closing ? 240 : 280,
        easing: closing ? "ease-in" : "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
    const backdropAnim = backdrop?.animate(
      closing ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }],
      { duration: closing ? 200 : 240, easing: "ease", fill: "forwards" },
    );
    if (closing) panelAnim.onfinish = () => onCloseRef.current();
    return () => {
      panelAnim.cancel();
      backdropAnim?.cancel();
    };
  }, [closing, fromOffscreen, open]);

  useEffect(() => {
    if (!open || closing) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (nested) event.stopImmediatePropagation();
      requestClose();
    }
    window.addEventListener("keydown", onKey, nested);
    return () => window.removeEventListener("keydown", onKey, nested);
  }, [closing, nested, open]);

  if (!open) return null;

  const footerNode = typeof footer === "function" ? footer(requestClose) : footer;
  const shellZ = nested ? "z-[90]" : "z-[80]";
  const panelZ = nested ? "z-[91]" : "z-[81]";
  const closeLabel = t("actions.close", "Aizvērt");
  const panelClass =
    side === "right"
      ? `option-drawer option-drawer-right ${panelZ} border-l border-[var(--line)]`
      : `option-drawer ${panelZ} border-r border-[var(--line)]`;

  const shellLayout =
    side === "left"
      ? `option-drawer-shell option-drawer-shell--studio ${shellZ}`
      : `fixed inset-0 ${shellZ}`;
  const backdropClass =
    side === "left"
      ? "option-drawer-backdrop bg-[var(--ink)]/35"
      : "absolute inset-0 bg-[var(--ink)]/35";

  return createPortal(
    <div className={shellLayout}>
      <button
        ref={backdropRef}
        type="button"
        aria-label={closeLabel}
        className={backdropClass}
        style={{ opacity: 0 }}
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className={panelClass}
        style={{ transform: fromOffscreen }}
      >
        <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
          </div>
          <button type="button" className="btn-quiet" onClick={requestClose} aria-label={closeLabel} disabled={closing}>
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footerNode ? <div className="border-t border-[var(--line)] p-3">{footerNode}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
