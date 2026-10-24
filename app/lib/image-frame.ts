import type { CSSProperties } from "react";
import type { ImagePosition } from "@/app/lib/types";

export function panLimits(zoom: number) {
  const half = clamp(zoom, 100, 200) / 2;
  const min = Math.ceil(100 - half);
  const max = Math.floor(half);
  return { min, max: Math.max(min, max) };
}

export function imageFrame(x?: number, y?: number, zoom?: number) {
  const scale = clamp(zoom ?? 100, 100, 200);
  const limits = panLimits(scale);
  return {
    x: clamp(x ?? 50, limits.min, limits.max),
    y: clamp(y ?? 50, limits.min, limits.max),
    zoom: scale,
  };
}

export function pageImageFrame(position: ImagePosition | undefined, x?: number, y?: number, zoom?: number) {
  if (x == null && y == null) {
    const legacy =
      position === "top"
        ? { x: 50, y: 0 }
        : position === "bottom"
          ? { x: 50, y: 100 }
          : position === "left"
            ? { x: 0, y: 50 }
            : position === "right"
              ? { x: 100, y: 50 }
              : { x: 50, y: 50 };
    return imageFrame(legacy.x, legacy.y, zoom);
  }
  return imageFrame(x, y, zoom);
}

export function placedImageStyle(x: number, y: number, zoom: number, contain = false): CSSProperties {
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: contain ? "100%" : `${zoom}%`,
    height: contain ? "100%" : `${zoom}%`,
    transform: "translate(-50%, -50%)",
    objectFit: contain ? "contain" : "cover",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
