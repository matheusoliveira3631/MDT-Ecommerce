import type { Metadata } from "next";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { adminListCategories } from "@/server/admin-catalog";
import { requireAdminPage } from "@/server/auth";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  await requireAdminPage("/admin/produtos/novo");
  const categorias = adminListCategories();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="m-0 text-h2-sm">Novo produto</h1>
      {categorias.length === 0 ? (
        <p className="m-0 rounded-lg bg-white p-6 text-body">Crie uma categoria antes de cadastrar produtos.</p>
      ) : (
        <ProductEditor
          categorias={categorias}
          initial={{
            nome: "",
            slug: "",
            categoriaId: null,
            resumo: "",
            descricao: "",
            medidas: "",
            precoBaseCentavos: null,
            precoPixCentavos: null,
            precoVaria: true,
            pedidoMinimo: 1,
            prazoProducaoDias: null,
            estoque: 0,
            pesoGramas: null,
            alturaCm: null,
            larguraCm: null,
            comprimentoCm: null,
            temas: [],
            cores: [],
            aceitaReferencia: true,
            selos: [],
            ativo: false,
            destaque: false,
            fotos: [],
          }}
        />
      )}
    </div>
  );
}
