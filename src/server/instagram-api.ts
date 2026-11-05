/*
 * API do Instagram (Instagram API with Instagram Login, da Meta). Sem acesso ao
 * banco, para os testes usarem um `fetch` simulado.
 * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */

export interface InstagramMedia {
  id: string;
  href: string;
  foto: string;
  alt: string;
}

interface ApiMedia {
  id: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
}

const GRAPH = "https://graph.instagram.com";

/** Legenda curta para o texto alternativo (sem hashtags e menções). */
function altFromCaption(caption: string | undefined, index: number): string {
  const text = (caption ?? "")
    .replace(/[#@][\p{L}\p{N}_.]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return `Post ${index + 1} do Instagram`;
  return text.length > 120 ? `${text.slice(0, 117).trimEnd()}…` : text;
}

/** Os posts mais recentes da conta dona do token (vídeos entram pela capa). */
export async function fetchRecentMedia(token: string, limit = 6, fetcher: typeof fetch = fetch): Promise<InstagramMedia[]> {
  const url = new URL(`${GRAPH}/me/media`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);
  const response = await fetcher(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!response.ok) throw new Error(`Instagram respondeu ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const { data } = (await response.json()) as { data?: ApiMedia[] };
  return (data ?? [])
    .map((m, i) => ({
      id: m.id,
      href: m.permalink ?? "",
      foto: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? "",
      alt: altFromCaption(m.caption, i),
    }))
    .filter((m) => m.href && m.foto)
    .slice(0, limit);
}

/** Troca o token de longa duração (60 dias) por um novo; precisa ter mais de 24 h. */
export async function refreshToken(token: string, fetcher: typeof fetch = fetch): Promise<{ token: string; expiresIn: number }> {
  const url = new URL(`${GRAPH}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", token);
  const response = await fetcher(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!response.ok) throw new Error(`Instagram recusou a renovação do token (${response.status}).`);
  const body = (await response.json()) as { access_token: string; expires_in: number };
  return { token: body.access_token, expiresIn: body.expires_in };
}
