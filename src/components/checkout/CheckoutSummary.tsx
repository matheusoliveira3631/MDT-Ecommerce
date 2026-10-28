"use client";

import { useCart } from "@/components/cart/CartProvider";
import { TotalsList } from "@/components/cart/OrderSummary";
import { Photo } from "@/components/ui/Photo";
import { getProduct } from "@/data/mock";
import { lineTotal, orderTotals, themeLabel } from "@/lib/cart";
import { formatPrice, pluralItens } from "@/lib/format";
import type { ShippingOption } from "@/lib/types";

/** Resumo do checkout: itens em lista compacta + totais. Fixo à direita no desktop. */
export function CheckoutSummary({ shipping, parcelas }: { shipping: ShippingOption | null; parcelas: string }) {
  const { lines, coupon } = useCart();
  const totals = orderTotals(lines, getProduct, shipping, coupon);

  return (
    <aside aria-labelledby="resumo-checkout-title" className="flex flex-col gap-[18px] rounded-lg bg-white p-6 md:p-7 lg:sticky lg:top-6">
      <h2 id="resumo-checkout-title" className="m-0 text-[22px] font-bold">
        Resumo do pedido{" "}
        <span className="font-body text-sm font-semibold text-ink-muted">({pluralItens(totals.itens)})</span>
      </h2>
      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {lines.map((line) => {
          const product = getProduct(line.produtoSlug);
          return (
            <li key={line.id} className="flex gap-3">
              <Photo src={product?.fotos[0]?.src} alt="" sizes="56px" className="size-14 shrink-0 rounded-sm" />
              <div className="flex min-w-0 flex-1 flex-col text-sm">
                <strong className="truncate font-heading text-[15px]">{product?.nome ?? line.produtoSlug}</strong>
                <span className="text-ink-muted">
                  {themeLabel(line.personalizacao)} · {line.personalizacao.nome} · {line.quantidade} un.
                </span>
              </div>
              <span className="text-sm font-bold whitespace-nowrap">
                {formatPrice(lineTotal(product, line.quantidade), "R$ [subtotal]")}
              </span>
            </li>
          );
        })}
      </ul>
      {coupon && <span className="text-sm font-bold text-primary">Cupom {coupon.codigo} aplicado</span>}
      <TotalsList
        subtotal={totals.subtotal}
        shipping={totals.shipping}
        discount={totals.discount}
        total={totals.total}
        pixTotal={totals.totalPix}
        parcelas={parcelas}
      />
    </aside>
  );
}
