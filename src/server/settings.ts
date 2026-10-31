import "server-only";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { configuracoes } from "./db/schema";
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

export async function saveHomeSettings(raw: unknown): Promise<SettingsResult> {
  const parsed = homeSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, errors };
  }
  const previous = getHomeSettings().heroFotoChave;
  db.insert(configuracoes)
    .values({ chave: "inicio", valor: parsed.data })
    .onConflictDoUpdate({ target: configuracoes.chave, set: { valor: parsed.data, atualizadoEm: sql`(unixepoch() * 1000)` } })
    .run();
  // A foto trocada ou removida sai do armazenamento
  if (previous && previous !== parsed.data.heroFotoChave) await removeFile(previous).catch(() => undefined);
  return { ok: true };
}
