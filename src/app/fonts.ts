import { Dancing_Script, Nunito, Quicksand } from "next/font/google";

/** Nome da marca e palavras de destaque curtas, no traço de pincel da cartilha (nunca abaixo de 24px). */
export const dancingScript = Dancing_Script({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dancing-script",
});

/** Títulos, nomes de produto e navegação. */
export const quicksand = Quicksand({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-quicksand",
});

/** Corpo, formulários, botões e preços. */
export const nunito = Nunito({
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const fontVariables = [dancingScript.variable, quicksand.variable, nunito.variable].join(" ");
