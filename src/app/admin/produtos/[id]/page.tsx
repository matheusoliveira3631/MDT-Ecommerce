import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { adminGetProduct, adminListCategories } from "@/server/admin-catalog";
import { requireAdminPage } from "@/server/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Editar produto" };

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  await requireAdminPage(`/admin/produtos/${id}`);
  const produto = /^\d+$/.test(id) ? adminGetProduct(Number(id)) : null;
  if (!produto) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="m-0 text-h2-sm">{produto.nome}</h1>
        {produto.ativo && (
          <Link href={`/produto/${produto.slug}`} className="text-body font-bold">
            Ver na loja
          </Link>
        )}
      </div>
      {/* key: depois de salvar, o formulário recomeça com o que está no banco */}
      <ProductEditor key={produto.atualizadoEm.getTime()} categorias={adminListCategories()} initial={produto} />
    </div>
  );
}
