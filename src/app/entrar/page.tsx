import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { helpLinks, store } from "@/data/mock";
import { getCurrentUser } from "@/server/auth";
import { listarCategorias } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{ voltar?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { voltar } = await searchParams;
  if (await getCurrentUser()) redirect("/conta");
  const categories = await listarCategorias();

  return (
    <>
      <Header categories={categories} />
      <main className="bg-rose-50">
        <div className="container-page flex justify-center py-section-sm md:py-section">
          <section aria-labelledby="entrar-title" className="flex w-full max-w-md flex-col gap-6 rounded-lg bg-white p-6 md:p-8">
            <div className="flex flex-col gap-1">
              <h1 id="entrar-title" className="m-0 text-h2-sm">
                Entrar
              </h1>
              <p className="m-0 text-body text-ink-muted">Acesse sua conta na {store.nome}.</p>
            </div>
            <LoginForm voltar={voltar} />
          </section>
        </div>
      </main>
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
