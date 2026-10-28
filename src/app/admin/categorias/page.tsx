import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { adminListCategories } from "@/server/admin-catalog";
import { requireAdminPage } from "@/server/auth";

export const metadata: Metadata = { title: "Categorias" };

export default async function AdminCategoriesPage() {
  await requireAdminPage("/admin/categorias");
  const categorias = adminListCategories();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="m-0 text-h2-sm">Categorias</h1>
        <p className="mt-1 mb-0 text-body text-ink-muted">A ordem define a sequência no menu e na página inicial.</p>
      </div>
      <CategoriesManager categorias={categorias} />
    </div>
  );
}
