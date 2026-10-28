/**
 * Endereço público da loja, usado em links absolutos (sitemap, Open Graph, dados estruturados).
 * Defina NEXT_PUBLIC_SITE_URL no ambiente de produção, ex.: https://www.seudominio.com.br
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
