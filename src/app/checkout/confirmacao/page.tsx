import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { Header } from "@/components/layout/Header";
import { store } from "@/data/mock";
import { db } from "@/server/db";
import { getOrderForCustomer } from "@/server/orders";

export const metadata: Metadata = {
  title: "Pedido recebido",
  // O token da URL dá acesso aos dados do pedido: não indexar nem repassar como referer
  referrer: "no-referrer",
};

interface PageProps {
  searchParams: Promise<{ pedido?: string; token?: string }>;
}

export default async function ConfirmacaoPage({ searchParams }: PageProps) {
  const { pedido, token } = await searchParams;
  const order = pedido && token ? getOrderForCustomer(db, pedido, token) : null;
  if (!order) notFound();

  return (
    <>
      <Header variant="checkout" checkoutStep={4} />
      <main className="container-page flex-1 pt-10 pb-section-sm md:pb-20">
        <OrderConfirmation order={order} whatsapp={store.whatsapp.numero} />
      </main>
    </>
  );
}
