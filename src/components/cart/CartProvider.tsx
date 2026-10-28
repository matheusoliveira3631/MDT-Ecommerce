"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { sameLine, type CartLine } from "@/lib/cart";

const STORAGE_KEY = "mimos-da-thaty:sacola";

interface CartContextValue {
  lines: CartLine[];
  /** `false` até ler a sacola salva: use para mostrar skeletons em vez de "sacola vazia". */
  hydrated: boolean;
  count: number;
  addLine: (line: Omit<CartLine, "id">) => void;
  updateLine: (id: string, changes: Partial<Omit<CartLine, "id">>) => void;
  removeLine: (id: string) => { line: CartLine; index: number } | null;
  restoreLine: (line: CartLine, index: number) => void;
  drawerOpen: boolean;
  /** Abre a sacola lateral e devolve o foco a `returnFocus` ao fechar. */
  openDrawer: (returnFocus?: HTMLElement | null) => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Sacola no navegador (localStorage) enquanto não há backend de pedidos.
 * Em produção, troque a persistência por uma API mantendo esta interface.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setLines(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Armazenamento indisponível (aba anônima, cota): a sacola vale só nesta visita.
    }
  }, [lines, hydrated]);

  /** Personalização igual à de uma linha existente soma a quantidade; diferente vira outra linha. */
  const addLine = useCallback((input: Omit<CartLine, "id">) => {
    const id = newId();
    setLines((current) => {
      const existing = current.find((l) => sameLine(l, input));
      if (!existing) return [...current, { ...input, id }];
      return current.map((l) => (l.id === existing.id ? { ...l, quantidade: l.quantidade + input.quantidade } : l));
    });
  }, []);

  const updateLine = useCallback((id: string, changes: Partial<Omit<CartLine, "id">>) => {
    setLines((current) => current.map((l) => (l.id === id ? { ...l, ...changes } : l)));
  }, []);

  const removeLine = useCallback(
    (id: string) => {
      const index = lines.findIndex((l) => l.id === id);
      if (index === -1) return null;
      const line = lines[index];
      setLines((current) => current.filter((l) => l.id !== id));
      return { line, index };
    },
    [lines],
  );

  const restoreLine = useCallback((line: CartLine, index: number) => {
    setLines((current) => {
      if (current.some((l) => l.id === line.id)) return current;
      const next = current.slice();
      next.splice(Math.min(index, next.length), 0, line);
      return next;
    });
  }, []);

  const openDrawer = useCallback((returnFocus?: HTMLElement | null) => {
    returnFocusRef.current = returnFocus ?? (document.activeElement as HTMLElement | null);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    // Devolve o foco a quem abriu, depois que o diálogo sai da árvore
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      hydrated,
      count: lines.reduce((sum, l) => sum + l.quantidade, 0),
      addLine,
      updateLine,
      removeLine,
      restoreLine,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [lines, hydrated, addLine, updateLine, removeLine, restoreLine, drawerOpen, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
