import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { configuracoes } from "./db/schema";
import { fetchRecentMedia, refreshToken, type InstagramMedia } from "./instagram-api";

/*
 * Posts recentes do Instagram para a página inicial.
 *
 * INSTAGRAM_TOKEN é o token de longa duração (dura 60 dias). A loja renova o
 * token sozinha a cada 7 dias e guarda o novo no banco, então o do .env só é
 * usado até a primeira renovação. Os posts ficam 1 hora em memória; sem token
 * ou com a API fora do ar, a lista vem vazia e a página mostra só o convite
 * para seguir.
 */

const CACHE_MS = 60 * 60 * 1000;
const RENOVAR_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredToken {
  token: string;
  renovadoEm: number;
  /** O token do .env de onde este veio: trocar o do .env passa a valer o novo. */
  origem: string;
}

const memory = globalThis as unknown as { instagramCache?: { at: number; posts: InstagramMedia[] } };

function storedToken(): StoredToken | null {
  const row = db.select().from(configuracoes).where(eq(configuracoes.chave, "instagram")).get();
  const value = row?.valor as Partial<StoredToken> | undefined;
  return value?.token && value.origem && typeof value.renovadoEm === "number" ? (value as StoredToken) : null;
}

function saveToken(valor: StoredToken) {
  db.insert(configuracoes)
    .values({ chave: "instagram", valor })
    .onConflictDoUpdate({ target: configuracoes.chave, set: { valor, atualizadoEm: new Date() } })
    .run();
}

async function currentToken(): Promise<string | null> {
  const envToken = process.env.INSTAGRAM_TOKEN?.trim();
  if (!envToken) return null;
  const stored = storedToken();
  const current = stored?.origem === envToken ? stored : null;
  const token = current?.token ?? envToken;

  if (!current || Date.now() - current.renovadoEm > RENOVAR_MS) {
    try {
      const fresh = await refreshToken(token);
      saveToken({ token: fresh.token, renovadoEm: Date.now(), origem: envToken });
      return fresh.token;
    } catch (error) {
      // Token com menos de 24 h ou instável: segue com o atual e tenta de novo depois
      console.error("Instagram: não foi possível renovar o token", error);
    }
  }
  return token;
}

export async function recentInstagramPosts(limit = 6): Promise<InstagramMedia[]> {
  const hit = memory.instagramCache;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.posts;
  let posts: InstagramMedia[] = [];
  try {
    const token = await currentToken();
    if (token) posts = await fetchRecentMedia(token, limit);
  } catch (error) {
    console.error("Instagram: não foi possível buscar os posts", error);
    // Mantém os últimos posts bons enquanto a API não volta
    if (hit) posts = hit.posts;
  }
  memory.instagramCache = { at: Date.now(), posts };
  return posts;
}
