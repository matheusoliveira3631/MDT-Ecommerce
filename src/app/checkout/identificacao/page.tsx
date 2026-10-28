import type { Metadata } from "next";
import { IdentificationStep } from "@/components/checkout/IdentificationStep";
import { Header } from "@/components/layout/Header";
import { store } from "@/data/mock";

export const metadata: Metadata = {
  title: "Identificação",
};

export default function IdentificacaoPage() {
  return (
    <>
      <Header variant="checkout" checkoutStep={2} />
      <main className="container-page flex-1 pt-10 pb-section-sm md:pb-20">
        <h1 className="mt-0 mb-7 text-h2-sm md:text-h2">Identificação e entrega</h1>
        <IdentificationStep parcelas={store.parcelas} />
      </main>
    </>
  );
}
