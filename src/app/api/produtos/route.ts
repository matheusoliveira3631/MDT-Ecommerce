import { NextResponse, type NextRequest } from "next/server";
import { produtosPorSlug } from "@/server/catalog";

const MAX_SLUGS = 50;

/**
 * GET /api/produtos?slugs=a,b — dados públicos dos produtos ativos.
 * Usado pela sacola, checkout e favoritos, que rodam no navegador.
 */
export async function GET(request: NextRequest) {
  const slugs = (request.nextUrl.searchParams.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,120}$/.test(s));
  if (slugs.length > MAX_SLUGS) {
    return NextResponse.json({ erro: `No máximo ${MAX_SLUGS} produtos por consulta.` }, { status: 400 });
  }
  const produtos = await produtosPorSlug([...new Set(slugs)]);
  return NextResponse.json({ produtos }, { headers: { "Cache-Control": "no-store" } });
}
