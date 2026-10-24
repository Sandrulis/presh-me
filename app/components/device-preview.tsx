"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { PageView } from "@/app/components/page-view";
import { PhoneFrame } from "@/app/components/phone-frame";
import { useTranslations } from "@/app/components/translations-provider";
import type { PageContent } from "@/app/lib/types";

type Device = "phone" | "desktop";

export function DevicePreview({
  page,
  published,
  publicPath,
  onTogglePublished,
}: {
  page: PageContent;
  published?: boolean;
  publicPath?: string;
  onTogglePublished?: () => void;
}) {
  const { t } = useTranslations();
  const [device, setDevice] = useState<Device>("phone");
  const showActions = onTogglePublished != null && publicPath != null && published != null;

  return (
    <div className="flex w-full max-w-[720px] flex-col items-center gap-4">
      <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
        <div className="inline-flex rounded-2xl bg-[#e8eef5] p-1" role="radiogroup" aria-label={t("studio.preview.device_aria", "Priekšskatījuma ierīce")}>
          <DeviceOption
            label={t("studio.preview.phone", "Telefons")}
            selected={device === "phone"}
            onSelect={() => setDevice("phone")}
            icon={<PhoneIcon />}
          />
          <DeviceOption
            label={t("studio.preview.desktop", "Dators")}
            selected={device === "desktop"}
            onSelect={() => setDevice("desktop")}
            icon={<DesktopIcon />}
          />
        </div>
        {showActions ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              role="switch"
              aria-checked={published}
              className="btn-quiet"
              onClick={onTogglePublished}
            >
              {published ? (
                <span className="h-2 w-2 rounded-full bg-[#2f7d4a]" />
              ) : (
                <span className="text-[var(--muted)]" aria-hidden="true">
                  <LockIcon />
                </span>
              )}
              {published ? t("studio.page.published", "Publicēta") : t("studio.page.unpublished", "Nepublisks")}
            </button>
            {published ? (
              <Link href={publicPath} className="btn-ink" target="_blank">
                {t("studio.view_page", "Skatīt lapu")}
              </Link>
            ) : (
              <span className="btn-ink pointer-events-none opacity-40" aria-disabled="true">
                {t("studio.view_page", "Skatīt lapu")}
              </span>
            )}
          </div>
        ) : null}
      </div>
      {device === "phone" ? <PhoneFrame page={page} /> : <DesktopFrame page={page} />}
    </div>
  );
}

function DeviceOption({
  label,
  selected,
  onSelect,
  icon,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      className={`group relative grid h-9 w-11 place-items-center rounded-xl ${
        selected ? "bg-white text-[#111] shadow-[0_1px_2px_rgba(16,24,40,0.12)]" : "text-[#8b95a3]"
      }`}
    >
      {icon}
      <span className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </button>
  );
}

function DesktopFrame({ page }: { page: PageContent }) {
  const handle = page.handle.trim();
  const host = handle ? `presh.me/${handle}` : "presh.me";

  return (
    <div className="flex h-[min(700px,78vh)] w-full flex-col overflow-hidden rounded-2xl bg-[#f4f5f7] shadow-[0_24px_50px_rgba(0,0,0,0.18)] ring-1 ring-black/10">
      <div
        className="flex shrink-0 items-center gap-3 px-3 py-2.5"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        aria-hidden="true"
      >
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <div className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg bg-white px-3 text-[13px] text-[#1c1c1e] ring-1 ring-black/10">
          <span className="truncate">
            <span className="text-[#8e8e93]">https://</span>
            <span className="font-medium">{host}</span>
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-white" style={{ containerType: "size" }}>
        <PageView page={page} mode="preview" framed />
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <rect x="5.5" y="11" width="13" height="9" rx="1.75" />
      <path d="M8.5 11V8.2a3.5 3.5 0 0 1 7 0V11" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="7" y="3" width="10" height="18" rx="2.25" />
      <path d="M11 18.5h2" strokeLinecap="round" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="1.75" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
