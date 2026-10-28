import type { Metadata } from "next";
import { ContentArticle } from "@/components/content/ContentArticle";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { legalPages } from "@/data/content";
import { helpLinks, store } from "@/data/mock";
import { listarCategorias } from "@/server/catalog";

const page = legalPages(store).find((p) => p.slug === "termos")!;

export const metadata: Metadata = {
  title: page.titulo,
  description: page.resumo,
};

export default async function TermsPage() {
  const categories = await listarCategorias();
  return (
    <>
      <Header categories={categories} />
      <ContentArticle page={page} trail={[{ label: "Início", href: "/" }]} whatsapp={store.whatsapp.numero} />
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
