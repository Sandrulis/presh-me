"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { Logo } from "@/app/components/logo";
import { SiteContactDialog } from "@/app/components/site-contact-dialog";
import { SiteFeedbackDialog } from "@/app/components/site-feedback-dialog";
import { StudioPlanPickerDrawer } from "@/app/components/studio-plan-picker-drawer";
import { StudioStorageMeter } from "@/app/components/studio-storage-meter";
import { useTranslations } from "@/app/components/translations-provider";
import type { FeedbackKind } from "@/app/lib/feedback/types";
import { useSubscriptionPlanLabels } from "@/app/lib/billing/use-subscription-plan-labels";
import { isModuleProLocked } from "@/app/lib/modules/is-module-pro-locked";
import { pageDesignInProgress } from "@/app/lib/onboarding/destination";
import { useFrontendModuleAccess } from "@/app/lib/modules/use-frontend-module-access";
import { isFrontendModuleEnabled } from "@/app/lib/site-admin/modules";
import {
  createPageForAccount,
  EMPTY_PAGES,
  getActivePageId,
  getSessionId,
  logoutAccount,
  readSessionAccount,
  readSessionPage,
  readSessionPages,
  setActivePageId,
  subscribeStore,
} from "@/app/lib/store";

type StudioSidebarProps = {
  open: boolean;
  mobile?: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StudioSidebar({ open, mobile = false, onOpenChange }: StudioSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, languageCode } = useTranslations();
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const pages = useSyncExternalStore(subscribeStore, readSessionPages, () => EMPTY_PAGES);
  const activePage = useSyncExternalStore(subscribeStore, readSessionPage, () => null);
  const account = useSyncExternalStore(subscribeStore, readSessionAccount, () => null);
  const activeId = useSyncExternalStore(subscribeStore, getActivePageId, () => null);
  const compact = !open;
  const [linksOpen, setLinksOpen] = useState(false);
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [multisitesOn, setMultisitesOn] = useState(false);
  const { access: multisitesAccess } = useFrontendModuleAccess("module_multisites");
  const { badgeLabelForModule } = useSubscriptionPlanLabels(languageCode);
  const multisitesProLocked = isModuleProLocked(multisitesAccess);
  const multisitesPlanBadge = multisitesProLocked
    ? badgeLabelForModule("module_multisites", t("studio.subscription.plan_unknown", "Plāns"))
    : null;
  const multisitesPlanBadgeLabel = multisitesPlanBadge
    ? t("studio.basics.plan_badge", "Pieejams ar plānu {plan}", { plan: multisitesPlanBadge })
    : null;
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const { notices, notify, dismissNotice } = useNotices();
  const unfinishedNoted = useRef("");
  const linksRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void isFrontendModuleEnabled("module_multisites").then((enabled) => {
      if (!cancelled) setMultisitesOn(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function clearLeaveTimer() {
    if (leaveTimer.current != null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }

  function onRailEnter() {
    if (mobile) return;
    clearLeaveTimer();
    onOpenChange(true);
  }

  function onRailLeave() {
    if (mobile) return;
    clearLeaveTimer();
    leaveTimer.current = window.setTimeout(() => onOpenChange(false), 120);
  }

  useEffect(() => () => clearLeaveTimer(), []);

  useEffect(() => {
    if (pathname !== "/studio") return;
    const active = activeId ?? pages[0]?.id ?? null;
    const pending = pages.filter((page) => page.id !== active && pageDesignInProgress(page.onboarding));
    if (pending.length === 0) return;
    const key = pending
      .map((page) => page.id)
      .sort()
      .join(",");
    if (unfinishedNoted.current === key) return;
    unfinishedNoted.current = key;
    const handles = pending.map((page) => `/${page.handle}`).join(", ");
    notify(t("studio.page.unfinished", "Iesākta un vēl nepabeigta: {handles}.", { handles }), "info");
  }, [pathname, pages, activeId, notify, t]);

  useEffect(() => {
    if (!linksOpen) return;
    function onDoc(event: MouseEvent) {
      if (!linksRef.current?.contains(event.target as Node)) setLinksOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [linksOpen]);

  if (!open && linksOpen) setLinksOpen(false);

  if (!sessionId) return null;

  const current = activePage ?? pages[0] ?? null;
  const handleLabel = current ? `/${current.handle}` : "Links";

  function selectPage(pageId: string) {
    void setActivePageId(pageId);
    setLinksOpen(false);
    const page = pages.find((item) => item.id === pageId);
    if (page && !page.onboarding?.finished) {
      router.push("/start");
      return;
    }
    if (pathname !== "/studio") router.push("/studio");
  }

  function createLink() {
    if (!sessionId || !multisitesOn) return;
    if (multisitesProLocked) {
      setLinksOpen(false);
      setPlanPickerOpen(true);
      return;
    }
    void createPageForAccount(sessionId);
    setLinksOpen(false);
    router.push("/start");
  }

  function onLinkNavClick() {
    if (!multisitesOn) {
      if (mobile) onOpenChange(false);
      router.push("/");
      return;
    }
    if (compact) {
      onOpenChange(true);
      window.setTimeout(() => setLinksOpen(true), 180);
      return;
    }
    setLinksOpen((value) => !value);
  }

  return (
    <aside
      onMouseEnter={onRailEnter}
      onMouseLeave={onRailLeave}
      className={`fixed top-0 left-0 z-40 flex h-dvh flex-col overflow-hidden border-r border-[var(--line)] bg-white text-[var(--ink)] transition-[width,box-shadow,transform] duration-200 ease-out ${
        open ? "w-60 shadow-xl" : mobile ? "w-60 -translate-x-full shadow-none" : "w-14"
      } ${mobile && open ? "translate-x-0" : ""}`}
    >
      <div className="flex min-h-[4.25rem] shrink-0 items-center px-2.5 py-4">
        {mobile ? (
          <button
            type="button"
            aria-label={t("shell.close_sidebar", "Aizvērt sānu joslu")}
            onClick={() => onOpenChange(false)}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)]"
          >
            <IconX />
          </button>
        ) : null}
        <Logo
          href="/studio"
          showLabel={!compact || mobile}
          labelClassName={`transition-opacity duration-200 ${
            compact && !mobile ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          onClick={() => {
            if (mobile) onOpenChange(false);
          }}
        />
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 ${compact ? "" : "pr-4"}`}>
        <nav className="flex flex-col gap-1" aria-label={t("nav.navigation", "Navigācija")}>
          <div ref={linksRef} className="relative">
            <SideItem
              label={handleLabel}
              icon={<IconLink />}
              active={pathname === "/studio" || pathname === "/start"}
              compact={compact}
              onClick={onLinkNavClick}
              chevron={multisitesOn ? linksOpen : undefined}
            />
            {multisitesOn && linksOpen && !compact ? (
              <div className="absolute z-50 mt-1 left-0 right-0 min-w-[12rem] overflow-visible rounded-xl border border-[var(--line)] bg-white py-1 shadow-lg">
                {pages.map((page) => {
                  const selected = (activeId ?? current?.id) === page.id;
                  const inProgress = pageDesignInProgress(page.onboarding);
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => selectPage(page.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                        inProgress
                          ? selected
                            ? "bg-red-100 font-medium hover:bg-red-100"
                            : "bg-red-50 hover:bg-red-100"
                          : selected
                            ? "bg-[var(--paper)] font-medium hover:bg-[var(--paper)]"
                            : "hover:bg-[var(--paper)]"
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--muted)] ${
                          inProgress ? "bg-white" : "bg-[var(--paper)]"
                        }`}
                      >
                        <IconLink />
                      </span>
                      <span className="min-w-0 truncate">/{page.handle}</span>
                    </button>
                  );
                })}
                <div className="my-1 border-t border-[var(--line)]" />
                <button
                  type="button"
                  onClick={createLink}
                  className="relative flex w-full items-center gap-2 overflow-visible px-3 py-2 text-left text-sm hover:bg-[var(--paper)]"
                >
                  {multisitesPlanBadge ? (
                    <span
                      className="pointer-events-none absolute -right-1 -top-1 z-[2] rounded-md bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-[0_1px_2px_rgba(14,17,22,0.12)]"
                      title={multisitesPlanBadgeLabel ?? multisitesPlanBadge}
                    >
                      {multisitesPlanBadge}
                    </span>
                  ) : null}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--paper)] text-[var(--muted)]">
                    <IconPlus />
                  </span>
                  <span>{t("studio.create_link", "Izveidot jaunu linku")}</span>
                </button>
              </div>
            ) : null}
          </div>
          <SideItem
            label={t("nav.settings", "Uzstādījumi")}
            icon={<IconGear />}
            active={pathname === "/settings"}
            compact={compact}
            href="/settings"
            onNavigate={() => onOpenChange(false)}
          />
          <StudioStorageMeter compact={compact} />
        </nav>
      </div>

      <div className={`shrink-0 border-t border-[var(--line)] py-2 px-2.5 ${compact ? "" : "pr-4"}`}>
        <SideItem
          label={t("nav.bug", "Atrast kļūdu?")}
          icon={<IconBug />}
          active={pathname === "/bug"}
          compact={compact}
          onClick={() => {
            if (mobile) onOpenChange(false);
            setFeedbackKind("bug");
          }}
        />
        <SideItem
          label={t("nav.suggestions", "Ieteikumi")}
          icon={<IconBulb />}
          active={pathname === "/suggestions"}
          compact={compact}
          onClick={() => {
            if (mobile) onOpenChange(false);
            setFeedbackKind("suggestion");
          }}
        />
        <SideItem
          label={t("nav.feedback", "Atsauksmes")}
          icon={<IconComment />}
          active={pathname === "/feedback"}
          compact={compact}
          onClick={() => {
            if (mobile) onOpenChange(false);
            setFeedbackKind("feedback");
          }}
        />
        <SideItem
          label={t("nav.contact", "Kontakti")}
          icon={<IconMail />}
          active={pathname === "/contact"}
          compact={compact}
          onClick={() => {
            if (mobile) onOpenChange(false);
            setContactOpen(true);
          }}
        />
        <SideItem
          label={t("nav.logout", "Iziet")}
          icon={<IconLogout />}
          compact={compact}
          onClick={() => {
            void logoutAccount().then(() => router.push("/"));
          }}
        />
      </div>

      <SiteFeedbackDialog
        kind={feedbackKind}
        account={account}
        notify={notify}
        onClose={() => setFeedbackKind(null)}
      />
      {contactOpen ? (
        <SiteContactDialog account={account} notify={notify} onClose={() => setContactOpen(false)} />
      ) : null}
      <StudioPlanPickerDrawer open={planPickerOpen} onClose={() => setPlanPickerOpen(false)} />
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
    </aside>
  );
}

export function SideItem({
  label,
  icon,
  active,
  compact,
  href,
  onClick,
  onNavigate,
  chevron,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  compact?: boolean;
  href?: string;
  onClick?: () => void;
  onNavigate?: () => void;
  chevron?: boolean;
}) {
  const tipRef = useRef<HTMLElement | null>(null);
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null);

  function placeTip() {
    if (!compact || window.matchMedia("(max-width: 699px)").matches) return;
    const rect = tipRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  }

  const className = `inline-flex h-9 w-full flex-none flex-row items-center gap-2 overflow-hidden rounded-xl text-left text-sm hover:bg-[var(--paper)] ${
    active ? "bg-[var(--paper)] shadow-sm" : ""
  }`;

  const body = (
    <>
      <span className="inline-grid h-9 w-9 shrink-0 place-items-center [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <span
        className={`min-w-0 flex-1 truncate transition-[opacity,max-width] duration-200 ${
          compact ? "pointer-events-none max-w-0 overflow-hidden opacity-0" : "max-w-none opacity-100"
        }`}
      >
        {label}
      </span>
      {chevron != null && !compact ? (
        <span className={`mr-2 shrink-0 text-[var(--muted)] transition-transform ${chevron ? "rotate-180" : ""}`}>
          <IconChevronDown />
        </span>
      ) : null}
    </>
  );

  return (
    <>
      {href ? (
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          aria-label={label}
          className={className}
          ref={(node) => {
            tipRef.current = node;
          }}
          onClick={onNavigate}
          onMouseEnter={placeTip}
          onMouseLeave={() => setTip(null)}
          onFocus={placeTip}
          onBlur={() => setTip(null)}
        >
          {body}
        </Link>
      ) : (
        <button
          type="button"
          aria-current={active ? "page" : undefined}
          aria-label={label}
          className={className}
          ref={(node) => {
            tipRef.current = node;
          }}
          onClick={onClick}
          onMouseEnter={placeTip}
          onMouseLeave={() => setTip(null)}
          onFocus={placeTip}
          onBlur={() => setTip(null)}
        >
          {body}
        </button>
      )}
      {tip
        ? createPortal(
            <span
              role="tooltip"
              style={{ top: tip.top, left: tip.left }}
              className="pointer-events-none fixed z-[70] -translate-y-1/2 rounded-md bg-white px-2 py-1 text-xs font-medium whitespace-nowrap text-[var(--ink)] ring-1 ring-[var(--line)]"
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 14a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66L11.5 6.84" strokeLinecap="round" />
      <path d="M14 10a4 4 0 0 0-5.66 0L5.5 12.83a4 4 0 1 0 5.66 5.66L12.5 17.16" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.5l1.9 1.1M17.2 15.4l1.9 1.1M4.9 16.5l1.9-1.1M17.2 8.6l1.9-1.1" strokeLinecap="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" strokeLinecap="round" />
      <path d="M14 8l4 4-4 4M18 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBug() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 8a4 4 0 1 1 8 0v2a4 4 0 0 1-8 0V8z" />
      <path d="M12 14v6M5 10H3M21 10h-2M6 18l-2 2M18 18l2 2M7 7 5 5M17 7l2-2" strokeLinecap="round" />
    </svg>
  );
}

function IconBulb() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 18h6M10 21h4" strokeLinecap="round" />
      <path d="M8 14a6 6 0 1 1 8 0c-.8.8-1.5 1.6-1.7 2.5h-4.6C9.5 15.6 8.8 14.8 8 14z" />
    </svg>
  );
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 6h14v10H8l-3 3V6z" strokeLinejoin="round" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 6 7.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
