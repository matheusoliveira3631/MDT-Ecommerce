"use server";

import { headers } from "next/headers";
import { getCurrentUser } from "@/server/auth";
import { findCoupon } from "@/server/coupons";
import { db } from "@/server/db";
import { createOrder, type CreateOrderResult } from "@/server/orders";
import { createCharge } from "@/server/payments";
import { rateLimit } from "@/server/rate-limit";
import { quoteShipping } from "@/server/shipping";

/** Fecha o pedido: tudo o que é cobrado é recalculado no servidor. */
export async function placeOrderAction(input: unknown): Promise<CreateOrderResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  // 10 tentativas de pedido a cada 10 minutos por IP
  if (!rateLimit(`pedido:${ip}`, 10, 10 * 60 * 1000).ok) {
    return { ok: false, error: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo." };
  }
  const user = await getCurrentUser();
  const payload = typeof input === "object" && input ? { ...input, usuarioId: user?.id ?? null } : input;
  return createOrder(db, payload, { quoteShipping, findCoupon, createCharge });
}
