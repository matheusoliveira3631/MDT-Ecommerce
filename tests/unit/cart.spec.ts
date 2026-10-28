import { expect, test } from "@playwright/test";
import { orderTotals, sameLine, themeLabel, type CartLine } from "../../src/lib/cart";
import type { Product } from "../../src/lib/types";

const product = (slug: string, precoBase: number | null, precoPix: number | null) =>
  ({ slug, precoBase, precoPix }) as Product;

const catalog: Record<string, Product> = {
  caixa: product("caixa", 5, 4.5),
  topo: product("topo", 40, 36),
  semPreco: product("semPreco", null, null),
};
const get = (slug: string) => catalog[slug];

const line = (produtoSlug: string, quantidade: number, nome = "Helena"): CartLine => ({
  id: `${produtoSlug}-${nome}`,
  produtoSlug,
  quantidade,
  personalizacao: { tema: "Safari", nome, cor: "Lilás" },
});

test("soma subtotal, frete e desconto", () => {
  const totals = orderTotals([line("caixa", 20), line("topo", 1)], get, { servico: "PAC", prazo: "5", valor: 25 }, { codigo: "X", tipo: "fixo", valor: 1000 });
  expect(totals.itens).toBe(21);
  expect(totals.subtotal).toBe(140);
  expect(totals.total).toBe(155);
  expect(totals.totalPix).toBe(126 + 25 - 10);
});

test("sem frete e sem cupom, só o subtotal conta", () => {
  const totals = orderTotals([line("caixa", 2)], get, null, null);
  expect(totals.shipping).toBeUndefined();
  expect(totals.discount).toBeUndefined();
  expect(totals.total).toBe(10);
});

test("preço ou desconto sem cadastro viram null (placeholder na tela)", () => {
  expect(orderTotals([line("caixa", 1), line("semPreco", 1)], get, null, null).total).toBeNull();
  expect(orderTotals([line("caixa", 1)], get, { servico: "PAC", prazo: "5", valor: null }, null).total).toBeNull();
});

test("mesma personalização é a mesma linha; diferente vira outra", () => {
  expect(sameLine(line("caixa", 1), line("caixa", 5))).toBe(true);
  expect(sameLine(line("caixa", 1, "Helena"), line("caixa", 1, "Miguel"))).toBe(false);
});

test("\"Outro tema\" mostra o tema digitado", () => {
  expect(themeLabel({ tema: "Outro tema", temaOutro: "Pequeno príncipe", nome: "A", cor: "B" })).toBe("Pequeno príncipe");
});
