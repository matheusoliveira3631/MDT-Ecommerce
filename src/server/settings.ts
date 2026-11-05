import "server-only";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { categorias, configuracoes } from "./db/schema";
import { KEY_PATTERN, publicUrl, removeFile } from "./storage";

/*
 * Ajustes da loja editáveis no painel. Cada grupo fica numa chave da tabela
 * `configuracoes`, validado aqui na leitura e na escrita.
 */

const homeSchema = z.object({
  heroFotoChave: z.string().regex(KEY_PATTERN, "Foto inválida. Envie de novo.").nullable(),
  heroFotoAlt: z.string().trim().max(200, "Use no máximo 200 caracteres."),
});

export type HomeSettings = z.infer<typeof homeSchema>;

const HOME_DEFAULTS: HomeSettings = { heroFotoChave: null, heroFotoAlt: "Mesa de festa com os produtos personalizados" };

export function getHomeSettings(): HomeSettings {
  const row = db.select().from(configuracoes).where(eq(configuracoes.chave, "inicio")).get();
  const parsed = homeSchema.safeParse(row?.valor);
  return parsed.success ? parsed.data : HOME_DEFAULTS;
}

/** Foto principal pronta para a página inicial (`src` vazio = placeholder). */
export function getHeroImage(): { src?: string; alt: string } {
  const home = getHomeSettings();
  return {
    src: home.heroFotoChave ? publicUrl(home.heroFotoChave) : undefined,
    alt: home.heroFotoAlt || HOME_DEFAULTS.heroFotoAlt,
  };
}

export type SettingsResult = { ok: true } | { ok: false; errors: Record<string, string> };

function upsert(chave: string, valor: unknown) {
  db.insert(configuracoes)
    .values({ chave, valor })
    .onConflictDoUpdate({ target: configuracoes.chave, set: { valor, atualizadoEm: sql`(unixepoch() * 1000)` } })
    .run();
}

/* ---------- Coleções sazonais (faixa da página inicial) ---------- */

const collectionSchema = z.object({
  ativa: z.boolean(),
  destaque: z.string().trim().max(40, "O destaque pode ter até 40 caracteres."),
  titulo: z.string().trim().min(3, "Escreva o título da coleção.").max(90, "Use no máximo 90 caracteres."),
  texto: z.string().trim().max(300, "Use no máximo 300 caracteres."),
  botao: z.string().trim().max(30, "O texto do botão pode ter até 30 caracteres."),
  /** O botão leva para esta categoria; sem categoria, a faixa fica sem botão. */
  categoriaId: z.number().int().positive().nullable(),
  fotoChave: z.string().regex(KEY_PATTERN, "Foto inválida. Envie de novo.").nullable(),
});

const collectionsSchema = z.array(collectionSchema).max(6, "Use até 6 coleções.");

export type SeasonalCollection = z.infer<typeof collectionSchema>;

/** Antes de qualquer edição no painel, vale a coleção de fim de ano do design. */
function defaultCollections(): SeasonalCollection[] {
  const especiais = db.select({ id: categorias.id }).from(categorias).where(eq(categorias.slug, "datas-especiais")).get();
  return [
    {
      ativa: true,
      destaque: "coleção de fim de ano",
      titulo: "Natal com mimos para presentear quem você ama",
      texto: "Encomendas abertas até [data limite]. Garanta a produção a tempo da sua ceia.",
      botao: "Conhecer a coleção",
      categoriaId: especiais?.id ?? null,
      fotoChave: null,
    },
  ];
}

export function getSeasonalCollections(): SeasonalCollection[] {
  const row = db.select().from(configuracoes).where(eq(configuracoes.chave, "colecoes")).get();
  if (!row) return defaultCollections();
  const parsed = collectionsSchema.safeParse(row.valor);
  return parsed.success ? parsed.data : [];
}

/** Coleções ativas prontas para a página inicial, na ordem do painel. */
export function activeSeasonalCollections() {
  const ativas = getSeasonalCollections().filter((c) => c.ativa);
  const ids = ativas.flatMap((c) => (c.categoriaId ? [c.categoriaId] : []));
  const slugs = new Map(
    (ids.length ? db.select({ id: categorias.id, slug: categorias.slug }).from(categorias).all() : []).map((c) => [c.id, c.slug]),
  );
  return ativas.map((c) => {
    const slug = c.categoriaId ? slugs.get(c.categoriaId) : undefined;
    return {
      destaque: c.destaque,
      titulo: c.titulo,
      texto: c.texto,
      cta: slug ? { label: c.botao || "Conhecer a coleção", href: `/categoria/${slug}` } : undefined,
      imagem: c.fotoChave ? publicUrl(c.fotoChave) : undefined,
    };
  });
}

export async function saveSeasonalCollections(raw: unknown): Promise<SettingsResult> {
  const parsed = collectionsSchema.safeParse(raw);
  if (!parsed.success) {
    // Erro de uma coleção: chave "1.titulo" para o formulário mostrar no campo certo
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join(".") || "form"] ??= issue.message;
    return { ok: false, errors };
  }
  const previous = new Set(getSeasonalCollections().flatMap((c) => (c.fotoChave ? [c.fotoChave] : [])));
  upsert("colecoes", parsed.data);
  // Fotos que saíram de todas as coleções saem do armazenamento
  const kept = new Set(parsed.data.flatMap((c) => (c.fotoChave ? [c.fotoChave] : [])));
  await Promise.all([...previous].filter((k) => !kept.has(k)).map((k) => removeFile(k).catch(() => undefined)));
  return { ok: true };
}

export async function saveHomeSettings(raw: unknown): Promise<SettingsResult> {
  const parsed = homeSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, errors };
  }
  const previous = getHomeSettings().heroFotoChave;
  upsert("inicio", parsed.data);
  // A foto trocada ou removida sai do armazenamento
  if (previous && previous !== parsed.data.heroFotoChave) await removeFile(previous).catch(() => undefined);
  return { ok: true };
}
