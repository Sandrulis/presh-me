import Link from "next/link";
import { ClaimForm } from "@/app/components/claim-form";
import { CompareTable } from "@/app/components/intent-landing";
import { Header } from "@/app/components/header";
import { SiteFooter } from "@/app/components/site-footer";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/compare/linktree",
  title: "Presh.Me vs Linktree",
  description:
    "Honest comparison of Presh.Me and Linktree-style link-in-bio tools — features that matter for a clean personal page.",
});

export default function Page() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Compare</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
          Presh.Me and Linktree-style tools
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
          Linktree popularized the bio link list. Presh.Me is built as a small personal site: themes, blocks and a studio
          preview — not a claim that every Linktree feature is cloned. We do not run their ads or import product yet.
        </p>
        <CompareTable
          title="Feature comparison"
          rows={[
            { feature: "One public URL", us: "Yes (presh.me/you)", them: "Yes" },
            { feature: "Visual themes / fonts", us: "Yes, live preview", them: "Varies by plan" },
            { feature: "Blocks (text, media, FAQ)", us: "Yes", them: "Links-first; extras vary" },
            { feature: "Ads on free bio", us: "No ads in your page", them: "Often monetized free tiers" },
            { feature: "Import from Linktree", us: "Planned — not shipping yet", them: "N/A" },
            { feature: "Open beta pricing", us: "Build free in beta", them: "Free + paid plans" },
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
          <Link href="/compare/liinks" className="underline-offset-2 hover:underline">
            vs Liinks
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
