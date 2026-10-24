import { Geist, Geist_Mono } from "next/font/google";

/** Landing / marketing: only brand UI fonts (preload). Theme fonts load in studio/public layouts. */
const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-mono",
  preload: false,
});

export const fontClassName = geist.className;
export const fontVariables = [geist, geistMono].map((face) => face.variable).join(" ");
