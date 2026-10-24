"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FONT_GROUPS, FONT_OPTIONS, type FontId } from "@/app/lib/font-catalog";

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 30, 32, 36, 40, 48, 56];

export function FontSelect({
  value,
  onChange,
  label = "Fonts",
}: {
  value: FontId;
  onChange: (id: FontId) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ left: number; top: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = FONT_OPTIONS.find((font) => font.id === value) ?? FONT_OPTIONS[0];

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 220);
      const menuHeight = 320;
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      const below = rect.bottom + 6;
      const top = below + menuHeight > window.innerHeight - 12 ? Math.max(12, rect.top - menuHeight - 6) : below;
      setBox({ left, top, width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open && box
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="fixed z-[80] max-h-80 overflow-y-auto rounded-[7px] border border-[#d5dbe6] bg-white py-1 shadow-[0_16px_40px_rgba(14,17,22,0.14)]"
            style={{ left: box.left, top: box.top, width: box.width }}
          >
            {FONT_GROUPS.map((group) => (
              <div key={group.id} className="py-1">
                <p className="px-3 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-[var(--muted)]">{group.label}</p>
                {FONT_OPTIONS.filter((font) => font.group === group.id).map((font) => {
                  const selected = font.id === value;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(font.id);
                        setOpen(false);
                      }}
                      className={`flex h-9 w-full items-center justify-between gap-3 px-3 text-left text-sm ${selected ? "bg-[#eef1f6]" : "hover:bg-[#f6f7fb]"}`}
                    >
                      <span className="truncate" style={{ fontFamily: font.family }}>
                        {font.label}
                      </span>
                      {selected ? <Check /> : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="min-w-0 flex-1">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((next) => !next)}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-[7px] border border-[#d5dbe6] bg-white py-0 pr-3 pl-3 text-left"
      >
        <span className="truncate text-sm" style={{ fontFamily: current.family }}>
          {current.label}
        </span>
        <Chevron />
      </button>
      {menu}
    </div>
  );
}

export function FontSizeSelect({
  value,
  onChange,
  label = "Fonta izmērs",
}: {
  value: number;
  onChange: (size: number) => void;
  label?: string;
}) {
  return (
    <span className="relative shrink-0">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 cursor-pointer appearance-none rounded-[7px] border border-[#d5dbe6] bg-white pr-12 pl-3 text-sm"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size} px
          </option>
        ))}
      </select>
      <Chevron className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" />
    </span>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3.5 8.2 6.4 11 12.5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`size-4 shrink-0 text-[var(--muted)] ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 6.5 8 10.5 12 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
