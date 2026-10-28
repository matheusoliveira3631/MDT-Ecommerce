"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { ChatIcon, CheckIcon } from "@/components/ui/icons";
import { ORDER_STATUS, PAYMENT_LABELS, type OrderView } from "@/lib/checkout";
import { cn, formatPrice } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";

const reais = (cents: number) => formatPrice(cents / 100);

/** Bloco do pagamento pendente: os dados (Pix, boleto) vêm do gateway. */
function PaymentInstructions({ order }: { order: OrderView }) {
  const [copyStatus, setCopyStatus] = useState<string>();
  const { metodo, status, instrucoes } = order.pagamento;

  if (status === "aprovado") return <p className="m-0 text-body">Pagamento confirmado. Obrigada!</p>;
  if (status === "recusado" || status === "expirado") {
    return <p className="m-0 text-body font-bold text-error">O pagamento não foi concluído e o pedido foi cancelado.</p>;
  }

  if (metodo === "cartao") {
    return <p className="m-0 text-body">Pagamento no cartão em análise. Você recebe a confirmação por e-mail.</p>;
  }

  if (metodo === "boleto") {
    return (
      <div className="flex flex-col gap-2 text-body">
        <span className="text-sm font-bold">Linha digitável</span>
        <code className="rounded-sm bg-rose-50 px-4 py-3 text-sm break-all">{instrucoes.linhaDigitavel}</code>
        <span className="text-sm text-ink-muted">Total: {reais(order.totalCentavos)}</span>
      </div>
    );
  }

  const pixCode = instrucoes.pixCopiaECola ?? "";
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
          Pague {reais(order.totalCentavos)} no app do seu banco: aponte a câmera para o QR Code ou use o código abaixo.
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
                e.currentTarget.parentElement?.querySelector("input")?.select();
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

export function OrderConfirmation({ order, whatsapp }: { order: OrderView; whatsapp: string }) {
  const cancelled = order.status === "cancelado";
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
          Pagamento · {PAYMENT_LABELS[order.pagamento.metodo]}
        </h2>
        <PaymentInstructions order={order} />
      </section>

      {!cancelled && (
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
      )}

      <section aria-labelledby="itens-title" className="flex flex-col gap-3 rounded-lg bg-white p-6 md:p-7">
        <h2 id="itens-title" className="m-0 text-[19px] font-bold">
          Itens do pedido
        </h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-body">
          {order.itens.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {item.nome}
                <span className="text-ink-muted">
                  {" "}
                  · {item.tema} · {item.nomeNaArte} · {item.quantidade} un.
                </span>
              </span>
              <span className="whitespace-nowrap">{reais(item.precoUnitarioCentavos * item.quantidade)}</span>
            </li>
          ))}
        </ul>
        <dl className="m-0 grid grid-cols-[1fr_auto] gap-2 border-t border-border pt-3 text-body">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="m-0 text-right">{reais(order.subtotalCentavos)}</dd>
          <dt className="text-ink-muted">Frete ({order.freteServico})</dt>
          <dd className="m-0 text-right">{reais(order.freteCentavos)}</dd>
          {order.descontoCentavos > 0 && (
            <>
              <dt className="text-ink-muted">Desconto{order.cupom ? ` (${order.cupom})` : ""}</dt>
              <dd className="m-0 text-right">−{reais(order.descontoCentavos)}</dd>
            </>
          )}
          <dt className="pt-1 text-lg font-extrabold">Total</dt>
          <dd className="m-0 pt-1 text-right text-lg font-extrabold">{reais(order.totalCentavos)}</dd>
        </dl>
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
