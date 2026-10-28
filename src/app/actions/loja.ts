"use server";

import type { CouponRule } from "@/lib/pricing";
import type { ShippingOption } from "@/lib/types";
import { findCoupon } from "@/server/coupons";
import { quoteShipping } from "@/server/shipping";

/*
 * Consultas públicas feitas pelo navegador. O cálculo final do pedido refaz
 * as duas no servidor: o que vem daqui é só para exibir.
 */

export async function quoteShippingAction(cep: string): Promise<ShippingOption[]> {
  const quotes = await quoteShipping(String(cep));
  return quotes.map((q) => ({ servico: q.servico, prazo: q.prazo, valor: q.valorCentavos == null ? null : q.valorCentavos / 100 }));
}

export async function validateCouponAction(code: string): Promise<CouponRule | null> {
  return findCoupon(String(code).slice(0, 40));
}
