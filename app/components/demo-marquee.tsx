"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { PageView } from "@/app/components/page-view";
import type { Portfolio } from "@/app/lib/types";

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

export function DemoMarquee({ pages }: { pages: Portfolio[] }) {
  const { t } = useTranslations();
  const reduced = useReducedMotion();
  if (pages.length === 0) return null;

  return (
    <section aria-label={t("demo.marquee.aria", "Parauga lapas")} className="py-2">
      <MarqueeRow items={pages} reduced={reduced} />
    </section>
  );
}

function MarqueeRow({
  items,
  reduced,
}: {
  items: Portfolio[];
  reduced: boolean;
}) {
  const track = reduced ? items : [...items, ...items];
  return (
    <div className="marquee-row marquee-mask">
      <div className={reduced ? "flex gap-4" : "marquee-track"}>
        {track.map((page, index) => {
          const clone = !reduced && index >= items.length;
          return (
            <DemoCard
              key={`${page.handle}-${index}`}
              page={page}
              clone={clone}
            />
          );
        })}
      </div>
    </div>
  );
}

function DemoCard({ page, clone }: { page: Portfolio; clone: boolean }) {
  const content = (
    <>
      <span className="relative block h-[360px] overflow-hidden rounded-[22px] shadow-[0_16px_40px_rgba(14,17,22,0.16)] ring-1 ring-black/10 transition-transform duration-300 group-hover:-translate-y-1">
        <span
          className="pointer-events-none absolute left-0 top-0 origin-top-left"
          style={{ width: 344, height: 360 / 0.64, transform: "scale(0.64)" }}
        >
          <PageView page={page} mode="preview" framed stretch />
        </span>
      </span>
      <span className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
        <span className="truncate text-sm font-semibold">{page.displayName}</span>
        <span className="shrink-0 text-xs text-[var(--muted)]">/{page.handle}</span>
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
      href={`/${page.handle}`}
      className="group block w-[220px] shrink-0 no-underline"
      aria-label={page.displayName}
    >
      {content}
    </Link>
  );
}
