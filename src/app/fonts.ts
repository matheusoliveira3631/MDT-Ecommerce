import { Great_Vibes, Nunito, Quicksand } from "next/font/google";

/** Logo provisório e palavras de destaque curtas (nunca abaixo de 30px). */
export const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-great-vibes",
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

export const fontVariables = [greatVibes.variable, quicksand.variable, nunito.variable].join(" ");
