"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

type Hsv = { h: number; s: number; v: number };

const HUE = "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)";
const PANEL_W = 244;
const PANEL_H = 248;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToHsv(hex: string): Hsv {
  const value = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return { h: 0, s: 0, v: 0 };
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: hue, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToHex(h: number, s: number, v: number) {
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = v - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;
  if (h < 60) [red, green, blue] = [chroma, x, 0];
  else if (h < 120) [red, green, blue] = [x, chroma, 0];
  else if (h < 180) [red, green, blue] = [0, chroma, x];
  else if (h < 240) [red, green, blue] = [0, x, chroma];
  else if (h < 300) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];
  const channel = (part: number) =>
    clamp(Math.round((part + match) * 255), 0, 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function pointerRatio(event: ReactPointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1),
    y: clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1),
  };
}

function panelLayout(rect: DOMRect) {
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - PANEL_W - 12);
  const below = rect.bottom + 8;
  const top = below + PANEL_H > window.innerHeight - 12 ? Math.max(12, rect.top - PANEL_H - 8) : below;
  return { left, top };
}

export function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : "#111111";
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ left: 12, top: 12 });
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const [model, setModel] = useState<Hsv>(() => hexToHsv(safe));
  const parsed = hexToHsv(safe);
  const emitted = hsvToHex(model.h, model.s, model.v).toLowerCase();
  const active: Hsv = emitted === safe ? model : { h: parsed.s < 0.02 ? model.h : parsed.h, s: parsed.s, v: parsed.v };

  function paint(next: Hsv) {
    setHexDraft(null);
    setModel(next);
    onChange(hsvToHex(next.h, next.s, next.v));
  }

  function commitHex(raw: string) {
    if (!/^[0-9a-fA-F]{6}$/.test(raw)) return;
    const hex = `#${raw.toLowerCase()}`;
    const next = hexToHsv(hex);
    setHexDraft(null);
    setModel((current) => ({ h: next.s < 0.02 ? current.h : next.h, s: next.s, v: next.v }));
    onChange(hex);
  }

  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setBox(panelLayout(rect));
    }
    function onDoc(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            className="fixed z-[80] rounded-2xl border border-[#d3e4da] bg-white p-3 shadow-[0_16px_40px_rgba(20,48,40,0.14)]"
            style={{ left: box.left, top: box.top, width: PANEL_W }}
          >
            <div
              className="relative h-[132px] cursor-crosshair touch-none overflow-hidden rounded-xl ring-1 ring-black/10"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${active.h}, 100%, 50%))`,
              }}
              onPointerDown={(event) => {
                const point = pointerRatio(event);
                paint({ h: active.h, s: point.x, v: 1 - point.y });
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                const point = pointerRatio(event);
                paint({ h: active.h, s: point.x, v: 1 - point.y });
              }}
            >
              <span
                className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                style={{ left: `${active.s * 100}%`, top: `${(1 - active.v) * 100}%` }}
              />
            </div>
            <div
              className="relative mt-3 h-3 cursor-pointer touch-none rounded-full"
              style={{ background: HUE }}
              onPointerDown={(event) => {
                paint({ ...active, h: pointerRatio(event).x * 359.99 });
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                paint({ ...active, h: pointerRatio(event).x * 359.99 });
              }}
            >
              <span
                className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                style={{ left: `${(active.h / 360) * 100}%`, background: `hsl(${active.h}, 100%, 50%)` }}
              />
            </div>
            <label className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-[#c5d9cd] bg-white px-3 focus-within:border-[#1a6b4a] focus-within:ring-4 focus-within:ring-[#1a6b4a]/15">
              <span className="size-5 shrink-0 rounded-md ring-1 ring-black/10" style={{ background: safe }} />
              <span className="text-sm text-[#5f756a]">#</span>
              <input
                value={(hexDraft ?? safe.replace("#", "")).toUpperCase()}
                spellCheck={false}
                maxLength={6}
                aria-label={label}
                className="w-full bg-transparent font-mono text-sm uppercase text-[#143028] outline-none"
                onChange={(event) => {
                  const raw = event.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                  setHexDraft(raw);
                  if (raw.length === 6) commitHex(raw);
                }}
                onBlur={() => {
                  if (hexDraft && hexDraft.length === 6) commitHex(hexDraft);
                  setHexDraft(null);
                }}
              />
            </label>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => {
          const rect = triggerRef.current?.getBoundingClientRect();
          if (rect) setBox(panelLayout(rect));
          setModel(hexToHsv(safe));
          setOpen((current) => !current);
        }}
        className={`size-9 shrink-0 rounded-xl ring-1 ring-[#c5d9cd] ${open ? "ring-2 ring-[#1a6b4a]" : ""}`}
        style={{ background: safe }}
      />
      {panel}
    </div>
  );
}
