"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { CardIcon, LockIcon } from "@/components/ui/icons";
import { createOrderMock } from "@/data/mock";
import { useProducts } from "@/components/catalog/useProducts";
import { orderTotals } from "@/lib/cart";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout";
import { cn, formatPrice } from "@/lib/format";
import { CheckoutGate } from "./CheckoutGate";
import { useCheckout } from "./CheckoutProvider";
import { CheckoutSummary } from "./CheckoutSummary";

export interface PaymentStepProps {
  parcelas: string;
  descontoPix: string;
  /** Link da política de trocas para produtos personalizados. */
  trocasHref: string;
}

function ReviewCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-body">
      <div className="flex items-center justify-between gap-3">
        <strong className="font-heading text-base">{title}</strong>
        <Link href="/checkout/identificacao" className="flex min-h-11 items-center text-sm font-bold hover:underline">
          Alterar
        </Link>
      </div>
      <div className="text-ink-muted">{children}</div>
    </div>
  );
}

function Step({ parcelas, descontoPix, trocasHref, onPlacing }: PaymentStepProps & { onPlacing: (v: boolean) => void }) {
  const router = useRouter();
  const { lines, coupon, clearCart } = useCart();
  const catalog = useProducts(lines.map((l) => l.produtoSlug));
  const { cliente, endereco, frete, completeOrder } = useCheckout();
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [accepted, setAccepted] = useState(false);
  const [termsError, setTermsError] = useState<string>();
  const [loading, setLoading] = useState(false);

  // CheckoutGate garante que os três existem
  if (!cliente || !endereco || !frete) return null;
  const totals = orderTotals(lines, catalog.get, frete, coupon);

  const methods: Array<{ value: PaymentMethod; detail: ReactNode }> = [
    {
      value: "pix",
      detail: (
        <>
          {descontoPix}% de desconto · {formatPrice(totals.totalPix, "R$ [total Pix]")}. O QR Code aparece na próxima
          tela e a aprovação é imediata.
        </>
      ),
    },
    {
      value: "cartao",
      detail: <>Em até {parcelas}x · {formatPrice(totals.total, "R$ [total]")}.</>,
    },
    {
      value: "boleto",
      detail: <>{formatPrice(totals.total, "R$ [total]")}. A arte começa depois da compensação, em até [X] dias úteis.</>,
    },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accepted) {
      setTermsError("Para continuar, confirme que leu a política de trocas.");
      e.currentTarget.querySelector<HTMLInputElement>("[name=termos]")?.focus();
      return;
    }
    setTermsError(undefined);
    setLoading(true);
    onPlacing(true);
    try {
      const order = await createOrderMock({
        cliente: cliente!,
        endereco: endereco!,
        frete: frete!,
        pagamento: method,
        linhas: lines,
        cupom: coupon?.codigo,
        total: totals.total,
        totalPix: totals.totalPix,
      });
      completeOrder(order);
      clearCart();
      router.push("/checkout/confirmacao");
    } catch {
      setLoading(false);
      onPlacing(false);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form noValidate onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5">
        <section aria-labelledby="revisao-title" className="flex flex-col gap-4 rounded-lg bg-white p-6 md:p-7">
          <h2 id="revisao-title" className="m-0 text-[19px] font-bold">
            Confira seus dados
          </h2>
          <ReviewCard title="Contato">
            {cliente.nome} · {cliente.email}
            <br />
            WhatsApp {cliente.whatsapp} (a arte chega por aqui)
          </ReviewCard>
          <ReviewCard title="Entrega">
            {endereco.rua}, {endereco.numero}
            {endereco.complemento && ` · ${endereco.complemento}`}
            <br />
            {endereco.bairro} · {endereco.cidade}/{endereco.uf} · CEP {endereco.cep}
            <br />
            {frete.servico} · {frete.prazo} após a produção · {formatPrice(frete.valor, "R$ [frete]")}
          </ReviewCard>
        </section>

        <fieldset className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border-0 bg-white p-6 md:p-7">
          <legend className="float-left mb-1 w-full p-0 font-heading text-[19px] font-bold">Forma de pagamento</legend>
          {methods.map(({ value, detail }) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md",
                // Borda de 2px no selecionado, compensada no padding para não pular
                method === value
                  ? "border-2 border-primary bg-rose-50 px-[17px] py-[15px]"
                  : "border border-border px-[18px] py-4 hover:bg-rose-50",
              )}
            >
              <input
                type="radio"
                name="pagamento"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="flex flex-col gap-0.5">
                <strong className="text-base">{PAYMENT_LABELS[value]}</strong>
                <span className="text-sm text-ink-muted">{detail}</span>
              </span>
            </label>
          ))}

          {method === "cartao" && (
            // Os dados do cartão nunca passam pelo nosso formulário: entram os campos seguros do gateway
            <div className="flex items-start gap-3 rounded-md border-[1.5px] border-dashed border-rose-300 p-5 text-sm">
              <span className="text-primary">
                <CardIcon />
              </span>
              <p className="m-0">
                <strong className="block text-body">Campos seguros do cartão</strong>
                <span className="text-ink-muted">
                  Número, validade e CVV são digitados nos campos do [Mercado Pago ou Pagar.me], que entram aqui na
                  integração do pagamento.
                </span>
              </p>
            </div>
          )}
        </fieldset>

        <div className="flex flex-col gap-1.5 rounded-lg bg-white p-6 md:p-7">
          <label className="flex cursor-pointer items-start gap-3 text-body">
            <input
              type="checkbox"
              name="termos"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              aria-invalid={termsError ? true : undefined}
              aria-describedby={termsError ? "termos-error" : undefined}
              className="mt-1 size-[18px] shrink-0 accent-primary"
            />
            <span>
              Li e concordo com a{" "}
              <Link href={trocasHref} target="_blank" className="font-bold">
                política de trocas
              </Link>{" "}
              para produtos personalizados.
            </span>
          </label>
          {termsError && (
            <span id="termos-error" className="text-sm font-bold text-error">
              {termsError}
            </span>
          )}
        </div>

        <Button type="submit" size="lg" fullWidth loading={loading} icon={<LockIcon size={18} strokeWidth={1.8} />}>
          {loading ? "Finalizando pedido" : "Finalizar pedido"}
        </Button>
      </form>
      <CheckoutSummary shipping={frete} parcelas={parcelas} />
    </div>
  );
}

export function PaymentStep(props: PaymentStepProps) {
  const [placing, setPlacing] = useState(false);
  return (
    <CheckoutGate requireIdentification paused={placing}>
      <Step {...props} onPlacing={setPlacing} />
    </CheckoutGate>
  );
}
