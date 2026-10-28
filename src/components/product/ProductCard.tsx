"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { HeartIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
  favorite?: boolean;
  onFavorite?: (product: Product, favorite: boolean) => void;
  /** Use em cards acima da dobra. */
  priority?: boolean;
}

function ProductImage({ product, sizes, priority }: { product: Product; sizes: string; priority?: boolean }) {
  const foto = product.fotos[0]?.src;
  return (
    <div className="relative aspect-square overflow-hidden rounded-md bg-placeholder">
      {foto ? (
        <Image
          src={foto}
          alt={product.nome}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-250 ease-out motion-safe:group-hover:scale-[1.03]"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-[13px] text-ink-muted transition-transform duration-250 ease-out motion-safe:group-hover:scale-[1.03]">
          Foto do produto
        </span>
      )}
    </div>
  );
}

export function ProductCard({ product, variant = "default", favorite, onFavorite, priority }: ProductCardProps) {
  const [localFavorite, setLocalFavorite] = useState(false);
  const isFavorite = favorite ?? localFavorite;
  const href = `/produto/${product.slug}`;
  const soldOut = !product.ativo || product.estoque <= 0;
  const selo = soldOut ? { tipo: "soldout" as const } : product.selos[0];
  const price = (
    <span className="text-body text-ink">
      {product.precoVaria && "a partir de "}
      <strong>{formatPrice(product.precoBase)}</strong>
    </span>
  );

  function toggleFavorite() {
    const next = !isFavorite;
    setLocalFavorite(next);
    onFavorite?.(product, next);
  }

  // Relacionados ("Combina com"): só foto, nome e preço, sem selo, favoritar ou botão
  if (variant === "compact") {
    return (
      <article className="group flex flex-col gap-3">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          <ProductImage product={product} sizes="(min-width: 1024px) 280px, 50vw" />
        </Link>
        <Link
          href={href}
          className="line-clamp-2 font-heading text-[17px] font-bold text-ink no-underline hover:text-primary-hover hover:underline"
        >
          {product.nome}
        </Link>
        {price}
      </article>
    );
  }

  return (
    <article className="group flex flex-col gap-3.5">
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          <ProductImage
            product={product}
            sizes="(min-width: 1024px) 280px, (min-width: 768px) 33vw, 50vw"
            priority={priority}
          />
        </Link>
        {selo && (
          <Badge variant={selo.tipo} label={selo.label} onImage className="absolute top-3.5 left-3.5" />
        )}
        <button
          type="button"
          aria-label={`Favoritar ${product.nome}`}
          aria-pressed={isFavorite}
          onClick={toggleFavorite}
          className="absolute top-2.5 right-2.5 flex size-11 cursor-pointer items-center justify-center rounded-pill bg-white text-primary transition-colors duration-150 ease-out hover:bg-rose-50"
        >
          <HeartIcon size={20} strokeWidth={1.8} filled={isFavorite} />
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] text-ink-muted">{product.categoria}</span>
        <Link
          href={href}
          className="line-clamp-2 font-heading text-h3 text-ink no-underline hover:text-primary-hover hover:underline"
        >
          {product.nome}
        </Link>
        {price}
      </div>
      <Link href={href} className={buttonClasses({ variant: "secondary", size: "sm", className: "self-start" })}>
        {soldOut ? "Avise-me quando voltar" : "Personalizar"}
      </Link>
    </article>
  );
}
