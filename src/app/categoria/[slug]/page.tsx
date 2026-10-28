import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/product/Breadcrumb";
import { ProductListing } from "@/components/product/ProductListing";
import { buttonClasses } from "@/components/ui/Button";
import { categories, getCategory, getCategoryProducts, helpLinks, store } from "@/data/mock";
import { parseSort, sortProducts } from "@/lib/catalog";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ordem?: string | string[] }>;
}

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = getCategory((await params).slug);
  // Canônico sem ?ordem= para a ordenação não gerar páginas duplicadas
  return category ? { title: category.nome, alternates: { canonical: `/categoria/${category.slug}` } } : {};
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const sort = parseSort((await searchParams).ordem);
  const products = sortProducts(getCategoryProducts(slug), sort);

  return (
    <>
      <Header categories={categories} />
      <main className="container-page pt-6 pb-section-sm md:pb-section">
        <Breadcrumb
          items={[
            { label: "Início", href: "/" },
            { label: "Categorias", href: "/categorias" },
          ]}
          current={category.nome}
        />
        <ProductListing
          title={category.nome}
          products={products}
          sort={sort}
          empty={
            <div className="flex flex-col items-start gap-4 rounded-lg bg-rose-50 p-8">
              <p className="m-0 text-body-lg">Ainda não temos produtos nesta categoria. Que tal ver as outras?</p>
              <Link href="/categorias" className={buttonClasses()}>
                Ver categorias
              </Link>
            </div>
          }
        />
      </main>
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
