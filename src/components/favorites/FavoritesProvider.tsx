"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "mimos-da-thaty:favoritos";

interface FavoritesContextValue {
  slugs: string[];
  hydrated: boolean;
  isFavorite: (slug: string) => boolean;
  /** Devolve o novo estado (true = salvo). */
  toggle: (slug: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/** Favoritos no navegador (localStorage) até existir conta de cliente. */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(parsed)) setSlugs(parsed.filter((s) => typeof s === "string"));
    } catch {
      // Armazenamento indisponível: começa vazio.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {
      // Armazenamento indisponível: os favoritos valem só nesta visita.
    }
  }, [slugs, hydrated]);

  const isFavorite = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback(
    (slug: string) => {
      const next = !slugs.includes(slug);
      setSlugs((current) => (next ? [...current, slug] : current.filter((s) => s !== slug)));
      return next;
    },
    [slugs],
  );

  const value = useMemo(() => ({ slugs, hydrated, isFavorite, toggle }), [slugs, hydrated, isFavorite, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites precisa estar dentro de <FavoritesProvider>");
  return ctx;
}
