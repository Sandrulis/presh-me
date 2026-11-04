"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSiteBranding } from "@/app/components/site-branding-provider";
import { BRAND_LOGO_PATH, BRAND_MARK_P_PATH, brandAssetUrl } from "@/app/lib/site-admin/branding";

/** Square ink mark with “P” — same as studio sidebar. */
export function BrandMarkIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[9px] bg-[var(--ink)] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4">
        <path d={BRAND_MARK_P_PATH} fill="#f4f6fb" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  showLabel = true,
  labelClassName = "",
  className = "",
  onClick,
  ariaLabel,
}: {
  href?: string;
  showLabel?: boolean;
  labelClassName?: string;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const { systemName, hasCustomLogo, logoSrc, assetVersion } = useSiteBranding();
  const [remoteFailed, setRemoteFailed] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);

  useEffect(() => {
    setRemoteFailed(false);
    setProxyFailed(false);
  }, [logoSrc, assetVersion]);

  const label = systemName.trim() || "Presh";
  const linkAria = ariaLabel ?? label;
  const proxySrc = brandAssetUrl(BRAND_LOGO_PATH, assetVersion);
  const useRemote = Boolean(hasCustomLogo && logoSrc && !remoteFailed);
  const useProxy = Boolean(hasCustomLogo && remoteFailed && !proxyFailed);

  return (
    <Link
      href={href}
      aria-label={showLabel ? undefined : linkAria}
      onClick={onClick}
      className={`inline-flex min-w-0 items-center gap-2 no-underline ${className}`}
    >
      {useRemote ? (
        <img
          src={logoSrc!}
          alt=""
          className="h-9 w-auto max-w-[140px] shrink-0 object-contain object-left"
          onError={() => setRemoteFailed(true)}
        />
      ) : useProxy ? (
        <img
          src={proxySrc}
          alt=""
          className="h-9 w-auto max-w-[140px] shrink-0 object-contain object-left"
          onError={() => setProxyFailed(true)}
        />
      ) : (
        <BrandMarkIcon />
      )}
      {showLabel ? (
        <span
          className={`min-w-0 truncate font-display text-base font-bold tracking-[-0.04em] text-[var(--ink)] ${labelClassName}`}
        >
          {label}
        </span>
      ) : null}
    </Link>
  );
}
