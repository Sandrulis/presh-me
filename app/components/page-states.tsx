"use client";

import Link from "next/link";
import { Header } from "@/app/components/header";
import { LoadingScreen } from "@/app/components/loading-screen";
import { useTranslations } from "@/app/components/translations-provider";
import { isHandleFormat } from "@/app/lib/handles";

export function MissingHandle({ handle }: { handle: string }) {
  const claimable = isHandleFormat(handle);
  const { t } = useTranslations();
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-5 py-16">
        <p className="text-sm text-[var(--muted)]">presh.me/{handle}</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.04em]">
          {t("page.missing.title", "Šāds links vēl nav izveidots")}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {t("page.missing.body", "Paņem to sev un saliec portfolio lapu.")}
        </p>
        {claimable ? (
          <Link href={`/register?handle=${encodeURIComponent(handle)}`} className="btn-ink mt-6">
            {t("page.missing.claim", "Izveidot šo linku")}
          </Link>
        ) : (
          <Link href="/" className="btn-ink mt-6">
            {t("common.home", "Uz sākumu")}
          </Link>
        )}
      </main>
    </div>
  );
}

export function UnpublishedPage() {
  const { t } = useTranslations();
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-display text-4xl font-bold tracking-[-0.04em]">
          {t("page.unpublished.title", "Šī lapa vēl nav publicēta")}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {t("page.unpublished.body", "Īpašnieks to vēl tur melnrakstā.")}
        </p>
        <Link href="/" className="btn-ink mt-6">
          {t("common.home", "Uz sākumu")}
        </Link>
      </main>
    </div>
  );
}

export function PageSkeleton() {
  return <LoadingScreen label="page.loading" />;
}
