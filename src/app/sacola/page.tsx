import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { store } from "@/data/mock";

export const metadata: Metadata = {
  title: "Sacola",
  robots: { index: false },
};

export default function SacolaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-rose-50">
      <Header variant="checkout" checkoutStep={1} />
      <main className="container-page flex-1 pt-10 pb-section-sm md:pb-20">
        <CartView
          prazoProducao={store.prazoProducaoPadrao}
          parcelas={store.parcelas}
          meiosPagamento={store.meiosPagamento}
        />
      </main>
      <Footer variant="compact" store={store} />
    </div>
  );
}
