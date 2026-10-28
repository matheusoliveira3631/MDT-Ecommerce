"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sameLine, type CartLine } from "@/lib/cart";
import type { CouponRule } from "@/lib/pricing";

const STORAGE_KEY = "mimos-da-thaty:sacola";
const COUPON_KEY = "mimos-da-thaty:cupom";

/** Cupom aplicado: a regra validada no servidor (o servidor confere de novo ao fechar o pedido). */
export type AppliedCoupon = CouponRule;

interface CartContextValue {
  lines: CartLine[];
  /** `false` até ler a sacola salva: use para mostrar skeletons em vez de "sacola vazia". */
  hydrated: boolean;
  count: number;
  addLine: (line: Omit<CartLine, "id">) => void;
  updateLine: (id: string, changes: Partial<Omit<CartLine, "id">>) => void;
  removeLine: (id: string) => { line: CartLine; index: number } | null;
  restoreLine: (line: CartLine, index: number) => void;
  /** Esvazia a sacola e o cupom (pedido finalizado). */
  clearCart: () => void;
  coupon: AppliedCoupon | null;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  drawerOpen: boolean;
  /** Abre a sacola lateral; ao fechar, o foco volta para onde estava. */
  openDrawer: () => void;
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

function readCoupon(): AppliedCoupon | null {
  try {
    const raw = window.localStorage.getItem(COUPON_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<AppliedCoupon>) : null;
    // Formato antigo ou corrompido: descarta
    return parsed?.codigo && (parsed.tipo === "percentual" || parsed.tipo === "fixo") && typeof parsed.valor === "number"
      ? (parsed as AppliedCoupon)
      : null;
  } catch {
    return null;
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
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setLines(readStorage());
    setCoupon(readCoupon());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
      if (coupon) window.localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
      else window.localStorage.removeItem(COUPON_KEY);
    } catch {
      // Armazenamento indisponível (aba anônima, cota): a sacola vale só nesta visita.
    }
  }, [lines, coupon, hydrated]);

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

  const clearCart = useCallback(() => {
    setLines([]);
    setCoupon(null);
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      hydrated,
      count: lines.reduce((sum, l) => sum + l.quantidade, 0),
      addLine,
      updateLine,
      removeLine,
      restoreLine,
      clearCart,
      coupon,
      setCoupon,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [lines, hydrated, addLine, updateLine, removeLine, restoreLine, clearCart, coupon, drawerOpen, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
