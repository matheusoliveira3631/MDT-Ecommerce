import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { checkCoupon } from "../../src/server/coupons";
import { createDatabase, type Database } from "../../src/server/db/connect";
import { cupons, pedidos, produtos } from "../../src/server/db/schema";
import { seedCatalog } from "../../src/server/db/seed";
import { applyPaymentUpdate, createOrder, type OrderDeps } from "../../src/server/orders";
import { couponDiscount } from "../../src/lib/pricing";

let db: Database;
let charge = 0;
const deps: OrderDeps = {
  quoteShipping: async () => [{ servico: "PAC", prazo: "8 dias úteis", valorCentavos: 2590 }],
  createCharge: async () => ({ id: `cob_${++charge}`, status: "pendente", instrucoes: {} }),
};

const order = (cupom: string, cpf = "529.982.247-25") => ({
  chaveIdempotencia: crypto.randomUUID(),
  itens: [{ produtoSlug: "caixa-milk-personalizada", quantidade: 20, personalizacao: { tema: "Safari", nome: "Helena", cor: "Lilás" } }],
  cliente: { nome: "Maria Souza", email: "maria@email.com", cpf, whatsapp: "(35) 99999-8888" },
  endereco: { cep: "37200-000", rua: "Rua A", numero: "10", bairro: "Centro", cidade: "Lavras", uf: "MG" },
  freteServico: "PAC",
  pagamento: "cartao",
  cupom,
});

const dia = (iso: string) => new Date(`${iso}T12:00:00-03:00`);

test.beforeEach(() => {
  db = createDatabase(":memory:");
  seedCatalog(db);
  db.update(produtos).set({ precoBaseCentavos: 550, estoque: 1000 }).where(eq(produtos.slug, "caixa-milk-personalizada")).run();
});

test("código em qualquer caixa; inativo ou inexistente é inválido", () => {
  db.insert(cupons).values([
    { codigo: "BEMVINDA", tipo: "fixo", valor: 500 },
    { codigo: "PAUSADO", tipo: "percentual", valor: 10, ativo: false },
  ]).run();
  const ok = checkCoupon(db, " bemvinda ");
  expect(ok.ok && ok.rule).toEqual({ codigo: "BEMVINDA", tipo: "fixo", valor: 500, minimoCentavos: null });
  expect(checkCoupon(db, "PAUSADO")).toEqual({ ok: false, erro: "Cupom inválido." });
  expect(checkCoupon(db, "NADA")).toEqual({ ok: false, erro: "Cupom inválido." });
});

test("validade: antes do início e depois do fim não vale", () => {
  db.insert(cupons).values({ codigo: "NATAL", tipo: "percentual", valor: 15, inicioEm: dia("2026-12-01"), fimEm: dia("2026-12-24") }).run();
  expect(checkCoupon(db, "NATAL", { agora: dia("2026-11-30").getTime() })).toEqual({ ok: false, erro: "Este cupom vale a partir de 01/12." });
  expect(checkCoupon(db, "NATAL", { agora: dia("2026-12-10").getTime() }).ok).toBe(true);
  expect(checkCoupon(db, "NATAL", { agora: dia("2026-12-26").getTime() })).toEqual({ ok: false, erro: "Este cupom expirou." });
});

test("pedido mínimo: a sacola explica, e o desconto só entra a partir do valor", () => {
  db.insert(cupons).values({ codigo: "COMPRE200", tipo: "fixo", valor: 2000, pedidoMinimoCentavos: 20000 }).run();
  const abaixo = checkCoupon(db, "COMPRE200", { subtotalCentavos: 11000 });
  expect(abaixo.ok).toBe(false);
  expect(!abaixo.ok && abaixo.erro.replace(/\s/g, " ")).toBe("Este cupom vale para compras a partir de R$ 200,00.");
  const acima = checkCoupon(db, "COMPRE200", { subtotalCentavos: 25000 });
  expect(acima.ok).toBe(true);
  if (acima.ok) {
    expect(couponDiscount(acima.rule, 25000)).toBe(2000);
    expect(couponDiscount(acima.rule, 19000)).toBe(0);
  }
});

test("limite de usos conta só pedidos não cancelados; uma vez por cliente olha o CPF", async () => {
  db.insert(cupons).values([
    { codigo: "DOIS", tipo: "percentual", valor: 10, limiteUsos: 2 },
    { codigo: "UMAVEZ", tipo: "percentual", valor: 10, umaVezPorCliente: true },
  ]).run();

  expect((await createOrder(db, order("DOIS"), deps)).ok).toBe(true);
  expect((await createOrder(db, order("DOIS"), deps)).ok).toBe(true);
  const terceiro = await createOrder(db, order("DOIS"), deps);
  expect(terceiro).toEqual({ ok: false, error: "Este cupom já foi usado o máximo de vezes. Remova o cupom na sacola para continuar." });
  // Um pedido cancelado libera o uso
  const primeiro = db.select().from(pedidos).get()!;
  applyPaymentUpdate(db, primeiro.pagamentoId!, "expirado");
  expect((await createOrder(db, order("DOIS"), deps)).ok).toBe(true);

  expect((await createOrder(db, order("UMAVEZ"), deps)).ok).toBe(true);
  expect(await createOrder(db, order("UMAVEZ"), deps)).toEqual({ ok: false, error: "Você já usou este cupom. Remova o cupom na sacola para continuar." });
  // Outra cliente (outro CPF) ainda pode
  expect((await createOrder(db, order("UMAVEZ", "111.444.777-35"), deps)).ok).toBe(true);
});
