import { notFound } from "next/navigation";
import { getCategory } from "@/data/mock";

/**
 * Valida a categoria antes do loading.tsx: um notFound() dentro da página só
 * acontece depois que o skeleton já saiu, e a resposta ficaria com status 200.
 */
export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  if (!getCategory((await params).slug)) notFound();
  return children;
}
