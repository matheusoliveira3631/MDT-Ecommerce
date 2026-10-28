import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import {
  cancelOrderAdmin,
  countOrdersByStatus,
  customerWhatsappDigits,
  getOrderAdmin,
  listOrdersAdmin,
  updateOrderStatus,
} from "../../src/server/admin-orders";
import { createDatabase, type Database } from "../../src/server/db/connect";
import { pedidos, produtos } from "../../src/server/db/schema";
import { seedCatalog } from "../../src/server/db/seed";
import { applyPaymentUpdate, createOrder, getOrderForCustomer, type OrderDeps } from "../../src/server/orders";

let db: Database;
let chargeCount = 0;

const deps: OrderDeps = {
  quoteShipping: async () => [{ servico: "PAC", prazo: "8 dias úteis", valorCentavos: 2590 }],
  findCoupon: () => null,
  createCharge: async () => ({ id: `cob_${++chargeCount}`, status: "pendente", instrucoes: {} }),
};

const estoque = () => db.select().from(produtos).where(eq(produtos.slug, "caixa-milk-personalizada")).get()!.estoque;

async function novoPedido(nome = "Maria Souza", email = "maria@email.com") {
  const result = await createOrder(
    db,
    {
      chaveIdempotencia: crypto.randomUUID(),
      itens: [
        {
          produtoSlug: "caixa-milk-personalizada",
          quantidade: 20,
          personalizacao: { tema: "Safari", nome: "Helena", cor: "Lilás", observacoes: "Sem glitter" },
        },
      ],
      cliente: { nome, email, cpf: "529.982.247-25", whatsapp: "(35) 99999-8888" },
      endereco: { cep: "37200-000", rua: "Rua A", numero: "10", bairro: "Centro", cidade: "Lavras", uf: "MG" },
      freteServico: "PAC",
      pagamento: "pix",
    },
    deps,
  );
  if (!result.ok) throw new Error(result.error);
  const pedido = db.select().from(pedidos).where(eq(pedidos.numero, result.numero)).get()!;
  return { ...result, pagamentoId: pedido.pagamentoId! };
}

async function pedidoPago() {
  const pedido = await novoPedido();
  applyPaymentUpdate(db, pedido.pagamentoId, "aprovado");
  return pedido;
}

test.beforeEach(() => {
  db = createDatabase(":memory:");
  seedCatalog(db);
  db.update(produtos)
    .set({ precoBaseCentavos: 550, precoPixCentavos: 500, estoque: 100 })
    .where(eq(produtos.slug, "caixa-milk-personalizada"))
    .run();
});

test("pedido pago segue o fluxo até o envio, com rastreio visível para a cliente", async () => {
  const { numero, token } = await pedidoPago();
  expect(getOrderAdmin(db, numero)!.proximos).toEqual(["aguardando_arte", "arte_enviada", "aprovada", "em_producao", "enviado"]);

  expect(updateOrderStatus(db, { numero, status: "arte_enviada" }, "Thaty")).toEqual({ ok: true });
  expect(updateOrderStatus(db, { numero, status: "arte_enviada" }, "Thaty")).toEqual({ ok: false, error: "O pedido já está nesse status." });
  expect(updateOrderStatus(db, { numero, status: "aprovada", nota: "Cliente pediu letra maior" }, "Thaty").ok).toBe(true);
  expect(updateOrderStatus(db, { numero, status: "enviado", rastreio: "qb123456789br" }, "Thaty").ok).toBe(true);

  const view = getOrderForCustomer(db, numero, token)!;
  expect(view.status).toBe("enviado");
  expect(view.rastreio).toBe("QB123456789BR");

  // Histórico do mais novo ao mais antigo, com quem mudou
  const { historico } = getOrderAdmin(db, numero)!;
  expect(historico.map((h) => [h.status, h.autor, h.nota])).toEqual([
    ["enviado", "Thaty", "Rastreio: QB123456789BR"],
    ["aprovada", "Thaty", "Cliente pediu letra maior"],
    ["arte_enviada", "Thaty", null],
    ["aguardando_arte", "Pagamento", null],
    ["aguardando_pagamento", "Loja", null],
  ]);
});

