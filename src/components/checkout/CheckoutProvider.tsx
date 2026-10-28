"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Address, Customer } from "@/lib/checkout";
import type { ShippingOption } from "@/lib/types";

const STORAGE_KEY = "mimos-da-thaty:checkout";

export interface CheckoutData {
  cliente: Customer | null;
  endereco: Address | null;
  frete: ShippingOption | null;
  /**
   * Identifica esta tentativa de compra: reenviar o mesmo pedido (duplo clique,
   * rede instável) devolve o pedido já criado em vez de criar outro.
   */
  chaveIdempotencia: string | null;
}

interface CheckoutContextValue extends CheckoutData {
  hydrated: boolean;
  saveIdentification: (data: { cliente: Customer; endereco: Address; frete: ShippingOption }) => void;
  /** Chave da tentativa atual (criada na primeira vez que é pedida). */
  ensureIdempotencyKey: () => string;
  /** Pedido criado: limpa os dados do checkout desta sessão. */
  finishCheckout: () => void;
}

const EMPTY: CheckoutData = { cliente: null, endereco: null, frete: null, chaveIdempotencia: null };
const CheckoutContext = createContext<CheckoutContextValue | null>(null);

function read(): CheckoutData {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<CheckoutData>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(value: CheckoutData | null) {
  try {
    if (value == null) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Armazenamento indisponível: os dados valem só enquanto a página estiver aberta.
  }
}

/** Dados do checkout na sessão do navegador (somem ao fechar a aba). */
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CheckoutData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(read());
    setHydrated(true);
  }, []);

  const update = useCallback((next: CheckoutData) => {
    setData(next);
    write(next);
  }, []);

  const saveIdentification = useCallback(
    (next: { cliente: Customer; endereco: Address; frete: ShippingOption }) => {
      // Dados mudaram: é outra tentativa de compra
      update({ ...next, chaveIdempotencia: null });
    },
    [update],
  );

  const ensureIdempotencyKey = useCallback(() => {
    if (data.chaveIdempotencia) return data.chaveIdempotencia;
    const key = crypto.randomUUID();
    update({ ...data, chaveIdempotencia: key });
    return key;
  }, [data, update]);

  const finishCheckout = useCallback(() => {
    setData(EMPTY);
    write(null);
  }, []);

  const value = useMemo<CheckoutContextValue>(
    () => ({ ...data, hydrated, saveIdentification, ensureIdempotencyKey, finishCheckout }),
    [data, hydrated, saveIdentification, ensureIdempotencyKey, finishCheckout],
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout precisa estar dentro de <CheckoutProvider>");
  return ctx;
}
