import type { MetadataRoute } from "next";
import { helpPages, legalPages } from "@/data/content";
import { store } from "@/data/mock";
import { listarCategorias, listarProdutos } from "@/server/catalog";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([listarCategorias(), listarProdutos()]);
  const pages: Array<{ path: string; priority: number }> = [
    { path: "/", priority: 1 },
    { path: "/categorias", priority: 0.8 },
    ...categories.map((c) => ({ path: `/categoria/${c.slug}`, priority: 0.8 })),
    ...products.map((p) => ({ path: `/produto/${p.slug}`, priority: 0.9 })),
    { path: "/ajuda", priority: 0.4 },
    ...helpPages(store).map((p) => ({ path: `/ajuda/${p.slug}`, priority: 0.4 })),
    ...legalPages(store).map((p) => ({ path: `/${p.slug}`, priority: 0.2 })),
  ];
  return pages.map(({ path, priority }) => ({ url: absoluteUrl(path), priority }));
}
