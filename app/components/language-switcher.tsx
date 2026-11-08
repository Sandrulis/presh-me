"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";
import { setLanguageAction } from "@/app/lib/i18n/actions";
import {
  languageFlagEmoji,
  sortSwitcherLanguages,
  type LanguageCode,
  type UiLanguageOption,
} from "@/app/lib/i18n/language";
import { parseMarketingPathname } from "@/app/lib/seo/localized-slugs";
import { localeHomePath, localePath } from "@/app/lib/seo/locale-path";

const MENU_WIDTH_PX = 224;

function LanguageFlag({
  code,
  className = "inline-flex shrink-0 items-center justify-center text-[1.35rem] leading-none",
}: {
  code: LanguageCode;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden="true" translate="no">
      {languageFlagEmoji(code)}
    </span>
  );
}

function LanguageOptionButton({
  language,
  active,
  pending,
  onSelect,
}: {
  language: UiLanguageOption;
  active: boolean;
  pending: boolean;
  onSelect: (code: LanguageCode) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={pending}
      onClick={() => onSelect(language.code)}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--muted)] hover:bg-[var(--paper)]"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <LanguageFlag
        code={language.code}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[2rem] leading-none"
      />
      <span className="min-w-0 flex-1 font-medium">{language.name}</span>
      {active ? (
        <span className="text-[10px] opacity-70" aria-hidden="true">
          ✓
        </span>
      ) : null}
    </button>
  );
}

