import type { Metadata } from "next";
import { absoluteUrl, siteOgImageUrl } from "@/app/lib/site-url";

export function intentMetadata(input: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const url = absoluteUrl(input.path);
  const ogImage = siteOgImageUrl();
  return {
    title: { absolute: `${input.title} · Presh.Me` },
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${input.title} · Presh.Me`,
      description: input.description,
      url,
      type: "website",
      siteName: "Presh.Me",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} · Presh.Me`,
      description: input.description,
      images: [ogImage],
    },
  };
}
