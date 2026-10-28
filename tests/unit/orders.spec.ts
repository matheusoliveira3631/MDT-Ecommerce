import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { createDatabase, type Database } from "../../src/server/db/connect";
import { pedidoItens, pedidos, produtos } from "../../src/server/db/schema";
import { seedCatalog } from "../../src/server/db/seed";
import { applyPaymentUpdate, createOrder, getOrderForCustomer, type OrderDeps } from "../../src/server/orders";
import type { Charge } from "../../src/server/payments";

let db: Database;
let chargeCount = 0;

const deps = (overrides: Partial<OrderDeps> = {}): OrderDeps => ({
  quoteShipping: async () => [
    { servico: "PAC", prazo: "8 dias úteis", valorCentavos: 2590 },
    { servico: "SEDEX", prazo: "3 dias úteis", valorCentavos: null },
  ],
  findCoupon: (code) => (code.toUpperCase() === "MIMO10" ? { codigo: "MIMO10", tipo: "percentual", valor: 10 } : null),
  createCharge: async (): Promise<Charge> => ({ id: `cob_${++chargeCount}`, status: "pendente", instrucoes: { pixCopiaECola: "abc" } }),
  ...overrides,
});

const estoque = (slug: string) => db.select().from(produtos).where(eq(produtos.slug, slug)).get()!.estoque;

const input = (extra: Record<string, unknown> = {}) => ({
  chaveIdempotencia: crypto.randomUUID(),
  itens: [
    {
      produtoSlug: "caixa-milk-personalizada",
      quantidade: 20,
      personalizacao: { tema: "Safari", nome: "Helena", cor: "Lilás" },
    },
  ],
  cliente: { nome: "Maria Souza", email: "maria@email.com", cpf: "529.982.247-25", whatsapp: "(35) 99999-8888" },
  endereco: { cep: "37200-000", rua: "Rua A", numero: "10", bairro: "Centro", cidade: "Lavras", uf: "MG" },
  freteServico: "PAC",
  pagamento: "cartao",
  ...extra,
});

test.beforeEach(() => {
  db = createDatabase(":memory:");
  seedCatalog(db);
  // Caixa milk: R$ 5,50 (R$ 5,00 no Pix), estoque 30
  db.update(produtos)
    .set({ precoBaseCentavos: 550, precoPixCentavos: 500, estoque: 30 })
    .where(eq(produtos.slug, "caixa-milk-personalizada"))
    .run();
});

test("o total sai do banco, não do que o navegador manda", async () => {
  const result = await createOrder(db, input({ total: 1, precoUnitario: 1 }), deps());
  expect(result.ok).toBe(true);
  const pedido = db.select().from(pedidos).get()!;
  expect(pedido.subtotalCentavos).toBe(20 * 550);
  expect(pedido.freteCentavos).toBe(2590);
  expect(pedido.totalCentavos).toBe(20 * 550 + 2590);
  expect(pedido.numero).toMatch(/^MT\d{5}$/);
  expect(db.select().from(pedidoItens).get()!.precoUnitarioCentavos).toBe(550);
  expect(estoque("caixa-milk-personalizada")).toBe(10);
});

test("no Pix, cobra com os preços do Pix e aplica o cupom", async () => {
  await createOrder(db, input({ pagamento: "pix", cupom: "mimo10" }), deps());
  const pedido = db.select().from(pedidos).get()!;
  expect(pedido.subtotalCentavos).toBe(20 * 500);
  expect(pedido.descontoCentavos).toBe(1000);
  expect(pedido.totalCentavos).toBe(10000 - 1000 + 2590);
  expect(pedido.cupomCodigo).toBe("MIMO10");
});

