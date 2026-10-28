"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { ChatIcon, CheckIcon } from "@/components/ui/icons";
import { getProduct } from "@/data/mock";
import { themeLabel } from "@/lib/cart";
import { ORDER_STATUS, PAYMENT_LABELS, type Order } from "@/lib/checkout";
import { cn, formatPrice } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";
import { useCheckout } from "./CheckoutProvider";

/** Bloco do pagamento pendente: o conteúdo real (QR Code, linha digitável) vem do gateway. */
function PaymentInstructions({ order }: { order: Order }) {
  const [copyStatus, setCopyStatus] = useState<string>();
  const pixCode = "[código Pix copia e cola]";

  if (order.pagamento === "cartao") {
    return (
      <p className="m-0 text-body">
        Pagamento no cartão em análise pelo [Mercado Pago ou Pagar.me]. Você recebe a confirmação por e-mail.
      </p>
    );
  }

  if (order.pagamento === "boleto") {
    return (
      <div className="flex flex-col gap-2 text-body">
        <span className="text-sm font-bold">Linha digitável</span>
        <code className="rounded-sm bg-rose-50 px-4 py-3 text-sm break-all">[linha digitável do boleto]</code>
        <span className="text-sm text-ink-muted">Total: {formatPrice(order.total, "R$ [total]")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row">
      <div
        role="img"
        aria-label="QR Code do Pix"
        className="flex size-40 shrink-0 items-center justify-center rounded-md bg-placeholder text-center text-[13px] text-ink-muted"
      >
        QR Code do Pix
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-body">
          Pague {formatPrice(order.totalPix, "R$ [total Pix]")} no app do seu banco: aponte a câmera para o QR Code ou use
          o código abaixo.
        </span>
        <label htmlFor="pix-copia-e-cola" className="text-sm font-bold">
          Pix copia e cola
        </label>
        <div className="flex gap-2">
          <input
            id="pix-copia-e-cola"
            readOnly
            value={pixCode}
            className="h-[46px] min-w-0 flex-1 rounded-pill border border-border-input bg-rose-50 px-4 text-sm text-ink"
          />
          <button
            type="button"
            onClick={async (e) => {
              try {
                await navigator.clipboard.writeText(pixCode);
                setCopyStatus("Código copiado");
              } catch {
                // Sem permissão de área de transferência: seleciona o código para copiar à mão
                const input = e.currentTarget.parentElement?.querySelector("input");
                input?.select();
                setCopyStatus("Código selecionado: use Ctrl+C ou Copiar do seu celular");
              }
            }}
            className={buttonClasses({ variant: "soft", size: "field" })}
          >
            Copiar
          </button>
        </div>
        <span role="status" className="text-sm font-bold text-primary">
          {copyStatus}
        </span>
      </div>
    </div>
  );
}

export function OrderConfirmation({ whatsapp }: { whatsapp: string }) {
  const router = useRouter();
  const { order, hydrated } = useCheckout();

  useEffect(() => {
    if (hydrated && !order) router.replace("/");
  }, [hydrated, order, router]);

  if (!order) {
    return <div aria-busy="true" aria-label="Carregando" className="mx-auto h-96 max-w-3xl animate-pulse rounded-lg bg-white" />;
  }

  const currentIndex = ORDER_STATUS.findIndex((s) => s.value === order.status);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <section className="flex flex-col items-center gap-3 rounded-lg bg-white px-6 py-10 text-center">
        <span className="flex size-[72px] items-center justify-center rounded-pill bg-rose-100 text-primary">
          <CheckIcon size={34} />
        </span>
        <span className="font-script text-[44px] leading-none text-primary">obrigada!</span>
        <h1 className="m-0 text-h2-sm md:text-h2">Pedido {order.numero} recebido</h1>
        <p className="m-0 max-w-lg text-body-lg text-ink-muted">
          Enviamos a confirmação para {order.cliente.email}. A arte chega no seu WhatsApp {order.cliente.whatsapp} para
          você aprovar antes da produção.
        </p>
      </section>

      <section aria-labelledby="pagamento-title" className="flex flex-col gap-4 rounded-lg bg-white p-6 md:p-7">
        <h2 id="pagamento-title" className="m-0 text-[19px] font-bold">
          Pagamento · {PAYMENT_LABELS[order.pagamento]}
        </h2>
        <PaymentInstructions order={order} />
      </section>

      <section aria-labelledby="proximos-title" className="flex flex-col gap-4 rounded-lg bg-white p-6 md:p-7">
        <h2 id="proximos-title" className="m-0 text-[19px] font-bold">
          Próximos passos
        </h2>
        <ol className="m-0 flex list-none flex-col p-0">
          {ORDER_STATUS.map((status, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;
            return (
              <li key={status.value} aria-current={current ? "step" : undefined} className="relative flex gap-4 pb-5 last:pb-0">
                {i < ORDER_STATUS.length - 1 && (
                  <span aria-hidden="true" className="absolute top-8 bottom-0 left-[15px] w-0.5 bg-border" />
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative flex size-8 shrink-0 items-center justify-center rounded-pill text-sm font-bold",
                    current || done ? "bg-primary text-white" : "border border-border-input bg-white text-ink-muted",
                  )}
                >
                  {done ? <CheckIcon size={16} /> : i + 1}
                </span>
                <span className="flex flex-col pt-1">
                  <strong className={cn("text-body", !current && !done && "text-ink-muted")}>{status.label}</strong>
                  <span className="text-sm text-ink-muted">{status.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="itens-title" className="flex flex-col gap-3 rounded-lg bg-white p-6 md:p-7">
        <h2 id="itens-title" className="m-0 text-[19px] font-bold">
          Itens do pedido
        </h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-body">
          {order.linhas.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span>
                {getProduct(line.produtoSlug)?.nome ?? line.produtoSlug}
                <span className="text-ink-muted">
                  {" "}
                  · {themeLabel(line.personalizacao)} · {line.personalizacao.nome}
                </span>
              </span>
              <span className="whitespace-nowrap">{line.quantidade} un.</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-border pt-3 text-lg font-extrabold">
          <span>Total</span>
          <span>{formatPrice(order.pagamento === "pix" ? order.totalPix : order.total, "R$ [total]")}</span>
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={whatsappHref(whatsapp, `Olá! Fiz o pedido ${order.numero} no site.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "secondary", size: "lg" })}
        >
          <ChatIcon size={20} strokeWidth={1.8} />
          Falar no WhatsApp
        </a>
        <Link href="/" className={buttonClasses({ size: "lg" })}>
          Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
