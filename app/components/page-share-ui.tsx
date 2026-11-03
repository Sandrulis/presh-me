"use client";

import { useEffect, useState } from "react";
import { SideDrawer } from "@/app/components/side-drawer";
import { ShareAvatarFace } from "@/app/components/share-avatar-face";
import { ShareQrCode } from "@/app/components/share-qr-code";
import { useTranslations } from "@/app/components/translations-provider";
import { publicPageUrl } from "@/app/lib/share/share-avatar";
import type { PageContent } from "@/app/lib/types";

export function PageShareUi({
  page,
  framed = false,
}: {
  page: PageContent;
  framed?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (page.shareEnabled !== true) return null;

  return (
    <>
      <ShareFloatingButton framed={framed} onOpen={() => setOpen(true)} />
      <PageShareDrawer page={page} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ShareFloatingButton({ framed, onOpen }: { framed: boolean; onOpen: () => void }) {
  const { t } = useTranslations();
  return (
    <button
      type="button"
      className={`grid size-11 place-items-center rounded-full bg-white text-[var(--ink)] shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-black/5 ${
        framed ? "absolute top-3 right-3 z-20" : "fixed top-4 right-4 z-30"
      }`}
      aria-label={t("page.share.open", "Dalīties")}
      onClick={onOpen}
    >
      <ShareIcon />
    </button>
  );
}

function PageShareDrawer({ page, open, onClose }: { page: PageContent; open: boolean; onClose: () => void }) {
  const { t } = useTranslations();
  const name = page.displayName.trim() || t("onboarding.name_ph", "Vārds Uzvārds");
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPageUrl(publicPageUrl(page.handle));
  }, [page.handle]);

  async function copyLink() {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const displayUrl = pageUrl.replace(/^https?:\/\//, "");

  return (
    <SideDrawer
      open={open}
      side="right"
      title={name}
      hint={t("page.share.drawer_hint", "Kopē saiti vai skenē QR kodu.")}
      onClose={onClose}
      ariaLabel={t("page.share.drawer_aria", "Dalīties ar lapu")}
    >
      <div className="flex flex-col items-center gap-6 px-1 pb-6 pt-2">
        <ShareAvatarFace page={page} name={name} sizeClassName="h-32 w-32 text-3xl" />

        <div className="w-full">
          <label className="sr-only" htmlFor="page-share-url">
            {t("page.share.link_label", "Lapas saite")}
          </label>
          <div className="flex items-center gap-2 rounded-xl bg-[#eef1f6] px-3 py-2 ring-1 ring-[var(--line)]">
            <input
              id="page-share-url"
              readOnly
              value={displayUrl}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--ink)] outline-none"
            />
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--ink)] hover:bg-white"
              aria-label={copied ? t("studio.copied", "Nokopēts") : t("studio.copy_link", "Kopēt linku")}
              onClick={() => void copyLink()}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>

        <div className="w-full flex justify-center">
          {pageUrl ? (
            <ShareQrCode url={pageUrl} label={t("page.share.qr_alt", "QR kods uz lapu")} />
          ) : null}
        </div>
      </div>
    </SideDrawer>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="12" r="2.2" />
      <circle cx="17" cy="7" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
      <path d="m9 11 6-3M9 13l6 3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
