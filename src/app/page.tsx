import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { buttonClasses } from "@/components/ui/Button";
import { categories, cartCount, helpLinks, store } from "@/data/mock";

/** Página inicial provisória: a vitrine completa entra na próxima etapa. */
export default function Home() {
  return (
    <>
      <Header cartCount={cartCount} categories={categories} />
      <main className="bg-rose-50">
        <div className="container-page flex flex-col items-start gap-5 py-section-sm md:py-section">
          <span className="font-script text-[40px] leading-none text-primary">em construção</span>
          <h1 className="m-0 text-display-sm md:text-display">Fundação da loja</h1>
          <p className="m-0 max-w-xl text-body-lg text-ink-muted">
            Tokens, fontes e componentes base prontos. Confira cada peça na página de componentes.
          </p>
          <Link href="/componentes" className={buttonClasses({ size: "lg" })}>
            Ver componentes
          </Link>
        </div>
      </main>
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
