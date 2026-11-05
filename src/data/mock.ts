import type { NavLink, Step, StoreConfig, Testimonial } from "@/lib/types";

/*
 * Configuração da loja e integrações ainda simuladas (newsletter e avise-me;
 * frete, cupom e pagamento ficam em src/server). Os valores entre colchetes
 * são placeholders do design. Produtos e categorias vêm do banco (src/server/catalog.ts).
 */

export const store: StoreConfig = {
  nome: "Mimos da Tati",
  descricao: "Papelaria personalizada para festas, presentes e datas especiais.",
  avisoBarra: "Enviamos para todo o Brasil · [X]% de desconto no Pix · Parcele em até [N]x",
  descontoPix: "[X]",
  parcelas: "[N]",
  whatsapp: {
    numero: "5519995939494",
    exibicao: "(19) 99593-9494",
    mensagemPadrao: "Olá! Vim pelo site da Mimos da Tati.",
  },
  email: "mimosdatatimococa@gmail.com",
  instagram: "mimosdethatymococa",
  cnpj: "54.179.951/0001-07",
  meiosPagamento: ["Pix", "Cartão de crédito", "Boleto"],
  referenciaMaxMB: 8,
  prazoProducaoPadrao: "[X]",
  politicaEntrega: "[Prazo de produção, opções de envio e retirada, política para produtos personalizados.]",
  bannerSazonal: {
    destaque: "coleção de fim de ano",
    titulo: "Natal com mimos para presentear quem você ama",
    texto: "Encomendas abertas até [data limite]. Garanta a produção a tempo da sua ceia.",
    cta: { label: "Conhecer a coleção", href: "/categoria/datas-especiais" },
  },
};

export const helpLinks: NavLink[] = [
  { label: "Prazos de produção", href: "/ajuda/prazos" },
  { label: "Frete e entrega", href: "/ajuda/frete" },
  { label: "Trocas e cancelamentos", href: "/ajuda/trocas" },
  { label: "Perguntas frequentes", href: "/ajuda/perguntas-frequentes" },
];

export const steps: Step[] = [
  { titulo: "Escolha o produto", texto: "Navegue pelas categorias e escolha a peça e a quantidade." },
  { titulo: "Conte o seu tema", texto: "Informe tema, nome, idade e cores. Pode enviar uma referência." },
  { titulo: "Aprove a arte", texto: "Enviamos a arte pelo WhatsApp. Ajustamos até ficar do seu jeito." },
  { titulo: "Receba em casa", texto: "Produzimos com carinho e enviamos para todo o Brasil." },
];

/** Em produção, lista vazia esconde a seção inteira. */
export const testimonials: Testimonial[] = Array.from({ length: 3 }, () => ({
  quote: "[Depoimento real de cliente, com a ocasião e o produto comprado]",
  author: "[Nome da cliente]",
  occasion: "[Ocasião · produto]",
}));

/** Simula a inscrição na newsletter (ferramenta de e-mail a definir). */
export async function subscribeNewsletterMock(email: string): Promise<void> {
  void email;
  await new Promise((resolve) => setTimeout(resolve, 600));
}

/** Simula o "Avise-me quando voltar" de um produto esgotado. */
export async function subscribeRestockMock(slug: string, email: string): Promise<void> {
  void slug;
  void email;
  await new Promise((resolve) => setTimeout(resolve, 600));
}

