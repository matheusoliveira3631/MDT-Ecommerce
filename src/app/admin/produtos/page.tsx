import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { cn, formatPrice } from "@/lib/format";
import { adminListProducts } from "@/server/admin-catalog";
import { requireAdminPage } from "@/server/auth";

export const metadata: Metadata = { title: "Produtos" };

export default async function AdminProductsPage() {
  await requireAdminPage("/admin/produtos");
  const products = adminListProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="m-0 text-h2-sm">Produtos</h1>
          <p className="mt-1 mb-0 text-body text-ink-muted">
            {products.length} {products.length === 1 ? "produto" : "produtos"} · os inativos não aparecem na loja
          </p>
        </div>
        <Link href="/admin/produtos/novo" className={buttonClasses()}>
          Novo produto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="m-0 rounded-lg bg-white p-8 text-body">Nenhum produto ainda. Comece pelo botão “Novo produto”.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left text-body">
            <thead>
              <tr className="border-b border-border text-sm text-ink-muted">
                <th scope="col" className="px-4 py-3 font-bold">Produto</th>
                <th scope="col" className="px-4 py-3 font-bold">Categoria</th>
                <th scope="col" className="px-4 py-3 font-bold">Preço</th>
                <th scope="col" className="px-4 py-3 font-bold">Estoque</th>
                <th scope="col" className="px-4 py-3 font-bold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Photo src={p.capaUrl ?? undefined} alt="" sizes="48px" className="size-12 shrink-0 rounded-sm" />
                      <div className="min-w-0">
                        <Link href={`/admin/produtos/${p.id}`} className="font-bold">
                          {p.nome}
                        </Link>
                        <div className="truncate text-sm text-ink-muted">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.categoria}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.precoBaseCentavos == null ? <span className="text-ink-muted">Sem preço</span> : formatPrice(p.precoBaseCentavos / 100)}
                  </td>
                  <td className={cn("px-4 py-3", p.estoque === 0 && "font-bold text-error")}>{p.estoque === 0 ? "Esgotado" : p.estoque}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={cn(
                          "rounded-pill px-2.5 py-1 text-xs font-extrabold",
                          p.ativo ? "bg-rose-100 text-primary" : "bg-disabled-bg text-soldout-fg",
                        )}
                      >
                        {p.ativo ? "Ativo" : "Inativo"}
                      </span>
                      {p.destaque && <span className="rounded-pill bg-primary px-2.5 py-1 text-xs font-extrabold text-white">Destaque</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
