import Link from "next/link";
import { Header } from "@/app/components/header";
import type { LegalDocument } from "@/app/lib/legal/documents";
import { formatLegalDate } from "@/app/lib/legal/documents";
import { getServerTranslations } from "@/app/lib/i18n/server";

export async function LegalPage({
  document,
  extra,
}: {
  document: LegalDocument;
  extra?: React.ReactNode;
}) {
  const { t } = await getServerTranslations();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-5 py-14">
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em]">{document.title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {t("legal.updated", "Atjaunināts: {date}", { date: formatLegalDate(document.updatedAt) })}
        </p>

        <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label={t("legal.nav", "Juridiskās lapas")}>
          <Link href="/terms" className="underline underline-offset-2">
            {t("legal.nav.terms", "Noteikumi")}
          </Link>
          <Link href="/privacy" className="underline underline-offset-2">
            {t("legal.nav.privacy", "Privātums")}
          </Link>
          <Link href="/cookies" className="underline underline-offset-2">
            {t("legal.nav.cookies", "Sīkdatnes")}
          </Link>
        </nav>

        {extra ? <div className="mt-6">{extra}</div> : null}

        <div className="mt-8 flex flex-col gap-8 text-[15px] leading-relaxed text-[var(--muted)]">
          {document.intro?.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}

          {document.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-[var(--ink)]">{section.title}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((item) => (
                      <li key={item.slice(0, 48)}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {section.afterBullets?.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
