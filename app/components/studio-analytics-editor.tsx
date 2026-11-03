"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { UmamiDashboard } from "@/app/components/admin-umami-dashboard";
import { FieldFrame } from "@/app/components/field-frame";
import { StudioGroup } from "@/app/components/studio-nav";
import { useTranslations } from "@/app/components/translations-provider";
import { sanitizeUmamiWebsiteId } from "@/app/lib/integrations/umami/sanitize";
import { parseUmamiShareUrl } from "@/app/lib/integrations/umami/share";
import type { UmamiRange, UmamiReportResult } from "@/app/lib/integrations/umami/share";
import type { Portfolio } from "@/app/lib/types";

const SAVE_DEBOUNCE_MS = 1000;

type Props = {
  page: Portfolio;
  update: (patch: Partial<Portfolio>) => void;
  onError: (message: string) => void;
  onSaved?: () => void;
  paidLocked: boolean;
};

export function StudioAnalyticsEditor({ page, update, onError, onSaved, paidLocked }: Props) {
  const { t } = useTranslations();
  const shareValid = Boolean(parseUmamiShareUrl(page.umamiShareUrl ?? ""));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareDraftRef = useRef(page.umamiShareUrl ?? "");

  shareDraftRef.current = page.umamiShareUrl ?? "";

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function clearDebounce() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }

  function notifySaved() {
    onSaved?.();
  }

  function scheduleSaved(validate: () => boolean) {
    clearDebounce();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      if (validate()) notifySaved();
    }, SAVE_DEBOUNCE_MS);
  }

  function flushSaved(validate: () => boolean) {
    clearDebounce();
    if (validate()) notifySaved();
  }

  async function loadReport(range: UmamiRange, timezone: string): Promise<UmamiReportResult> {
    const params = new URLSearchParams({
      pageId: page.id,
      range,
      timezone,
    });
    const res = await fetch(`/api/studio/umami/report?${params.toString()}`, { credentials: "same-origin" });
    const body = (await res.json()) as UmamiReportResult;
    return body;
  }

  function saveShareUrl(raw: string): boolean {
    const trimmed = raw.trim();
    if (!trimmed) {
      update({ umamiShareUrl: "" });
      notifySaved();
      return true;
    }
    if (!parseUmamiShareUrl(trimmed)) {
      onError(t("admin.integrations.umami_invalid_url", "Nederīga Umami Share URL."));
      return false;
    }
    update({ umamiShareUrl: trimmed });
    notifySaved();
    return true;
  }

  function shareDebouncedValid() {
    const trimmed = shareDraftRef.current.trim();
    if (!trimmed) return true;
    return Boolean(parseUmamiShareUrl(trimmed));
  }

  if (paidLocked) {
    return (
      <StudioGroup>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          {t(
            "studio.analytics.paid_required",
            "Analytics ir pieejams ar aktīvu abonementu, kas ietver šo moduli.",
          )}
        </p>
        <Link href="/settings" className="btn-line mt-3 inline-flex w-full justify-center">
          {t("studio.analytics.view_plans", "Skatīt plānus")}
        </Link>
      </StudioGroup>
    );
  }

  return (
    <StudioGroup>
      <p className="text-xs leading-relaxed text-[var(--muted)]">
        {t(
          "studio.analytics.hint",
          "Ievadi Umami Website ID publiskās lapas skaitīšanai un Share saiti, lai skatītu statistiku studijā.",
        )}
      </p>

      <FieldFrame label={t("admin.integrations.meta.umami.website_id", "Website ID")}>
        <input
          className="auth-field"
          value={page.umamiWebsiteId ?? ""}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            update({ umamiWebsiteId: sanitizeUmamiWebsiteId(event.target.value) });
            scheduleSaved(() => true);
          }}
          onBlur={() => flushSaved(() => true)}
        />
        <p className="mt-2 text-xs text-[var(--muted)]">
          {t(
            "studio.analytics.website_id_hint",
            "Izmanto sistēmas Umami skriptu; apmeklējumi tiek reģistrēti šim ID.",
          )}
        </p>
      </FieldFrame>

      <FieldFrame label={t("studio.analytics.share_url", "Umami Share saite")}>
        <input
          className="auth-field"
          value={page.umamiShareUrl ?? ""}
          placeholder="https://cloud.umami.is/share/…"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            const value = event.target.value;
            shareDraftRef.current = value;
            update({ umamiShareUrl: value });
            scheduleSaved(shareDebouncedValid);
          }}
          onBlur={(event) => {
            clearDebounce();
            saveShareUrl(event.target.value);
          }}
        />
        <p className="mt-2 text-xs text-[var(--muted)]">
          {t("admin.integrations.umami_share_hint", "Share saite no Umami — rāda analītiku studijā.")}
        </p>
      </FieldFrame>

      {shareValid ? (
        <div className="mt-6 border-t border-[var(--line)] pt-4">
          <UmamiDashboard loadReport={loadReport} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">
          {t("studio.analytics.share_required", "Saglabā derīgu Share saiti, lai redzētu statistiku.")}
        </p>
      )}
    </StudioGroup>
  );
}
