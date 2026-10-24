import Image from "next/image";
import type { CSSProperties } from "react";

/** Uses next/image for http(s) Storage URLs; falls back to <img> for data URLs / relative. */
export function PageMedia({
  src,
  alt = "",
  className,
  style,
  sizes = "100vw",
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
}) {
  if (!src) return null;
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} style={style} />;
  }
  if (!/^https?:\/\//i.test(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} style={style} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={1600}
      className={className}
      style={style}
      sizes={sizes}
      unoptimized
    />
  );
}
