function rgbToHex(red: number, green: number, blue: number) {
  const channel = (value: number) =>
    Math.min(255, Math.max(0, value)).toString(16).padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

/** Sample a pixel from a displayed `<img>` (object-fit: cover). Returns null if outside image or tainted canvas. */
export function samplePixelFromImageElement(
  img: HTMLImageElement,
  clientX: number,
  clientY: number,
): string | null {
  const rect = img.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  if (!naturalW || !naturalH || rect.width <= 0 || rect.height <= 0) return null;

  const scale = Math.max(rect.width / naturalW, rect.height / naturalH);
  const renderedW = naturalW * scale;
  const renderedH = naturalH * scale;
  const offsetX = (rect.width - renderedW) / 2;
  const offsetY = (rect.height - renderedH) / 2;
  const nx = (localX - offsetX) / scale;
  const ny = (localY - offsetY) / scale;
  if (nx < 0 || ny < 0 || nx > naturalW || ny > naturalH) return null;

  const canvas = document.createElement("canvas");
  canvas.width = naturalW;
  canvas.height = naturalH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    ctx.drawImage(img, 0, 0);
  } catch {
    return null;
  }

  const px = Math.min(naturalW - 1, Math.max(0, Math.floor(nx)));
  const py = Math.min(naturalH - 1, Math.max(0, Math.floor(ny)));
  const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
  return rgbToHex(r, g, b);
}

export function supportsEyeDropper(): boolean {
  return typeof window !== "undefined" && "EyeDropper" in window;
}

export async function pickColorFromScreen(): Promise<string | null> {
  if (!supportsEyeDropper()) return null;
  type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };
  const EyeDropper = (window as Window & { EyeDropper?: EyeDropperCtor }).EyeDropper;
  if (!EyeDropper) return null;
  try {
    const dropper = new EyeDropper();
    const { sRGBHex } = await dropper.open();
    const hex = sRGBHex.trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(hex) ? hex : null;
  } catch {
    return null;
  }
}
