import { Header } from "@/components/layout/Header";
import { ListingSkeleton } from "@/components/product/ListingSkeleton";
import { listarCategorias } from "@/server/catalog";

export default async function Loading() {
  const categories = await listarCategorias();
  return (
    <>
      <Header categories={categories} />
      <ListingSkeleton />
    </>
  );
}
