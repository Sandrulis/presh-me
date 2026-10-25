"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AdminTodoDrawer } from "@/app/components/admin-todo-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import {
  countForAdminHref,
  fetchAdminNavCounts,
  type AdminNavCounts,
} from "@/app/lib/admin-nav-counts";
import { createClient } from "@/app/lib/supabase/client";
import { parseUmamiShareUrl } from "@/app/lib/integrations/umami/share";
import { getSessionId, isSessionAdmin, subscribeStore } from "@/app/lib/store";

type AdminSidebarProps = {
  open: boolean;
  mobile?: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminSidebar({ open, mobile = false, onOpenChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const compact = !open;
  const leaveTimer = useRef<number | null>(null);
  const [todoOpen, setTodoOpen] = useState(false);
  const [umamiNav, setUmamiNav] = useState(false);
  const [navCounts, setNavCounts] = useState<AdminNavCounts | null>(null);
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const isAdmin = useSyncExternalStore(subscribeStore, isSessionAdmin, () => false);

  useEffect(() => {
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("site_integrations")
          .select("is_enabled, configured_account_email")
          .eq("integration_key", "umami")
          .maybeSingle();
        setUmamiNav(
          Boolean(data?.is_enabled && parseUmamiShareUrl(data.configured_account_email ?? "")),
        );
      } catch {
        setUmamiNav(false);
      }
    })();
  }, [pathname]);

  useEffect(() => {
    if (!sessionId || !isAdmin) {
      setNavCounts(null);
      return;
    }
    let cancelled = false;
    async function refresh() {
      try {
        const counts = await fetchAdminNavCounts(sessionId!);
        if (!cancelled) setNavCounts(counts);
      } catch {
        if (!cancelled) setNavCounts(null);
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 45_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [sessionId, isAdmin, pathname, todoOpen]);

  const links = useMemo(() => {
    const items: { href: string; label: string; icon: ReactNode }[] = [
      { href: "/admin/users", label: t("admin.nav.users", "Lietotāji"), icon: <IconUsers /> },
      { href: "/admin/links", label: t("admin.nav.links", "Linki"), icon: <IconLink /> },
      { href: "/admin/feedback", label: t("admin.nav.feedback", "Ziņojumi"), icon: <IconInbox /> },
    ];
    if (umamiNav) {
      items.push({ href: "/admin/umami", label: "Umami", icon: <IconChart /> });
    }
    items.push(
      {
        href: "/admin/integrations",
        label: t("admin.nav.integrations", "Integrācijas"),
        icon: <IconPlug />,
      },
      { href: "/admin/modules", label: t("admin.nav.modules", "Moduļi"), icon: <IconModules /> },
      { href: "/admin/languages", label: t("admin.nav.languages", "Valodas"), icon: <IconLang /> },
      {
        href: "/admin/translations",
        label: t("admin.nav.translations", "Tulkojumi"),
        icon: <IconTranslate />,
      },
      {
        href: "/admin/email-templates",
        label: t("admin.nav.email_templates", "E-pasta dizaini"),
        icon: <IconMail />,
      },
      {
        href: "/admin/settings",
        label: t("admin.nav.settings", "Uzstādījumi"),
        icon: <IconGear />,
      },
    );
    return items;
  }, [umamiNav, t]);

  function clearLeaveTimer() {
    if (leaveTimer.current != null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }

  function onRailEnter() {
    if (mobile || todoOpen) return;
    clearLeaveTimer();
    onOpenChange(true);
  }

  function onRailLeave() {
    if (mobile) return;
    clearLeaveTimer();
    leaveTimer.current = window.setTimeout(() => onOpenChange(false), 120);
  }

  useEffect(() => () => clearLeaveTimer(), []);

  function openTodo() {
    clearLeaveTimer();
    onOpenChange(false);
    setTodoOpen(true);
  }

  return (
    <>
      <aside
        aria-label={t("admin.nav.panel", "Administrācijas panelis")}
        onMouseEnter={onRailEnter}
        onMouseLeave={onRailLeave}
        className={`fixed top-0 right-0 z-40 flex h-dvh flex-col overflow-hidden border-l border-[var(--line)] bg-white text-[var(--ink)] transition-[width,box-shadow,transform] duration-200 ease-out ${
          open ? "w-60 shadow-xl" : mobile ? "w-60 translate-x-full shadow-none" : "w-14"
        } ${mobile && open ? "translate-x-0" : ""}`}
      >
        {mobile ? (
          <div className="flex shrink-0 justify-end px-2.5 py-4">
            <button
              type="button"
              aria-label={t("admin.nav.close", "Aizvērt admin joslu")}
              onClick={() => onOpenChange(false)}
              className="grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)]"
            >
              <IconX />
            </button>
          </div>
        ) : (
          <div className="h-4 shrink-0" aria-hidden="true" />
        )}

        <nav className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 ${compact ? "" : "pl-4"}`} aria-label="Admin">
          <div className="flex flex-col gap-1">
            <AdminSideItem
              label={t("admin.nav.todo", "Todo")}
              icon={<IconTodo />}
              active={todoOpen}
              compact={compact}
              badge={navCounts?.todo}
              onClick={openTodo}
            />
            {links.map((item) => (
              <AdminSideItem
                key={item.href}
                label={item.label}
                icon={item.icon}
                href={item.href}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                compact={compact}
                badge={navCounts ? countForAdminHref(item.href, navCounts) : null}
                onNavigate={() => onOpenChange(false)}
              />
            ))}
          </div>
        </nav>
      </aside>

      <AdminTodoDrawer open={todoOpen} onClose={() => setTodoOpen(false)} />
    </>
  );
}

function formatNavBadge(value: number) {
  if (value > 99) return "99+";
  return String(value);
}

function NavCountBadge({ value, compact }: { value: number; compact?: boolean }) {
  const text = formatNavBadge(value);
  if (compact) {
    return (
      <span
        className="pointer-events-none absolute -top-0.5 -right-0.5 z-[1] inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full bg-[var(--ink)] px-1 text-[9px] font-semibold leading-none text-white tabular-nums"
        aria-hidden="true"
      >
        {text}
      </span>
    );
  }
  return (
    <span
      className="inline-flex min-h-[1.25rem] min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[var(--ink)] px-1.5 text-[10px] font-semibold leading-none text-white tabular-nums"
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

function AdminSideItem({
  label,
  icon,
  href,
  active,
  compact,
  badge,
  onClick,
  onNavigate,
}: {
  label: string;
  icon: ReactNode;
  href?: string;
  active?: boolean;
  compact?: boolean;
  badge?: number | null;
  onClick?: () => void;
  onNavigate?: () => void;
}) {
  const tipRef = useRef<HTMLElement | null>(null);
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null);

  function placeTip() {
    if (!compact || window.matchMedia("(max-width: 699px)").matches) return;
    const rect = tipRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ top: rect.top + rect.height / 2, left: rect.left - 8 });
  }

  const className = `inline-flex w-full flex-row-reverse items-center gap-2 overflow-hidden rounded-xl text-sm hover:bg-[var(--paper)] ${
    active ? "bg-[var(--paper)] shadow-sm" : ""
  }`;

  const showBadge = badge !== null && badge !== undefined;
  const ariaLabel = showBadge ? `${label} (${badge})` : label;

  const body = (
    <>
      <span className="relative inline-grid h-9 w-9 shrink-0 place-items-center [&_svg]:h-5 [&_svg]:w-5">
        {icon}
        {showBadge && compact ? <NavCountBadge value={badge} compact /> : null}
      </span>
      <span
        className={`flex min-w-0 flex-1 items-center justify-end gap-2 transition-opacity duration-200 ${
          compact ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {showBadge && !compact ? <NavCountBadge value={badge} /> : null}
        <span className="truncate text-right">{label}</span>
      </span>
    </>
  );

  return (
    <>
      {href ? (
        <Link
          ref={(node) => {
            tipRef.current = node;
          }}
          href={href}
          aria-current={active ? "page" : undefined}
          aria-label={ariaLabel}
          title={ariaLabel}
          onClick={onNavigate}
          onMouseEnter={placeTip}
          onMouseLeave={() => setTip(null)}
          onFocus={placeTip}
          onBlur={() => setTip(null)}
          className={className}
        >
          {body}
        </Link>
      ) : (
        <button
          type="button"
          ref={(node) => {
            tipRef.current = node;
          }}
          aria-pressed={active}
          aria-label={ariaLabel}
          title={ariaLabel}
          onClick={onClick}
          onMouseEnter={placeTip}
          onMouseLeave={() => setTip(null)}
          onFocus={placeTip}
          onBlur={() => setTip(null)}
          className={className}
        >
          {body}
        </button>
      )}
      {tip
        ? createPortal(
            <span
              role="tooltip"
              style={{ top: tip.top, left: tip.left }}
              className="pointer-events-none fixed z-[70] -translate-x-full -translate-y-1/2 rounded-md bg-white px-2 py-1 text-xs font-medium whitespace-nowrap text-[var(--ink)] ring-1 ring-[var(--line)]"
            >
              {ariaLabel}
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

function IconTodo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
      <path d="M4.5 6.2 5.7 7.4 7.8 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 12.2 5.7 13.4 7.8 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 18.2 5.7 19.4 7.8 17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 18.5c.8-2.6 2.8-4 5.5-4s4.7 1.4 5.5 4" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M14.2 18.5c.5-1.7 1.7-2.8 3.5-2.8 1.2 0 2.2.5 2.8 1.4" strokeLinecap="round" />
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

function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 13h4l2 3h4l2-3h4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z" strokeLinejoin="round" />
      <path d="M4 13 6.5 5.5A2 2 0 0 1 8.4 4h7.2a2 2 0 0 1 1.9 1.5L20 13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlug() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 7v4M15 7v4M8 11h8v2.5a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4V11Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17.5V20" strokeLinecap="round" />
    </svg>
  );
}

function IconModules() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconLang() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.8 3.8 5.6 3.8 8.5S14.5 17.7 12 20.5C9.5 17.7 8.2 14.9 8.2 12S9.5 6.3 12 3.5Z" strokeLinecap="round" />
    </svg>
  );
}

function IconTranslate() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h7M7.5 5v2.5A8.5 8.5 0 0 0 14 16" strokeLinecap="round" />
      <path d="M5 9.5h6.5M13 19l3.2-8 3.2 8M14.2 16.2h5.6" strokeLinecap="round" strokeLinejoin="round" />
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

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 8 7.5 5.5L19.5 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19h16M7 16V9M12 16V5M17 16v-4" strokeLinecap="round" />
    </svg>
  );
}
