/*
 * Retirada na loja, em Mococa/SP, para quem mora na região. A região são os
 * CEPs que começam com os prefixos de RETIRADA_CEPS (padrão "137": Mococa,
 * Casa Branca, São José do Rio Pardo, Tambaú, Vargem Grande do Sul e vizinhas).
 * RETIRADA_CEPS vazio de propósito ("-") desliga a retirada.
 */

export const RETIRADA_SERVICO = "Retirada em Mococa/SP";

export function pickupPrefixes(config = process.env.RETIRADA_CEPS): string[] {
  const value = config?.trim() || "137";
  if (value === "-") return [];
  return value
    .split(",")
    .map((p) => p.replace(/\D/g, ""))
    .filter(Boolean);
}

/** A retirada vale para este CEP (8 dígitos)? */
export function pickupAvailable(cep: string, prefixes = pickupPrefixes()): boolean {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8 && prefixes.some((p) => digits.startsWith(p));
}

export const pickupQuote = () => ({
  servico: RETIRADA_SERVICO,
  prazo: "Combinamos dia e horário pelo WhatsApp",
  valorCentavos: 0,
});
