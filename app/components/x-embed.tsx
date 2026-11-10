"use client";

import { useEffect, useRef } from "react";
import { xStatusUrl } from "@/app/lib/social-embeds";

type Twttr = { widgets?: { load?: (element?: HTMLElement) => void } };

export function XEmbed({ source }: { source: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const statusUrl = xStatusUrl(source);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.replaceChildren();
    if (!statusUrl) return;
    const quote = document.createElement("blockquote");
    quote.className = "twitter-tweet";
    const link = document.createElement("a");
    link.href = statusUrl;
    link.textContent = statusUrl;
    quote.append(link);
    root.append(quote);

    let cancelled = false;
    const load = () => {
      if (cancelled) return;
      const twttr = (window as Window & { twttr?: Twttr }).twttr;
      if (twttr?.widgets?.load) {
        twttr.widgets.load(root);
        return;
      }
      window.setTimeout(load, 200);
    };
    if (!document.querySelector("script[data-x-widgets]")) {
      const script = document.createElement("script");
      script.src = "https://platform.x.com/widgets.js";
      script.async = true;
      script.dataset.xWidgets = "1";
      document.body.append(script);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [statusUrl]);

  if (!statusUrl) return null;
  return <div ref={rootRef} className="w-full overflow-hidden" />;
}
