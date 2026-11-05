"use client";

import Link from "next/link";
import { useTranslations } from "@/app/components/translations-provider";
import { PageView } from "@/app/components/page-view";
import { localizeDemos } from "@/app/lib/demos";

const spots = [
  { handle: "asmens", top: "4%", left: "-10%", rotate: -11, z: 2 },
  { handle: "mara", top: "-8%", left: "24%", rotate: -4, z: 4 },
  { handle: "kafe", top: "1%", left: "58%", rotate: 8, z: 5 },
  { handle: "skaistums", top: "34%", left: "6%", rotate: 6, z: 6 },
  { handle: "zobarsts", top: "30%", left: "46%", rotate: -7, z: 3 },
  { handle: "niks", top: "52%", left: "70%", rotate: 12, z: 4 },
  { handle: "garaza", top: "64%", left: "-8%", rotate: -8, z: 3 },
  { handle: "adrese", top: "68%", left: "30%", rotate: 4, z: 5 },
];

export function AuthShowcase() {
  const { t } = useTranslations();
  const byHandle = new Map(localizeDemos(t).map((demo) => [demo.page.handle, demo]));

  return (
    <aside className="auth-stage relative min-h-[460px] overflow-hidden lg:min-h-screen" aria-hidden="true">
      {spots.map((spot) => {
        const demo = byHandle.get(spot.handle);
        if (!demo) return null;
        return (
          <Link
            key={spot.handle}
            href={`/${demo.page.handle}`}
            tabIndex={-1}
            className="absolute block h-[430px] w-[248px] overflow-hidden rounded-[28px] shadow-[0_28px_60px_rgba(48,24,90,0.18)] ring-1 ring-white/70"
            style={{
              top: spot.top,
              left: spot.left,
              zIndex: spot.z,
              transform: `rotate(${spot.rotate}deg)`,
            }}
          >
            <span
              className="pointer-events-none absolute left-0 top-0 origin-top-left"
              style={{ width: 400, height: 430 / 0.62, transform: "scale(0.62)" }}
            >
              <PageView page={demo.page} mode="preview" framed stretch />
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
