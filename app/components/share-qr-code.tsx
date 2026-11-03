"use client";

import { useEffect, useState } from "react";

export function ShareQrCode({ url, label }: { url: string; label: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("qrcode")
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(url, {
          width: 200,
          margin: 1,
          color: { dark: "#111111", light: "#ffffff" },
        }),
      )
      .then((next) => {
        if (!cancelled) setDataUrl(next);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!dataUrl) {
    return (
      <div className="mx-auto grid size-[200px] place-items-center rounded-2xl bg-[#eef1f6]" aria-hidden="true">
        <span className="size-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--ink)]" />
      </div>
    );
  }

  return (
    <img src={dataUrl} width={200} height={200} alt={label} className="mx-auto" />
  );
}
