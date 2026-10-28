import { and, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { OTHER_THEME } from "@/lib/cart";
import type { Database } from "./db/connect";
import { pedidoHistorico, pedidoItens, pedidos, STATUS_PEDIDO, type PedidoRow } from "./db/schema";
import { cancelOrder, logStatus } from "./orders";

/*
 * Pedidos no painel: lista, detalhe e a mudança de status. As regras de qual
 * status pode virar qual ficam aqui, não na tela: a Server Action pode ser
 * chamada direto.
 */

export type StatusPedido = (typeof STATUS_PEDIDO)[number];

/** O caminho de um pedido pago, da arte ao envio. */
export const FLUXO_PAGO = ["aguardando_arte", "arte_enviada", "aprovada", "em_producao", "enviado"] as const;

export const PAGE_SIZE = 30;

export interface OrderListFilter {
  status?: StatusPedido;
  /** Número do pedido, nome ou e-mail da cliente. */
  busca?: string;
  pagina?: number;
}

export function listOrdersAdmin(db: Database, filter: OrderListFilter = {}) {
  const conditions: SQL[] = [];
  if (filter.status) conditions.push(eq(pedidos.status, filter.status));
  const busca = filter.busca?.trim();
  if (busca) {
    // % e _ são curingas no LIKE: escapados para buscar o texto como digitado
    const pattern = `%${busca.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(
      or(
        sql`${pedidos.numero} like ${pattern} escape '\\'`,
        sql`${pedidos.clienteNome} like ${pattern} escape '\\'`,
        sql`${pedidos.clienteEmail} like ${pattern} escape '\\'`,
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const pagina = Math.max(1, Math.floor(filter.pagina ?? 1));

  const total = db.select({ n: count() }).from(pedidos).where(where).get()!.n;
  const rows = db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      status: pedidos.status,
      clienteNome: pedidos.clienteNome,
      clienteEmail: pedidos.clienteEmail,
      totalCentavos: pedidos.totalCentavos,
      pagamentoMetodo: pedidos.pagamentoMetodo,
      pagamentoStatus: pedidos.pagamentoStatus,
      criadoEm: pedidos.criadoEm,
    })
    .from(pedidos)
    .where(where)
    .orderBy(desc(pedidos.id))
    .limit(PAGE_SIZE)
    .offset((pagina - 1) * PAGE_SIZE)
    .all();

  const itens = rows.length
    ? db
        .select({ pedidoId: pedidoItens.pedidoId, n: count() })
        .from(pedidoItens)
        .where(inArray(pedidoItens.pedidoId, rows.map((r) => r.id)))
        .groupBy(pedidoItens.pedidoId)
        .all()
    : [];
  const itensPorPedido = new Map(itens.map((i) => [i.pedidoId, i.n]));

  return {
    pedidos: rows.map((r) => ({ ...r, itens: itensPorPedido.get(r.id) ?? 0 })),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Quantos pedidos há em cada status (abas da lista). */
export function countOrdersByStatus(db: Database): Record<StatusPedido, number> {
  const rows = db.select({ status: pedidos.status, n: count() }).from(pedidos).groupBy(pedidos.status).all();
  const counts = Object.fromEntries(STATUS_PEDIDO.map((s) => [s, 0])) as Record<StatusPedido, number>;
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}

export function getOrderAdmin(db: Database, numero: string) {
  const pedido = db.select().from(pedidos).where(eq(pedidos.numero, numero)).get();
  if (!pedido) return null;
  const itens = db.select().from(pedidoItens).where(eq(pedidoItens.pedidoId, pedido.id)).orderBy(pedidoItens.id).all();
  const historico = db
    .select()
    .from(pedidoHistorico)
    .where(eq(pedidoHistorico.pedidoId, pedido.id))
    .orderBy(desc(pedidoHistorico.id))
    .all();
  return {
    pedido,
    itens: itens.map((i) => ({
      ...i,
      tema: i.personalizacao.tema === OTHER_THEME && i.personalizacao.temaOutro ? i.personalizacao.temaOutro : i.personalizacao.tema,
    })),
    historico,
    proximos: nextStatuses(pedido),
  };
}

/** Status que o painel pode escolher para este pedido. */
export function nextStatuses(pedido: Pick<PedidoRow, "status" | "pagamentoStatus">): StatusPedido[] {
  if (pedido.status === "cancelado" || pedido.pagamentoStatus !== "aprovado") return [];
  return [...FLUXO_PAGO];
}

export const updateStatusSchema = z.object({
  numero: z.string().regex(/^MT\d{5,}$/),
  status: z.enum(FLUXO_PAGO),
  rastreio: z
    .string()
    .trim()
    .toUpperCase()
    .max(40)
    .regex(/^[A-Z0-9-]*$/, "Use só letras e números no código de rastreio.")
    .optional(),
  nota: z.string().trim().max(500).optional(),
});

export type OrderActionResult = { ok: true } | { ok: false; error: string };

export function updateOrderStatus(db: Database, raw: unknown, autor: string): OrderActionResult {
  const parsed = updateStatusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const { numero, status, rastreio, nota } = parsed.data;

  return db.transaction((tx) => {
    const pedido = tx.select().from(pedidos).where(eq(pedidos.numero, numero)).get();
    if (!pedido) return { ok: false as const, error: "Pedido não encontrado." };
    if (pedido.status === "cancelado") return { ok: false as const, error: "Pedido cancelado não muda mais de status." };
    if (pedido.pagamentoStatus !== "aprovado") {
      return { ok: false as const, error: "O pagamento ainda não foi confirmado. A produção começa depois dele." };
    }
    const codigo = status === "enviado" ? rastreio || pedido.codigoRastreio || null : pedido.codigoRastreio;
    if (status === pedido.status && codigo === pedido.codigoRastreio && !nota) {
      return { ok: false as const, error: "O pedido já está nesse status." };
    }
    tx.update(pedidos)
      .set({ status, codigoRastreio: codigo, atualizadoEm: new Date() })
      .where(eq(pedidos.id, pedido.id))
      .run();
    const notaFinal = [status === "enviado" && codigo && codigo !== pedido.codigoRastreio ? `Rastreio: ${codigo}` : null, nota]
      .filter(Boolean)
      .join(" · ");
    logStatus(tx, pedido.id, status, autor, notaFinal);
    return { ok: true as const };
  });
}

export const cancelSchema = z.object({
  numero: z.string().regex(/^MT\d{5,}$/),
  motivo: z.string().trim().min(3, "Conte o motivo do cancelamento.").max(500),
});

export function cancelOrderAdmin(db: Database, raw: unknown, autor: string): OrderActionResult {
  const parsed = cancelSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const pedido = db.select().from(pedidos).where(eq(pedidos.numero, parsed.data.numero)).get();
  if (!pedido) return { ok: false, error: "Pedido não encontrado." };
  if (pedido.status === "cancelado") return { ok: false, error: "O pedido já está cancelado." };
  if (pedido.status === "enviado") return { ok: false, error: "O pedido já foi enviado e não pode ser cancelado aqui." };
  return cancelOrder(db, pedido.id, { autor, nota: parsed.data.motivo })
    ? { ok: true }
    : { ok: false, error: "O pedido já está cancelado." };
}

/** WhatsApp da cliente com DDI do Brasil, para o link do wa.me. */
export function customerWhatsappDigits(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, "");
  return digits.length <= 11 ? `55${digits}` : digits;
}
