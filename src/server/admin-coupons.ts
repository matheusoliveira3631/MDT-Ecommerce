import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { endOfDayBR, startOfDayBR, toYmdBR } from "@/lib/dates";
import { couponUses } from "./coupons";
import { dateField } from "./admin-catalog";
import { db } from "./db";
import { cupons } from "./db/schema";

/*
 * Cadastro de cupons no painel. Quem chama (as Server Actions) já passou por
 * requireAdmin(). Datas chegam como "AAAA-MM-DD" e valem o dia inteiro no
 * horário de Brasília.
 */


export const couponSchema = z
  .object({
    id: z.number().int().positive().optional(),
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "Use de 3 a 30 letras, números, - ou _, sem espaços."),
    descricao: z.string().trim().max(200, "Use no máximo 200 caracteres."),
    tipo: z.enum(["percentual", "fixo"]),
    valor: z.number({ error: "Informe o desconto." }).int().positive("Informe o desconto."),
    pedidoMinimoCentavos: z.number().int().positive().max(100_000_000).nullable(),
    inicio: dateField,
    fim: dateField,
    limiteUsos: z.number().int().min(1, "O limite precisa ser de pelo menos 1 uso.").max(1_000_000).nullable(),
    umaVezPorCliente: z.boolean(),
    ativo: z.boolean(),
  })
  .superRefine((c, ctx) => {
    if (c.tipo === "percentual" && c.valor > 100) {
      ctx.addIssue({ code: "custom", path: ["valor"], message: "O percentual vai até 100%." });
    }
    if (c.tipo === "fixo" && c.valor > 10_000_000) ctx.addIssue({ code: "custom", path: ["valor"], message: "Valor alto demais." });
    if (c.inicio && c.fim && c.fim < c.inicio) {
      ctx.addIssue({ code: "custom", path: ["fim"], message: "O fim precisa ser depois do início." });
    }
  });


export interface AdminCoupon {
  id: number;
  codigo: string;
  descricao: string;
  tipo: "percentual" | "fixo";
  valor: number;
  pedidoMinimoCentavos: number | null;
  inicio: string;
  fim: string;
  limiteUsos: number | null;
  umaVezPorCliente: boolean;
  ativo: boolean;
  usos: number;
  /** Situação agora: ativo, agendado, expirado, esgotado ou pausado. */
  situacao: "ativo" | "agendado" | "expirado" | "esgotado" | "pausado";
}

export function adminListCoupons(agora = Date.now()): AdminCoupon[] {
  return db
    .select()
    .from(cupons)
    .orderBy(desc(cupons.id))
    .all()
    .map((c) => {
      const usos = couponUses(db, c.codigo);
      const situacao: AdminCoupon["situacao"] = !c.ativo
        ? "pausado"
        : c.fimEm && agora > c.fimEm.getTime()
          ? "expirado"
          : c.limiteUsos != null && usos >= c.limiteUsos
            ? "esgotado"
            : c.inicioEm && agora < c.inicioEm.getTime()
              ? "agendado"
              : "ativo";
      return {
        id: c.id,
        codigo: c.codigo,
        descricao: c.descricao,
        tipo: c.tipo,
        valor: c.valor,
        pedidoMinimoCentavos: c.pedidoMinimoCentavos,
        inicio: toYmdBR(c.inicioEm),
        fim: toYmdBR(c.fimEm),
        limiteUsos: c.limiteUsos,
        umaVezPorCliente: c.umaVezPorCliente,
        ativo: c.ativo,
        usos,
        situacao,
      };
    });
}

export type CouponSaveResult = { ok: true } | { ok: false; errors: Record<string, string> };

export function saveCoupon(raw: unknown): CouponSaveResult {
  const parsed = couponSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, errors };
  }
  const { id, inicio, fim, ...data } = parsed.data;
  const taken = db
    .select({ id: cupons.id })
    .from(cupons)
    .where(id ? and(eq(cupons.codigo, data.codigo), ne(cupons.id, id)) : eq(cupons.codigo, data.codigo))
    .get();
  if (taken) return { ok: false, errors: { codigo: "Já existe um cupom com esse código." } };

  const values = { ...data, inicioEm: inicio ? startOfDayBR(inicio) : null, fimEm: fim ? endOfDayBR(fim) : null };
  if (id) {
    const current = db.select().from(cupons).where(eq(cupons.id, id)).get();
    if (!current) return { ok: false, errors: { form: "Cupom não encontrado." } };
    // Os pedidos guardam o código: trocar o código de um cupom usado perderia a contagem
    if (current.codigo !== data.codigo && couponUses(db, current.codigo) > 0) {
      return { ok: false, errors: { codigo: "Esse cupom já foi usado: o código não pode mudar. Crie outro cupom." } };
    }
    db.update(cupons).set(values).where(eq(cupons.id, id)).run();
  } else {
    db.insert(cupons).values(values).run();
  }
  return { ok: true };
}

export function deleteCoupon(id: number): { ok: true } | { ok: false; error: string } {
  const current = db.select().from(cupons).where(eq(cupons.id, id)).get();
  if (!current) return { ok: true };
  const usos = couponUses(db, current.codigo);
  if (usos > 0) {
    return { ok: false, error: `Esse cupom já foi usado em ${usos} ${usos === 1 ? "pedido" : "pedidos"}. Pause-o em vez de excluir.` };
  }
  db.delete(cupons).where(eq(cupons.id, id)).run();
  return { ok: true };
}
