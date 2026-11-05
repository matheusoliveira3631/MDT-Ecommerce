"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type { CouponRule } from "@/lib/pricing";
import type { ShippingResult } from "@/lib/types";
import { checkCoupon } from "@/server/coupons";
import { db } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { quoteShipping, ShippingUnavailableError } from "@/server/shipping";
import { createReferenceUpload, type ReferenceTicket } from "@/server/storage";

/*
 * Consultas públicas feitas pelo navegador. O cálculo final do pedido refaz
 * as duas no servidor: o que vem daqui é só para exibir.
 */

const itensSchema = z
  .array(z.object({ slug: z.string().regex(/^[a-z0-9-]{1,120}$/), quantidade: z.number().int().min(1).max(10_000) }))
  .max(50);

/** Frete do CEP para os itens (um produto na página dele, ou a sacola inteira). */
export async function quoteShippingAction(cep: string, itens: unknown): Promise<ShippingResult> {
  const parsed = itensSchema.safeParse(itens);
  if (!parsed.success) return { ok: false, erro: "Não foi possível calcular o frete." };
  // A cotação real consulta a transportadora: 30 por minuto por IP
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`frete:${ip}`, 30, 60 * 1000).ok) return { ok: false, erro: "Muitas consultas seguidas. Espere um minuto." };
  try {
    const quotes = await quoteShipping(String(cep), parsed.data);
    if (quotes.length === 0) return { ok: false, erro: "Não encontramos esse CEP." };
    return {
      ok: true,
      opcoes: quotes.map((q) => ({ servico: q.servico, prazo: q.prazo, valor: q.valorCentavos == null ? null : q.valorCentavos / 100 })),
    };
  } catch (error) {
    if (!(error instanceof ShippingUnavailableError)) throw error;
    console.error(error);
    return { ok: false, erro: "Não conseguimos calcular o frete agora. Tente de novo em instantes." };
  }
}

/** Cupom digitado na sacola. O pedido confere de novo no fechamento (limite de usos, uma vez por cliente). */
export async function validateCouponAction(
  code: string,
  subtotalCentavos?: number | null,
): Promise<{ ok: true; rule: CouponRule } | { ok: false; erro: string }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  // Evita adivinhar códigos no chute: 20 tentativas a cada 10 minutos por IP
  if (!rateLimit(`cupom:${ip}`, 20, 10 * 60 * 1000).ok) return { ok: false, erro: "Muitas tentativas. Espere alguns minutos." };
  const subtotal = typeof subtotalCentavos === "number" && Number.isFinite(subtotalCentavos) ? subtotalCentavos : null;
  const check = checkCoupon(db, String(code).slice(0, 40), { subtotalCentavos: subtotal });
  return check.ok ? { ok: true, rule: check.rule } : check;
}

/** Envio da imagem de referência da cliente (convite, decoração), antes de ir para a sacola. */
export async function requestReferenceUploadAction(input: {
  contentType: string;
  tamanho: number;
}): Promise<{ ok: true; ticket: ReferenceTicket } | { ok: false; erro: string }> {
  // Sem login: 20 envios por hora por IP
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`referencia:${ip}`, 20, 60 * 60 * 1000).ok) {
    return { ok: false, erro: "Muitos envios seguidos. Tente de novo mais tarde." };
  }
  try {
    return { ok: true, ticket: await createReferenceUpload({ contentType: String(input?.contentType), tamanho: Number(input?.tamanho) }) };
  } catch (error) {
    return { ok: false, erro: error instanceof Error ? error.message : "Não foi possível enviar a imagem." };
  }
}
