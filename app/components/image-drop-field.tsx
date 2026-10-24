"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function isFileDrag(event: React.DragEvent | DragEvent) {
  const types = event.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes("Files");
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
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function takeFile(list: FileList | null | undefined) {
    const file = list?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    onFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`image-drop ${active ? "image-drop-active" : ""} ${className}`.trim()}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        inputRef.current?.click();
      }}
      onDragEnter={(event) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        event.stopPropagation();
        depth.current += 1;
        setActive(true);
      }}
      onDragOver={(event) => {
        if (!isFileDrag(event)) return;
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
        takeFile(event.dataTransfer.files);
      }}
    >
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-[var(--muted)]">{active ? "Atlaid šeit" : hint}</span>
      </span>
      <span className={`image-drop-preview ${active ? "image-drop-preview-active" : ""}`}>{preview}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          takeFile(event.target.files);
          event.target.value = "";
        }}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
