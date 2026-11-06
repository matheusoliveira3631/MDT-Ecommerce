/*
 * Promoções. Funções puras: a vitrine (exibição) e o fechamento do pedido
 * (o que é cobrado) usam as mesmas regras.
 */

/* ---------- Por produto: "de R$ X por R$ Y" ---------- */

export interface PromoFields {
  precoBaseCentavos: number | null;
  precoPixCentavos: number | null;
  precoPromoCentavos: number | null;
  promoInicioEm: Date | null;
  promoFimEm: Date | null;
}

export interface EffectivePrices {
  /** Preço que vale agora (o promocional, durante a promoção). */
  base: number | null;
  pix: number | null;
  /** Preço "de", riscado; `null` fora de promoção. */
  de: number | null;
}

export function promoActive(p: PromoFields, agora = Date.now()): boolean {
  return (
    p.precoPromoCentavos != null &&
    p.precoBaseCentavos != null &&
    p.precoPromoCentavos < p.precoBaseCentavos &&
    (!p.promoInicioEm || agora >= p.promoInicioEm.getTime()) &&
    (!p.promoFimEm || agora <= p.promoFimEm.getTime())
  );
}

/** Preços em centavos que valem agora. No Pix, a promoção mantém o mesmo desconto do Pix sobre o preço normal. */
export function effectivePrices(p: PromoFields, agora = Date.now()): EffectivePrices {
  if (!promoActive(p, agora)) return { base: p.precoBaseCentavos, pix: p.precoPixCentavos, de: null };
  const promo = p.precoPromoCentavos!;
  const base = p.precoBaseCentavos!;
  const pix = p.precoPixCentavos == null ? null : Math.round((promo * p.precoPixCentavos) / base);
  return { base: promo, pix, de: base };
}

/** "-15%" para o selo, arredondado para baixo (nunca promete mais do que dá). */
export function promoPercent(de: number, por: number): number {
  return Math.floor(((de - por) / de) * 100);
}

/* ---------- Por carrinho: desconto progressivo ---------- */

export interface CartTier {
  /** Subtotal mínimo em centavos. */
  minimoCentavos: number;
  /** 10 = 10%. */
  percentual: number;
}

/** Faixa que vale para o subtotal (a de maior mínimo alcançado), ou `null`. */
export function tierFor(tiers: CartTier[], subtotalCentavos: number): CartTier | null {
  return tiers.filter((t) => subtotalCentavos >= t.minimoCentavos).sort((a, b) => b.minimoCentavos - a.minimoCentavos)[0] ?? null;
}

/** Próxima faixa ainda não alcançada, para o aviso "Faltam R$ X para ganhar Y%". */
export function nextTier(tiers: CartTier[], subtotalCentavos: number): CartTier | null {
  const current = tierFor(tiers, subtotalCentavos);
  return (
    tiers
      .filter((t) => t.minimoCentavos > subtotalCentavos && t.percentual > (current?.percentual ?? 0))
      .sort((a, b) => a.minimoCentavos - b.minimoCentavos)[0] ?? null
  );
}
