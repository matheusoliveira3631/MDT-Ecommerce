"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";

/** Cache da sessão do navegador: `null` = consultado e não existe (ou foi desativado). */
const cache = new Map<string, Product | null>();

/**
 * Dados dos produtos (do banco, via /api/produtos) para componentes do navegador.
 * `ready` fica `false` até todos os slugs pedidos terem resposta.
 */
export function useProducts(slugs: string[]) {
  const key = [...new Set(slugs)].sort().join(",");
  const [, setVersion] = useState(0);
  const missing = key ? key.split(",").filter((s) => !cache.has(s)) : [];
  const missingKey = missing.join(",");

  useEffect(() => {
    if (!missingKey) return;
    let cancelled = false;
    fetch(`/api/produtos?slugs=${encodeURIComponent(missingKey)}`)
      .then((r) => (r.ok ? r.json() : { produtos: [] }))
      .then(({ produtos }: { produtos: Product[] }) => {
        const found = new Map(produtos.map((p) => [p.slug, p]));
        for (const slug of missingKey.split(",")) cache.set(slug, found.get(slug) ?? null);
        if (!cancelled) setVersion((v) => v + 1);
      })
      .catch(() => {
        // Sem rede: tenta de novo na próxima renderização
      });
    return () => {
      cancelled = true;
    };
  }, [missingKey]);

  return useMemo(
    () => ({
      ready: missing.length === 0,
      get: (slug: string) => cache.get(slug) ?? undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcula quando o cache muda (missingKey)
    [missingKey, key],
  );
}
