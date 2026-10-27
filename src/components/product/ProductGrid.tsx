import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

/** 2 colunas no mobile; `auto-fill` com mínimo de 260px a partir do tablet. */
export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-grid">
      {products.map((p, i) => (
        <li key={p.slug}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
