"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import { handleError, normalizeHandle } from "@/app/lib/handles";
import { checkHandleAvailable } from "@/app/lib/store";

export function ClaimForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const { t } = useTranslations();
  const [handle, setHandle] = useState(initial);
  const [pending, setPending] = useState(false);
  const { notices, notify, dismissNotice } = useNotices();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = normalizeHandle(handle);
    const invalid = handleError(next);
    if (invalid) {
      notify(invalid, "error");
      return;
    }
    setPending(true);
    const available = await checkHandleAvailable(next);
    setPending(false);
    if (!available) {
      notify(t("claim.taken", "Šis links jau ir aizņemts."), "error");
      return;
    }
    router.push(`/register?handle=${encodeURIComponent(next)}`);
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="w-full max-w-xl">
      <label className="sr-only" htmlFor="claim-handle">
        {t("claim.label", "Tavs links")}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white p-1.5 pl-4 shadow-[0_8px_30px_rgba(14,17,22,0.05)]">
        <span className="shrink-0 text-sm font-medium text-[var(--muted)]">presh.me/</span>
        <input
          id="claim-handle"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder={t("claim.placeholder", "vards")}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
        />
        <button type="submit" className="btn-ink shrink-0" disabled={pending}>
          {pending ? "…" : t("claim.submit", "Paņemt")}
        </button>
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {t("claim.hint", "3-24 simboli. Mazie burti, cipari un defise.")}
      </p>
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
    </form>
  );
}
