import type { Metadata } from "next";

/** Auth, studio, admin, support forms — keep out of search indexes. */
export const privateRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function privatePageMetadata(title: string): Metadata {
  return {
    title,
    robots: privateRobots,
  };
}
