"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { readImageFile } from "@/app/lib/blocks";
import { FEEDBACK_IMAGE_MAX } from "@/app/lib/feedback/store";

function isFileDrag(event: React.DragEvent | DragEvent) {
  const types = event.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes("Files");
}

export function FeedbackImagesField({
  images,
  onChange,
  onError,
  disabled,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslations();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const depth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = FEEDBACK_IMAGE_MAX - images.length;
  const full = remaining <= 0;

  useEffect(() => {
    function block(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
    }
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  async function takeFiles(list: FileList | null | undefined) {
    if (!list || list.length === 0 || full || disabled || busy) return;
    const files = Array.from(list)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining);
    if (files.length === 0) {
      onError(t("feedback.images.pick", "Izvēlies attēlu."));
      return;
    }
    setBusy(true);
    const next = [...images];
    for (const file of files) {
      await new Promise<void>((resolve) => {
        void readImageFile(
          file,
          (url) => {
            next.push(url);
            resolve();
          },
          (message) => {
            onError(message);
            resolve();
          },
        );
      });
    }
    onChange(next.slice(0, FEEDBACK_IMAGE_MAX));
    setBusy(false);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{t("feedback.images.title", "Attēli")}</p>
        <p className="text-xs text-[var(--muted)]">
          {t("feedback.images.hint", "Nav obligāti · līdz {count}", { count: FEEDBACK_IMAGE_MAX })}
        </p>
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((url, index) => (
            <li key={`${index}-${url.slice(0, 24)}`} className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)]">
              <img
                src={url}
                alt={t("feedback.images.alt", "Pievienotais attēls {count}", { count: index + 1 })}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                aria-label={t("feedback.images.remove", "Noņemt attēlu")}
                disabled={disabled || busy}
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-lg bg-white/95 text-[var(--ink)] shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {full ? null : (
        <div
          role="button"
          tabIndex={disabled || busy ? -1 : 0}
          aria-disabled={disabled || busy}
          aria-label={t("feedback.images.add", "Pievienot attēlus")}
          className={`rounded-xl border border-dashed px-4 py-5 text-center transition ${
            active
              ? "border-[var(--accent)] bg-[var(--accent)]/5"
              : "border-[var(--line)] bg-[var(--paper)] hover:border-[var(--muted)]"
          } ${disabled || busy ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          onClick={() => {
            if (disabled || busy) return;
            inputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            if (disabled || busy) return;
            inputRef.current?.click();
          }}
          onDragEnter={(event) => {
            if (!isFileDrag(event) || disabled || busy) return;
            event.preventDefault();
            event.stopPropagation();
            depth.current += 1;
            setActive(true);
          }}
          onDragOver={(event) => {
            if (!isFileDrag(event) || disabled || busy) return;
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(event) => {
            if (!isFileDrag(event)) return;
            event.preventDefault();
            event.stopPropagation();
            depth.current = Math.max(0, depth.current - 1);
            if (depth.current === 0) setActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            depth.current = 0;
            setActive(false);
            void takeFiles(event.dataTransfer.files);
          }}
        >
          <p className="text-sm font-medium">
            {active
              ? t("feedback.images.drop", "Atlaid šeit")
              : busy
                ? t("feedback.images.processing", "Apstrādā…")
                : t("feedback.images.drag", "Ievelc attēlus vai izvēlies")}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {t("feedback.images.formats", "PNG, JPG · vēl {count}", { count: remaining })}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            tabIndex={-1}
            disabled={disabled || busy}
            onChange={(event) => {
              void takeFiles(event.target.files);
              event.target.value = "";
            }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
