"use client";

import type { ReactNode } from "react";

/** Kompakts lauks: etiķete kā mazs zīmogs uz rāmja augšmalas. */
export function FieldFrame({
  label,
  children,
  action,
  className = "",
}: {
  label: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field-frame ${className}`.trim()} role="group" aria-label={label}>
      <span className="field-frame-mark">
        <span className="field-frame-dot" aria-hidden="true" />
        {label}
      </span>
      {action ? <div className="field-frame-action">{action}</div> : null}
      {children}
    </div>
  );
}
