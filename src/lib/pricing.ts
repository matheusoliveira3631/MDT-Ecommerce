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
}

export interface Totals {
  itens: number;
  subtotal: number | null;
  subtotalPix: number | null;
  /** `undefined` = frete ainda não escolhido (fica de fora do total). */
  shipping: number | null | undefined;
  /** `undefined` = sem cupom. */
  discount: number | null | undefined;
  discountPix: number | null | undefined;
  total: number | null;
  totalPix: number | null;
}

const sum = (values: Array<number | null>) =>
  values.some((v) => v == null) ? null : values.reduce<number>((acc, v) => acc + (v as number), 0);

export function couponDiscount(rule: CouponRule, subtotal: number): number {
  const raw = rule.tipo === "percentual" ? Math.round((subtotal * rule.valor) / 100) : rule.valor;
  // O desconto nunca passa do subtotal
  return Math.max(0, Math.min(raw, subtotal));
}

export function computeTotals(
  lines: PricedLine[],
  shippingCents: number | null | undefined,
  coupon: CouponRule | null | undefined,
): Totals {
  const itens = lines.reduce((acc, l) => acc + l.quantidade, 0);
  const subtotal = sum(lines.map((l) => (l.unitCents == null ? null : l.unitCents * l.quantidade)));
  const subtotalPix = sum(lines.map((l) => {
    const unit = l.unitPixCents ?? l.unitCents;
    return unit == null ? null : unit * l.quantidade;
  }));
  const discount = coupon ? (subtotal == null ? null : couponDiscount(coupon, subtotal)) : undefined;
  const discountPix = coupon ? (subtotalPix == null ? null : couponDiscount(coupon, subtotalPix)) : undefined;
  const shippingPart = shippingCents === undefined ? 0 : shippingCents;
  return {
    itens,
    subtotal,
    subtotalPix,
    shipping: shippingCents,
    discount,
    discountPix,
    total: sum([subtotal, shippingPart, discount === undefined ? 0 : discount == null ? null : -discount]),
    totalPix: sum([subtotalPix, shippingPart, discountPix === undefined ? 0 : discountPix == null ? null : -discountPix]),
  };
}

export const reaisToCents = (reais: number | null | undefined) => (reais == null ? null : Math.round(reais * 100));
export const centsToReais = (cents: number | null | undefined) => (cents == null ? null : cents / 100);
