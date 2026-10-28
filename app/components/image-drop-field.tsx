"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function isFileDrag(event: React.DragEvent | DragEvent) {
  const types = event.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes("Files");
}

function takeFirstImageFile(list: FileList | null | undefined) {
  const file = list?.[0];
  if (!file || !file.type.startsWith("image/")) return undefined;
  return file;
}

/** Kopīga drag-and-drop / faila izvēle attēliem. */
export function useImageFileDrop(onFile: (file: File | undefined) => void, enabled = true) {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  function applyFile(list: FileList | null | undefined) {
    const file = takeFirstImageFile(list);
    if (file) onFile(file);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  const dragDropProps = {
    onDragEnter: (event: React.DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      depth.current += 1;
      setActive(true);
    },
    onDragOver: (event: React.DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (event: React.DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setActive(false);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      depth.current = 0;
      setActive(false);
      applyFile(event.dataTransfer.files);
    },
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => {
        applyFile(event.target.files);
        event.target.value = "";
      }}
      onClick={(event) => event.stopPropagation()}
    />
  );

  return { active, dragDropProps, openPicker, fileInput };
}

/** Bloķē pārlūka „atvērt failu jaunā tabulā” un izceļ zonu, kamēr velk. */
export function ImageDropField({
  title,
  hint = "Ievelc attēlu vai izvēlies failu.",
  preview,
  onFile,
  className = "",
}: {
  title: string;
  hint?: string;
  preview: ReactNode;
  onFile: (file: File | undefined) => void;
  className?: string;
}) {
  const { active, dragDropProps, openPicker, fileInput } = useImageFileDrop(onFile);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`image-drop ${active ? "image-drop-active" : ""} ${className}`.trim()}
      onClick={() => openPicker()}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openPicker();
      }}
      {...dragDropProps}
    >
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-[var(--muted)]">{active ? "Atlaid šeit" : hint}</span>
      </span>
      <span className={`image-drop-preview ${active ? "image-drop-preview-active" : ""}`}>{preview}</span>
      {fileInput}
    </div>
  );
}
