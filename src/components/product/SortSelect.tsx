"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId } from "react";
import { SORT_OPTIONS, type SortValue } from "@/lib/catalog";

/** Troca `?ordem=` mantendo os outros parâmetros (ex.: `q` da busca). */
export function SortSelect({ value }: { value: SortValue }) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor={id} className="text-sm font-bold whitespace-nowrap">
        Ordenar por
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("ordem", e.target.value);
          router.replace(`${pathname}?${next.toString()}`, { scroll: false });
        }}
        className="h-11 cursor-pointer rounded-pill border border-border-input bg-white px-4 text-body text-ink focus:border-primary"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
