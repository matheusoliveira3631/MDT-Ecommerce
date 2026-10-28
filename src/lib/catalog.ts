import type { Product } from "./types";

export const SORT_OPTIONS = [
  { value: "mais-vendidos", label: "Mais vendidos" },
  { value: "novidades", label: "Novidades" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function parseSort(value: string | string[] | undefined): SortValue {
  const v = Array.isArray(value) ? value[0] : value;
  return SORT_OPTIONS.some((o) => o.value === v) ? (v as SortValue) : "mais-vendidos";
}

/** Minúsculas e sem acentos: "Café" encontra "cafe". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

const isSoldOut = (p: Product) => !p.ativo || p.estoque <= 0;
const hasBadge = (p: Product, tipo: Product["selos"][number]["tipo"]) => p.selos.some((s) => s.tipo === tipo);

/** Todas as palavras da busca precisam aparecer no nome, na categoria ou nos temas. */
export function searchProducts(products: Product[], query: string): Product[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return products;
  return products.filter((p) => {
    const haystack = normalize([p.nome, p.categoria, ...p.temas].join(" "));
    return terms.every((t) => haystack.includes(t));
  });
}

/** Ordena mantendo esgotados no fim. Preços ainda não cadastrados (`null`) vão para o fim. */
export function sortProducts(products: Product[], sort: SortValue): Product[] {
  const byPrice = (dir: 1 | -1) => (a: Product, b: Product) => {
    if (a.precoBase == null) return b.precoBase == null ? 0 : 1;
    if (b.precoBase == null) return -1;
    return (a.precoBase - b.precoBase) * dir;
  };
  const byBadge = (tipo: Product["selos"][number]["tipo"]) => (a: Product, b: Product) =>
    Number(hasBadge(b, tipo)) - Number(hasBadge(a, tipo));

  const compare = {
    "mais-vendidos": byBadge("bestseller"),
    novidades: byBadge("new"),
    "menor-preco": byPrice(1),
    "maior-preco": byPrice(-1),
  }[sort];

  return [...products].sort((a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)) || compare(a, b));
}
