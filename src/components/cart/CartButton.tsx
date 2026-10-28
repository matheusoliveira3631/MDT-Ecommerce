"use client";

import Link from "next/link";
import { BagIcon } from "@/components/ui/icons";
import { pluralItens } from "@/lib/format";
import { useCart } from "./CartProvider";

/** Ícone de 44×44 com badge; o `aria-label` inclui a contagem. */
export function CartButton({ className }: { className?: string }) {
  const { count } = useCart();
  const label = count > 0 ? `Sacola, ${pluralItens(count)}` : "Sacola vazia";
  return (
    <Link href="/sacola" aria-label={label} className={className}>
      <BagIcon />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-primary px-1 text-[11px] font-extrabold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
