import Link from "next/link";
import type { ReactNode } from "react";
import { ClaimForm } from "@/app/components/claim-form";
import { Header } from "@/app/components/header";
import { JsonLd } from "@/app/components/json-ld";
import { SiteFooter } from "@/app/components/site-footer";
import { absoluteUrl, getPublicSiteUrl } from "@/app/lib/site-url";

export function IntentLanding({
  path,
  kicker,
  h1,
  lead,
  bullets,
  related,
}: {
  path: string;
  kicker: string;
  h1: string;
  lead: string;
  bullets: string[];
  related?: { href: string; label: string }[];
}) {
  const site = getPublicSiteUrl();
  const pageUrl = absoluteUrl(path);
  return (
    <div className="min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: h1,
          description: lead,
          isPartOf: { "@type": "WebSite", name: "Presh.Me", url: site },
          url: pageUrl,
        }}
      />
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{kicker}</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.035em] sm:text-5xl">{h1}</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)]">{lead}</p>
        <ul className="mt-8 space-y-3 text-sm leading-relaxed text-[var(--ink)]">
          {bullets.map((item) => (
            <li key={item}>— {item}</li>
          ))}
        </ul>
        <div className="mt-10">
          <ClaimForm />
        </div>
        {related?.length ? (
          <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted)]" aria-label="Related">
            {related.map((link) => (
              <Link key={link.href} href={link.href} className="underline-offset-2 hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

export function CompareTable({
  title,
  rows,
}: {
  title: string;
  rows: { feature: string; us: string; them: string }[];
}): ReactNode {
  return (
    <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--line)]">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">{title}</caption>
        <thead className="bg-[var(--paper)] text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          <tr>
            <th className="px-4 py-3">Feature</th>
            <th className="px-4 py-3">Presh.Me</th>
            <th className="px-4 py-3">Other</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {rows.map((row) => (
            <tr key={row.feature}>
              <td className="px-4 py-3 font-medium">{row.feature}</td>
              <td className="px-4 py-3">{row.us}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{row.them}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
