import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Logo } from "@/components/layout/Logo";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { categories, cartCount, helpLinks, products, store } from "@/data/mock";
import { FieldsDemo, LoadingButtonDemo, ProductGridDemo, StepperDemo } from "./demos";

export const metadata: Metadata = {
  title: "Componentes",
  robots: { index: false },
};

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[18px] rounded-lg bg-white p-6 md:p-7">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-[19px] font-bold">{title}</h2>
        {description && <p className="m-0 text-sm text-ink-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function ComponentesPage() {
  return (
    <>
      <Header cartCount={cartCount} categories={categories} />

      <main className="bg-rose-50">
        <div className="container-page flex flex-col gap-10 py-section-sm md:py-16">
          <div>
            <span className="text-[13px] font-extrabold tracking-widest text-primary uppercase">Componentes</span>
            <h1 className="mt-1.5 mb-0 text-h1-sm md:text-[40px]">Peças reutilizáveis da loja</h1>
            <p className="mt-2 mb-0 max-w-2xl text-body-lg text-ink-muted">
              Fundação do design system. O cabeçalho acima e o rodapé abaixo são os componentes reais, com dados
              mockados. Os valores entre colchetes vêm de dados.
            </p>
          </div>

          <div className="grid items-start gap-7 lg:grid-cols-2">
            <div className="flex flex-col gap-7">
              <Section title="Botões" description="Sempre pill. md = 50px, lg = 56px.">
                <div className="flex flex-wrap items-center gap-3">
                  <Button>Primário</Button>
                  <Button variant="secondary">Secundário</Button>
                  <Button variant="soft">Suave</Button>
                  <Button variant="text">Texto</Button>
                  <Button disabled>Indisponível</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="lg">Adicionar à sacola</Button>
                  <LoadingButtonDemo />
                  <Button asChild variant="secondary">
                    <Link href="/">Link com asChild</Link>
                  </Button>
                </div>
              </Section>

              <Section title="Selos">
                <div className="flex flex-wrap gap-2.5">
                  <Badge variant="customizable" />
                  <Badge variant="bestseller" />
                  <Badge variant="new" />
                  <Badge variant="soldout" />
                  <Badge variant="deadline" label="Encomenda até [data]" />
                </div>
              </Section>

              <Section title="Campos" description="Label sempre visível; erro com borda de 2px e aria-describedby.">
                <FieldsDemo />
              </Section>

              <Section title="Quantidade" description="O botão − fica desabilitado no mínimo.">
                <div className="flex flex-wrap items-end gap-6">
                  <StepperDemo min={1} size="md" label="md · mínimo 1" />
                  <StepperDemo min={20} size="lg" label="lg · pedido mínimo 20" />
                </div>
              </Section>

              <Section title="WhatsApp" description="Fixo no canto inferior direito, exceto no checkout.">
                <div className="flex items-center gap-3.5">
                  <WhatsAppFab phone={store.whatsapp.numero} message={store.whatsapp.mensagemPadrao} position="inline" />
                  <span className="text-sm text-ink-muted">
                    Número de dados: <code>{store.whatsapp.numero}</code>
                  </span>
                </div>
              </Section>
            </div>

            <div className="flex flex-col gap-7">
              <Section title="Logo" description="Provisório em Great Vibes, até chegar o SVG oficial.">
                <div className="flex flex-wrap items-center gap-6">
                  <Logo />
                  <div className="flex items-center gap-5 rounded-lg bg-ink px-6 py-4">
                    <Logo variant="monogram" />
                    <Logo variant="onDark" />
                  </div>
                </div>
              </Section>

              <Section title="Card de produto · compact" description="Usado em produtos relacionados.">
                <div className="flex flex-col gap-5">
                  <ProductCard product={products[0]} variant="compact" />
                  <ProductCard product={products[4]} variant="compact" />
                </div>
              </Section>

              <Section title="Cabeçalho · checkout">
                <div className="-mx-6 overflow-hidden border-y border-border md:-mx-7">
                  <Header variant="checkout" checkoutStep={1} />
                </div>
              </Section>

              <Section title="Rodapé · compact">
                <div className="-mx-6 overflow-hidden md:-mx-7">
                  <Footer variant="compact" store={store} />
                </div>
              </Section>
            </div>
          </div>

          <Section
            title="Card de produto"
            description="Vitrine com selo, favoritar (aria-pressed), nome em até 2 linhas e estado esgotado."
          >
            <ProductGridDemo products={products} />
          </Section>
        </div>
      </main>

      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
