import { centsToReais, computeTotals, reaisToCents, type CouponRule } from "./pricing";
import type { Product, ShippingOption } from "./types";

/** Personalização de um item da sacola (HANDOFF.md, seção 9). */
export interface Personalizacao {
  tema: string;
  temaOutro?: string;
  nome: string;
  idadeOcasiao?: string;
  cor: string;
  /** Só o nome do arquivo por enquanto; o upload depende do armazenamento (S3, R2 ou Supabase). */
  referenciaNome?: string;
  observacoes?: string;
}

export interface CartLine {
  id: string;
  produtoSlug: string;
  quantidade: number;
  personalizacao: Personalizacao;
}

export const OTHER_THEME = "Outro tema";

/** Dois itens do mesmo produto com personalizações diferentes são linhas separadas. */
export function sameLine(a: Pick<CartLine, "produtoSlug" | "personalizacao">, b: Pick<CartLine, "produtoSlug" | "personalizacao">) {
  return a.produtoSlug === b.produtoSlug && JSON.stringify(a.personalizacao) === JSON.stringify(b.personalizacao);
}

export function themeLabel(p: Personalizacao): string {
  return p.tema === OTHER_THEME && p.temaOutro ? p.temaOutro : p.tema;
}

export function nameLabel(p: Personalizacao): string {
  return p.idadeOcasiao ? `${p.nome} · ${p.idadeOcasiao}` : p.nome;
}

/** `null` quando o preço ainda não está cadastrado. */
export function lineTotal(product: Product | undefined, quantidade: number, pix = false): number | null {
  const unit = pix ? product?.precoPix : product?.precoBase;
  return unit == null ? null : unit * quantidade;
}

export interface CartTotals {
  itens: number;
  subtotal: number | null;
  subtotalPix: number | null;
}

/** Soma as linhas; se qualquer preço faltar, o valor vira `null` (placeholder na tela). */
export function cartTotals(lines: CartLine[], getProduct: (slug: string) => Product | undefined): CartTotals {
  let subtotal: number | null = 0;
  let subtotalPix: number | null = 0;
  let itens = 0;
  for (const line of lines) {
    const product = getProduct(line.produtoSlug);
    itens += line.quantidade;
    const total = lineTotal(product, line.quantidade);
    const totalPix = lineTotal(product, line.quantidade, true);
    subtotal = subtotal == null || total == null ? null : subtotal + total;
    subtotalPix = subtotalPix == null || totalPix == null ? null : subtotalPix + totalPix;
  }
  return { itens, subtotal, subtotalPix };
}

export interface OrderTotals extends CartTotals {
  /** `undefined` enquanto o frete não foi escolhido. */
  shipping: number | null | undefined;
  /** `undefined` sem cupom. */
  discount: number | null | undefined;
  total: number | null;
  totalPix: number | null;
}

/**
 * Totais em reais para a tela, calculados em centavos por computeTotals
 * (a mesma conta que o servidor faz ao fechar o pedido).
 */
export function orderTotals(
  lines: CartLine[],
  getProduct: (slug: string) => Product | undefined,
  shipping: ShippingOption | null | undefined,
  coupon: CouponRule | null | undefined,
): OrderTotals {
  const t = computeTotals(
    lines.map((l) => {
      const product = getProduct(l.produtoSlug);
      return { quantidade: l.quantidade, unitCents: reaisToCents(product?.precoBase), unitPixCents: reaisToCents(product?.precoPix) };
    }),
    shipping ? reaisToCents(shipping.valor) : undefined,
    coupon,
  );
  return {
    itens: t.itens,
    subtotal: centsToReais(t.subtotal),
    subtotalPix: centsToReais(t.subtotalPix),
    shipping: t.shipping === undefined ? undefined : centsToReais(t.shipping),
    discount: t.discount === undefined ? undefined : centsToReais(t.discount),
    total: centsToReais(t.total),
    totalPix: centsToReais(t.totalPix),
  };
}
