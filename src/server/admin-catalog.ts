import "server-only";
import { asc, desc, eq, inArray, ne, and, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { categorias, produtoFotos, produtos } from "./db/schema";
import { KEY_PATTERN, publicUrl, removeFile } from "./storage";

/*
 * Escrita do catálogo pelo admin. Quem chama (as Server Actions em
 * src/app/admin/actions.ts) já passou por requireAdmin().
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
  .string()
  .trim()
  .min(1, "Informe o endereço (slug).")
  .max(120, "Use no máximo 120 caracteres.")
  .regex(SLUG, "Use só letras minúsculas, números e hífens, ex.: caixa-milk.");
const cents = z.number().int().min(0, "O preço não pode ser negativo.").max(10_000_000).nullable();
const photoKey = z.string().regex(KEY_PATTERN, "Foto inválida. Envie de novo.");

export const categorySchema = z.object({
  id: z.number().int().positive().optional(),
  nome: z.string().trim().min(2, "Informe o nome da categoria.").max(60, "Use no máximo 60 caracteres."),
  slug: slugField,
  posicao: z.number().int().min(0).max(999),
  fotoChave: photoKey.nullable(),
});

export const productSchema = z
  .object({
    id: z.number().int().positive().optional(),
    nome: z.string().trim().min(2, "Informe o nome do produto.").max(120, "Use no máximo 120 caracteres."),
    slug: slugField,
    categoriaId: z.number({ error: "Escolha a categoria." }).int().positive("Escolha a categoria."),
    resumo: z.string().trim().max(300, "Use no máximo 300 caracteres."),
    descricao: z.string().trim().max(5000, "Use no máximo 5.000 caracteres."),
    medidas: z.string().trim().max(1000, "Use no máximo 1.000 caracteres."),
    precoBaseCentavos: cents,
    precoPixCentavos: cents,
    precoVaria: z.boolean(),
    pedidoMinimo: z.number().int().min(1, "O mínimo é 1.").max(10_000),
    prazoProducaoDias: z.number().int().min(0).max(365, "Use até 365 dias.").nullable(),
    estoque: z.number().int().min(0, "O estoque não pode ser negativo.").max(100_000),
    pesoGramas: z.number().int().min(1, "Informe o peso em gramas.").max(30_000, "Use até 30.000 g (30 kg).").nullable(),
    alturaCm: z.number().int().min(1, "Mínimo de 1 cm.").max(100, "Use até 100 cm.").nullable(),
    larguraCm: z.number().int().min(1, "Mínimo de 1 cm.").max(100, "Use até 100 cm.").nullable(),
    comprimentoCm: z.number().int().min(1, "Mínimo de 1 cm.").max(100, "Use até 100 cm.").nullable(),
    temas: z.array(z.string().trim().min(1).max(40, "Cada tema pode ter até 40 caracteres.")).max(30, "Use até 30 temas."),
    cores: z
      .array(
        z.object({
          nome: z.string().trim().min(1, "Dê um nome para cada cor.").max(40),
          hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
        }),
      )
      .max(30, "Use até 30 cores."),
    aceitaReferencia: z.boolean(),
    selos: z
      .array(
        z.object({
          tipo: z.enum(["customizable", "bestseller", "new", "deadline"]),
          label: z.string().trim().max(40, "O texto do selo pode ter até 40 caracteres.").optional(),
        }),
      )
      .max(4),
    ativo: z.boolean(),
    destaque: z.boolean(),
    fotos: z.array(z.object({ chave: photoKey, alt: z.string().trim().max(200) })).max(12, "Use até 12 fotos."),
  })
  .superRefine((p, ctx) => {
    if (p.precoBaseCentavos != null && p.precoPixCentavos != null && p.precoPixCentavos > p.precoBaseCentavos) {
      ctx.addIssue({ code: "custom", path: ["precoPixCentavos"], message: "O preço no Pix não pode ser maior que o preço normal." });
    }
    const deadline = p.selos.find((s) => s.tipo === "deadline");
    if (deadline && !deadline.label) {
      ctx.addIssue({ code: "custom", path: ["selos"], message: "Escreva o texto do selo de data, ex.: Encomenda até 10/12." });
    }
  });

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;

export type FieldErrors = Record<string, string>;
export type SaveResult = { ok: true; id: number; slug: string } | { ok: false; errors: FieldErrors };

/** Primeira mensagem de cada campo, pelo nome do campo de topo. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}

/* ---------- Leitura para o admin (inclui inativos) ---------- */

export function adminListCategories() {
  const totals = db
    .select({ categoriaId: produtos.categoriaId, total: count() })
    .from(produtos)
    .groupBy(produtos.categoriaId)
    .all();
  return db
    .select()
    .from(categorias)
    .orderBy(asc(categorias.posicao), asc(categorias.nome))
    .all()
    .map((c) => ({
      ...c,
      fotoUrl: c.fotoChave ? publicUrl(c.fotoChave) : null,
      totalProdutos: totals.find((t) => t.categoriaId === c.id)?.total ?? 0,
    }));
}

export function adminListProducts() {
  const rows = db
    .select({ produto: produtos, categoria: categorias.nome })
    .from(produtos)
    .innerJoin(categorias, eq(produtos.categoriaId, categorias.id))
    .orderBy(desc(produtos.atualizadoEm), desc(produtos.id))
    .all();
  const capas = rows.length
    ? db
        .select()
        .from(produtoFotos)
        .where(inArray(produtoFotos.produtoId, rows.map((r) => r.produto.id)))
        .orderBy(asc(produtoFotos.posicao))
        .all()
    : [];
  return rows.map(({ produto, categoria }) => {
    const capa = capas.find((f) => f.produtoId === produto.id);
    return { ...produto, categoria, capaUrl: capa ? publicUrl(capa.chave) : null };
  });
}

export function adminGetProduct(id: number) {
  const produto = db.select().from(produtos).where(eq(produtos.id, id)).get();
  if (!produto) return null;
  const fotos = db
    .select()
    .from(produtoFotos)
    .where(eq(produtoFotos.produtoId, id))
    .orderBy(asc(produtoFotos.posicao))
    .all()
    .map((f) => ({ chave: f.chave, alt: f.alt, src: publicUrl(f.chave) }));
  return { ...produto, fotos };
}

export type AdminProduct = NonNullable<ReturnType<typeof adminGetProduct>>;

/* ---------- Escrita ---------- */

function slugTaken(table: typeof produtos | typeof categorias, slug: string, id?: number) {
  const where = id ? and(eq(table.slug, slug), ne(table.id, id)) : eq(table.slug, slug);
  return Boolean(db.select({ id: table.id }).from(table).where(where).get());
}

export async function saveCategory(raw: unknown): Promise<SaveResult> {
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  if (slugTaken(categorias, data.slug, id)) return { ok: false, errors: { slug: "Já existe uma categoria com esse endereço." } };

  let oldPhoto: string | null = null;
  let savedId: number;
  if (id) {
    const current = db.select().from(categorias).where(eq(categorias.id, id)).get();
    if (!current) return { ok: false, errors: { form: "Categoria não encontrada." } };
    oldPhoto = current.fotoChave !== data.fotoChave ? current.fotoChave : null;
    db.update(categorias).set(data).where(eq(categorias.id, id)).run();
    savedId = id;
  } else {
    savedId = db.insert(categorias).values(data).returning({ id: categorias.id }).get().id;
  }
  if (oldPhoto) await removeFile(oldPhoto).catch(() => undefined);
  return { ok: true, id: savedId, slug: data.slug };
}

export async function deleteCategory(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const used = db.select({ total: count() }).from(produtos).where(eq(produtos.categoriaId, id)).get()?.total ?? 0;
  if (used > 0) {
    return { ok: false, error: `Essa categoria tem ${used} ${used === 1 ? "produto" : "produtos"}. Mude-os de categoria antes de excluir.` };
  }
  const current = db.delete(categorias).where(eq(categorias.id, id)).returning().get();
  if (current?.fotoChave) await removeFile(current.fotoChave).catch(() => undefined);
  return { ok: true };
}

export async function saveProduct(raw: unknown): Promise<SaveResult> {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error) };
  const { id, fotos, ...data } = parsed.data;
  if (slugTaken(produtos, data.slug, id)) return { ok: false, errors: { slug: "Já existe um produto com esse endereço." } };
  if (!db.select({ id: categorias.id }).from(categorias).where(eq(categorias.id, data.categoriaId)).get()) {
    return { ok: false, errors: { categoriaId: "Escolha a categoria." } };
  }

  const values = { ...data, selos: data.selos.map((s) => (s.label ? s : { tipo: s.tipo })), atualizadoEm: new Date() };
  const newKeys = new Set(fotos.map((f) => f.chave));

  const { savedId, removed } = db.transaction((tx) => {
    let productId = id;
    let previous: string[] = [];
    if (productId) {
      if (!tx.select({ id: produtos.id }).from(produtos).where(eq(produtos.id, productId)).get()) {
        throw new Error("Produto não encontrado.");
      }
      tx.update(produtos).set(values).where(eq(produtos.id, productId)).run();
      previous = tx.select({ chave: produtoFotos.chave }).from(produtoFotos).where(eq(produtoFotos.produtoId, productId)).all().map((f) => f.chave);
      tx.delete(produtoFotos).where(eq(produtoFotos.produtoId, productId)).run();
    } else {
      productId = tx.insert(produtos).values(values).returning({ id: produtos.id }).get().id;
    }
    fotos.forEach((foto, posicao) => {
      tx.insert(produtoFotos).values({ produtoId: productId!, chave: foto.chave, alt: foto.alt, posicao }).run();
    });
    return { savedId: productId, removed: previous.filter((k) => !newKeys.has(k)) };
  });

  // Só apaga os arquivos depois que o banco confirmou
  await Promise.all(removed.map((k) => removeFile(k).catch(() => undefined)));
  return { ok: true, id: savedId, slug: data.slug };
}

export async function deleteProduct(id: number): Promise<void> {
  const keys = db.select({ chave: produtoFotos.chave }).from(produtoFotos).where(eq(produtoFotos.produtoId, id)).all();
  db.delete(produtos).where(eq(produtos.id, id)).run();
  await Promise.all(keys.map((k) => removeFile(k.chave).catch(() => undefined)));
}
