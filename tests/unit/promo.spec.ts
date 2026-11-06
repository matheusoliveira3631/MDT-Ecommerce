import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { computeTotals } from "../../src/lib/pricing";
import { effectivePrices, nextTier, promoPercent, tierFor, type CartTier } from "../../src/lib/promo";
import { createDatabase } from "../../src/server/db/connect";
import { configuracoes, cupons, pedidos, produtos } from "../../src/server/db/schema";
import { seedCatalog } from "../../src/server/db/seed";
import { createOrder, type OrderDeps } from "../../src/server/orders";

const dia = (iso: string) => new Date(`${iso}T12:00:00-03:00`);
const tiers: CartTier[] = [
  { minimoCentavos: 20000, percentual: 5 },
  { minimoCentavos: 40000, percentual: 10 },
];

test("preço promocional vale só dentro do período; o Pix mantém o mesmo desconto", () => {
  const p = {
    precoBaseCentavos: 1000,
    precoPixCentavos: 900,
    precoPromoCentavos: 800,
    promoInicioEm: dia("2026-12-01"),
    promoFimEm: dia("2026-12-24"),
  };
  expect(effectivePrices(p, dia("2026-11-30").getTime())).toEqual({ base: 1000, pix: 900, de: null });
  expect(effectivePrices(p, dia("2026-12-10").getTime())).toEqual({ base: 800, pix: 720, de: 1000 });
  expect(effectivePrices(p, dia("2026-12-25").getTime())).toEqual({ base: 1000, pix: 900, de: null });
  // Sem datas, vale enquanto preenchido; promocional maior que o normal é ignorado
  expect(effectivePrices({ ...p, promoInicioEm: null, promoFimEm: null }).de).toBe(1000);
  expect(effectivePrices({ ...p, precoPromoCentavos: 1200, promoInicioEm: null, promoFimEm: null }).de).toBeNull();
  expect(promoPercent(1000, 849)).toBe(15);
});

test("faixas: vale a maior alcançada; a próxima vira o aviso", () => {
  expect(tierFor(tiers, 19999)).toBeNull();
  expect(tierFor(tiers, 25000)?.percentual).toBe(5);
  expect(tierFor(tiers, 40000)?.percentual).toBe(10);
  expect(nextTier(tiers, 15000)?.minimoCentavos).toBe(20000);
  expect(nextTier(tiers, 25000)?.minimoCentavos).toBe(40000);
  expect(nextTier(tiers, 50000)).toBeNull();
});

test("desconto progressivo e cupom não somam: vale o maior", () => {
  const lines = [{ quantidade: 1, unitCents: 30000, unitPixCents: 27000 }];
  // 5% (R$ 15) contra cupom de R$ 10: vale o progressivo
  const a = computeTotals(lines, 0, { codigo: "DEZ", tipo: "fixo", valor: 1000 }, tiers);
  expect(a.discountSource).toBe("progressivo");
  expect(a.discount).toBe(1500);
  expect(a.discountPix).toBe(1350);
  // Cupom de 10% (R$ 30) ganha
  const b = computeTotals(lines, 0, { codigo: "MIMO10", tipo: "percentual", valor: 10 }, tiers);
  expect(b.discountSource).toBe("cupom");
  expect(b.discount).toBe(3000);
  // Sem faixa e sem cupom: sem linha de desconto
  expect(computeTotals([{ quantidade: 1, unitCents: 10000, unitPixCents: null }], 0, null, tiers).discount).toBeUndefined();
  // Compra mínima do cupom confere o subtotal normal, mesmo descontando sobre o do Pix
  const c = computeTotals(lines, 0, { codigo: "MIN", tipo: "fixo", valor: 5000, minimoCentavos: 29000 }, []);
  expect(c.discountPix).toBe(5000);
});

test("o pedido cobra o preço promocional e aplica a faixa; o cupom que perdeu não conta como usado", async () => {
  const db = createDatabase(":memory:");
  seedCatalog(db);
  db.update(produtos)
    .set({ precoBaseCentavos: 1500, precoPixCentavos: 1500, precoPromoCentavos: 1200, estoque: 1000 })
    .where(eq(produtos.slug, "caixa-milk-personalizada"))
    .run();
  db.insert(configuracoes).values({ chave: "desconto_progressivo", valor: { ativo: true, faixas: tiers } }).run();
  db.insert(cupons).values({ codigo: "DEZ", tipo: "fixo", valor: 1000 }).run();
  const deps: OrderDeps = {
    quoteShipping: async () => [{ servico: "PAC", prazo: "8 dias úteis", valorCentavos: 2590 }],
    createCharge: async () => ({ id: crypto.randomUUID(), status: "pendente", instrucoes: {} }),
  };
  const result = await createOrder(
    db,
    {
      chaveIdempotencia: crypto.randomUUID(),
      itens: [{ produtoSlug: "caixa-milk-personalizada", quantidade: 20, personalizacao: { tema: "Safari", nome: "Helena", cor: "Lilás" } }],
      cliente: { nome: "Maria Souza", email: "maria@email.com", cpf: "529.982.247-25", whatsapp: "(35) 99999-8888" },
      endereco: { cep: "37200-000", rua: "Rua A", numero: "10", bairro: "Centro", cidade: "Lavras", uf: "MG" },
      freteServico: "PAC",
      pagamento: "cartao",
      cupom: "DEZ",
    },
    deps,
  );
  expect(result.ok).toBe(true);
  const pedido = db.select().from(pedidos).get()!;
  // 20 × R$ 12,00 (promoção) = R$ 240,00 → faixa de 5% (R$ 12,00) ganha do cupom de R$ 10,00
  expect(pedido.subtotalCentavos).toBe(24000);
  expect(pedido.descontoCentavos).toBe(1200);
  expect(pedido.descontoDescricao).toBe("Desconto progressivo (5%)");
  expect(pedido.cupomCodigo).toBeNull();
  expect(pedido.totalCentavos).toBe(24000 - 1200 + 2590);
});
