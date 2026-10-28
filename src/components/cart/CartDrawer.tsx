"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";
import { Photo } from "@/components/ui/Photo";
import { getProduct } from "@/data/mock";
import { cartTotals, lineTotal, themeLabel } from "@/lib/cart";
import { cn, formatPrice, pluralItens } from "@/lib/format";
import { useCart } from "./CartProvider";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Sacola lateral: entra pela direita com overlay ink 40%. `role="dialog"`, foco preso,
 * Esc fecha e o foco volta a quem abriu (CartProvider).
 */
export function CartDrawer() {
  const { lines, drawerOpen, closeDrawer } = useCart();
  // Mantém montado durante a animação de saída
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (drawerOpen) setMounted(true);
  }, [drawerOpen]);

  useEffect(() => {
    // Espera o painel montar para mover o foco para dentro dele
    if (!drawerOpen || !mounted) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
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
    };
  }, [drawerOpen, mounted, closeDrawer]);

  if (!mounted) return null;

  const totals = cartTotals(lines, getProduct);
  const state = drawerOpen ? "open" : "closed";

  return (
    // Fechando: fica fora da árvore de acessibilidade e do foco durante a animação de saída
    <div className="fixed inset-0 z-50" data-state={state} inert={!drawerOpen}>
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={cn(
          "absolute inset-0 bg-ink/40",
          drawerOpen ? "animate-overlay-in" : "animate-overlay-out",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sacola-lateral-title"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && !drawerOpen) setMounted(false);
        }}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-drawer",
          drawerOpen
            ? "animate-drawer-in motion-reduce:animate-fade-in"
            : "animate-drawer-out motion-reduce:animate-fade-out",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-[22px]">
          <h2 id="sacola-lateral-title" className="m-0 text-xl font-bold">
            Sua sacola{" "}
            <span className="font-body text-sm font-semibold text-ink-muted">({pluralItens(totals.itens)})</span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Fechar sacola"
            className="flex size-11 cursor-pointer items-center justify-center rounded-pill bg-rose-50 text-ink hover:bg-rose-100"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <ul className="m-0 flex flex-1 list-none flex-col gap-[18px] overflow-y-auto px-6 py-[18px]">
          {lines.map((line) => {
            const product = getProduct(line.produtoSlug);
            return (
              <li key={line.id} className="flex gap-3.5">
                <Photo
                  src={product?.fotos[0]?.src}
                  alt=""
                  sizes="76px"
                  placeholder="Foto"
                  className="size-[76px] shrink-0 rounded-sm"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <strong className="font-heading text-base">{product?.nome ?? line.produtoSlug}</strong>
                  <span className="text-[13px] text-ink-muted">
                    {themeLabel(line.personalizacao)} · {line.quantidade} un.
                  </span>
                  <span className="text-body font-extrabold">
                    {formatPrice(lineTotal(product, line.quantidade), "R$ [subtotal]")}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-3.5 bg-rose-50 px-6 py-[22px]">
          <div className="flex justify-between text-base">
            <span>Subtotal</span>
            <strong>{formatPrice(totals.subtotal, "R$ [subtotal]")}</strong>
          </div>
          <span className="-mt-1.5 text-[13px] text-ink-muted">Frete e cupom na próxima etapa</span>
          <Link href="/sacola" onClick={closeDrawer} className={buttonClasses({ fullWidth: true })}>
            Ver sacola e finalizar
          </Link>
          <button
            type="button"
            onClick={closeDrawer}
            className="min-h-11 cursor-pointer text-[15px] font-bold text-primary hover:text-primary-hover hover:underline"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
}