function LanguageSideDrawer({
  title,
  hint,
  closeLabel,
  children,
  onClose,
}: {
  title: string;
  hint: string;
  closeLabel: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  function requestClose() {
    if (!closing) setClosing(true);
  }

  useEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel) return;
    const panelAnim = panel.animate(
      closing
        ? [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }]
        : [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }],
      {
        duration: closing ? 240 : 280,
        easing: closing ? "ease-in" : "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
    const backdropAnim = backdrop?.animate(
      closing ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }],
      { duration: closing ? 200 : 240, easing: "ease", fill: "forwards" },
    );
    if (closing) panelAnim.onfinish = () => onCloseRef.current();
    return () => {
      panelAnim.cancel();
      backdropAnim?.cancel();
    };
  }, [closing]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || closing) return;
      event.preventDefault();
      requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closing]);

  return createPortal(
    <div className="option-drawer-shell option-drawer-shell--studio z-[80]">
      <button
        ref={backdropRef}
        type="button"
        aria-label={closeLabel}
        className="option-drawer-backdrop bg-[var(--ink)]/35"
        style={{ opacity: 0 }}
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="option-drawer z-[81] border-r border-[var(--line)]"
        style={{ transform: "translateX(-100%)" }}
      >
        <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-[var(--muted)]">{hint}</p>
          </div>
          <button
            type="button"
            className="btn-quiet"
            onClick={requestClose}
            aria-label={closeLabel}
            disabled={closing}
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function LanguageSwitcher({
  variant = "menu",
}: {
  variant?: "menu" | "stacked" | "compact";
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { languageCode, languages, t } = useTranslations();
  const pathname = usePathname() || "/";
  const marketingRoute = parseMarketingPathname(pathname);

  function targetUrlFor(language: LanguageCode) {
    if (!marketingRoute) return pathname;
    if (marketingRoute.canonical === "/") return localeHomePath(language);
    return localePath(language, marketingRoute.canonical);
  }
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);
  const options = sortSwitcherLanguages(languages);
  const current =
    options.find((language) => language.code === languageCode) ??
    options.find((language) => language.isDefault) ??
    options[0];
  const label = t("settings.language.title", "Valoda");
  const hint = t("settings.language.hint", "Sistēmas saskarnes valoda.");
  const closeLabel = t("actions.close", "Aizvērt");

  function normalizePath(path: string) {
    const trimmed = path.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
  }

  function switchLanguage(next: LanguageCode) {
    const target = targetUrlFor(next);
    if (next === languageCode && normalizePath(target) === normalizePath(pathname)) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await setLanguageAction(next);
      setOpen(false);
      // Full navigation so middleware can set locale cookies and layout reloads messages.
      window.location.assign(target);
    });
  }

  useLayoutEffect(() => {
    if (!open || variant === "stacked") {
      setMenuPos(null);
      return;
    }
    if (!triggerRef.current) return;

    function update() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let left = rect.left;
      if (left + MENU_WIDTH_PX > window.innerWidth - 8) {
        left = rect.right - MENU_WIDTH_PX;
      }
      left = Math.min(Math.max(8, left), window.innerWidth - MENU_WIDTH_PX - 8);
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 220;
      const next = openUp
        ? {
            left,
            bottom: window.innerHeight - rect.top + 4,
            maxHeight: Math.max(160, rect.top - 16),
          }
        : {
            left,
            top: rect.bottom + 4,
            maxHeight: Math.max(160, window.innerHeight - rect.bottom - 16),
          };
      setMenuPos((currentPos) =>
        currentPos &&
        currentPos.left === next.left &&
        currentPos.top === next.top &&
        currentPos.bottom === next.bottom &&
        currentPos.maxHeight === next.maxHeight
          ? currentPos
          : next,
      );
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, variant]);

  useEffect(() => {
    if (!open || variant === "stacked") return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, variant]);

  if (options.length <= 1) return null;

  if (variant === "stacked") {
    if (!current) return null;
    return (
      <>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`${label}: ${current.name}`}
          disabled={pending}
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-left text-sm text-[var(--ink)] transition hover:border-[var(--muted)] hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LanguageFlag
            code={current.code}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[2rem] leading-none"
          />
          <span className="min-w-0 flex-1 font-medium">{current.name}</span>
          <svg
            viewBox="0 0 16 16"
            className="size-4 shrink-0 text-[var(--muted)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M6 3.5 10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open ? (
          <LanguageSideDrawer
            title={label}
            hint={hint}
            closeLabel={closeLabel}
            onClose={() => setOpen(false)}
          >
            <div className="flex flex-col gap-2" role="radiogroup" aria-label={label}>
              {options.map((language) => (
                <LanguageOptionButton
                  key={language.code}
                  language={language}
                  active={language.code === languageCode}
                  pending={pending}
                  onSelect={switchLanguage}
                />
              ))}
            </div>
          </LanguageSideDrawer>
        ) : null}
      </>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className="flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-0.5"
        role="radiogroup"
        aria-label={label}
      >
        {options.map((language) => {
          const active = language.code === languageCode;
          return (
            <button
              key={language.code}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={language.name}
              disabled={pending}
              onClick={() => switchLanguage(language.code)}
              className={`inline-flex items-center justify-center rounded-md px-1.5 py-1.5 leading-none transition ${
                active ? "bg-[var(--ink)]" : "hover:bg-white"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <LanguageFlag code={language.code} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}${current ? `: ${current.name}` : ""}`}
        title={label}
        disabled={pending}
        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-1.5 leading-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
          open
            ? "bg-[var(--paper)] text-[var(--ink)]"
            : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
        }`}
      >
        <LanguageFlag
          code={languageCode}
          className="inline-flex size-6 items-center justify-center text-[1.45rem] leading-none"
        />
      </button>

      {open && menuPos
        ? createPortal(
            <div
              ref={dropdownRef}
              role="menu"
              style={{
                left: menuPos.left,
                top: menuPos.top,
                bottom: menuPos.bottom,
                maxHeight: menuPos.maxHeight,
              }}
              className="fixed z-[80] w-56 overflow-y-auto overscroll-contain rounded-xl border border-[var(--line)] bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,0.16)]"
              onWheel={(event) => event.stopPropagation()}
            >
              {options.map((language) => {
                const active = language.code === languageCode;
                const className = `flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-60 ${
                  active ? "font-medium text-[var(--ink)]" : "text-[var(--muted)]"
                }`;
                return (
                  <button
                    key={language.code}
                    type="button"
                    role="menuitem"
                    disabled={pending}
                    onClick={() => switchLanguage(language.code)}
                    className={className}
                  >
                    <LanguageFlag
                      code={language.code}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[2rem] leading-none"
                    />
                    <span className="min-w-0 flex-1 truncate">{language.name}</span>
                    {active ? (
                      <span className="text-[10px] text-[var(--muted)]" aria-hidden="true">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-block w-2.5" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
