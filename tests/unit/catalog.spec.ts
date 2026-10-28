import { expect, test } from "@playwright/test";
import { normalize, parseSort, searchProducts, sortProducts } from "../../src/lib/catalog";
import { products } from "../../src/data/mock";

test("busca ignora acentos e maiúsculas e exige todas as palavras", () => {
  expect(normalize("  CAFÉ ")).toBe("cafe");
  expect(searchProducts(products, "CAFE").map((p) => p.slug)).toEqual(["cesta-de-cafe-da-manha"]);
  expect(searchProducts(products, "caixa milk").map((p) => p.slug)).toEqual(["caixa-milk-personalizada"]);
  expect(searchProducts(products, "caixa unicornio")).toEqual([]);
  expect(searchProducts(products, "")).toHaveLength(products.length);
});

test("ordenação mantém esgotados no fim", () => {
  const sorted = sortProducts(products, "novidades");
  expect(sorted[0].slug).toBe("kit-festa-na-caixa");
  expect(sorted.at(-1)?.estoque).toBe(0);
});

test("ordem inválida cai em mais vendidos", () => {
  expect(parseSort("qualquer")).toBe("mais-vendidos");
  expect(parseSort(["menor-preco"])).toBe("menor-preco");
});
