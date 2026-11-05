export type { DemoProfile } from "@/app/lib/demo-profiles";
export { demos } from "@/app/lib/demo-profiles";

import type { Portfolio } from "@/app/lib/types";
import { demos, type DemoProfile } from "@/app/lib/demo-profiles";

type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

const byHandle = new Map(demos.map((item) => [item.page.handle, item.page]));

const mara = byHandle.get("mara");

export function getExample(handle: string) {
  if (handle === "paraugs" && mara) return { ...mara, handle: "paraugs" };
  return byHandle.get(handle) ?? null;
}

/** Apply UI-language copy to a demo profile (role, bio, link titles/notes). */
export function localizeDemoProfile(demo: DemoProfile, t: TranslateFn): DemoProfile {
  const handle = demo.page.handle;
  const prefix = `demo.${handle}`;
  const blocks = demo.page.blocks.map((block, index) => {
    if (block.type !== "link") return block;
    const n = index + 1;
    return {
      ...block,
      title: t(`${prefix}.l${n}.title`, block.title),
      note: block.note ? t(`${prefix}.l${n}.note`, block.note) : block.note,
    };
  });
  return {
    role: t(`${prefix}.role`, demo.role),
    theme: demo.theme,
    page: {
      ...demo.page,
      displayName: t(`${prefix}.name`, demo.page.displayName),
      bio: t(`${prefix}.bio`, demo.page.bio),
      blocks,
    },
  };
}

export function localizeDemoPage(page: Portfolio, t: TranslateFn): Portfolio {
  const sourceHandle = page.handle === "paraugs" ? "mara" : page.handle;
  const demo = demos.find((item) => item.page.handle === sourceHandle);
  if (!demo) return page;
  const localized = localizeDemoProfile(demo, t);
  return { ...localized.page, handle: page.handle, id: page.id };
}

export function localizeDemos(t: TranslateFn): DemoProfile[] {
  return demos.map((demo) => localizeDemoProfile(demo, t));
}
