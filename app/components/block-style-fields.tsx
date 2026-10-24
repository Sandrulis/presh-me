"use client";

import type { ReactNode } from "react";
import { ColorPicker } from "@/app/components/color-picker";
import { FontSelect, FontSizeSelect } from "@/app/components/font-select";
import { useTranslations } from "@/app/components/translations-provider";
import type { FontId, PageBlock, TextAlign } from "@/app/lib/types";

/** Vai blokam ir pielāgojami izskata iestatījumi. */
export function blockHasStyles(block: PageBlock): boolean {
  return block.type !== "instagram";
}

export function BlockStyleFields({
  block,
  onChange,
}: {
  block: PageBlock;
  onChange: (next: PageBlock) => void;
}) {
  const { t } = useTranslations();
  switch (block.type) {
    case "link":
      return (
        <div>
          <p className="mb-2 text-sm font-medium">{t("studio.style.button_look", "Pogas izskats")}</p>
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <p className="mb-2 text-sm text-[var(--muted)]">{t("onboarding.color", "Krāsa")}</p>
              <ColorPicker
                label={t("onboarding.color", "Krāsa")}
                value={block.color ?? "#111111"}
                onChange={(color) => onChange({ ...block, color })}
              />
            </div>
            <div className="min-w-0 flex-1">
              <RangeRow
                label={t("onboarding.avatar_radius", "Noapaļojums")}
                min={0}
                max={40}
                value={block.borderRadius ?? 8}
                suffix=" px"
                onChange={(borderRadius) => onChange({ ...block, borderRadius })}
              />
            </div>
          </div>
        </div>
      );
    case "text":
      return (
        <AlignAndLook
          align={block.align ?? "center"}
          color={block.color ?? "#5d6672"}
          fontId={(block.fontId ?? "sans") as FontId}
          fontSize={block.fontSize ?? 14}
          onAlign={(align) => onChange({ ...block, align })}
          onColor={(color) => onChange({ ...block, color })}
          onFont={(fontId) => onChange({ ...block, fontId })}
          onSize={(fontSize) => onChange({ ...block, fontSize })}
        />
      );
    case "youtube":
    case "image":
    case "audio":
      return (
        <div>
          <p className="mb-2 text-sm font-medium">{t("studio.style.border", "Robeža")}</p>
          <RangeRow
            label={t("onboarding.avatar_radius", "Noapaļojums")}
            min={0}
            max={40}
            value={block.borderRadius ?? 12}
            suffix=" px"
            onChange={(borderRadius) => onChange({ ...block, borderRadius })}
          />
          <RangeRow
            label={t("studio.style.thickness", "Biezums")}
            min={0}
            max={16}
            value={block.borderWidth ?? 0}
            suffix=" px"
            onChange={(borderWidth) => onChange({ ...block, borderWidth })}
          />
          <div className="mt-3 flex items-center gap-3">
            <ColorPicker
              label={t("studio.style.border_color", "Robežas krāsa")}
              value={block.borderColor ?? "#111111"}
              onChange={(borderColor) => onChange({ ...block, borderColor })}
            />
            <span className="text-sm text-[var(--muted)]">{t("studio.style.border_color", "Robežas krāsa")}</span>
          </div>
        </div>
      );
    case "resume":
      return (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">{t("studio.style.vertical_line", "Vertikālā līnija")}</p>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <p className="mb-2 text-sm text-[var(--muted)]">{t("onboarding.color", "Krāsa")}</p>
                <ColorPicker
                  label={t("studio.style.line_color", "Līnijas krāsa")}
                  value={block.lineColor ?? "#c5ccd6"}
                  onChange={(lineColor) => onChange({ ...block, lineColor })}
                />
              </div>
              <div className="min-w-0 flex-1">
                <RangeRow
                  label={t("studio.style.thickness", "Biezums")}
                  min={1}
                  max={8}
                  value={block.lineWidth ?? 1}
                  suffix=" px"
                  onChange={(lineWidth) => onChange({ ...block, lineWidth })}
                />
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("studio.style.circle", "Aplis")}</p>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <p className="mb-2 text-sm text-[var(--muted)]">{t("onboarding.color", "Krāsa")}</p>
                <ColorPicker
                  label={t("studio.style.circle_color", "Apļa krāsa")}
                  value={block.circleColor ?? "#111111"}
                  onChange={(circleColor) => onChange({ ...block, circleColor })}
                />
              </div>
              <div className="min-w-0 flex-1">
                <RangeRow
                  label={t("studio.style.size", "Lielums")}
                  min={16}
                  max={56}
                  value={block.circleSize ?? 32}
                  suffix=" px"
                  onChange={(circleSize) => onChange({ ...block, circleSize })}
                />
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("common.text", "Teksts")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <FontSelect
                value={(block.fontId ?? "sans") as FontId}
                onChange={(fontId) => onChange({ ...block, fontId })}
              />
              <FontSizeSelect
                value={block.fontSize ?? 14}
                onChange={(fontSize) => onChange({ ...block, fontSize })}
              />
            </div>
          </div>
        </div>
      );
    case "quote":
      return (
        <AlignAndLook
          align={block.align ?? "center"}
          color={block.color ?? "#111111"}
          fontId={(block.fontId ?? "serif") as FontId}
          fontSize={block.fontSize ?? 18}
          onAlign={(align) => onChange({ ...block, align })}
          onColor={(color) => onChange({ ...block, color })}
          onFont={(fontId) => onChange({ ...block, fontId })}
          onSize={(fontSize) => onChange({ ...block, fontSize })}
        />
      );
    case "faq":
      return (
        <>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">{t("studio.style.block", "Bloks")}</p>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <p className="mb-2 text-sm text-[var(--muted)]">{t("onboarding.bg_color", "Fona krāsa")}</p>
                <ColorPicker
                  label={t("onboarding.bg_color", "Fona krāsa")}
                  value={block.backgroundColor ?? "#f4f6fb"}
                  onChange={(backgroundColor) => onChange({ ...block, backgroundColor })}
                />
              </div>
              <div className="min-w-0 flex-1">
                <RangeRow
                  label={t("onboarding.avatar_radius", "Noapaļojums")}
                  min={0}
                  max={40}
                  value={block.borderRadius ?? 8}
                  suffix=" px"
                  onChange={(borderRadius) => onChange({ ...block, borderRadius })}
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">{t("studio.style.question", "Jautājums")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <ColorPicker
                label={t("studio.style.bg_label", "Fons")}
                value={block.questionBackground ?? block.backgroundColor ?? "#f4f6fb"}
                onChange={(questionBackground) => onChange({ ...block, questionBackground })}
              />
              <FontSelect
                value={(block.questionFontId ?? "sans") as FontId}
                onChange={(questionFontId) => onChange({ ...block, questionFontId })}
              />
              <FontSizeSelect
                value={block.questionFontSize ?? 15}
                onChange={(questionFontSize) => onChange({ ...block, questionFontSize })}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("studio.style.answer", "Atbilde")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <ColorPicker
                label={t("studio.style.bg_label", "Fons")}
                value={block.answerBackground ?? block.backgroundColor ?? "#f4f6fb"}
                onChange={(answerBackground) => onChange({ ...block, answerBackground })}
              />
              <FontSelect
                value={(block.answerFontId ?? "sans") as FontId}
                onChange={(answerFontId) => onChange({ ...block, answerFontId })}
              />
              <FontSizeSelect
                value={block.answerFontSize ?? 14}
                onChange={(answerFontSize) => onChange({ ...block, answerFontSize })}
              />
            </div>
          </div>
        </>
      );
    case "instagram":
      return <p className="text-sm text-[var(--muted)]">{t("studio.style.no_settings", "Šim blokam nav atsevišķu izskata iestatījumu.")}</p>;
  }
}