test("sem pagamento confirmado, o painel não avança o pedido", async () => {
  const { numero } = await novoPedido();
  expect(getOrderAdmin(db, numero)!.proximos).toEqual([]);
  const result = updateOrderStatus(db, { numero, status: "em_producao" }, "Thaty");
  expect(result.ok).toBe(false);
  expect(db.select().from(pedidos).get()!.status).toBe("aguardando_pagamento");
  // Status fora do fluxo (ou inventado) é recusado na validação
  expect(updateOrderStatus(db, { numero, status: "cancelado" }, "Thaty").ok).toBe(false);
  expect(updateOrderStatus(db, { numero, status: "aguardando_pagamento" }, "Thaty").ok).toBe(false);
  expect(updateOrderStatus(db, { numero, status: "enviado", rastreio: "<script>" }, "Thaty").ok).toBe(false);
});

test("cancelar pelo painel devolve o estoque uma vez e trava o pedido", async () => {
  const { numero } = await pedidoPago();
  expect(estoque()).toBe(80);
  expect(cancelOrderAdmin(db, { numero, motivo: "" }, "Thaty").ok).toBe(false);
  expect(cancelOrderAdmin(db, { numero, motivo: "Cliente desistiu" }, "Thaty")).toEqual({ ok: true });
  expect(estoque()).toBe(100);
  expect(cancelOrderAdmin(db, { numero, motivo: "De novo" }, "Thaty").ok).toBe(false);
  expect(estoque()).toBe(100);

  const pedido = db.select().from(pedidos).get()!;
  expect(pedido.status).toBe("cancelado");
  // O pagamento continua aprovado: o reembolso é feito no gateway
  expect(pedido.pagamentoStatus).toBe("aprovado");
  expect(updateOrderStatus(db, { numero, status: "em_producao" }, "Thaty").ok).toBe(false);
  expect(getOrderAdmin(db, numero)!.historico[0]).toMatchObject({ status: "cancelado", autor: "Thaty", nota: "Cliente desistiu" });
});

test("pagamento aprovado depois do cancelamento fica registrado para reembolso", async () => {
  const { numero, pagamentoId } = await novoPedido();
  cancelOrderAdmin(db, { numero, motivo: "Cliente desistiu" }, "Thaty");
  expect(applyPaymentUpdate(db, pagamentoId, "aprovado")).toBe("ignorado");
  const pedido = db.select().from(pedidos).get()!;
  expect(pedido.status).toBe("cancelado");
  expect(pedido.pagamentoStatus).toBe("aprovado");
  expect(estoque()).toBe(100);
  expect(getOrderAdmin(db, numero)!.historico[0].nota).toMatch(/reembolso/);
  // O mesmo aviso de novo não duplica o histórico
  applyPaymentUpdate(db, pagamentoId, "aprovado");
  expect(getOrderAdmin(db, numero)!.historico).toHaveLength(3);
});

test("pedido enviado não é cancelado pelo painel", async () => {
  const { numero } = await pedidoPago();
  updateOrderStatus(db, { numero, status: "enviado" }, "Thaty");
  expect(cancelOrderAdmin(db, { numero, motivo: "Extraviou" }, "Thaty").ok).toBe(false);
  expect(estoque()).toBe(80);
});

test("lista filtra por status e busca por número, nome ou e-mail", async () => {
  const a = await pedidoPago();
  await novoPedido("Ana Lima", "ana@email.com");
  await novoPedido("Bia 100%", "bia@email.com");

  expect(listOrdersAdmin(db).total).toBe(3);
  expect(listOrdersAdmin(db).pedidos[0].numero).toBe("MT00003");
  expect(listOrdersAdmin(db, { status: "aguardando_arte" }).pedidos.map((p) => p.numero)).toEqual([a.numero]);
  expect(listOrdersAdmin(db, { busca: "ana@" }).pedidos.map((p) => p.clienteNome)).toEqual(["Ana Lima"]);
  expect(listOrdersAdmin(db, { busca: "mt00001" }).total).toBe(1);
  // % é texto, não curinga
  expect(listOrdersAdmin(db, { busca: "100%" }).pedidos.map((p) => p.clienteNome)).toEqual(["Bia 100%"]);
  expect(listOrdersAdmin(db, { busca: "%" }).total).toBe(1);
  expect(listOrdersAdmin(db).pedidos[0].itens).toBe(1);

  const counts = countOrdersByStatus(db);
  expect(counts.aguardando_arte).toBe(1);
  expect(counts.aguardando_pagamento).toBe(2);
  expect(counts.cancelado).toBe(0);
});

test("WhatsApp da cliente ganha o DDI do Brasil", () => {
  expect(customerWhatsappDigits("(35) 99999-8888")).toBe("5535999998888");
  expect(customerWhatsappDigits("+55 35 99999-8888")).toBe("5535999998888");
});
