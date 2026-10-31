import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { produtos } from "./db/schema";
import { quoteMelhorEnvio, ShippingUnavailableError, type ShippingPackage } from "./melhor-envio";

/*
 * Cotação de frete, sempre saindo do CEP da loja (CEP_ORIGEM, padrão 13732-000).
 *
 * Com MELHOR_ENVIO_TOKEN, cota de verdade no Melhor Envio com o peso e as
 * medidas de cada produto. Sem ele, usa FRETE_SIMULADO (desenvolvimento e
 * testes), ex.: "PAC:2590:8,SEDEX:4590:3" (serviço:centavos:dias úteis).
 */

export { ShippingUnavailableError };

export interface ShippingQuote {
  servico: string;
  prazo: string;
  /** `null` = valor ainda não disponível. */
  valorCentavos: number | null;
}

export interface ShippingItem {
  slug: string;
  quantidade: number;
}

export const CEP_ORIGEM = (process.env.CEP_ORIGEM || "13732000").replace(/\D/g, "");

/** Embalagem de uma unidade quando o produto não tem peso e medidas cadastrados (mínimo dos Correios). */
export const PACOTE_PADRAO = { pesoGramas: 200, largura: 11, altura: 2, comprimento: 16 };

const prazoTexto = (dias: number) => `${dias} ${dias === 1 ? "dia útil" : "dias úteis"}`;

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
    return { servico, valorCentavos: Number(centavos), prazo: prazoTexto(Number(dias)) };
  });
}

/** Pacotes dos produtos ativos, com o peso e as medidas cadastrados (ou o padrão). */
function packagesFor(itens: ShippingItem[]): ShippingPackage[] {
  const slugs = [...new Set(itens.map((i) => i.slug))];
  if (slugs.length === 0) return [];
  const rows = db.select().from(produtos).where(and(inArray(produtos.slug, slugs), eq(produtos.ativo, true))).all();
  const bySlug = new Map(rows.map((p) => [p.slug, p]));
  return itens.flatMap((item) => {
    const p = bySlug.get(item.slug);
    if (!p) return [];
    return [
      {
        id: p.slug,
        pesoGramas: p.pesoGramas ?? PACOTE_PADRAO.pesoGramas,
        largura: p.larguraCm ?? PACOTE_PADRAO.largura,
        altura: p.alturaCm ?? PACOTE_PADRAO.altura,
        comprimento: p.comprimentoCm ?? PACOTE_PADRAO.comprimento,
        valorCentavos: p.precoBaseCentavos ?? 0,
        quantidade: item.quantidade,
      },
    ];
  });
}

// Mesma cotação por alguns minutos: a sacola, o checkout e o fechamento do pedido veem o mesmo valor
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; quotes: ShippingQuote[] }>();

/**
 * Opções de frete para um CEP (8 dígitos) e os itens a enviar.
 * Lista vazia = CEP não encontrado. Lança ShippingUnavailableError se a
 * transportadora não responder.
 */
export async function quoteShipping(cep: string, itens: ShippingItem[]): Promise<ShippingQuote[]> {
  const destino = cep.replace(/\D/g, "");
  if (destino.length !== 8 || /^0+$/.test(destino)) return [];

  const token = process.env.MELHOR_ENVIO_TOKEN?.trim();
  if (!token) return simulatedOptions();

  const pacotes = packagesFor(itens);
  if (pacotes.length === 0) return [];
  const key = `${destino}|${pacotes.map((p) => `${p.id}:${p.quantidade}`).sort().join(",")}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.quotes;

  const result = await quoteMelhorEnvio(
    {
      token,
      ambiente: process.env.MELHOR_ENVIO_AMBIENTE,
      servicos: process.env.MELHOR_ENVIO_SERVICOS,
      contato: process.env.MELHOR_ENVIO_CONTATO || "contato@mimosdathaty.com.br",
    },
    CEP_ORIGEM,
    destino,
    pacotes,
  );
  const quotes = result.map((q) => ({ servico: q.servico, prazo: prazoTexto(q.prazoDias), valorCentavos: q.valorCentavos }));
  if (cache.size > 500) cache.clear();
  cache.set(key, { at: Date.now(), quotes });
  return quotes;
}
