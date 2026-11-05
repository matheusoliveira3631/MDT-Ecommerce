import { and, count, eq, ne } from "drizzle-orm";
import { formatPrice } from "@/lib/format";
import type { CouponRule } from "@/lib/pricing";
import type { Database } from "./db/connect";
import { cupons, pedidos, type CupomRow } from "./db/schema";

/*
 * Cupons cadastrados no painel (tabela `cupons`). Recebe o banco como
 * parâmetro: a sacola consulta, e o fechamento do pedido confere de novo
 * dentro da transação (limite de usos sem corrida).
 */

type Reader = Pick<Database, "select">;

export type CouponCheck = { ok: true; rule: CouponRule; cupom: CupomRow } | { ok: false; erro: string };

const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

export const toRule = (c: CupomRow): CouponRule => ({
  codigo: c.codigo,
  tipo: c.tipo,
  valor: c.valor,
  minimoCentavos: c.pedidoMinimoCentavos,
});

/** Pedidos (não cancelados) que usaram o cupom; com CPF, só os dessa cliente. */
export function couponUses(db: Reader, codigo: string, cpf?: string): number {
  const conditions = [eq(pedidos.cupomCodigo, codigo), ne(pedidos.status, "cancelado")];
  if (cpf) conditions.push(eq(pedidos.clienteCpf, cpf.replace(/\D/g, "")));
  return db.select({ n: count() }).from(pedidos).where(and(...conditions)).get()?.n ?? 0;
}

/**
 * Confere se o cupom vale agora. `subtotalCentavos` confere o pedido mínimo
 * (sem ele, a regra vai junto e a sacola mostra o desconto só quando bater);
 * `cpf` confere o "uma vez por cliente" (só no fechamento do pedido).
 */
export function checkCoupon(
  db: Reader,
  code: string,
  ctx: { subtotalCentavos?: number | null; cpf?: string; agora?: number } = {},
): CouponCheck {
  const codigo = code.trim().toUpperCase();
  if (!codigo) return { ok: false, erro: "Digite o código do cupom." };
  const cupom = db.select().from(cupons).where(eq(cupons.codigo, codigo)).get();
  if (!cupom || !cupom.ativo) return { ok: false, erro: "Cupom inválido." };

  const agora = ctx.agora ?? Date.now();
  if (cupom.inicioEm && agora < cupom.inicioEm.getTime()) {
    return { ok: false, erro: `Este cupom vale a partir de ${date.format(cupom.inicioEm)}.` };
  }
  if (cupom.fimEm && agora > cupom.fimEm.getTime()) return { ok: false, erro: "Este cupom expirou." };
  if (cupom.limiteUsos != null && couponUses(db, codigo) >= cupom.limiteUsos) {
    return { ok: false, erro: "Este cupom já foi usado o máximo de vezes." };
  }
  if (cupom.umaVezPorCliente && ctx.cpf && couponUses(db, codigo, ctx.cpf) > 0) {
    return { ok: false, erro: "Você já usou este cupom." };
  }
  if (cupom.pedidoMinimoCentavos != null && ctx.subtotalCentavos != null && ctx.subtotalCentavos < cupom.pedidoMinimoCentavos) {
    return { ok: false, erro: `Este cupom vale para compras a partir de ${formatPrice(cupom.pedidoMinimoCentavos / 100)}.` };
  }
  return { ok: true, rule: toRule(cupom), cupom };
}
