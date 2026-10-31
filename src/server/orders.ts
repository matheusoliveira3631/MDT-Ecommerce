import { randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { OTHER_THEME } from "@/lib/cart";
import type { OrderView } from "@/lib/checkout";
import { isValidCpf } from "@/lib/format";
import { computeTotals, type CouponRule } from "@/lib/pricing";
import type { Database } from "./db/connect";
import { pedidoHistorico, pedidoItens, pedidos, produtos, type PedidoRow } from "./db/schema";
import type { Charge, ChargeRequest } from "./payments";
import type { ShippingItem, ShippingQuote } from "./shipping";

/*
 * Fechamento do pedido no servidor. O navegador manda só intenções (o que
 * comprar, para onde, como pagar); preços, frete, desconto e total saem
 * daqui, do banco e das integrações. Banco e integrações entram como
 * parâmetros para os testes usarem um banco em memória e falhas simuladas.
 */

export interface OrderDeps {
  quoteShipping: (cep: string, itens: ShippingItem[]) => Promise<ShippingQuote[]>;
  findCoupon: (code: string) => CouponRule | null;
  createCharge: (request: ChargeRequest) => Promise<Charge>;
}

const text = (max: number) => z.string().trim().max(max);

const personalizacaoSchema = z.object({
  tema: text(60).min(1),
  temaOutro: text(60).optional(),
  nome: text(30).min(1, "Informe o nome que vai na arte."),
  idadeOcasiao: text(60).optional(),
  cor: text(40),
  referenciaNome: text(200).optional(),
  observacoes: text(500).optional(),
});

export const orderInputSchema = z.object({
  chaveIdempotencia: z.string().regex(/^[A-Za-z0-9-]{16,64}$/, "Recarregue a página e tente de novo."),
  itens: z
    .array(
      z.object({
        produtoSlug: z.string().regex(/^[a-z0-9-]{1,120}$/),
        quantidade: z.number().int().min(1).max(10_000),
        personalizacao: personalizacaoSchema,
      }),
    )
    .min(1, "Sua sacola está vazia.")
    .max(50, "Use no máximo 50 itens por pedido."),
  cliente: z.object({
    nome: text(120).min(2, "Informe seu nome completo."),
    email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(200),
    cpf: z.string().refine(isValidCpf, "CPF inválido."),
    whatsapp: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Informe o WhatsApp com DDD."),
  }),
  endereco: z.object({
    cep: z.string().refine((v) => v.replace(/\D/g, "").length === 8, "CEP incompleto."),
    rua: text(200).min(1),
    numero: text(20).min(1),
    complemento: text(100).optional(),
    bairro: text(100).min(1),
    cidade: text(100).min(1),
    uf: z.string().regex(/^[A-Z]{2}$/),
  }),
  freteServico: text(60).min(1, "Escolha o frete."),
  cupom: text(40).optional(),
  pagamento: z.enum(["pix", "cartao", "boleto"]),
  usuarioId: z.number().int().positive().nullable().optional(),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
export type CreateOrderResult = { ok: true; numero: string; token: string } | { ok: false; error: string };

class OrderError extends Error {}

const orderNumber = (id: number) => `MT${String(id).padStart(5, "0")}`;

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Registra a mudança de status no histórico do pedido. */
export function logStatus(tx: Database | Tx, pedidoId: number, status: PedidoRow["status"], autor: string, nota?: string | null) {
  tx.insert(pedidoHistorico).values({ pedidoId, status, autor, nota: nota || null }).run();
}

export async function createOrder(db: Database, raw: unknown, deps: OrderDeps): Promise<CreateOrderResult> {
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os dados do pedido." };
  }
  const input = parsed.data;

  // Mesmo envio de novo: devolve o pedido já criado
  const existing = db.select().from(pedidos).where(eq(pedidos.chaveIdempotencia, input.chaveIdempotencia)).get();
  if (existing) return { ok: true, numero: existing.numero, token: existing.tokenAcesso };

  try {
    // Produtos ativos, com os preços do banco
    const slugs = [...new Set(input.itens.map((i) => i.produtoSlug))];
    const rows = db.select().from(produtos).where(and(inArray(produtos.slug, slugs), eq(produtos.ativo, true))).all();
    const bySlug = new Map(rows.map((p) => [p.slug, p]));
    const usePix = input.pagamento === "pix";

    const quantities = new Map<number, number>();
    const lines = input.itens.map((item) => {
      const produto = bySlug.get(item.produtoSlug);
      if (!produto) throw new OrderError("Um dos produtos da sacola não está mais disponível. Revise a sacola.");
      if (item.quantidade < produto.pedidoMinimo) {
        throw new OrderError(`${produto.nome}: o pedido mínimo é de ${produto.pedidoMinimo} unidades.`);
      }
      if (produto.precoBaseCentavos == null) throw new OrderError(`${produto.nome} ainda não tem preço cadastrado.`);
      const p = item.personalizacao;
      if (p.tema !== OTHER_THEME && produto.temas.length > 0 && !produto.temas.includes(p.tema)) {
        throw new OrderError(`${produto.nome}: escolha um dos temas disponíveis.`);
      }
      if (p.tema === OTHER_THEME && !p.temaOutro) throw new OrderError(`${produto.nome}: conte qual é o tema.`);
      if (produto.cores.length > 0 && !produto.cores.some((c) => c.nome === p.cor)) {
        throw new OrderError(`${produto.nome}: escolha uma das cores disponíveis.`);
      }
      quantities.set(produto.id, (quantities.get(produto.id) ?? 0) + item.quantidade);
      const unit = usePix ? (produto.precoPixCentavos ?? produto.precoBaseCentavos) : produto.precoBaseCentavos;
      return { produto, item, unit };
    });

    for (const [id, quantidade] of quantities) {
      const produto = rows.find((p) => p.id === id)!;
      if (produto.estoque < quantidade) {
        throw new OrderError(
          produto.estoque === 0 ? `${produto.nome} esgotou.` : `${produto.nome}: só temos ${produto.estoque} em estoque.`,
        );
      }
    }

    // Frete e cupom recalculados aqui, não aceitos do navegador
    let quotes: ShippingQuote[];
    try {
      quotes = await deps.quoteShipping(
        input.endereco.cep,
        input.itens.map((i) => ({ slug: i.produtoSlug, quantidade: i.quantidade })),
      );
    } catch (error) {
      console.error("Falha ao cotar o frete", error);
      throw new OrderError("Não conseguimos calcular o frete agora. Tente de novo em instantes.");
    }
    const frete = quotes.find((q) => q.servico === input.freteServico);
    if (!frete) throw new OrderError("Esse frete não está disponível para o CEP. Escolha de novo.");
    if (frete.valorCentavos == null) throw new OrderError("O valor do frete para esse CEP ainda não está disponível.");

    let coupon: CouponRule | null = null;
    if (input.cupom) {
      coupon = deps.findCoupon(input.cupom);
      if (!coupon) throw new OrderError("O cupom não é mais válido. Remova-o na sacola.");
    }

    const totals = computeTotals(
      lines.map((l) => ({ quantidade: l.item.quantidade, unitCents: l.unit, unitPixCents: null })),
      frete.valorCentavos,
      coupon,
    );
    if (totals.total == null || totals.subtotal == null) throw new OrderError("Não foi possível calcular o total.");
    if (totals.total <= 0) throw new OrderError("O total do pedido precisa ser maior que zero.");

    const token = randomBytes(24).toString("base64url");
    const pedidoId = db.transaction((tx) => {
      const id = tx
        .insert(pedidos)
        .values({
          numero: `tmp-${input.chaveIdempotencia}`,
          tokenAcesso: token,
          chaveIdempotencia: input.chaveIdempotencia,
          usuarioId: input.usuarioId ?? null,
          clienteNome: input.cliente.nome,
          clienteEmail: input.cliente.email,
          clienteCpf: input.cliente.cpf.replace(/\D/g, ""),
          clienteWhatsapp: input.cliente.whatsapp,
          endereco: input.endereco,
          freteServico: frete.servico,
          fretePrazo: frete.prazo,
          freteCentavos: frete.valorCentavos!,
          cupomCodigo: coupon?.codigo ?? null,
          descontoCentavos: totals.discount ?? 0,
          subtotalCentavos: totals.subtotal!,
          totalCentavos: totals.total!,
          pagamentoMetodo: input.pagamento,
        })
        .returning({ id: pedidos.id })
        .get().id;
      tx.update(pedidos).set({ numero: orderNumber(id) }).where(eq(pedidos.id, id)).run();
      logStatus(tx, id, "aguardando_pagamento", "Loja");

      for (const { produto, item, unit } of lines) {
        tx.insert(pedidoItens)
          .values({
            pedidoId: id,
            produtoId: produto.id,
            produtoSlug: produto.slug,
            produtoNome: produto.nome,
            precoUnitarioCentavos: unit!,
            quantidade: item.quantidade,
            personalizacao: item.personalizacao,
          })
          .run();
      }
      // Reserva o estoque; a condição evita vender o mesmo item duas vezes em pedidos simultâneos
      for (const [produtoId, quantidade] of quantities) {
        const result = tx
          .update(produtos)
          .set({ estoque: sql`${produtos.estoque} - ${quantidade}` })
          .where(and(eq(produtos.id, produtoId), gte(produtos.estoque, quantidade)))
          .run();
        if (result.changes !== 1) throw new OrderError("Um dos produtos acabou de esgotar. Revise a sacola.");
      }
      return id;
    });

    const numero = orderNumber(pedidoId);
    try {
      const charge = await deps.createCharge({
        pedidoNumero: numero,
        valorCentavos: totals.total,
        metodo: input.pagamento,
        cliente: { nome: input.cliente.nome, email: input.cliente.email, cpf: input.cliente.cpf },
      });
      db.update(pedidos)
        .set({
          pagamentoId: charge.id,
          pagamentoInstrucoes: charge.instrucoes,
          pagamentoStatus: charge.status,
          status: charge.status === "aprovado" ? "aguardando_arte" : "aguardando_pagamento",
          atualizadoEm: new Date(),
        })
        .where(eq(pedidos.id, pedidoId))
        .run();
      if (charge.status === "aprovado") logStatus(db, pedidoId, "aguardando_arte", "Pagamento");
    } catch (error) {
      // Cobrança falhou: cancela e devolve o estoque reservado
      cancelOrder(db, pedidoId, { pagamentoStatus: "recusado", autor: "Pagamento", nota: "A cobrança não foi criada." });
      console.error("Falha ao criar a cobrança", error);
      throw new OrderError("Não conseguimos iniciar o pagamento. Tente de novo em instantes.");
    }

    return { ok: true, numero, token };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    // Dois envios simultâneos com a mesma chave: o segundo devolve o pedido do primeiro
    if (error instanceof Error && error.message.includes("pedidos.chave_idempotencia")) {
      const winner = db.select().from(pedidos).where(eq(pedidos.chaveIdempotencia, input.chaveIdempotencia)).get();
      if (winner) return { ok: true, numero: winner.numero, token: winner.tokenAcesso };
    }
    throw error;
  }
}

/**
 * Cancela (uma vez) e devolve o estoque reservado. Devolve `false` se o pedido
 * já estava cancelado.
 */
export function cancelOrder(
  db: Database,
  pedidoId: number,
  { pagamentoStatus, autor, nota }: { pagamentoStatus?: "recusado" | "expirado"; autor: string; nota?: string },
): boolean {
  return db.transaction((tx) => {
    const pedido = tx.select().from(pedidos).where(eq(pedidos.id, pedidoId)).get();
    if (!pedido || pedido.estoqueDevolvido || pedido.status === "cancelado") return false;
    const itens = tx.select().from(pedidoItens).where(eq(pedidoItens.pedidoId, pedidoId)).all();
    for (const item of itens) {
      if (item.produtoId == null) continue;
      tx.update(produtos)
        .set({ estoque: sql`${produtos.estoque} + ${item.quantidade}` })
        .where(eq(produtos.id, item.produtoId))
        .run();
    }
    tx.update(pedidos)
      .set({
        status: "cancelado",
        pagamentoStatus: pagamentoStatus ?? pedido.pagamentoStatus,
        estoqueDevolvido: true,
        atualizadoEm: new Date(),
      })
      .where(eq(pedidos.id, pedidoId))
      .run();
    logStatus(tx, pedidoId, "cancelado", autor, nota);
    return true;
  });
}

/**
 * Resultado do pagamento vindo do gateway (webhook). Idempotente: o gateway
 * pode mandar o mesmo aviso mais de uma vez.
 */
export function applyPaymentUpdate(
  db: Database,
  pagamentoId: string,
  status: "aprovado" | "recusado" | "expirado",
): "ok" | "pedido_nao_encontrado" | "ignorado" {
  const pedido = db.select().from(pedidos).where(eq(pedidos.pagamentoId, pagamentoId)).get();
  if (!pedido) return "pedido_nao_encontrado";
  if (status === "aprovado") {
    if (pedido.status === "cancelado") {
      // Pagou depois do cancelamento: o pedido não volta, mas o painel precisa ver para reembolsar
      if (pedido.pagamentoStatus === "aprovado") return "ignorado";
      db.update(pedidos).set({ pagamentoStatus: "aprovado", atualizadoEm: new Date() }).where(eq(pedidos.id, pedido.id)).run();
      logStatus(db, pedido.id, "cancelado", "Pagamento", "Pagamento aprovado depois do cancelamento: faça o reembolso no gateway.");
      return "ignorado";
    }
    const liberaArte = pedido.status === "aguardando_pagamento";
    db.update(pedidos)
      .set({ pagamentoStatus: "aprovado", status: liberaArte ? "aguardando_arte" : pedido.status, atualizadoEm: new Date() })
      .where(eq(pedidos.id, pedido.id))
      .run();
    if (liberaArte) logStatus(db, pedido.id, "aguardando_arte", "Pagamento");
    return "ok";
  }
  // Recusa ou expiração só cancela enquanto o pagamento não foi aprovado
  if (pedido.pagamentoStatus === "aprovado") return "ignorado";
  cancelOrder(db, pedido.id, {
    pagamentoStatus: status,
    autor: "Pagamento",
    nota: status === "recusado" ? "Pagamento recusado." : "O prazo para pagar acabou.",
  });
  return "ok";
}

/** Pedido para a página de confirmação; exige o token da URL. */
export function getOrderForCustomer(db: Database, numero: string, token: string): OrderView | null {
  const pedido = db.select().from(pedidos).where(eq(pedidos.numero, numero)).get();
  if (!pedido) return null;
  const a = Buffer.from(pedido.tokenAcesso);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const itens = db.select().from(pedidoItens).where(eq(pedidoItens.pedidoId, pedido.id)).all();
  return {
    numero: pedido.numero,
    status: pedido.status,
    criadoEm: pedido.criadoEm.toISOString(),
    cliente: { nome: pedido.clienteNome, email: pedido.clienteEmail, whatsapp: pedido.clienteWhatsapp },
    pagamento: { metodo: pedido.pagamentoMetodo, status: pedido.pagamentoStatus, instrucoes: pedido.pagamentoInstrucoes ?? {} },
    itens: itens.map((i) => ({
      nome: i.produtoNome,
      quantidade: i.quantidade,
      precoUnitarioCentavos: i.precoUnitarioCentavos,
      tema: i.personalizacao.tema === OTHER_THEME && i.personalizacao.temaOutro ? i.personalizacao.temaOutro : i.personalizacao.tema,
      nomeNaArte: i.personalizacao.nome,
    })),
    subtotalCentavos: pedido.subtotalCentavos,
    freteCentavos: pedido.freteCentavos,
    freteServico: pedido.freteServico,
    descontoCentavos: pedido.descontoCentavos,
    cupom: pedido.cupomCodigo,
    totalCentavos: pedido.totalCentavos,
    rastreio: pedido.codigoRastreio,
  };
}

/** Pedidos de uma cliente logada, do mais novo ao mais antigo (para a página da conta). */
export function listOrdersOfUser(db: Database, usuarioId: number) {
  return db
    .select({
      numero: pedidos.numero,
      token: pedidos.tokenAcesso,
      status: pedidos.status,
      totalCentavos: pedidos.totalCentavos,
      criadoEm: pedidos.criadoEm,
    })
    .from(pedidos)
    .where(eq(pedidos.usuarioId, usuarioId))
    .orderBy(desc(pedidos.id))
    .limit(50)
    .all();
}
