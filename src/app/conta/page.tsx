import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/entrar/actions";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Button, buttonClasses } from "@/components/ui/Button";
import { helpLinks, store } from "@/data/mock";
import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { listOrdersOfUser } from "@/server/orders";
import { listarCategorias } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?voltar=/conta");
  const categories = await listarCategorias();
  const orders = listOrdersOfUser(db, user.id);

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
              <p className="m-0 text-body text-ink-muted">Acompanhe os pedidos e cadastre categorias, produtos e fotos.</p>
              <Link href="/admin" className={buttonClasses({ className: "self-start" })}>
                Abrir o painel
              </Link>
            </section>
          )}
          <section aria-labelledby="pedidos-title" className="flex flex-col gap-3">
            <h2 id="pedidos-title" className="m-0 text-[19px] font-bold">
              Meus pedidos
            </h2>
            {orders.length === 0 ? (
              <p className="m-0 text-body text-ink-muted">
                Os pedidos feitos com esta conta aparecem aqui, com o andamento da arte e da entrega.
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {orders.map((o) => (
                  <li key={o.numero}>
                    <Link
                      href={`/checkout/confirmacao?pedido=${o.numero}&token=${encodeURIComponent(o.token)}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-white p-4 text-ink no-underline hover:border-rose-300"
                    >
                      <span className="flex flex-col">
                        <strong className="text-body text-primary">Pedido {o.numero}</strong>
                        <span className="text-sm text-ink-muted">
                          {formatDateTime(o.criadoEm)} · {formatPrice(o.totalCentavos / 100)}
                        </span>
                      </span>
                      <OrderStatusBadge status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
