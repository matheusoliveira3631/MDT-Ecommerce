import { notFound } from "next/navigation";
import { obterCategoria } from "@/server/catalog";

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
  if (!(await obterCategoria((await params).slug))) notFound();
  return children;
}
