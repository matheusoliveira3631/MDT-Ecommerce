import { expect, test } from "@playwright/test";
import { fetchRecentMedia, refreshToken } from "../../src/server/instagram-api";

function fakeFetch(status: number, body: unknown) {
  const urls: string[] = [];
  const fn = (async (url: URL | string) => {
    urls.push(String(url));
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fn, urls };
}

test("busca os posts recentes; vídeo entra pela capa e a legenda vira o texto alternativo", async () => {
  const { fn, urls } = fakeFetch(200, {
    data: [
      { id: "1", media_type: "IMAGE", media_url: "https://cdn/1.jpg", permalink: "https://instagram.com/p/1", caption: "Caixas milk do safari 🦁 #festa @cliente" },
      { id: "2", media_type: "VIDEO", media_url: "https://cdn/2.mp4", thumbnail_url: "https://cdn/2.jpg", permalink: "https://instagram.com/p/2" },
      { id: "3", media_type: "IMAGE", permalink: "https://instagram.com/p/3" },
    ],
  });
  const posts = await fetchRecentMedia("tk", 6, fn);
  expect(posts).toEqual([
    { id: "1", href: "https://instagram.com/p/1", foto: "https://cdn/1.jpg", alt: "Caixas milk do safari 🦁" },
    { id: "2", href: "https://instagram.com/p/2", foto: "https://cdn/2.jpg", alt: "Post 2 do Instagram" },
  ]);
  const url = new URL(urls[0]);
  expect(url.origin + url.pathname).toBe("https://graph.instagram.com/me/media");
  expect(url.searchParams.get("access_token")).toBe("tk");
  expect(url.searchParams.get("limit")).toBe("6");
});

test("erro da API vira exceção; a renovação devolve o token novo", async () => {
  await expect(fetchRecentMedia("vencido", 6, fakeFetch(400, { error: { message: "expired" } }).fn)).rejects.toThrow(/400/);
  const { fn, urls } = fakeFetch(200, { access_token: "novo", token_type: "bearer", expires_in: 5184000 });
  expect(await refreshToken("velho", fn)).toEqual({ token: "novo", expiresIn: 5184000 });
  expect(urls[0]).toContain("grant_type=ig_refresh_token");
});
