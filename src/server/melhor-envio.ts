/*
 * Cotação na API do Melhor Envio (Correios, Jadlog e outras numa chamada só).
 * Sem acesso ao banco: recebe os pacotes prontos, para os testes usarem um
 * `fetch` simulado. https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos
 */

export interface ShippingPackage {
  id: string;
  /** Centímetros. */
  largura: number;
  altura: number;
  comprimento: number;
  pesoGramas: number;
  /** Valor declarado de uma unidade (seguro), em centavos. */
  valorCentavos: number;
  quantidade: number;
}

export interface CarrierQuote {
  servico: string;
  prazoDias: number;
  valorCentavos: number;
}

export interface MelhorEnvioConfig {
  token: string;
  /** "sandbox" para testes, qualquer outro valor = produção. */
  ambiente?: string;
  /** Ids dos serviços aceitos, ex.: "1,2" (Correios PAC e SEDEX). Vazio = todos. */
  servicos?: string;
  /** Contato exigido pela API no User-Agent. */
  contato: string;
  fetch?: typeof fetch;
}

export class ShippingUnavailableError extends Error {}

interface ApiService {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
  company?: { name?: string };
}

const reaisToCents = (value: string) => Math.round(Number(value) * 100);

export async function quoteMelhorEnvio(
  config: MelhorEnvioConfig,
  origem: string,
  destino: string,
  pacotes: ShippingPackage[],
): Promise<CarrierQuote[]> {
  const host = config.ambiente === "sandbox" ? "https://sandbox.melhorenvio.com.br" : "https://www.melhorenvio.com.br";
  const body = {
    from: { postal_code: origem },
    to: { postal_code: destino },
    products: pacotes.map((p) => ({
      id: p.id,
      width: p.largura,
      height: p.altura,
      length: p.comprimento,
      weight: p.pesoGramas / 1000,
      insurance_value: p.valorCentavos / 100,
      quantity: p.quantidade,
    })),
    options: { receipt: false, own_hand: false },
    ...(config.servicos ? { services: config.servicos } : {}),
  };

  let response: Response;
  try {
    response = await (config.fetch ?? fetch)(`${host}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
        "User-Agent": `Mimos da Thaty (${config.contato})`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new ShippingUnavailableError(`Melhor Envio fora do ar: ${error instanceof Error ? error.message : error}`);
  }
  // 422: CEP de destino inválido ou inexistente
  if (response.status === 422) return [];
  if (!response.ok) {
    throw new ShippingUnavailableError(`Melhor Envio respondeu ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const services = (await response.json()) as ApiService[];
  if (!Array.isArray(services)) throw new ShippingUnavailableError("Resposta inesperada do Melhor Envio.");
  return services
    .filter((s) => !s.error && (s.custom_price ?? s.price))
    .map((s) => ({
      servico: [s.company?.name, s.name].filter(Boolean).join(" "),
      prazoDias: s.custom_delivery_time ?? s.delivery_time ?? 0,
      valorCentavos: reaisToCents((s.custom_price ?? s.price)!),
    }))
    .sort((a, b) => a.valorCentavos - b.valorCentavos);
}
