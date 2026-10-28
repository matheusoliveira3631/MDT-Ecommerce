import type { Product } from "@/lib/types";
import { absoluteUrl } from "@/lib/site";

/** Dados estruturados (schema.org) do produto e do caminho, para os resultados do Google. */
export function ProductJsonLd({
  product,
  brand,
  category,
}: {
  product: Product;
  brand: string;
  category?: { nome: string; slug: string };
}) {
  const url = absoluteUrl(`/produto/${product.slug}`);
  const images = product.fotos.flatMap((f) => (f.src ? [absoluteUrl(f.src)] : []));
  const available = product.ativo && product.estoque > 0;

  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.nome,
      description: product.resumo,
      sku: product.slug,
      url,
      brand: { "@type": "Brand", name: brand },
      ...(images.length > 0 && { image: images }),
      // Sem preço cadastrado não há oferta: o Google rejeita Offer sem price
      ...(product.precoBase != null && {
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "BRL",
          price: product.precoBase.toFixed(2),
          availability: `https://schema.org/${available ? "InStock" : "OutOfStock"}`,
        },
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: absoluteUrl("/") },
        ...(category
          ? [{ "@type": "ListItem", position: 2, name: category.nome, item: absoluteUrl(`/categoria/${category.slug}`) }]
          : []),
        { "@type": "ListItem", position: category ? 3 : 2, name: product.nome, item: url },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      // JSON gerado no servidor a partir dos dados do produto; "<" escapado para não fechar a tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
