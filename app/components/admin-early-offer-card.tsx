"use client";

import { useEffect, useRef, useState } from "react";
import { ToggleSwitch } from "@/app/components/admin-ui";
import { useTranslations } from "@/app/components/translations-provider";
import {
  loadSubscriptionEarlyOffer,
  saveSubscriptionEarlyOffer,
  type SubscriptionEarlyOffer,
} from "@/app/lib/site-admin/subscription-early-offer";

type Language = { code: string; name: string };

type Draft = {
  enabled: boolean;
  userLimit: string;
  freeMonths: string;
  extendable: boolean;
  notes: Record<string, string>;
};

function draftFromOffer(offer: SubscriptionEarlyOffer): Draft {
  return {
    enabled: offer.enabled,
    userLimit: String(offer.userLimit),
    freeMonths: String(offer.freeMonths),
    extendable: offer.extendable,
    notes: { ...offer.notes },
  };
}

export function AdminEarlyOfferCard({
  languages,
  onError,
  onSaved,
}: {
  languages: Language[];
  onError: (message: string) => void;
  onSaved: (message: string) => void;
}) {
  const { t } = useTranslations();
  const [offer, setOffer] = useState<SubscriptionEarlyOffer | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await loadSubscriptionEarlyOffer();
        if (cancelled) return;
        setOffer(next);
        setDraft(draftFromOffer(next));
      } catch (error) {
        if (!cancelled) {
          onErrorRef.current(
            error instanceof Error
              ? error.message
              : t("admin.subscription_plans.load_failed", "Neizdevās ielādēt abonementu plānus."),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (!draft || !offer) return null;

  const dirty =
    draft.enabled !== offer.enabled ||
    draft.extendable !== offer.extendable ||
    (Number.parseInt(draft.userLimit, 10) || 0) !== offer.userLimit ||
    (Number.parseInt(draft.freeMonths, 10) || 0) !== offer.freeMonths ||
    languages.some((language) => (draft.notes[language.code] ?? "") !== (offer.notes[language.code] ?? ""));

  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      const saved = await saveSubscriptionEarlyOffer({
        enabled: draft.enabled,
        userLimit: Number.parseInt(draft.userLimit, 10),
        freeMonths: Number.parseInt(draft.freeMonths, 10),
        extendable: draft.extendable,
        notes: draft.notes,
      });
      setOffer(saved);
      setDraft(draftFromOffer(saved));
      onSaved(t("admin.subscription_plans.early_saved", "Piedāvājums saglabāts."));
    } catch (error) {
      onError(
        error instanceof Error ? error.message : t("admin.subscription_plans.save_failed", "Neizdevās saglabāt."),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            {t("admin.subscription_plans.early_title", "Pirmie lietotāji")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            {t(
              "admin.subscription_plans.early_hint",
              "Viens piedāvājums visiem maksas plāniem. Pirmie X lietotāji saņem Y mēnešus bez maksas. Cena rādās ar zvaigznīti un piezīmi. Limitu var palielināt vēlāk.",
            )}
          </p>
        </div>
        <button type="button" className="btn-ink shrink-0" disabled={busy || !dirty} onClick={() => void save()}>
          {busy ? t("common.loading", "Ielādē...") : t("actions.save", "Saglabāt")}
        </button>
      </div>

      <p className="text-sm tabular-nums text-[var(--muted)]">
        {t("admin.subscription_plans.early_used", "Izmantots {used} no {limit}", {
          used: offer.claimed,
          limit: Number.parseInt(draft.userLimit, 10) || 0,
        })}
      </p>

      <label className="flex items-center gap-3">
        <ToggleSwitch
          checked={draft.enabled}
          disabled={busy}
          label={t("admin.subscription_plans.early_enabled", "Piedāvājums ieslēgts")}
          onChange={(checked) => setDraft((current) => (current ? { ...current, enabled: checked } : current))}
        />
        <span className="text-sm text-[var(--muted)]">
          {t(
            "admin.subscription_plans.early_enabled_hint",
            "Izslēgts piedāvājums nerādās un netiek piešķirts.",
          )}
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="auth-label">{t("admin.subscription_plans.early_users", "Lietotāju skaits")}</span>
          <input
            className="auth-field tabular-nums"
            inputMode="numeric"
            min={0}
            value={draft.userLimit}
            disabled={busy}
            onChange={(event) =>
              setDraft((current) => (current ? { ...current, userLimit: event.target.value } : current))
            }
          />
        </label>
        <label className="block">
          <span className="auth-label">{t("admin.subscription_plans.early_months", "Bezmaksas mēneši")}</span>
          <input
            className="auth-field tabular-nums"
            inputMode="numeric"
            min={0}
            max={24}
            value={draft.freeMonths}
            disabled={busy}
            onChange={(event) =>
              setDraft((current) => (current ? { ...current, freeMonths: event.target.value } : current))
            }
          />
        </label>
      </div>

      <label className="flex items-center gap-3">
        <ToggleSwitch
          checked={draft.extendable}
          disabled={busy}
          label={t("admin.subscription_plans.early_extendable", "Var pagarināt")}
          onChange={(checked) => setDraft((current) => (current ? { ...current, extendable: checked } : current))}
        />
        <span className="text-sm text-[var(--muted)]">
          {t(
            "admin.subscription_plans.early_extendable_hint",
            "Piezīmē parādās, ka piedāvājumu var pagarināt.",
          )}
        </span>
      </label>

      <div className="space-y-3">
        {languages.map((language) => (
          <label key={language.code} className="block">
            <span className="text-xs font-medium text-[var(--muted)]">
              * {t("admin.subscription_plans.early_note", "Piezīme")} · {language.name} ({language.code})
            </span>
            <textarea
              className="auth-field mt-1 min-h-16"
              maxLength={400}
              value={draft.notes[language.code] ?? ""}
              disabled={busy}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? { ...current, notes: { ...current.notes, [language.code]: event.target.value } }
                    : current,
                )
              }
            />
          </label>
        ))}
      </div>
    </section>
  );
}
