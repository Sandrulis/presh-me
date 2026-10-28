"use client";

import type { ReactNode } from "react";

/** Kompakts lauks: etiķete kā mazs zīmogs uz rāmja augšmalas. */
export function FieldFrame({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field-frame ${className}`.trim()} role="group" aria-label={label}>
      <span className="field-frame-mark">
        <span className="field-frame-dot" aria-hidden="true" />
        {label}
      </span>
      {children}
    </div>
  );
}
