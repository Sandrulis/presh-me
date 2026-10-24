import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MarketingHome } from "@/app/components/marketing-home";
import { SESSION_HINT_COOKIE } from "@/app/lib/auth/session-hint";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getLocaleSeoStatus } from "@/app/lib/seo/locale-completeness";
import { buildHomeMetadata } from "@/app/lib/seo/home-metadata";
import { createClient } from "@/app/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { languageCode } = await getServerTranslations();
  return buildHomeMetadata(languageCode);
}

function needsOnboarding(content: unknown) {
  const onboarding = (content as { onboarding?: { finished?: boolean } } | null)?.onboarding;
  return !onboarding || onboarding.finished === false;
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionHint = cookieStore.get(SESSION_HINT_COOKIE)?.value === "1";

  // Speed M8: skip Auth round-trip for anonymous visitors without a session hint cookie.
  if (sessionHint) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: pages } = await supabase
        .from("pages")
        .select("id, content")
        .eq("account_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      const page = pages?.[0];
      redirect(!page || needsOnboarding(page.content) ? "/start" : "/studio");
    }
  }

  const { t, languageCode } = await getServerTranslations();
  const status = await getLocaleSeoStatus(languageCode);
  return (
    <MarketingHome
      t={t}
      languageCode={languageCode}
      translationIncomplete={!status.indexable}
    />
  );
}
