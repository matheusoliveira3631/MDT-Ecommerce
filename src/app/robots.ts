import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Páginas pessoais, de compra ou internas não entram na busca
      disallow: ["/sacola", "/checkout/", "/favoritos", "/busca", "/componentes"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
