import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/entrar/actions";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Button, buttonClasses } from "@/components/ui/Button";
import { helpLinks, store } from "@/data/mock";
import { getCurrentUser } from "@/server/auth";
import { listarCategorias } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?voltar=/conta");
  const categories = await listarCategorias();

  return (
    <>
      <Header categories={categories} />
      <main className="container-page py-section-sm md:py-section">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <div>
            <h1 className="m-0 text-h1-sm md:text-h1">Olá, {user.nome.split(" ")[0]}</h1>
            <p className="mt-1 mb-0 text-body text-ink-muted">{user.email}</p>
          </div>
          {user.papel === "admin" && (
            <section aria-labelledby="admin-title" className="flex flex-col gap-3 rounded-lg bg-rose-50 p-6">
              <h2 id="admin-title" className="m-0 text-[19px] font-bold">
                Administração
              </h2>
              <p className="m-0 text-body text-ink-muted">Cadastre categorias, produtos e fotos da loja.</p>
              <Link href="/admin" className={buttonClasses({ className: "self-start" })}>
                Abrir o painel
              </Link>
            </section>
          )}
          <p className="m-0 text-body text-ink-muted">
            Em breve: seus pedidos e o acompanhamento da arte aparecem aqui.
          </p>
          <form action={logout}>
            <Button type="submit" variant="secondary">
              Sair
            </Button>
          </form>
        </div>
      </main>
      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
