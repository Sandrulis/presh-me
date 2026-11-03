"use client";

import { useState } from "react";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import { downloadContactVcard } from "@/app/lib/contact/build-vcard";
import type { PageContent } from "@/app/lib/types";

export function PageContactUi({
  page,
  framed = false,
}: {
  page: PageContent;
  framed?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (page.contactEnabled !== true) return null;

  return (
    <>
      <ContactFloatingButton framed={framed} onOpen={() => setOpen(true)} />
      <PageContactDrawer page={page} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ContactFloatingButton({ framed, onOpen }: { framed: boolean; onOpen: () => void }) {
  const { t } = useTranslations();
  return (
    <button
      type="button"
      className={`grid size-11 place-items-center rounded-full bg-white text-[var(--ink)] shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-black/5 ${
        framed ? "absolute top-3 left-3 z-20" : "fixed top-4 left-4 z-30"
      }`}
      aria-label={t("page.contact.open", "Pievienot kontaktu")}
      onClick={onOpen}
    >
      <ContactAddIcon />
    </button>
  );
}

function PageContactDrawer({ page, open, onClose }: { page: PageContent; open: boolean; onClose: () => void }) {
  const { t } = useTranslations();
  const name = page.displayName.trim() || t("onboarding.name_ph", "Vārds Uzvārds");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addContact() {
    setPending(true);
    setError(null);
    try {
      await downloadContactVcard(page, page.handle || name);
      onClose();
    } catch {
      setError(t("page.contact.download_failed", "Neizdevās izveidot kontaktu."));
    } finally {
      setPending(false);
    }
  }

  return (
    <SideDrawer
      open={open}
      side="left"
      title={name}
      hint={t("page.contact.drawer_hint", "Saglabā kontaktu savā tālrunī.")}
      onClose={onClose}
      ariaLabel={t("page.contact.drawer_aria", "Pievienot kontaktu")}
    >
      <div className="flex flex-col items-center gap-6 px-1 pb-6 pt-4 text-center">
        <div className="grid justify-items-center gap-2">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#eef1f6] text-[var(--ink)]">
            <ContactAddIcon className="size-7" />
          </span>
          <p className="m-0 max-w-[16rem] text-[15px] font-medium text-[var(--ink)]">
            {t("page.contact.save_label", "Saglabāt kā kontaktu")}
          </p>
        </div>

        <button
          type="button"
          className="btn-ink w-full max-w-sm"
          disabled={pending}
          onClick={() => void addContact()}
        >
          {pending ? t("common.loading", "Ielādē...") : t("page.contact.add_button", "Pievienot kontaktu")}
        </button>
        {error ? (
          <p className="m-0 text-sm text-[var(--stamp)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </SideDrawer>
  );
}

function ContactAddIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}
