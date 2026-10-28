import { Header } from "@/components/layout/Header";
import { ListingSkeleton } from "@/components/product/ListingSkeleton";
import { categories } from "@/data/mock";

export default function Loading() {
  return (
    <>
      <Header categories={categories} />
      <ListingSkeleton />
    </>
  );
}
