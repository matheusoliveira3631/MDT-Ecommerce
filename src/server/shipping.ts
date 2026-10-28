/*
 * Cotação de frete. Por enquanto simulada: a integração real (Melhor Envio ou
 * Correios) entra aqui, com a mesma assinatura, e o resto da loja não muda.
 *
 * FRETE_SIMULADO define as opções, ex.: "PAC:2590:8,SEDEX:4590:3"
 * (serviço:valor em centavos:prazo em dias úteis). Sem ela, o valor fica
 * indefinido e o pedido não pode ser fechado.
 */

export interface ShippingQuote {
  servico: string;
  prazo: string;
  /** `null` = valor ainda não disponível. */
  valorCentavos: number | null;
}

function simulatedOptions(): ShippingQuote[] {
  const config = process.env.FRETE_SIMULADO?.trim();
  if (!config) {
    return [
      { servico: "PAC", prazo: "[X] dias úteis", valorCentavos: null },
      { servico: "SEDEX", prazo: "[X] dias úteis", valorCentavos: null },
    ];
  }
  return config.split(",").map((entry) => {
    const [servico, centavos, dias] = entry.split(":").map((s) => s.trim());
    return { servico, valorCentavos: Number(centavos), prazo: `${dias} ${dias === "1" ? "dia útil" : "dias úteis"}` };
  });
}

/** Opções de frete para um CEP (8 dígitos). Lista vazia = CEP não encontrado. */
export async function quoteShipping(cep: string): Promise<ShippingQuote[]> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8 || /^0+$/.test(digits)) return [];
  return simulatedOptions();
}
