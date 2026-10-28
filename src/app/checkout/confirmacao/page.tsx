import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { Header } from "@/components/layout/Header";
import { store } from "@/data/mock";

export const metadata: Metadata = {
  title: "Pedido recebido",
};

export default function ConfirmacaoPage() {
  return (
    <>
      <Header variant="checkout" checkoutStep={4} />
      <main className="container-page flex-1 pt-10 pb-section-sm md:pb-20">
        <OrderConfirmation whatsapp={store.whatsapp.numero} />
      </main>
    </>
  );
}
