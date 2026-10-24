"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { LANDING_FAQ_ITEMS } from "@/app/lib/landing-faq-items";

export function LandingFaq() {
  const { t } = useTranslations();
  const [openId, setOpenId] = useState<string | null>(LANDING_FAQ_ITEMS[0]?.q ?? null);

  return (
    <section className="border-t border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto max-w-3xl px-5 py-14">
        <h2 className="font-display text-3xl font-bold tracking-[-0.03em]">
          {t("landing.faq.title", "Biežāk uzdotie jautājumi")}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          {t("landing.faq.subtitle", "Īsas atbildes par Presh.Me lapu, linku un iestatīšanu.")}
        </p>
        <div className="mt-8 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-white">
          {LANDING_FAQ_ITEMS.map((item) => {
            const open = openId === item.q;
            return (
              <details
                key={item.q}
                open={open}
                className="group"
                onToggle={(event) => {
                  const el = event.currentTarget;
                  if (el.open) setOpenId(item.q);
                  else if (openId === item.q) setOpenId(null);
                }}
              >
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-[var(--ink)] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <span>{t(item.q, item.qFb)}</span>
                    <span
                      className={`mt-0.5 shrink-0 text-lg leading-none text-[var(--muted)] transition ${open ? "rotate-45" : ""}`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-[var(--muted)]">
                  {t(item.a, item.aFb)}
                  {item.q === "landing.faq.q10" ? (
                    <>
                      {" "}
                      <Link href="/contact" className="underline underline-offset-2 hover:text-[var(--ink)]">
                        {t("nav.contact", "Contact us")}
                      </Link>
                      .
                    </>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
