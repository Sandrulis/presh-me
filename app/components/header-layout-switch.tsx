"use client";

import type { BannerContentAlign, BannerContentPlace, HeaderLayout } from "@/app/lib/types";
import { useTranslations } from "@/app/components/translations-provider";

export function HeaderLayoutSwitch({
  value,
  onChange,
}: {
  value: HeaderLayout;
  onChange: (value: HeaderLayout) => void;
}) {
  const { t } = useTranslations();
  const options: { id: HeaderLayout; labelKey: string; fallback: string; icon: React.ReactNode }[] = [
    { id: "center", labelKey: "look.header.center", fallback: "Centrēts attēls", icon: <CenterIcon /> },
    { id: "banner-center", labelKey: "look.header.banner_center", fallback: "Josla un centrēts attēls", icon: <BannerCenterIcon /> },
    { id: "banner-left", labelKey: "look.header.banner_left", fallback: "Fons ar attēlu pa kreisi", icon: <BannerLeftIcon /> },
    { id: "banner-text", labelKey: "look.header.banner_text", fallback: "Josla un teksts", icon: <BannerTextIcon /> },
  ];

  return (
    <div
      className="inline-flex rounded-2xl bg-[#e8eef5] p-1"
      role="radiogroup"
      aria-label={t("look.header.layout_aria", "Galvenes izkārtojums")}
    >
      {options.map((option) => {
        const selected = value === option.id;
        const label = t(option.labelKey, option.fallback);
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(option.id)}
            className={`group relative grid h-[50px] w-[62px] place-items-center rounded-xl ${
              selected ? "bg-white text-[#111] shadow-[0_1px_2px_rgba(16,24,40,0.12)]" : "text-[#8b95a3]"
            }`}
          >
            {option.icon}
            <span className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function BannerContentSwitch({
  value,
  onChange,
}: {
  value: BannerContentPlace;
  onChange: (value: BannerContentPlace) => void;
}) {
  const { t } = useTranslations();
  const places: { id: BannerContentPlace; labelKey: string; fallback: string; icon: React.ReactNode }[] = [
    { id: "beside", labelKey: "look.header.icon_beside", fallback: "Ikona blakus", icon: <BesideIcon /> },
    { id: "above", labelKey: "look.header.icon_above", fallback: "Ikona virs teksta", icon: <AboveIcon /> },
  ];

  return (
    <div
      className="inline-flex rounded-2xl bg-[#e8eef5] p-1"
      role="radiogroup"
      aria-label={t("look.header.icon_place_aria", "Ikonas vieta")}
    >
      {places.map((option) => {
        const selected = value === option.id;
        const label = t(option.labelKey, option.fallback);
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(option.id)}
            className={`group relative grid h-11 w-14 place-items-center rounded-xl ${
              selected ? "bg-white text-[#111] shadow-[0_1px_2px_rgba(16,24,40,0.12)]" : "text-[#8b95a3]"
            }`}
          >
            {option.icon}
            <span className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function BannerContentAlignSwitch({
  value,
  onChange,
}: {
  value: BannerContentAlign;
  onChange: (value: BannerContentAlign) => void;
}) {
  const { t } = useTranslations();
  const aligns: { id: BannerContentAlign; labelKey: string; fallback: string; icon: React.ReactNode }[] = [
    { id: "left", labelKey: "studio.style.align.left", fallback: "Pa kreisi", icon: <AlignLeftIcon /> },
    { id: "center", labelKey: "look.header.align_center_plural", fallback: "Centrēti", icon: <AlignCenterIcon /> },
    { id: "right", labelKey: "studio.style.align.right", fallback: "Pa labi", icon: <AlignRightIcon /> },
  ];

  return (
    <div
      className="inline-flex rounded-2xl bg-[#e8eef5] p-1"
      role="radiogroup"
      aria-label={t("look.header.icon_align_aria", "Ikonas puse")}
    >
      {aligns.map((option) => {
        const selected = value === option.id;
        const label = t(option.labelKey, option.fallback);
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(option.id)}
            className={`group relative grid h-11 w-14 place-items-center rounded-xl ${
              selected ? "bg-white text-[#111] shadow-[0_1px_2px_rgba(16,24,40,0.12)]" : "text-[#8b95a3]"
            }`}
          >
            {option.icon}
            <span className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AlignLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="6.5" cy="12" r="2.1" />
      <path d="M11 10.4h7M11 13.6h5" strokeLinecap="round" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="2.1" />
      <path d="M5 10.4h3.2M15.8 10.4H19M6.2 13.6h2.2M15.6 13.6h2.2" strokeLinecap="round" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="17.5" cy="12" r="2.1" />
      <path d="M6 10.4h7M8 13.6h5" strokeLinecap="round" />
    </svg>
  );
}

function BesideIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="7" cy="12" r="2.2" />
      <path d="M12 10.2h7M12 13.8h5.5" strokeLinecap="round" />
    </svg>
  );
}

function AboveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="7.2" r="2.2" />
      <path d="M7.5 13.2h9M8.8 16.4h6.4" strokeLinecap="round" />
    </svg>
  );
}

function CenterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[25px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="8.25" r="1.7" />
      <path d="M8.25 13h7.5M9.25 15.75h5.5" strokeLinecap="round" />
    </svg>
  );
}

function BannerCenterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[25px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 9h16" />
      <circle cx="12" cy="9" r="1.7" />
      <path d="M8.25 14h7.5M9.25 16.5h5.5" strokeLinecap="round" />
    </svg>
  );
}

function BannerLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[25px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <rect x="5.4" y="6.2" width="13.2" height="11.6" rx="1.6" fill="currentColor" fillOpacity="0.16" stroke="none" />
      <circle cx="8.5" cy="12" r="1.7" />
      <path d="M11.3 10.6h5M11.3 13.4h4" strokeLinecap="round" />
    </svg>
  );
}

function BannerTextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[25px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 8.5h16" />
      <path d="M8 12.75h8M9 15.5h6" strokeLinecap="round" />
    </svg>
  );
}
