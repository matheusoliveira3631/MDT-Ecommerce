import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentArticle } from "@/components/content/ContentArticle";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { helpPages } from "@/data/content";
import { categories, helpLinks, store } from "@/data/mock";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const pages = helpPages(store);

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = pages.find((p) => p.slug === slug);
  return page ? { title: page.titulo, description: page.resumo } : {};
}

export default async function HelpPage({ params }: PageProps) {
  const { slug } = await params;
  const page = pages.find((p) => p.slug === slug);
  if (!page) notFound();

  return (
    <>
      <Header categories={categories} />
      <ContentArticle
        page={page}
        trail={[
          { label: "Início", href: "/" },
          { label: "Ajuda", href: "/ajuda" },
        ]}
        nav={{ title: "Ajuda", links: helpLinks, current: `/ajuda/${page.slug}` }}
        whatsapp={store.whatsapp.numero}
      />
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
