import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

export interface OrderSummaryProps {
  subtotal: number | null;
  /** `undefined` enquanto o CEP não foi informado. */
  shipping?: number | null;
  /** `undefined` sem cupom aplicado. */
  discount?: number | null;
  total: number | null;
  pixTotal: number | null;
  parcelas: string;
  meiosPagamento: string[];
  checkoutHref: string;
  /** Campos de frete e cupom, acima dos valores. */
  children?: ReactNode;
}

export type TotalsListProps = Pick<
  OrderSummaryProps,
  "subtotal" | "shipping" | "discount" | "total" | "pixTotal" | "parcelas"
>;

/** Subtotal, frete, desconto, total e a linha do Pix/parcelas. */
export function TotalsList({ subtotal, shipping, discount, total, pixTotal, parcelas }: TotalsListProps) {
  return (
    <>
      <dl className="m-0 grid grid-cols-[1fr_auto] gap-2.5 border-t border-border pt-[18px] text-body">
        <dt className="text-ink-muted">Subtotal</dt>
        <dd className="m-0 text-right">{formatPrice(subtotal, "R$ [subtotal]")}</dd>
        <dt className="text-ink-muted">Frete</dt>
        <dd className="m-0 text-right">
          {shipping === undefined ? (
            <span className="text-ink-muted">Informe o CEP</span>
          ) : (
            formatPrice(shipping, "R$ [frete]")
          )}
        </dd>
        {discount !== undefined && (
          <>
            <dt className="text-ink-muted">Desconto</dt>
            <dd className="m-0 text-right">−{formatPrice(discount, "R$ [0,00]")}</dd>
          </>
        )}
        <dt className="pt-2 text-lg font-extrabold">Total</dt>
        <dd className="m-0 pt-2 text-right text-lg font-extrabold">{formatPrice(total, "R$ [total]")}</dd>
      </dl>
      <span className="-mt-2 text-sm text-ink-muted">
        ou {formatPrice(pixTotal, "R$ [total Pix]")} no Pix · até {parcelas}x no cartão
      </span>
    </>
  );
}

/** Card do resumo: fixo à direita no desktop (sticky), abaixo da lista no mobile. */
export function OrderSummary({
  subtotal,
  shipping,
  discount,
  total,
  pixTotal,
  parcelas,
  meiosPagamento,
  checkoutHref,
  children,
}: OrderSummaryProps) {
  return (
    <aside
      aria-labelledby="resumo-title"
      className="flex flex-col gap-[18px] rounded-lg bg-white p-6 md:p-7 lg:sticky lg:top-6"
    >
      <h2 id="resumo-title" className="m-0 text-[22px] font-bold">
        Resumo
      </h2>
      {children}
      <TotalsList
        subtotal={subtotal}
        shipping={shipping}
        discount={discount}
        total={total}
        pixTotal={pixTotal}
        parcelas={parcelas}
      />
      <Link href={checkoutHref} className={buttonClasses({ size: "lg", fullWidth: true })}>
        Finalizar compra
      </Link>
      <ul aria-label="Formas de pagamento" className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
        {meiosPagamento.map((meio) => (
          <li key={meio} className="rounded-[8px] border border-border px-2.5 py-1.5 text-xs font-bold text-ink-muted">
            {meio}
          </li>
        ))}
      </ul>
    </aside>
  );
}
