import type { MetadataRoute } from "next";
import { helpPages, legalPages } from "@/data/content";
import { categories, products, store } from "@/data/mock";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{ path: string; priority: number }> = [
    { path: "/", priority: 1 },
    { path: "/categorias", priority: 0.8 },
    ...categories.map((c) => ({ path: `/categoria/${c.slug}`, priority: 0.8 })),
    ...products.filter((p) => p.ativo).map((p) => ({ path: `/produto/${p.slug}`, priority: 0.9 })),
    { path: "/ajuda", priority: 0.4 },
    ...helpPages(store).map((p) => ({ path: `/ajuda/${p.slug}`, priority: 0.4 })),
    ...legalPages(store).map((p) => ({ path: `/${p.slug}`, priority: 0.2 })),
  ];
  return pages.map(({ path, priority }) => ({ url: absoluteUrl(path), priority }));
}
