"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  /** id do título dentro do painel (`aria-labelledby`). */
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

/**
 * Painel lateral modal: overlay ink 40%, `role="dialog"`, foco preso, Esc e clique
 * fora fecham, e o foco volta para quem estava focado ao abrir. Entra em 280ms e
 * sai em 200ms; com movimento reduzido, só faz fade.
 */
export function Drawer({ open, onClose, side = "right", labelledBy, className, children }: DrawerProps) {
  // Mantém montado durante a animação de saída
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Ref para o efeito de foco não reiniciar quando o pai passa uma função nova a cada render
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    // Espera o painel montar para mover o foco para dentro dele
    if (!open || !mounted || !panelRef.current) return;
    const panel = panelRef.current;
    (panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Fechou: devolve o foco a quem abriu (se ainda estiver na página)
      const target = returnFocusRef.current;
      if (target?.isConnected) requestAnimationFrame(() => target.focus());
    };
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    // Fechando: fica fora da árvore de acessibilidade e do foco durante a animação de saída
    <div className="fixed inset-0 z-50" data-state={open ? "open" : "closed"} inert={!open}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn("absolute inset-0 bg-ink/40", open ? "animate-overlay-in" : "animate-overlay-out")}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && !open) setMounted(false);
        }}
        className={cn(
          "absolute inset-y-0 flex w-full flex-col bg-white shadow-drawer",
          side === "right" ? "right-0" : "left-0",
          open
            ? side === "right"
              ? "animate-drawer-in motion-reduce:animate-fade-in"
              : "animate-drawer-in-left motion-reduce:animate-fade-in"
            : side === "right"
              ? "animate-drawer-out motion-reduce:animate-fade-out"
              : "animate-drawer-out-left motion-reduce:animate-fade-out",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
