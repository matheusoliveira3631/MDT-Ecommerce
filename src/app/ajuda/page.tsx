import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/product/Breadcrumb";
import { helpPages } from "@/data/content";
import { categories, helpLinks, store } from "@/data/mock";

export const metadata: Metadata = {
  title: "Ajuda",
  description: "Prazos, frete, trocas e perguntas frequentes.",
};

export default function HelpIndexPage() {
  const pages = helpPages(store);
  return (
    <>
      <Header categories={categories} />
      <main className="container-page pt-6 pb-section-sm md:pb-section">
        <Breadcrumb items={[{ label: "Início", href: "/" }]} current="Ajuda" />
        <h1 className="mt-0 mb-8 text-h1-sm md:text-h1">Como podemos ajudar?</h1>
        <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/ajuda/${page.slug}`}
                className="flex h-full flex-col gap-2 rounded-lg border border-border p-6 text-ink no-underline transition-colors duration-150 ease-out hover:border-rose-300 hover:bg-rose-50 hover:text-ink"
              >
                <strong className="font-heading text-h3">{page.titulo}</strong>
                <span className="text-body text-ink-muted">{page.resumo}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
