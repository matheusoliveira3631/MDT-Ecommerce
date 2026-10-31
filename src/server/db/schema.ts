import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Address, PaymentMethod } from "@/lib/checkout";
import type { Personalizacao } from "@/lib/cart";
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
    /** Embalagem de uma unidade, para a cotação do frete; vazio usa o pacote padrão. */
    pesoGramas: integer("peso_gramas"),
    alturaCm: integer("altura_cm"),
    larguraCm: integer("largura_cm"),
    comprimentoCm: integer("comprimento_cm"),
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

/** Ajustes da loja editáveis no painel (chave → valor JSON), ex.: a foto principal da página inicial. */
export const configuracoes = sqliteTable("configuracoes", {
  chave: text("chave").primaryKey(),
  valor: text("valor", { mode: "json" }).$type<unknown>().notNull(),
  atualizadoEm: integer("atualizado_em", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const STATUS_PEDIDO = [
  "aguardando_pagamento",
  "aguardando_arte",
  "arte_enviada",
  "aprovada",
  "em_producao",
  "enviado",
  "cancelado",
] as const;

export const pedidos = sqliteTable(
  "pedidos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Número mostrado à cliente, ex.: MT00042. */
    numero: text("numero").notNull().unique(),
    /** Segredo da URL de confirmação (quem não fez o pedido não vê os dados). */
    tokenAcesso: text("token_acesso").notNull(),
    /** Mesmo pedido enviado duas vezes (duplo clique, rede instável) não vira dois. */
    chaveIdempotencia: text("chave_idempotencia").notNull().unique(),
    status: text("status", { enum: STATUS_PEDIDO }).notNull().default("aguardando_pagamento"),
    usuarioId: integer("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
    clienteNome: text("cliente_nome").notNull(),
    clienteEmail: text("cliente_email").notNull(),
    clienteCpf: text("cliente_cpf").notNull(),
    clienteWhatsapp: text("cliente_whatsapp").notNull(),
    endereco: text("endereco", { mode: "json" }).$type<Address>().notNull(),
    freteServico: text("frete_servico").notNull(),
    fretePrazo: text("frete_prazo").notNull(),
    freteCentavos: integer("frete_centavos").notNull(),
    cupomCodigo: text("cupom_codigo"),
    descontoCentavos: integer("desconto_centavos").notNull().default(0),
    subtotalCentavos: integer("subtotal_centavos").notNull(),
    /** O que foi cobrado (no Pix, com os preços do Pix). */
    totalCentavos: integer("total_centavos").notNull(),
    pagamentoMetodo: text("pagamento_metodo", { enum: ["pix", "cartao", "boleto"] }).$type<PaymentMethod>().notNull(),
    pagamentoStatus: text("pagamento_status", { enum: ["pendente", "aprovado", "recusado", "expirado"] })
      .notNull()
      .default("pendente"),
    /** Id da cobrança no gateway. */
    pagamentoId: text("pagamento_id").unique(),
    /** Dados para pagar (Pix copia e cola, linha do boleto...), vindos do gateway. */
    pagamentoInstrucoes: text("pagamento_instrucoes", { mode: "json" }).$type<Record<string, string>>(),
    /** Código de rastreio dos Correios, preenchido no painel ao despachar. */
    codigoRastreio: text("codigo_rastreio"),
    /** O estoque já foi devolvido (pedido cancelado): evita devolver duas vezes. */
    estoqueDevolvido: integer("estoque_devolvido", { mode: "boolean" }).notNull().default(false),
    criadoEm: criadoEm(),
    atualizadoEm: integer("atualizado_em", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("pedidos_status_idx").on(t.status)],
);

export const pedidoItens = sqliteTable(
  "pedido_itens",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pedidoId: integer("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    /** Pode sumir se o produto for excluído; nome e preço ficam copiados abaixo. */
    produtoId: integer("produto_id").references(() => produtos.id, { onDelete: "set null" }),
    produtoSlug: text("produto_slug").notNull(),
    produtoNome: text("produto_nome").notNull(),
    precoUnitarioCentavos: integer("preco_unitario_centavos").notNull(),
    quantidade: integer("quantidade").notNull(),
    personalizacao: text("personalizacao", { mode: "json" }).$type<Personalizacao>().notNull(),
  },
  (t) => [index("pedido_itens_pedido_idx").on(t.pedidoId)],
);

/** Cada mudança de status do pedido: quando, quem (loja, pagamento ou o nome de quem mexeu no painel) e por quê. */
export const pedidoHistorico = sqliteTable(
  "pedido_historico",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pedidoId: integer("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    status: text("status", { enum: STATUS_PEDIDO }).notNull(),
    autor: text("autor").notNull(),
    nota: text("nota"),
    criadoEm: criadoEm(),
  },
  (t) => [index("pedido_historico_pedido_idx").on(t.pedidoId)],
);

export type PedidoRow = typeof pedidos.$inferSelect;
export type PedidoHistoricoRow = typeof pedidoHistorico.$inferSelect;
export type PedidoItemRow = typeof pedidoItens.$inferSelect;
export type CategoriaRow = typeof categorias.$inferSelect;
export type ProdutoRow = typeof produtos.$inferSelect;
export type ProdutoFotoRow = typeof produtoFotos.$inferSelect;
export type UsuarioRow = typeof usuarios.$inferSelect;
