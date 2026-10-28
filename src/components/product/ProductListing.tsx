import { Suspense, type ReactNode } from "react";
import type { SortValue } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { ProductGrid } from "./ProductGrid";
import { SortSelect } from "./SortSelect";

export interface ProductListingProps {
  title: ReactNode;
  kicker?: string;
  products: Product[];
  sort: SortValue;
  /** Conteúdo quando a lista está vazia. */
  empty?: ReactNode;
}

/** Cabeçalho (título, contagem, ordenação) + grade. Usado em categoria e busca. */
export function ProductListing({ title, kicker, products, sort, empty }: ProductListingProps) {
  const count = products.length;
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          {kicker && <span className="block font-script text-[34px] leading-tight text-primary">{kicker}</span>}
          <h1 className="m-0 text-h1-sm md:text-h1">{title}</h1>
          <p className="mt-1.5 mb-0 text-body text-ink-muted" aria-live="polite">
            {count} {count === 1 ? "produto" : "produtos"}
          </p>
        </div>
        {count > 1 && (
          <Suspense>
            <SortSelect value={sort} />
          </Suspense>
        )}
      </div>
      {count > 0 ? <ProductGrid products={products} priorityCount={2} /> : empty}
    </>
  );
}
