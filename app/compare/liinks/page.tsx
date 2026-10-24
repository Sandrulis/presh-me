import Link from "next/link";
import { ClaimForm } from "@/app/components/claim-form";
import { CompareTable } from "@/app/components/intent-landing";
import { Header } from "@/app/components/header";
import { SiteFooter } from "@/app/components/site-footer";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/compare/liinks",
  title: "Presh.Me vs Liinks",
  description:
    "How Presh.Me compares to Liinks-style link pages — honest notes, no copied marketing claims.",
});

export default function Page() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Compare</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
          Presh.Me and Liinks-style pages
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
          Several tools offer mobile-first link pages. Presh.Me focuses on a studio with live preview, themes and
          structured blocks. This table is directional — products change; verify current plans on each site.
        </p>
        <CompareTable
          title="Feature comparison"
          rows={[
            { feature: "Custom handle URL", us: "Yes", them: "Typically yes" },
            { feature: "Design themes", us: "Yes", them: "Varies" },
            { feature: "Rich blocks (FAQ, resume, embeds)", us: "Yes", them: "Varies by product" },
            { feature: "Ads on free page", us: "No ads in your page", them: "Check current free tier" },
            { feature: "Latvian / multi-language UI", us: "Yes (many UI languages)", them: "Varies" },
            { feature: "Open beta", us: "Free to build now", them: "Usually free + paid" },
          ]}
        />
        <div className="mt-10">
          <ClaimForm />
        </div>
        <p className="mt-8 text-sm text-[var(--muted)]">
          <Link href="/" className="underline-offset-2 hover:underline">
            ← Presh.Me
          </Link>
          {" · "}
          <Link href="/compare/linktree" className="underline-offset-2 hover:underline">
            vs Linktree
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
