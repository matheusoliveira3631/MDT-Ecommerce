import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LostState } from "@/components/layout/LostState";
import { helpLinks, store } from "@/data/mock";
import { listarCategorias } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default async function NotFound() {
  const categories = await listarCategorias();
  return (
    <>
      <Header categories={categories} />
      <main className="bg-rose-50">
        <LostState
          kicker="Ops!"
          title="Essa página se perdeu no meio dos papéis"
          text="O link pode estar errado ou o produto saiu da loja. Tente buscar o que procura ou volte para o início."
          categories={categories}
          whatsapp={store.whatsapp.numero}
        />
      </main>
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
