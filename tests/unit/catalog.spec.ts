import { expect, test } from "@playwright/test";
import { normalize, parseSort, searchProducts, sortProducts } from "../../src/lib/catalog";
import type { Product } from "../../src/lib/types";

const product = (slug: string, nome: string, extra: Partial<Product> = {}) =>
  ({ slug, nome, categoria: "", categoriaSlug: "", temas: [], selos: [], estoque: 10, ativo: true, precoBase: null, ...extra }) as Product;

const products: Product[] = [
  product("caixa-milk-personalizada", "Caixa milk personalizada", { categoria: "Caixas milk", selos: [{ tipo: "bestseller" }] }),
  product("cesta-de-cafe-da-manha", "Cesta de café da manhã", { categoria: "Cestas" }),
  product("kit-festa-na-caixa", "Kit festa na caixa", { categoria: "Kits festa", selos: [{ tipo: "new" }] }),
  product("lembrancinha-tubete", "Tubete personalizado", { categoria: "Lembrancinhas", estoque: 0 }),
];

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

test("preço: menor primeiro e sem preço no fim", () => {
  const priced = [
    product("a", "A", { precoBase: 30 }),
    product("b", "B", { precoBase: null }),
    product("c", "C", { precoBase: 10 }),
  ];
  expect(sortProducts(priced, "menor-preco").map((p) => p.slug)).toEqual(["c", "a", "b"]);
  expect(sortProducts(priced, "maior-preco").map((p) => p.slug)).toEqual(["a", "c", "b"]);
});

test("ordem inválida cai em mais vendidos", () => {
  expect(parseSort("qualquer")).toBe("mais-vendidos");
  expect(parseSort(["menor-preco"])).toBe("menor-preco");
});
