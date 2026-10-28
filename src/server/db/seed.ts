import type { ProductBadge, ProductColor } from "@/lib/types";
import type { Database } from "./connect";
import { categorias, produtos } from "./schema";

/*
 * Catálogo inicial (os produtos de exemplo do design). Só é importado num banco
 * sem categorias, então rodar de novo não duplica nem sobrescreve o que o admin cadastrou.
 */

const CATEGORIAS = [
  { slug: "caixas-milk", nome: "Caixas milk" },
  { slug: "topos-de-bolo", nome: "Topos de bolo" },
  { slug: "cestas", nome: "Cestas" },
  { slug: "kits-festa", nome: "Kits festa" },
  { slug: "lembrancinhas", nome: "Lembrancinhas" },
  { slug: "datas-especiais", nome: "Datas especiais" },
];

const CORES: ProductColor[] = [
  { nome: "Rosa e branco", hex: "#F3CBD6" },
  { nome: "Lilás", hex: "#D9C8EE" },
  { nome: "Azul bebê", hex: "#C9DFF2" },
  { nome: "Verde menta", hex: "#CBE8DA" },
  { nome: "Amarelo suave", hex: "#F6E3A8" },
  { nome: "Neutros", hex: "#E8DDD3" },
];

const BASE = {
  resumo: "[Resumo do produto em uma ou duas frases.]",
  descricao: "[Descrição completa do produto: o que acompanha, para que ocasiões é indicado, sugestões de recheio.]",
  medidas: "[Altura × largura × profundidade, tipo e gramatura do papel, acabamento.]",
  temas: ["Jardim encantado", "Ursinho", "Safari", "Princesa", "Fundo do mar"],
  cores: CORES,
  estoque: 99,
};

const PRODUTOS: Array<{
  slug: string;
  nome: string;
  categoria: string;
  selos: ProductBadge[];
  resumo?: string;
  pedidoMinimo?: number;
  estoque?: number;
  destaque?: boolean;
}> = [
  {
    slug: "caixa-milk-personalizada",
    nome: "Caixa milk personalizada",
    categoria: "caixas-milk",
    resumo:
      "Caixinha no formato de embalagem de leite, impressa com o tema, o nome e as cores da sua festa. Perfeita para lembrancinha com doces.",
    pedidoMinimo: 20,
    selos: [{ tipo: "bestseller" }],
    destaque: true,
  },
  { slug: "topo-de-bolo-em-camadas", nome: "Topo de bolo em camadas", categoria: "topos-de-bolo", selos: [{ tipo: "customizable" }], destaque: true },
  { slug: "cesta-de-cafe-da-manha", nome: "Cesta de café da manhã", categoria: "cestas", selos: [{ tipo: "customizable" }], destaque: true },
  { slug: "kit-festa-na-caixa", nome: "Kit festa na caixa", categoria: "kits-festa", selos: [{ tipo: "new" }], destaque: true },
  {
    slug: "kit-natal-personalizado",
    nome: "Kit de Natal personalizado com caixa, tag, cartão e laço de cetim para presentear",
    categoria: "datas-especiais",
    selos: [{ tipo: "deadline", label: "Encomenda até [data]" }],
  },
  { slug: "lembrancinha-tubete", nome: "Tubete personalizado", categoria: "lembrancinhas", selos: [{ tipo: "soldout" }], estoque: 0 },
];

export function seedCatalog(db: Database): { categorias: number; produtos: number } {
  if (db.select({ id: categorias.id }).from(categorias).limit(1).get()) return { categorias: 0, produtos: 0 };

  return db.transaction((tx) => {
    const ids = new Map<string, number>();
    CATEGORIAS.forEach((c, posicao) => {
      const row = tx.insert(categorias).values({ ...c, posicao }).returning({ id: categorias.id }).get();
      ids.set(c.slug, row.id);
    });
    // Mais antigos primeiro: a loja ordena pelos mais recentes, então a ordem do design se mantém
    [...PRODUTOS].reverse().forEach((p, i) => {
      tx.insert(produtos)
        .values({
          ...BASE,
          slug: p.slug,
          nome: p.nome,
          categoriaId: ids.get(p.categoria)!,
          resumo: p.resumo ?? BASE.resumo,
          pedidoMinimo: p.pedidoMinimo ?? 1,
          selos: p.selos,
          estoque: p.estoque ?? BASE.estoque,
          destaque: p.destaque ?? false,
          criadoEm: new Date(Date.UTC(2026, 0, 1, 0, i)),
        })
        .run();
    });
    return { categorias: CATEGORIAS.length, produtos: PRODUTOS.length };
  });
}
