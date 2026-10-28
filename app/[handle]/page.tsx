import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageView } from "@/app/components/page-view";
import { MissingHandle } from "@/app/components/page-states";
import { localizeDemoPage } from "@/app/lib/demos";
import { getExample } from "@/app/lib/examples";
import { isHandleFormat, normalizeHandle } from "@/app/lib/handles";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { publicShareImage, truncateMeta } from "@/app/lib/seo/json-ld";
import {
  loadPageByHandle,
  profileCanonicalUrl,
  profileIsIndexable,
} from "@/app/lib/seo/public-page";
import { siteOgImageUrl } from "@/app/lib/site-url";
import { shouldRedirectPublicProfileAway } from "@/app/lib/trial/public-trial-access";

type HandlePageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: HandlePageProps): Promise<Metadata> {
  const { handle: raw } = await params;
  const handle = normalizeHandle(decodeURIComponent(raw));
  if (!isHandleFormat(handle)) {
    return { title: handle || "Presh.Me", robots: { index: false, follow: false } };
  }

  const page = await loadPageByHandle(handle);
  if (!page) {
    return {
      title: handle,
      description: "This Presh.Me link is available. Create your page.",
      robots: { index: false, follow: false },
    };
  }

  const indexable = profileIsIndexable(page);

  if (!page.published) {
    return {
      title: handle,
      robots: { index: false, follow: false },
    };
  }

  const titleBase = page.displayName.trim() || page.handle;
  const title = `${titleBase} · Presh.Me`;
  const description = truncateMeta(
    page.bio.trim() ||
      `${titleBase} on Presh.Me — links, work and contact in one page.`,
  );
  const canonical = profileCanonicalUrl(page.handle);
  const image = publicShareImage(page.avatarUrl) || siteOgImageUrl();

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      siteName: "Presh.Me",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function HandlePage({ params }: HandlePageProps) {
  const { handle: raw } = await params;
  const handle = normalizeHandle(decodeURIComponent(raw));
  if (!isHandleFormat(handle)) return <MissingHandle handle={handle || raw} />;

  const example = getExample(handle);
  if (example) {
    const { t } = await getServerTranslations();
    return <PageView page={localizeDemoPage(example, t)} mode="live" />;
  }

  const page = await loadPageByHandle(handle);
  if (!page || page.accountId === "example") {
    return <MissingHandle handle={handle} />;
  }

  if (await shouldRedirectPublicProfileAway(page)) {
    redirect("/");
  }

  return <PageView page={page} mode="live" />;
}
