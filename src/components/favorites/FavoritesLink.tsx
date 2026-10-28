"use client";

import Link from "next/link";
import { HeartIcon } from "@/components/ui/icons";
import { useFavorites } from "./FavoritesProvider";

/** Ícone do cabeçalho; o `aria-label` inclui quantos favoritos há. */
export function FavoritesLink({ className }: { className?: string }) {
  const { slugs } = useFavorites();
  const count = slugs.length;
  return (
    <Link href="/favoritos" aria-label={count ? `Favoritos, ${count}` : "Favoritos"} className={className}>
      <HeartIcon filled={count > 0} className={count > 0 ? "text-primary" : undefined} />
    </Link>
  );
}