function RangeRow({
  label,
  min,
  max,
  value,
  suffix,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="rounded-md bg-[#eef1f6] px-2 py-0.5 text-[var(--muted)] tabular-nums">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full"
      />
    </label>
  );
}

function AlignAndLook({
  align,
  color,
  fontId,
  fontSize,
  onAlign,
  onColor,
  onFont,
  onSize,
}: {
  align: TextAlign;
  color: string;
  fontId: FontId;
  fontSize: number;
  onAlign: (value: TextAlign) => void;
  onColor: (value: string) => void;
  onFont: (value: FontId) => void;
  onSize: (value: number) => void;
}) {
  const { t } = useTranslations();
  return (
    <>
      <div className="mt-1">
        <p className="mb-2 text-sm font-medium">{t("studio.style.alignment", "Novietojums")}</p>
        <TextAlignSwitch value={align} onChange={onAlign} />
      </div>
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">{t("studio.style.look", "Izskats")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <ColorPicker label={t("onboarding.color", "Krāsa")} value={color} onChange={onColor} />
          <FontSelect value={fontId} onChange={onFont} />
          <FontSizeSelect value={fontSize} onChange={onSize} />
        </div>
      </div>
    </>
  );
}

function TextAlignSwitch({ value, onChange }: { value: TextAlign; onChange: (value: TextAlign) => void }) {
  const { t } = useTranslations();
  const options: { id: TextAlign; label: string; icon: ReactNode }[] = [
    { id: "left", label: t("studio.style.align.left", "Pa kreisi"), icon: <AlignIcon kind="left" /> },
    { id: "center", label: t("studio.style.align.center", "Centrēts"), icon: <AlignIcon kind="center" /> },
    { id: "right", label: t("studio.style.align.right", "Pa labi"), icon: <AlignIcon kind="right" /> },
  ];
  return (
    <div className="inline-flex rounded-2xl bg-[#e8eef5] p-1" role="radiogroup" aria-label={t("studio.style.text_align_aria", "Teksta novietojums")}>
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.id)}
            className={`grid h-10 w-12 place-items-center rounded-xl ${
              selected ? "bg-white text-[#111] shadow-[0_1px_2px_rgba(16,24,40,0.12)]" : "text-[#8b95a3]"
            }`}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}

function AlignIcon({ kind }: { kind: TextAlign }) {
  const d = kind === "left" ? "M4 6h16M4 12h10M4 18h14" : kind === "center" ? "M4 6h16M7 12h10M5 18h14" : "M4 6h16M10 12h10M6 18h14";
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={d} strokeLinecap="round" />
    </svg>
  );
}
