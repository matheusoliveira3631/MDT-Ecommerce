import localFont from "next/font/local";

/*
 * Fontes do Google Fonts (licença SIL Open Font License) hospedadas no próprio
 * repositório, em src/app/fonts: o build não depende de baixar nada do Google.
 * Arquivos variáveis com o subconjunto latino (cobre ç, ã, é e afins).
 */

/** Nome da marca e palavras de destaque curtas, no traço de pincel da cartilha (nunca abaixo de 24px). */
export const dancingScript = localFont({
  src: "./fonts/dancing-script.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-dancing-script",
});

/** Títulos, nomes de produto e navegação. */
export const quicksand = localFont({
  src: "./fonts/quicksand.woff2",
  weight: "300 700",
  display: "swap",
  variable: "--font-quicksand",
});

/** Corpo, formulários, botões e preços. */
export const nunito = localFont({
  src: "./fonts/nunito.woff2",
  weight: "200 1000",
  display: "swap",
  variable: "--font-nunito",
});

export const fontVariables = [dancingScript.variable, quicksand.variable, nunito.variable].join(" ");
