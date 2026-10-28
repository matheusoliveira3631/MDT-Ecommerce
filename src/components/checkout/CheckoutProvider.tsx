"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Address, Customer, Order } from "@/lib/checkout";
import type { ShippingOption } from "@/lib/types";

const STORAGE_KEY = "mimos-da-thaty:checkout";
const ORDER_KEY = "mimos-da-thaty:ultimo-pedido";

export interface CheckoutData {
  cliente: Customer | null;
  endereco: Address | null;
  frete: ShippingOption | null;
}

interface CheckoutContextValue extends CheckoutData {
  hydrated: boolean;
  saveIdentification: (data: { cliente: Customer; endereco: Address; frete: ShippingOption }) => void;
  order: Order | null;
  /** Guarda o pedido criado e limpa os dados do checkout. */
  completeOrder: (order: Order) => void;
}

const EMPTY: CheckoutData = { cliente: null, endereco: null, frete: null };
const CheckoutContext = createContext<CheckoutContextValue | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value == null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Armazenamento indisponível: os dados valem só enquanto a página estiver aberta.
  }
}

/**
 * Dados do checkout na sessão do navegador (somem ao fechar a aba). Com backend,
 * troque por chamadas à API mantendo esta interface.
 */
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CheckoutData>(EMPTY);
  const [order, setOrder] = useState<Order | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(read(STORAGE_KEY, EMPTY));
    setOrder(read<Order | null>(ORDER_KEY, null));
    setHydrated(true);
  }, []);

  const saveIdentification = useCallback((next: { cliente: Customer; endereco: Address; frete: ShippingOption }) => {
    setData(next);
    write(STORAGE_KEY, next);
  }, []);

  const completeOrder = useCallback((created: Order) => {
    setOrder(created);
    write(ORDER_KEY, created);
    setData(EMPTY);
    write(STORAGE_KEY, null);
  }, []);

  const value = useMemo<CheckoutContextValue>(
    () => ({ ...data, hydrated, saveIdentification, order, completeOrder }),
    [data, hydrated, saveIdentification, order, completeOrder],
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout precisa estar dentro de <CheckoutProvider>");
  return ctx;
}
