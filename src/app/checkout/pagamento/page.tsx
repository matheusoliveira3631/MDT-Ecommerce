import type { Metadata } from "next";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { Header } from "@/components/layout/Header";
import { helpLinks, store } from "@/data/mock";

export const metadata: Metadata = {
  title: "Pagamento",
};

export default function PagamentoPage() {
  const trocas = helpLinks.find((l) => l.href.includes("trocas"));
  return (
    <>
      <Header variant="checkout" checkoutStep={3} />
      <main className="container-page flex-1 pt-10 pb-section-sm md:pb-20">
        <h1 className="mt-0 mb-7 text-h2-sm md:text-h2">Pagamento</h1>
        <PaymentStep parcelas={store.parcelas} descontoPix={store.descontoPix} trocasHref={trocas?.href ?? "/"} />
      </main>
    </>
  );
}
