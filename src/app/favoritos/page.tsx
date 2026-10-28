import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/FavoritesView";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/product/Breadcrumb";
import { helpLinks, store } from "@/data/mock";
import { listarCategorias } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false },
};

export default async function FavoritesPage() {
  const categories = await listarCategorias();
  return (
    <>
      <Header categories={categories} />
      <main className="container-page pt-6 pb-section-sm md:pb-section">
        <Breadcrumb items={[{ label: "Início", href: "/" }]} current="Favoritos" />
        <h1 className="mt-0 mb-2 text-h1-sm md:text-h1">Seus favoritos</h1>
        <FavoritesView />
      </main>
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
