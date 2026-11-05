"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { PageView } from "@/app/components/page-view";
import { localizeDemos, type DemoProfile } from "@/app/lib/demos";

/** Cap DOM size on the marketing homepage. */
const MARQUEE_LIMIT = 10;

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function DemoMarquee() {
  const { t } = useTranslations();
  const localized = localizeDemos(t).slice(0, MARQUEE_LIMIT);
  const reduced = useReducedMotion();

  return (
    <section aria-label={t("demo.marquee.aria", "Parauga lapas")} className="space-y-4 py-2">
      <MarqueeRow items={localized} reduced={reduced} reverse={false} />
      <MarqueeRow items={[...localized].reverse()} reduced={reduced} reverse />
    </section>
  );
}

function MarqueeRow({
  items,
  reverse = false,
  reduced,
}: {
  items: DemoProfile[];
  reverse?: boolean;
  reduced: boolean;
}) {
  const track = reduced ? items : [...items, ...items];
  return (
    <div className="marquee-row marquee-mask">
      <div className={reverse && !reduced ? "marquee-track reverse" : reduced ? "flex gap-4" : "marquee-track"}>
        {track.map((demo, index) => {
          const clone = !reduced && index >= items.length;
          return (
            <DemoCard
              key={`${demo.page.handle}-${index}`}
              demo={demo}
              clone={clone}
            />
          );
        })}
      </div>
    </div>
  );
}

function DemoCard({ demo, clone }: { demo: DemoProfile; clone: boolean }) {
  const content = (
    <>
      <span className="relative block h-[360px] overflow-hidden rounded-[22px] shadow-[0_16px_40px_rgba(14,17,22,0.16)] ring-1 ring-black/10 transition-transform duration-300 group-hover:-translate-y-1">
        <span
          className="pointer-events-none absolute left-0 top-0 origin-top-left"
          style={{ width: 344, height: 360 / 0.64, transform: "scale(0.64)" }}
        >
          <PageView page={demo.page} mode="preview" framed stretch />
        </span>
      </span>
      <span className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
        <span className="text-sm font-semibold">{demo.role}</span>
        <span className="text-xs text-[var(--muted)]">/{demo.page.handle}</span>
      </span>
    </>
  );

  if (clone) {
    return (
      <div className="group block w-[220px] shrink-0" aria-hidden="true" inert>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/${demo.page.handle}`}
      className="group block w-[220px] shrink-0 no-underline"
      aria-label={`${demo.page.displayName}, ${demo.role}`}
    >
      {content}
    </Link>
  );
}
