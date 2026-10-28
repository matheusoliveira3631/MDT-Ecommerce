import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import type { Category, Product } from "@/lib/types";
import { db } from "./db";
import { categorias, produtoFotos, produtos, type CategoriaRow, type ProdutoFotoRow, type ProdutoRow } from "./db/schema";
import { publicUrl } from "./storage";

/*
 * Leitura do catálogo para a loja. Ler daqui marca a página como dinâmica
 * (connection()), então qualquer alteração no admin aparece na hora, sem novo build.
 */

const centsToReais = (cents: number | null) => (cents == null ? null : cents / 100);

export function toCategory(row: CategoriaRow): Category {
  return { slug: row.slug, nome: row.nome, foto: row.fotoChave ? publicUrl(row.fotoChave) : undefined };
}

export function toProduct(row: ProdutoRow, categoria: CategoriaRow, fotos: ProdutoFotoRow[]): Product {
  return {
    id: row.id,
    slug: row.slug,
    nome: row.nome,
    categoria: categoria.nome,
    categoriaSlug: categoria.slug,
    resumo: row.resumo,
    descricao: row.descricao,
    medidas: row.medidas,
    fotos: fotos
      .slice()
      .sort((a, b) => a.posicao - b.posicao)
      .map((f) => ({ src: publicUrl(f.chave), alt: f.alt || row.nome, chave: f.chave })),
    precoBase: centsToReais(row.precoBaseCentavos),
    precoPix: centsToReais(row.precoPixCentavos),
    precoVaria: row.precoVaria,
    pedidoMinimo: row.pedidoMinimo,
    prazoProducaoDias: row.prazoProducaoDias,
    temas: row.temas,
    cores: row.cores,
    aceitaReferencia: row.aceitaReferencia,
    selos: row.selos,
    estoque: row.estoque,
    ativo: row.ativo,
    destaque: row.destaque,
  };
}

/** Monta os produtos com categoria e fotos (duas consultas, sem N+1). */
function hydrate(rows: Array<{ produto: ProdutoRow; categoria: CategoriaRow }>): Product[] {
  if (rows.length === 0) return [];
  const fotos = db
    .select()
    .from(produtoFotos)
    .where(inArray(produtoFotos.produtoId, rows.map((r) => r.produto.id)))
    .all();
  return rows.map(({ produto, categoria }) =>
    toProduct(produto, categoria, fotos.filter((f) => f.produtoId === produto.id)),
  );
}

function selectProducts() {
  return db
    .select({ produto: produtos, categoria: categorias })
    .from(produtos)
    .innerJoin(categorias, eq(produtos.categoriaId, categorias.id));
}

export const listarCategorias = cache(async (): Promise<Category[]> => {
  await connection();
  return db.select().from(categorias).orderBy(asc(categorias.posicao), asc(categorias.nome)).all().map(toCategory);
});

export const obterCategoria = cache(async (slug: string): Promise<Category | undefined> => {
  await connection();
  const row = db.select().from(categorias).where(eq(categorias.slug, slug)).get();
  return row ? toCategory(row) : undefined;
});

/** Produtos ativos (esgotados incluídos). */
export const listarProdutos = cache(async (): Promise<Product[]> => {
  await connection();
  return hydrate(selectProducts().where(eq(produtos.ativo, true)).orderBy(desc(produtos.criadoEm), desc(produtos.id)).all());
});

export const produtosDaCategoria = cache(async (slug: string): Promise<Product[]> => {
  await connection();
  return hydrate(
    selectProducts()
      .where(and(eq(produtos.ativo, true), eq(categorias.slug, slug)))
      .orderBy(desc(produtos.criadoEm), desc(produtos.id))
      .all(),
  );
});

/** Produto ativo pelo slug; inativo conta como inexistente na loja. */
export const obterProduto = cache(async (slug: string): Promise<Product | undefined> => {
  await connection();
  const row = selectProducts().where(and(eq(produtos.slug, slug), eq(produtos.ativo, true))).get();
  return row ? hydrate([row])[0] : undefined;
});

export async function produtosPorSlug(slugs: string[]): Promise<Product[]> {
  await connection();
  if (slugs.length === 0) return [];
  return hydrate(selectProducts().where(and(inArray(produtos.slug, slugs), eq(produtos.ativo, true))).all());
}

/** Vitrine da home: os marcados como destaque; sem nenhum, os mais recentes. */
export async function produtosEmDestaque(limite = 8): Promise<Product[]> {
  const todos = (await listarProdutos()).filter((p) => p.estoque > 0);
  const destaques = todos.filter((p) => p.destaque);
  return (destaques.length > 0 ? destaques : todos).slice(0, limite);
}

export async function produtosRelacionados(produto: Product, limite = 4): Promise<Product[]> {
  const todos = (await listarProdutos()).filter((p) => p.slug !== produto.slug && p.estoque > 0);
  // Primeiro os da mesma categoria
  const mesma = todos.filter((p) => p.categoriaSlug === produto.categoriaSlug);
  const outras = todos.filter((p) => p.categoriaSlug !== produto.categoriaSlug);
  return [...mesma, ...outras].slice(0, limite);
}
