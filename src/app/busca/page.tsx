import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LostState } from "@/components/layout/LostState";
import { ProductListing } from "@/components/product/ProductListing";
import { helpLinks, store } from "@/data/mock";
import { listarCategorias, listarProdutos } from "@/server/catalog";
import { parseSort, searchProducts, sortProducts } from "@/lib/catalog";

interface PageProps {
  searchParams: Promise<{ q?: string | string[]; ordem?: string | string[] }>;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const q = first((await searchParams).q).trim();
  return { title: q ? `Busca: ${q}` : "Todos os produtos", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = first(params.q).trim();
  const sort = parseSort(params.ordem);
  const [categories, products] = await Promise.all([listarCategorias(), listarProdutos()]);
  const results = sortProducts(searchProducts(products, q), sort);

  return (
    <>
      <Header categories={categories} defaultQuery={q} />
      {results.length === 0 ? (
        // Sem resultados: layout da 404, mantendo a busca e as categorias
        <main className="bg-rose-50">
          <LostState
            kicker="Hum…"
            title={`Nada encontrado para “${q}”`}
            text="Confira se a palavra está certa ou tente um termo mais simples, como “caixa” ou “topo”."
            categories={categories}
            whatsapp={store.whatsapp.numero}
            defaultQuery={q}
          />
        </main>
      ) : (
        <main className="container-page pt-10 pb-section-sm md:pb-section">
          <ProductListing
            kicker={q ? "você buscou" : undefined}
            title={q ? `“${q}”` : "Todos os produtos"}
            products={results}
            sort={sort}
          />
        </main>
      )}
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
