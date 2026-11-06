/*
 * Cálculo do pedido em centavos inteiros (sem erro de arredondamento).
 * Função pura: roda igual no navegador (exibição) e no servidor (o que é cobrado).
 * `null` = valor ainda não definido (preço sem cadastro, frete sem valor...).
 */

export interface PricedLine {
  quantidade: number;
  unitCents: number | null;
  /** Preço unitário no Pix; sem ele, o Pix usa o preço normal. */
  unitPixCents: number | null;
}

/** Regra do cupom. `percentual`: 10 = 10%. `fixo`: valor em centavos. */
export interface CouponRule {
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  /** Subtotal mínimo em centavos; abaixo dele o cupom não desconta nada. */
  minimoCentavos?: number | null;
}

import { nextTier, tierFor, type CartTier } from "./promo";

export interface Totals {
  itens: number;
  subtotal: number | null;
  subtotalPix: number | null;
  /** `undefined` = frete ainda não escolhido (fica de fora do total). */
  shipping: number | null | undefined;
  /** `undefined` = sem cupom e sem desconto progressivo. */
  discount: number | null | undefined;
  discountPix: number | null | undefined;
  /** Qual desconto valeu: os dois não somam, vale o maior. */
  discountSource: "cupom" | "progressivo" | undefined;
  /** Faixa do desconto progressivo alcançada (mesmo que o cupom tenha dado mais). */
  tier: CartTier | null;
  /** Próxima faixa, para o aviso "Faltam R$ X para ganhar Y%". */
  nextTier: CartTier | null;
  total: number | null;
  totalPix: number | null;
}

const sum = (values: Array<number | null>) =>
  values.some((v) => v == null) ? null : values.reduce<number>((acc, v) => acc + (v as number), 0);

/** `minimoBase`: o subtotal que confere a compra mínima (o normal, mesmo quando o desconto é sobre o do Pix). */
export function couponDiscount(rule: CouponRule, subtotal: number, minimoBase = subtotal): number {
  if (rule.minimoCentavos != null && minimoBase < rule.minimoCentavos) return 0;
  const raw = rule.tipo === "percentual" ? Math.round((subtotal * rule.valor) / 100) : rule.valor;
  // O desconto nunca passa do subtotal
  return Math.max(0, Math.min(raw, subtotal));
}

const tierDiscount = (tier: CartTier, subtotal: number) => Math.round((subtotal * tier.percentual) / 100);

/**
 * Totais do pedido. Desconto progressivo (por faixa de subtotal) e cupom não
 * somam: vale o que der mais desconto. A faixa é escolhida pelo subtotal
 * normal e o percentual vale também sobre o subtotal do Pix.
 */
export function computeTotals(
  lines: PricedLine[],
  shippingCents: number | null | undefined,
  coupon: CouponRule | null | undefined,
  tiers: CartTier[] = [],
): Totals {
  const itens = lines.reduce((acc, l) => acc + l.quantidade, 0);
  const subtotal = sum(lines.map((l) => (l.unitCents == null ? null : l.unitCents * l.quantidade)));
  const subtotalPix = sum(lines.map((l) => {
    const unit = l.unitPixCents ?? l.unitCents;
    return unit == null ? null : unit * l.quantidade;
  }));

  const tier = subtotal == null ? null : tierFor(tiers, subtotal);
  let source: Totals["discountSource"];
  if (tier && subtotal != null) {
    source = coupon && couponDiscount(coupon, subtotal) >= tierDiscount(tier, subtotal) ? "cupom" : "progressivo";
  } else if (coupon) {
    source = "cupom";
  }
  const discountOn = (base: number | null) =>
    source === undefined
      ? undefined
      : base == null
        ? null
        : source === "cupom"
          ? couponDiscount(coupon!, base, subtotal ?? base)
          : tierDiscount(tier!, base);
  const discount = discountOn(subtotal);
  const discountPix = discountOn(subtotalPix);

  const shippingPart = shippingCents === undefined ? 0 : shippingCents;
  return {
    itens,
    subtotal,
    subtotalPix,
    shipping: shippingCents,
    discount,
    discountPix,
    discountSource: source,
    tier,
    nextTier: subtotal == null ? null : nextTier(tiers, subtotal),
    total: sum([subtotal, shippingPart, discount === undefined ? 0 : discount == null ? null : -discount]),
    totalPix: sum([subtotalPix, shippingPart, discountPix === undefined ? 0 : discountPix == null ? null : -discountPix]),
  };
}

export const reaisToCents = (reais: number | null | undefined) => (reais == null ? null : Math.round(reais * 100));
export const centsToReais = (cents: number | null | undefined) => (cents == null ? null : cents / 100);
