import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { ProductBadge, ProductColor } from "@/lib/types";

const criadoEm = () =>
  integer("criado_em", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const categorias = sqliteTable("categorias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  nome: text("nome").notNull(),
  /** Chave da foto no armazenamento (S3 ou pasta local). */
  fotoChave: text("foto_chave"),
  posicao: integer("posicao").notNull().default(0),
  criadoEm: criadoEm(),
});

export const produtos = sqliteTable(
  "produtos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    nome: text("nome").notNull(),
    categoriaId: integer("categoria_id")
      .notNull()
      .references(() => categorias.id, { onDelete: "restrict" }),
    resumo: text("resumo").notNull().default(""),
    descricao: text("descricao").notNull().default(""),
    medidas: text("medidas").notNull().default(""),
    /** Preços em centavos; `null` enquanto não cadastrados. */
    precoBaseCentavos: integer("preco_base_centavos"),
    precoPixCentavos: integer("preco_pix_centavos"),
    precoVaria: integer("preco_varia", { mode: "boolean" }).notNull().default(true),
    pedidoMinimo: integer("pedido_minimo").notNull().default(1),
    prazoProducaoDias: integer("prazo_producao_dias"),
    temas: text("temas", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    cores: text("cores", { mode: "json" }).$type<ProductColor[]>().notNull().default(sql`'[]'`),
    aceitaReferencia: integer("aceita_referencia", { mode: "boolean" }).notNull().default(true),
    selos: text("selos", { mode: "json" }).$type<ProductBadge[]>().notNull().default(sql`'[]'`),
    estoque: integer("estoque").notNull().default(0),
    ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
    /** Aparece na vitrine "Mais vendidos" da página inicial. */
    destaque: integer("destaque", { mode: "boolean" }).notNull().default(false),
    criadoEm: criadoEm(),
    atualizadoEm: integer("atualizado_em", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("produtos_categoria_idx").on(t.categoriaId)],
);

export const produtoFotos = sqliteTable(
  "produto_fotos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    produtoId: integer("produto_id")
      .notNull()
      .references(() => produtos.id, { onDelete: "cascade" }),
    chave: text("chave").notNull(),
    alt: text("alt").notNull().default(""),
    posicao: integer("posicao").notNull().default(0),
  },
  (t) => [index("produto_fotos_produto_idx").on(t.produtoId)],
);

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Sempre em minúsculas. */
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  senhaHash: text("senha_hash").notNull(),
  papel: text("papel", { enum: ["cliente", "admin"] }).notNull().default("cliente"),
  criadoEm: criadoEm(),
});

export const sessoes = sqliteTable(
  "sessoes",
  {
    /** SHA-256 do token do cookie: o token em si nunca é guardado. */
    id: text("id").primaryKey(),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    expiraEm: integer("expira_em", { mode: "timestamp_ms" }).notNull(),
    criadoEm: criadoEm(),
  },
  (t) => [index("sessoes_usuario_idx").on(t.usuarioId)],
);

export type CategoriaRow = typeof categorias.$inferSelect;
export type ProdutoRow = typeof produtos.$inferSelect;
export type ProdutoFotoRow = typeof produtoFotos.$inferSelect;
export type UsuarioRow = typeof usuarios.$inferSelect;
