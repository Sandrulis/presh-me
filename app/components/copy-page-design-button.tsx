"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { designFromPage, readCopiedDesign, saveCopiedDesign } from "@/app/lib/page-design";
import type { FrontendModuleAccess } from "@/app/lib/modules/user-module-access";
import type { PageContent } from "@/app/lib/types";

export function CopyPageDesignButton({ page }: { page: PageContent }) {
  const { t } = useTranslations();
  const [allowed, setAllowed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/modules/access?key=module_multisites", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as FrontendModuleAccess;
      })
      .then((access) => {
        if (!cancelled) setAllowed(access?.canUse === true);
      })
      .catch(() => {
        if (!cancelled) setAllowed(false);
      });
    const stored = readCopiedDesign();
    if (stored?.handle === page.handle) setCopied(true);
    return () => {
      cancelled = true;
    };
  }, [page.handle]);

  if (!allowed) return null;

  function copy() {
    try {
      saveCopiedDesign(designFromPage(page));
      setCopied(true);
      setNote(t("page.copy_design.done", "Dizains nokopēts. Jaunā profilā izvēlies No cita lietotāja."));
    } catch {
      setNote(t("page.copy_design.error", "Šo dizainu neizdevās nokopēt."));
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-30 flex max-w-[16rem] flex-col items-end gap-2">
      {note ? (
        <p className="rounded-xl bg-white px-3 py-2 text-xs leading-5 text-[var(--ink)] shadow-lg" role="status">
          {note}
        </p>
      ) : null}
      <button
        type="button"
        aria-pressed={copied}
        aria-label={t("page.copy_design", "Kopēt dizainu")}
        title={t("page.copy_design", "Kopēt dizainu")}
        onClick={copy}
        className="grid size-12 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--ink)] shadow-lg"
      >
        <CopyIcon />
      </button>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
