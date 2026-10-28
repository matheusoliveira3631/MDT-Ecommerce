"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ShippingCalculator } from "@/components/product/ShippingCalculator";
import { buttonClasses } from "@/components/ui/Button";
import { BagIcon, ChatIcon } from "@/components/ui/icons";
import { Toast } from "@/components/ui/Toast";
import { calculateShippingMock, getProduct, validateCouponMock } from "@/data/mock";
import { cartTotals, sumOrNull, type CartLine } from "@/lib/cart";
import { pluralItens } from "@/lib/format";
import type { ShippingOption } from "@/lib/types";
import { CartLineItem } from "./CartLineItem";
import { useCart } from "./CartProvider";
import { CouponField } from "./CouponField";
import { OrderSummary } from "./OrderSummary";

export interface CartViewProps {
  prazoProducao: string;
  parcelas: string;
  meiosPagamento: string[];
}

function EmptyCart() {
  return (
    <section
      aria-labelledby="sacola-vazia-title"
      className="mx-auto flex max-w-xl flex-col items-center gap-3.5 rounded-lg bg-white px-8 py-10 text-center"
    >
      <span className="flex size-[84px] items-center justify-center rounded-pill bg-rose-100 text-primary">
        <BagIcon size={38} strokeWidth={1.5} />
      </span>
      <span className="font-script text-[40px] leading-none text-primary">ainda vazia</span>
      <h1 id="sacola-vazia-title" className="m-0 text-[22px] font-bold">
        Sua sacola está esperando um mimo
      </h1>
      <p className="m-0 max-w-[340px] text-body text-ink-muted">
        Escolha um produto e personalize com o tema da sua festa.
      </p>
      <Link href="/#mais-vendidos" className={buttonClasses({ className: "mt-1.5" })}>
        Ver mais vendidos
      </Link>
    </section>
  );
}

/** Skeleton nas dimensões finais enquanto a sacola salva é lida. */
function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando a sacola" className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-5 rounded-lg bg-white p-[22px]">
            <div className="size-24 shrink-0 animate-pulse rounded-md bg-rose-50 sm:size-[120px]" />
            <div className="flex flex-1 flex-col gap-3 pt-1">
              <div className="h-5 w-2/3 animate-pulse rounded-pill bg-rose-50" />
              <div className="h-4 w-1/2 animate-pulse rounded-pill bg-rose-50" />
              <div className="h-4 w-1/3 animate-pulse rounded-pill bg-rose-50" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-lg bg-white" />
    </div>
  );
}

export function CartView({ prazoProducao, parcelas, meiosPagamento }: CartViewProps) {
  const { lines, hydrated, updateLine, removeLine, restoreLine } = useCart();
  const [shipping, setShipping] = useState<ShippingOption | null>(null);
  const [coupon, setCoupon] = useState<{ codigo: string; desconto: number | null } | null>(null);
  const [removed, setRemoved] = useState<{ line: CartLine; index: number } | null>(null);
  const dismissToast = useCallback(() => setRemoved(null), []);

  if (!hydrated) return <CartSkeleton />;

  const totals = cartTotals(lines, getProduct);
  const shippingValue = shipping ? shipping.valor : undefined;
  const discountValue = coupon ? coupon.desconto : undefined;
  // Sem CEP o frete fica de fora; sem cupom o desconto não entra
  const adjustments = [shippingValue === undefined ? 0 : shippingValue, discountValue === undefined ? 0 : discountValue == null ? null : -discountValue];
  const total = sumOrNull(totals.subtotal, ...adjustments);
  const pixTotal = sumOrNull(totals.subtotalPix, ...adjustments);

  const toast = (
    <Toast
      message={removed ? "Item removido" : null}
      action={
        removed
          ? {
              label: "Desfazer",
              onClick: () => {
                restoreLine(removed.line, removed.index);
                setRemoved(null);
              },
            }
          : undefined
      }
      onDismiss={dismissToast}
      duration={5000}
    />
  );

  if (lines.length === 0) {
    return (
      <>
        <EmptyCart />
        {toast}
      </>
    );
  }

  return (
    <>
      <h1 className="mt-0 mb-7 text-h2-sm md:text-h2">
        Sua sacola{" "}
        <span className="font-body text-[17px] font-semibold text-ink-muted">({pluralItens(totals.itens)})</span>
      </h1>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {lines.map((line) => (
              <li key={line.id}>
                <CartLineItem
                  line={line}
                  product={getProduct(line.produtoSlug)}
                  onQty={(quantidade) => updateLine(line.id, { quantidade })}
                  onRemove={() => setRemoved(removeLine(line.id))}
                  editHref={`/produto/${line.produtoSlug}?editar=${line.id}`}
                />
              </li>
            ))}
          </ul>

          <div className="flex items-start gap-3.5 rounded-md bg-rose-100 px-[22px] py-[18px]">
            <span className="mt-0.5 shrink-0 text-primary">
              <ChatIcon />
            </span>
            <p className="m-0 text-body">
              Depois do pagamento, enviamos a arte pelo WhatsApp para você aprovar. A produção de {prazoProducao} dias
              úteis começa a contar a partir da aprovação.
            </p>
          </div>
          <Link href="/" className="self-start py-2.5 text-body font-bold hover:underline">
            ← Continuar comprando
          </Link>
        </div>

        <OrderSummary
          subtotal={totals.subtotal}
          shipping={shippingValue}
          discount={discountValue}
          total={total}
          pixTotal={pixTotal}
          parcelas={parcelas}
          meiosPagamento={meiosPagamento}
          checkoutHref="/checkout/identificacao"
        >
          <ShippingCalculator
            label="Frete"
            placeholder="Seu CEP"
            onCalculate={calculateShippingMock}
            onSelect={setShipping}
          />
          <CouponField
            applied={coupon?.codigo}
            onApply={async (code) => {
              const result = await validateCouponMock(code);
              if (result) setCoupon(result);
              return result != null;
            }}
          />
        </OrderSummary>
      </div>
      {toast}
    </>
  );
}