test("recusa preço sem cadastro, pedido mínimo, falta de estoque, frete e cupom inválidos", async () => {
  const semPreco = input({ itens: [{ produtoSlug: "topo-de-bolo-em-camadas", quantidade: 1, personalizacao: { tema: "Safari", nome: "A", cor: "Lilás" } }] });
  expect(await createOrder(db, semPreco, deps())).toEqual({ ok: false, error: "Topo de bolo em camadas ainda não tem preço cadastrado." });

  const abaixoDoMinimo = input({ itens: [{ produtoSlug: "caixa-milk-personalizada", quantidade: 5, personalizacao: { tema: "Safari", nome: "A", cor: "Lilás" } }] });
  expect((await createOrder(db, abaixoDoMinimo, deps())).ok).toBe(false);

  const semEstoque = input({ itens: [{ produtoSlug: "caixa-milk-personalizada", quantidade: 40, personalizacao: { tema: "Safari", nome: "A", cor: "Lilás" } }] });
  expect(await createOrder(db, semEstoque, deps())).toEqual({ ok: false, error: "Caixa milk personalizada: só temos 30 em estoque." });

  expect((await createOrder(db, input({ freteServico: "SEDEX" }), deps())).ok).toBe(false);
  expect((await createOrder(db, input({ freteServico: "TELETRANSPORTE" }), deps())).ok).toBe(false);
  expect((await createOrder(db, input({ cupom: "NAOEXISTE" }), deps())).ok).toBe(false);

  const temaInventado = input({ itens: [{ produtoSlug: "caixa-milk-personalizada", quantidade: 20, personalizacao: { tema: "Qualquer", nome: "A", cor: "Lilás" } }] });
  expect((await createOrder(db, temaInventado, deps())).ok).toBe(false);

  expect(db.select().from(pedidos).all()).toHaveLength(0);
  expect(estoque("caixa-milk-personalizada")).toBe(30);
});

test("reenviar com a mesma chave devolve o mesmo pedido sem reservar estoque de novo", async () => {
  const body = input();
  const first = await createOrder(db, body, deps());
  const second = await createOrder(db, body, deps());
  expect(second).toEqual(first);
  expect(db.select().from(pedidos).all()).toHaveLength(1);
  expect(estoque("caixa-milk-personalizada")).toBe(10);
});

test("se a cobrança falha, o pedido é cancelado e o estoque volta", async () => {
  const result = await createOrder(db, input(), deps({ createCharge: async () => { throw new Error("gateway fora do ar"); } }));
  expect(result).toEqual({ ok: false, error: "Não conseguimos iniciar o pagamento. Tente de novo em instantes." });
  expect(db.select().from(pedidos).get()!.status).toBe("cancelado");
  expect(estoque("caixa-milk-personalizada")).toBe(30);
});

test("webhook: aprovado libera a arte; expirado cancela uma vez só; recusa depois de aprovado é ignorada", async () => {
  await createOrder(db, input(), deps());
  const pedido = db.select().from(pedidos).get()!;
  expect(applyPaymentUpdate(db, pedido.pagamentoId!, "aprovado")).toBe("ok");
  expect(db.select().from(pedidos).get()!.status).toBe("aguardando_arte");
  expect(applyPaymentUpdate(db, pedido.pagamentoId!, "recusado")).toBe("ignorado");
  expect(applyPaymentUpdate(db, "nao-existe", "aprovado")).toBe("pedido_nao_encontrado");

  // Segundo pedido (repõe estoque para caber): expira e devolve as 20 unidades, uma vez só
  db.update(produtos).set({ estoque: 60 }).where(eq(produtos.slug, "caixa-milk-personalizada")).run();
  await createOrder(db, input(), deps());
  const segundo = db.select().from(pedidos).all()[1];
  expect(estoque("caixa-milk-personalizada")).toBe(40);
  applyPaymentUpdate(db, segundo.pagamentoId!, "expirado");
  applyPaymentUpdate(db, segundo.pagamentoId!, "expirado");
  expect(db.select().from(pedidos).all()[1].status).toBe("cancelado");
  expect(estoque("caixa-milk-personalizada")).toBe(60);
});

test("a confirmação exige o token do pedido", async () => {
  const result = await createOrder(db, input(), deps());
  if (!result.ok) throw new Error(result.error);
  expect(getOrderForCustomer(db, result.numero, result.token)?.totalCentavos).toBe(20 * 550 + 2590);
  expect(getOrderForCustomer(db, result.numero, "token-errado")).toBeNull();
});
