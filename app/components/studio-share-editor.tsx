"use client";

import { useState, type CSSProperties } from "react";
import { ColorPicker } from "@/app/components/color-picker";
import { FieldFrame } from "@/app/components/field-frame";
import { ImageDropField } from "@/app/components/image-drop-field";
import { ImagePlaceControls } from "@/app/components/image-place-controls";
import { ShareAvatarFace } from "@/app/components/share-avatar-face";
import { StudioGroup } from "@/app/components/studio-nav";
import { useTranslations } from "@/app/components/translations-provider";
import { resolveShareAvatarUrl, shareAvatarSourceOf } from "@/app/lib/share/share-avatar";
import type { Portfolio } from "@/app/lib/types";

type Props = {
  page: Portfolio;
  update: (patch: Partial<Portfolio>) => void;
  onError: (message: string) => void;
};

export function StudioShareEditor({ page, update, onError }: Props) {
  const { t } = useTranslations();
  const source = shareAvatarSourceOf(page);
  const name = page.displayName.trim() || t("onboarding.name_ph", "Vārds Uzvārds");
  const hasAvatarImage = Boolean(resolveShareAvatarUrl(page));

  return (
    <StudioGroup>
      <div className="flex justify-center">
        <ShareAvatarFace page={page} name={name} />
      </div>

      <FieldFrame label={t("studio.share.avatar_source", "Avatars")}>
            <div className="grid gap-2">
              <ChoiceRow
                checked={source === "profile"}
                label={t("studio.share.use_profile", "Profila attēls")}
                onSelect={() => update({ shareAvatarSource: "profile" })}
              />
              <ChoiceRow
                checked={source === "custom"}
                label={t("studio.share.custom_image", "Cits attēls")}
                onSelect={() => update({ shareAvatarSource: "custom" })}
              />
            </div>
          </FieldFrame>

          {source === "custom" ? (
            <ShareImageField
              title={t("studio.share.upload", "Augšupielādēt attēlu")}
              src={page.shareAvatarUrl}
              onFile={async (file) => {
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  onError(t("onboarding.image.pick", "Izvēlies attēlu."));
                  return;
                }
                const { processAndUploadImage } = await import("@/app/lib/storage/process-upload");
                const result = await processAndUploadImage(file, {
                  mode: "cover",
                  width: 256,
                  height: 256,
                  folder: "share",
                });
                if (!result.ok) {
                  onError(result.error ?? t("onboarding.image.read_error", "Neizdevās nolasīt attēlu."));
                  return;
                }
                update({ shareAvatarUrl: result.url, shareAvatarSource: "custom" });
              }}
              onClear={() => update({ shareAvatarUrl: null })}
            />
          ) : null}

          {hasAvatarImage ? (
            <FieldFrame label={t("studio.share.image_position", "Attēla novietojums")}>
              {source === "profile" ? (
                <ImagePlaceControls
                  x={page.avatarX}
                  y={page.avatarY}
                  zoom={page.avatarZoom}
                  onChange={({ x, y, zoom }) => update({ avatarX: x, avatarY: y, avatarZoom: zoom })}
                />
              ) : (
                <ImagePlaceControls
                  x={page.shareAvatarX}
                  y={page.shareAvatarY}
                  zoom={page.shareAvatarZoom}
                  onChange={({ x, y, zoom }) => update({ shareAvatarX: x, shareAvatarY: y, shareAvatarZoom: zoom })}
                />
              )}
            </FieldFrame>
          ) : null}

          <RangeField
            label={t("onboarding.avatar_radius", "Noapaļojums")}
            min={0}
            max={50}
            value={page.shareAvatarRadius ?? 50}
            suffix="%"
            onChange={(shareAvatarRadius) => update({ shareAvatarRadius })}
          />
          <RangeField
            label={t("studio.look.border_width", "Apmales biezums")}
            min={0}
            max={16}
            value={page.shareAvatarBorder ?? 3}
            suffix=" px"
            onChange={(shareAvatarBorder) => update({ shareAvatarBorder })}
          />
          <ColorRow
            label={t("onboarding.border_color", "Apmales krāsa")}
            value={page.shareAvatarBorderColor ?? "#ffffff"}
            onChange={(shareAvatarBorderColor) => update({ shareAvatarBorderColor })}
          />
    </StudioGroup>
  );
}

function ChoiceRow({ checked, label, onSelect }: { checked: boolean; label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
        checked ? "border-[var(--ink)] bg-[var(--paper)] font-medium" : "border-[var(--line)] hover:bg-[var(--paper)]"
      }`}
      onClick={onSelect}
    >
      <span
        className={`grid size-4 place-items-center rounded-full border ${checked ? "border-[var(--ink)]" : "border-[var(--line)]"}`}
        aria-hidden="true"
      >
        {checked ? <span className="size-2 rounded-full bg-[var(--ink)]" /> : null}
      </span>
      {label}
    </button>
  );
}

function ShareImageField({
  title,
  src,
  onFile,
  onClear,
}: {
  title: string;
  src?: string | null;
  onFile: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const { t } = useTranslations();
  return (
    <div className="mt-3">
      <ImageDropField
        title={title}
        onFile={onFile}
        preview={
          <span className="relative inline-flex shrink-0">
            <span className="relative block h-14 w-14 overflow-hidden rounded-md bg-[#eef1f6]">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="size-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-xs text-[var(--muted)]">+</span>
              )}
            </span>
            {src ? (
              <button
                type="button"
                aria-label={t("actions.delete", "Dzēst")}
                className="absolute top-0 right-0 z-10 grid size-5 translate-x-1/3 -translate-y-1/3 place-items-center rounded-full bg-[#111] text-white ring-2 ring-white"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onClear();
                }}
              >
                <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                  <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
          </span>
        }
      />
    </div>
  );
}

function RangeField({
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
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <label className="mt-3 block">
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
        style={{ "--range-fill": `${fill}%` } as CSSProperties}
      />
    </label>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <ColorPicker label={label} value={value} onChange={onChange} />;
}
