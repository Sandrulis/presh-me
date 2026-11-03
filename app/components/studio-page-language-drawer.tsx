"use client";

import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import {
  languageFlagEmoji,
  type LanguageCode,
} from "@/app/lib/i18n/language";
import {
  pagePublicLanguageLabel,
  resolvePagePublicLanguageCode,
} from "@/app/lib/i18n/resolve-page-public-language";
import type { Portfolio } from "@/app/lib/types";

export function StudioPageLanguageDrawer({
  open,
  page,
  onClose,
  update,
}: {
  open: boolean;
  page: Portfolio;
  onClose: () => void;
  update: (patch: Partial<Portfolio>) => void;
}) {
  const { t, languages } = useTranslations();
  const selected = resolvePagePublicLanguageCode(page.publicLanguageCode, languages);
  const visitorLabel = t("studio.language.visitor_default", "Apmeklētāja valoda");

  function pick(code: LanguageCode | null) {
    update({ publicLanguageCode: code ?? "" });
  }

  return (
    <SideDrawer
      open={open}
      side="left"
      title={t("studio.language.drawer_title", "Valoda")}
      hint={t(
        "studio.language.drawer_hint",
        "Izvēlies, kurā valodā rādīt lapas sistēmas tekstus (booking, contact u.c.).",
      )}
      onClose={onClose}
      ariaLabel={t("studio.language.drawer_aria", "Lapas valoda")}
    >
      <div className="grid gap-2">
        <LanguageChoice
          active={selected === null}
          flag={null}
          title={visitorLabel}
          subtitle={t(
            "studio.language.visitor_default_hint",
            "Pēc apmeklētāja valodas vai pārlūka.",
          )}
          onSelect={() => pick(null)}
        />
        {languages.map((language) => (
          <LanguageChoice
            key={language.code}
            active={selected === language.code}
            flag={languageFlagEmoji(language.code)}
            title={language.name}
            onSelect={() => pick(language.code)}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--muted)]">
        {t("studio.language.current", "Pašlaik: {label}", {
          label: pagePublicLanguageLabel(page.publicLanguageCode, languages, visitorLabel),
        })}
      </p>
    </SideDrawer>
  );
}

function LanguageChoice({
  active,
  flag,
  title,
  subtitle,
  onSelect,
}: {
  active: boolean;
  flag: string | null;
  title: string;
  subtitle?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--muted)] hover:bg-[var(--paper)]"
      }`}
    >
      {flag ? (
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[2rem] leading-none" aria-hidden translate="no">
          {flag}
        </span>
      ) : (
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--paper)] text-base"
          aria-hidden
        >
          ◐
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {subtitle ? (
          <span className={`mt-0.5 block text-xs ${active ? "text-white/80" : "text-[var(--muted)]"}`}>
            {subtitle}
          </span>
        ) : null}
      </span>
      {active ? (
        <span className="text-[10px] opacity-70" aria-hidden="true">
          ✓
        </span>
      ) : null}
    </button>
  );
}
