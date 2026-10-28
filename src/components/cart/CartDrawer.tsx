"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { useProducts } from "@/components/catalog/useProducts";
import { Drawer } from "@/components/ui/Drawer";
import { CloseIcon } from "@/components/ui/icons";
import { Photo } from "@/components/ui/Photo";
import { cartTotals, lineTotal, themeLabel } from "@/lib/cart";
import { formatPrice, pluralItens } from "@/lib/format";
import { useCart } from "./CartProvider";

/** Sacola lateral: abre pela direita ao adicionar um item (desktop). */
export function CartDrawer() {
  const { lines, drawerOpen, closeDrawer } = useCart();
  const catalog = useProducts(lines.map((l) => l.produtoSlug));
  const totals = cartTotals(lines, catalog.get);

  return (
    <Drawer open={drawerOpen} onClose={closeDrawer} labelledBy="sacola-lateral-title" className="max-w-[420px]">
      <div className="flex items-center justify-between border-b border-border px-6 py-[22px]">
        <h2 id="sacola-lateral-title" className="m-0 text-xl font-bold">
          Sua sacola{" "}
          <span className="font-body text-sm font-semibold text-ink-muted">({pluralItens(totals.itens)})</span>
        </h2>
        <button
          data-autofocus
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
          const product = catalog.get(line.produtoSlug);
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
    </Drawer>
  );
}
