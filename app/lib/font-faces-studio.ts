import {
  Caveat,
  Comfortaa,
  DM_Sans,
  Inter,
  JetBrains_Mono,
  Libre_Baskerville,
  Lora,
  Manrope,
  Montserrat,
  Nunito,
  Outfit,
  Playfair_Display,
  Source_Serif_4,
  Space_Grotesk,
} from "next/font/google";

/** LV/EN need latin-ext; script/mono stay latin-only to cut bytes (speed M6). */
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", preload: false });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope", preload: false });
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-dm-sans", preload: false });
const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-outfit", preload: false });
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  preload: false,
});
const nunito = Nunito({ subsets: ["latin", "latin-ext"], variable: "--font-nunito", preload: false });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space-grotesk",
  preload: false,
});
const lora = Lora({ subsets: ["latin", "latin-ext"], variable: "--font-lora", preload: false });
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  preload: false,
});
const libre = Libre_Baskerville({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-libre",
  preload: false,
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-serif",
  preload: false,
});
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", preload: false });
const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  preload: false,
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  preload: false,
});

/** Theme / studio / public profile fonts — loaded only where needed. */
export const studioFontVariables = [
  inter,
  manrope,
  dmSans,
  outfit,
  montserrat,
  nunito,
  spaceGrotesk,
  lora,
  playfair,
  libre,
  sourceSerif,
  caveat,
  comfortaa,
  jetbrains,
]
  .map((face) => face.variable)
  .join(" ");
