import type { Metadata } from "next";
import { CategoryTile } from "@/components/category/CategoryTile";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/product/Breadcrumb";
import { helpLinks, store } from "@/data/mock";
import { listarCategorias } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Categorias",
};

export default async function CategoriesPage() {
  const categories = await listarCategorias();
  return (
    <>
      <Header categories={categories} />
      <main className="container-page pt-6 pb-section-sm md:pb-section">
        <Breadcrumb items={[{ label: "Início", href: "/" }]} current="Categorias" />
        <h1 className="mt-0 mb-8 text-h1-sm md:text-h1">Compre por categoria</h1>
        <ul className="m-0 grid list-none grid-cols-2 gap-6 p-0 sm:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
          {categories.map((c) => (
            <li key={c.slug}>
              <CategoryTile category={c} />
            </li>
          ))}
        </ul>
      </main>
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
