"use client";

import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { lineTotal, nameLabel, themeLabel, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export interface CartLineItemProps {
  line: CartLine;
  product: Product | undefined;
  onQty: (quantidade: number) => void;
  onRemove: () => void;
  editHref: string;
}

/** Item da sacola com a personalização numa `<dl>` (Tema, Nome, Cores). */
export function CartLineItem({ line, product, onQty, onRemove, editHref }: CartLineItemProps) {
  const p = line.personalizacao;
  const productHref = `/produto/${line.produtoSlug}`;
  const nome = product?.nome ?? line.produtoSlug;

  return (
    <article aria-label={nome} className="flex gap-4 rounded-lg bg-white p-4 sm:gap-5 sm:p-[22px]">
      <Link href={productHref} tabIndex={-1} aria-hidden="true" className="shrink-0">
        <Photo
          src={product?.fotos[0]?.src}
          alt=""
          sizes="120px"
          placeholder="Foto"
          className="size-20 rounded-sm sm:size-[120px] sm:rounded-md"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
          <Link
            href={productHref}
            className="font-heading text-lg font-bold text-ink no-underline hover:text-primary-hover hover:underline"
          >
            {nome}
          </Link>
          <strong className="text-[17px] whitespace-nowrap">
            {formatPrice(lineTotal(product, line.quantidade), "R$ [subtotal]")}
          </strong>
        </div>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 text-sm">
          <dt className="text-ink-muted">Tema</dt>
          <dd className="m-0">{themeLabel(p)}</dd>
          <dt className="text-ink-muted">Nome</dt>
          <dd className="m-0">{nameLabel(p)}</dd>
          <dt className="text-ink-muted">Cores</dt>
          <dd className="m-0">{p.cor}</dd>
          {p.referenciaNome && (
            <>
              <dt className="text-ink-muted">Referência</dt>
              <dd className="m-0 truncate">{p.referenciaNome}</dd>
            </>
          )}
          {p.observacoes && (
            <>
              <dt className="text-ink-muted">Observações</dt>
              <dd className="m-0 line-clamp-2">{p.observacoes}</dd>
            </>
          )}
        </dl>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            value={line.quantidade}
            onChange={onQty}
            min={product?.pedidoMinimo ?? 1}
            label={`Quantidade de ${nome}`}
          />
          <div className="flex gap-[18px] text-sm font-bold">
            <Link href={editHref} className="flex min-h-11 items-center hover:underline">
              Editar personalização
            </Link>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remover ${nome}`}
              className="min-h-11 cursor-pointer text-ink-muted underline hover:text-primary-hover"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
