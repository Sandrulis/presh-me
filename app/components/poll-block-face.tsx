"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { contrastInk, hasSolidColor, isTransparentColor } from "@/app/lib/color/surface";
import type { PollBlock } from "@/app/lib/types";
import type { Theme } from "@/app/lib/themes";

function voterStorageKey(blockId: string): string {
  return `presh-poll-voter-${blockId}`;
}

function readVoterKey(blockId: string): string {
  if (typeof window === "undefined") return "";
  const storageKey = voterStorageKey(blockId);
  let key = localStorage.getItem(storageKey);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(storageKey, key);
  }
  return key;
}

export function PollBlockFace({
  block,
  mode,
  theme,
  pageHandle,
}: {
  block: PollBlock;
  mode: "live" | "preview";
  theme: Theme;
  pageHandle: string;
}) {
  const { t } = useTranslations();
  const options = useMemo(() => block.options.filter((item) => item.label.trim()), [block.options]);
  const question = block.question.trim();
  const radius = Math.max(0, block.borderRadius ?? 8);
  const barRadius = Math.min(radius, 999);
  const borderWidth = Math.max(0, block.borderWidth ?? 0);
  const solidFill = hasSolidColor(block.color);
  const background = isTransparentColor(block.color) ? "transparent" : block.color?.trim() || undefined;
  const ink = solidFill ? contrastInk(block.color ?? "") : theme.text;
  const mutedInk = solidFill ? `${ink}99` : theme.muted;
  const progressFill = block.progressColor?.trim() || ink;
  const trackBg = solidFill ? `${ink}22` : `${theme.muted}33`;
  const borderColor =
    borderWidth > 0
      ? block.borderColor?.trim() || (solidFill ? `${ink}33` : theme.buttonBorder ?? "var(--line)")
      : undefined;
  const optionBorder = block.borderColor?.trim() || (theme.buttonBorder ?? "var(--line)");
  const cardPadding = solidFill || borderWidth > 0;

  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(options.map((o) => [o.id, 0])),
  );
  const [total, setTotal] = useState(0);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [previewVoteId, setPreviewVoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === "live");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showResults = mode === "preview" ? previewVoteId !== null : votedOptionId !== null;

  const refreshResults = useCallback(async () => {
    if (mode !== "live" || !pageHandle) {
      setLoading(false);
      return;
    }
    const voterKey = readVoterKey(block.id);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        handle: pageHandle,
        blockId: block.id,
        voterKey,
      });
      const response = await fetch(`/api/poll/results?${params}`);
      const data = (await response.json()) as {
        ok?: boolean;
        counts?: Record<string, number>;
        total?: number;
        votedOptionId?: string | null;
        error?: string;
      };
      if (data.ok && data.counts) {
        setCounts(data.counts);
        setTotal(data.total ?? 0);
        setVotedOptionId(data.votedOptionId ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [block.id, mode, pageHandle]);

  useEffect(() => {
    void refreshResults();
  }, [refreshResults]);

  if (!question || options.length < 2) return null;

  async function vote(optionId: string) {
    setError(null);
    if (mode === "preview") {
      setPreviewVoteId(optionId);
      const next = { ...counts };
      next[optionId] = (next[optionId] ?? 0) + 1;
      setCounts(next);
      setTotal((value) => value + 1);
      return;
    }
    if (votedOptionId || submitting) return;
    setSubmitting(true);
    try {
      const voterKey = readVoterKey(block.id);
      const response = await fetch("/api/poll/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: pageHandle,
          blockId: block.id,
          optionId,
          voterKey,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        const key = data.error ?? "errors.poll_unavailable";
        const fallbacks: Record<string, string> = {
          "errors.poll_invalid": "Nederīga aptauja.",
          "errors.poll_not_found": "Aptauja nav atrasta.",
          "errors.poll_unavailable": "Aptauja šobrīd nav pieejama.",
          "errors.poll_already_voted": "Tu jau esi nobalsojis.",
          "errors.rate_limit": "Pārāk daudz pieprasījumu. Mēģini vēlāk.",
        };
        setError(t(key, fallbacks[key] ?? "Kļūda"));
        if (data.error === "errors.poll_already_voted") {
          await refreshResults();
        }
        return;
      }
      await refreshResults();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`w-full text-left${cardPadding ? " px-4 py-4" : ""}`}
      style={{
        background,
        color: ink,
        borderRadius: radius,
        border: borderColor ? `${borderWidth}px solid ${borderColor}` : undefined,
      }}
    >
      <p className="mb-3 text-center text-base font-semibold" style={{ color: ink }}>
        {question}
      </p>
      {error ? (
        <p className="mb-2 text-center text-xs text-[var(--stamp)]" role="alert">
          {error}
        </p>
      ) : null}
      {loading && mode === "live" ? (
        <div className="h-16 w-full animate-pulse rounded-lg bg-black/10" aria-busy="true" />
      ) : showResults ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {options.map((option) => {
            const count = counts[option.id] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const chosen = (mode === "preview" ? previewVoteId : votedOptionId) === option.id;
            return (
              <li key={option.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className={`min-w-0 truncate ${chosen ? "font-semibold" : ""}`} style={{ color: ink }}>
                    {option.label.trim()}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs opacity-70" style={{ color: mutedInk }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden" style={{ background: trackBg, borderRadius: barRadius }}>
                  <div
                    className="h-full transition-[width] duration-300"
                    style={{ width: `${pct}%`, background: progressFill, borderRadius: barRadius }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                disabled={submitting}
                className="w-full border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60"
                style={{
                  color: ink,
                  borderColor: optionBorder,
                  borderRadius: Math.max(4, radius - 2),
                }}
                onClick={() => void vote(option.id)}
              >
                {option.label.trim()}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
