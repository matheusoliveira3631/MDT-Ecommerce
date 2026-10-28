"use client";

import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { buttonClasses } from "@/components/ui/Button";
import { HeartIcon } from "@/components/ui/icons";
import { getProduct } from "@/data/mock";
import type { Product } from "@/lib/types";
import { useFavorites } from "./FavoritesProvider";

export function FavoritesView() {
  const { slugs, hydrated } = useFavorites();

  if (!hydrated) {
    return (
      <div aria-busy="true" aria-label="Carregando favoritos" className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-square animate-pulse rounded-md bg-rose-50" />
            <div className="h-4 w-2/3 animate-pulse rounded-pill bg-rose-50" />
            <div className="h-4 w-1/3 animate-pulse rounded-pill bg-rose-50" />
          </div>
        ))}
      </div>
    );
  }

  const products = slugs.map(getProduct).filter((p): p is Product => p != null);

  if (products.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3.5 rounded-lg bg-rose-50 px-8 py-10 text-center">
        <span className="flex size-[84px] items-center justify-center rounded-pill bg-rose-100 text-primary">
          <HeartIcon size={38} strokeWidth={1.5} />
        </span>
        <h2 className="m-0 text-[22px] font-bold">Nenhum favorito ainda</h2>
        <p className="m-0 max-w-[340px] text-body text-ink-muted">
          Toque no coração dos produtos para guardar aqui o que você quer encomendar depois.
        </p>
        <Link href="/busca?q=" className={buttonClasses({ className: "mt-1.5" })}>
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-0 mb-8 text-body text-ink-muted">
        {products.length} {products.length === 1 ? "produto salvo" : "produtos salvos"} neste navegador.
      </p>
      <ProductGrid products={products} />
    </>
  );
}
