import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/product/Breadcrumb";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductForm } from "@/components/product/ProductForm";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductJsonLd } from "@/components/product/ProductJsonLd";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { helpLinks, store } from "@/data/mock";
import { listarCategorias, obterProduto, produtosRelacionados } from "@/server/catalog";
import { formatPrice } from "@/lib/format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await obterProduto((await params).slug);
  if (!product) return {};
  const images = product.fotos.flatMap((f) => (f.src ? [{ url: f.src, alt: f.alt }] : []));
  return {
    title: product.nome,
    description: product.resumo,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: { title: product.nome, description: product.resumo, ...(images.length > 0 && { images }) },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const [product, categories] = await Promise.all([obterProduto((await params).slug), listarCategorias()]);
  if (!product) notFound();

  const category = categories.find((c) => c.slug === product.categoriaSlug);
  const related = await produtosRelacionados(product);
  const soldOut = !product.ativo || product.estoque <= 0;
  const selo = soldOut ? { tipo: "soldout" as const } : product.selos[0];

  return (
    <>
      <Header categories={categories} />
      <ProductJsonLd product={product} brand={store.nome} category={category} />

      <main className="container-page pt-6 pb-32 md:pb-20">
        <Breadcrumb
          items={[
            { label: "Início", href: "/" },
            ...(category ? [{ label: category.nome, href: `/categoria/${category.slug}` }] : []),
          ]}
          current={product.nome}
        />

        {/*
          Desktop: fotos e detalhes na coluna da esquerda, dados e frete na da direita.
          A segunda linha é 1fr: se a coluna da direita for mais alta, o espaço extra
          fica abaixo dos detalhes, que continuam colados nas fotos.
          Mobile: fotos, dados e frete, detalhes.
        */}
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <ProductGallery photos={product.fotos} productName={product.nome} />
          </div>

          <div className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="flex flex-col items-start gap-2.5">
              {selo && <Badge variant={selo.tipo} label={selo.label} />}
              <h1 className="m-0 text-h1-sm md:text-h1">{product.nome}</h1>
              <p className="m-0 text-base leading-relaxed text-ink-muted">{product.resumo}</p>
            </div>

            <div className="flex flex-col gap-1.5 rounded-md bg-rose-50 px-[22px] py-5">
              <span className="font-heading text-price">
                {formatPrice(product.precoBase)}{" "}
                <span className="font-body text-base font-semibold text-ink-muted">/ unidade</span>
              </span>
              <span className="text-body">
                ou <strong>{formatPrice(product.precoPix, "R$ [preço Pix]")}</strong> no Pix · em até {store.parcelas}x
                no cartão
              </span>
              {product.pedidoMinimo > 1 && (
                <span className="text-sm text-ink-muted">Pedido mínimo: {product.pedidoMinimo} unidades</span>
              )}
            </div>

            <ProductForm
              product={product}
              whatsapp={store.whatsapp.numero}
              referenciaMaxMB={store.referenciaMaxMB}
            />
          </div>

          <section aria-label="Detalhes do produto" className="min-w-0 lg:col-start-1 lg:row-start-2">
            <Accordion
              items={[
                { title: "Descrição", content: <p className="m-0">{product.descricao}</p> },
                { title: "Medidas e material", content: <p className="m-0">{product.medidas}</p> },
                {
                  title: "Como funciona a personalização",
                  content: (
                    <p className="m-0">
                      Depois do pagamento, enviamos a arte pelo WhatsApp para você aprovar. Ajustes de texto e cor estão
                      incluídos; a produção começa só depois do seu ok.
                    </p>
                  ),
                },
                { title: "Prazos, entrega e trocas", content: <p className="m-0">{store.politicaEntrega}</p> },
              ]}
            />
          </section>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="relacionados-title" className="mt-section-sm md:mt-20">
            <SectionHeading
              id="relacionados-title"
              kicker="para completar a festa"
              title="Combina com"
              className="mb-7"
            />
            <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-6">
              {related.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} variant="compact" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
