"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast, type ToastAction } from "./Toast";

interface ToastOptions {
  message: string;
  action?: ToastAction;
  /** ms; o padrão do handoff é 4s (5s para "Desfazer"). */
  duration?: number;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

/** Um único toast para a loja inteira: uma mensagem nova substitui a anterior. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<(ToastOptions & { key: number }) | null>(null);
  const pathname = usePathname();
  const show = useCallback((options: ToastOptions) => setCurrent({ ...options, key: Date.now() }), []);
  const dismiss = useCallback(() => setCurrent(null), []);
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        key={current?.key}
        message={current?.message ?? null}
        action={current?.action}
        duration={current?.duration}
        onDismiss={dismiss}
        // No produto, o mobile tem a barra fixa de compra embaixo
        className={pathname.startsWith("/produto/") ? "max-md:bottom-24" : undefined}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return show;
}
