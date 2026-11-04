"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState, type DragEvent } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { uploadSiteBrandingImage } from "@/app/lib/site-admin/site-settings-server";

const labelClass = "text-sm font-medium text-[var(--ink)]";
const hintClass = "mt-1.5 text-xs text-[var(--muted)]";

export function BrandingImageField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled = false,
  onInvalid,
}: {
  id: string;
  label: string;
  hint: string;
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  onInvalid?: () => void;
}) {
  const { t } = useTranslations();
  const dragCountRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  async function applyFile(file: File | undefined) {
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    try {
      const { url } = await uploadSiteBrandingImage(formData);
      onChange(url);
    } catch {
      onInvalid?.();
    }
  }

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current += 1;
    setDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current = Math.max(0, dragCountRef.current - 1);
    if (dragCountRef.current === 0) setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current = 0;
    setDragging(false);
    void applyFile(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <label
        htmlFor={id}
        className={`mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-center text-sm transition ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
            : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--ink)]/30"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id={id}
          type="file"
          accept="image/*,.ico"
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            void applyFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {value ? (
          <span className="inline-flex size-12 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)]">
            <img src={value} alt="" className="size-full object-contain" />
          </span>
        ) : (
          <span className="text-lg text-[var(--muted)]" aria-hidden="true">
            ▭
          </span>
        )}
        <span>
          {t("admin.settings.image_drop", "Ievelc attēlu šeit vai")}{" "}
          <span className="font-medium text-[var(--ink)] underline decoration-dotted underline-offset-4">
            {t("admin.settings.image_browse", "pārlūko")}
          </span>
        </span>
      </label>
      <p className={hintClass}>{hint}</p>
      {value ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className="mt-2 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--stamp)] disabled:cursor-not-allowed"
        >
          {t("admin.settings.image_remove", "Noņemt attēlu")}
        </button>
      ) : null}
    </div>
  );
}
