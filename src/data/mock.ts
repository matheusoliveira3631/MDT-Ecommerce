import type {
  Category,
  InstagramPost,
  NavLink,
  Product,
  ShippingOption,
  Step,
  StoreConfig,
  Testimonial,
} from "@/lib/types";
import type { Order } from "@/lib/checkout";

/*
 * Dados mockados. Os valores entre colchetes são placeholders do design:
 * em produção vêm do produto, das configurações da loja ou do CMS.
 */

export const store: StoreConfig = {
  nome: "Mimos da Thaty",
  descricao: "Papelaria personalizada para festas, presentes e datas especiais.",
  avisoBarra: "Enviamos para todo o Brasil · [X]% de desconto no Pix · Parcele em até [N]x",
  descontoPix: "[X]",
  parcelas: "[N]",
  whatsapp: {
    numero: "[5500000000000]",
    exibicao: "[(00) 00000-0000]",
    mensagemPadrao: "Olá! Vim pelo site da Mimos da Thaty.",
  },
  email: "[contato@seudominio.com.br]",
  instagram: "[seuinstagram]",
  cnpj: "[00.000.000/0001-00]",
  meiosPagamento: ["Pix", "Cartão de crédito", "Boleto"],
  referenciaMaxMB: null,
  prazoProducaoPadrao: "[X]",
  politicaEntrega: "[Prazo de produção, opções de envio e retirada, política para produtos personalizados.]",
  bannerSazonal: {
    destaque: "coleção de fim de ano",
    titulo: "Natal com mimos para presentear quem você ama",
    texto: "Encomendas abertas até [data limite]. Garanta a produção a tempo da sua ceia.",
    cta: { label: "Conhecer a coleção", href: "/categoria/datas-especiais" },
  },
};

export const categories: Category[] = [
  { slug: "caixas-milk", nome: "Caixas milk" },
  { slug: "topos-de-bolo", nome: "Topos de bolo" },
  { slug: "cestas", nome: "Cestas" },
  { slug: "kits-festa", nome: "Kits festa" },
  { slug: "lembrancinhas", nome: "Lembrancinhas" },
  { slug: "datas-especiais", nome: "Datas especiais" },
];

export const helpLinks: NavLink[] = [
  { label: "Prazos de produção", href: "/ajuda/prazos" },
  { label: "Frete e entrega", href: "/ajuda/frete" },
  { label: "Trocas e cancelamentos", href: "/ajuda/trocas" },
  { label: "Perguntas frequentes", href: "/ajuda/perguntas-frequentes" },
];

const photoSlots = (nome: string) =>
  Array.from({ length: 4 }, (_, i) => ({ alt: `${nome}, foto ${i + 1}` }));

const baseProduct = {
  resumo: "[Resumo do produto em uma ou duas frases.]",
  descricao: "[Descrição completa do produto: o que acompanha, para que ocasiões é indicado, sugestões de recheio.]",
  medidas: "[Altura × largura × profundidade, tipo e gramatura do papel, acabamento.]",
  precoBase: null,
  precoPix: null,
  precoVaria: true,
  pedidoMinimo: 1,
  prazoProducaoDias: "[X]",
  temas: ["Jardim encantado", "Ursinho", "Safari", "Princesa", "Fundo do mar"],
  cores: [
    { nome: "Rosa e branco", hex: "#F3CBD6" },
    { nome: "Lilás", hex: "#D9C8EE" },
    { nome: "Azul bebê", hex: "#C9DFF2" },
    { nome: "Verde menta", hex: "#CBE8DA" },
    { nome: "Amarelo suave", hex: "#F6E3A8" },
    { nome: "Neutros", hex: "#E8DDD3" },
  ],
  aceitaReferencia: true,
  estoque: 99,
  ativo: true,
} satisfies Partial<Product>;

export const products: Product[] = [
  {
    ...baseProduct,
    slug: "caixa-milk-personalizada",
    nome: "Caixa milk personalizada",
    fotos: photoSlots("Caixa milk personalizada"),
    categoria: "Caixas milk",
    resumo:
      "Caixinha no formato de embalagem de leite, impressa com o tema, o nome e as cores da sua festa. Perfeita para lembrancinha com doces.",
    pedidoMinimo: 20,
    selos: [{ tipo: "bestseller" }],
  },
  {
    ...baseProduct,
    slug: "topo-de-bolo-em-camadas",
    nome: "Topo de bolo em camadas",
    fotos: photoSlots("Topo de bolo em camadas"),
    categoria: "Topos de bolo",
    selos: [{ tipo: "customizable" }],
  },
  {
    ...baseProduct,
    slug: "cesta-de-cafe-da-manha",
    nome: "Cesta de café da manhã",
    fotos: photoSlots("Cesta de café da manhã"),
    categoria: "Cestas",
    selos: [{ tipo: "customizable" }],
  },
  {
    ...baseProduct,
    slug: "kit-festa-na-caixa",
    nome: "Kit festa na caixa",
    fotos: photoSlots("Kit festa na caixa"),
    categoria: "Kits festa",
    selos: [{ tipo: "new" }],
  },
  {
    ...baseProduct,
    slug: "kit-natal-personalizado",
    nome: "Kit de Natal personalizado com caixa, tag, cartão e laço de cetim para presentear",
    fotos: photoSlots("Kit de Natal personalizado com caixa, tag, cartão e laço de cetim para presentear"),
    categoria: "Datas especiais",
    selos: [{ tipo: "deadline", label: "Encomenda até [data]" }],
  },
  {
    ...baseProduct,
    slug: "lembrancinha-tubete",
    nome: "Tubete personalizado",
    fotos: photoSlots("Tubete personalizado"),
    categoria: "Lembrancinhas",
    selos: [{ tipo: "soldout" }],
    estoque: 0,
  },
];

export const featuredProducts: Product[] = products.slice(0, 4);

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

/** Em produção, lista vazia esconde a seção inteira. */
export const instagramPosts: InstagramPost[] = Array.from({ length: 6 }, (_, i) => ({
  href: `https://instagram.com/${store.instagram}`,
  alt: `Post ${i + 1} do Instagram`,
}));

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryProducts(slug: string): Product[] {
  const category = getCategory(slug);
  return category ? products.filter((p) => p.categoria === category.nome) : [];
}

export function getRelatedProducts(slug: string, limit = 4): Product[] {
  return products.filter((p) => p.slug !== slug && p.ativo && p.estoque > 0).slice(0, limit);
}

/**
 * Simula a validação de cupom. `MIMO10` é o cupom de exemplo; o valor do desconto
 * fica `null` (placeholder) até existir a regra real.
 */
export async function validateCouponMock(code: string): Promise<{ codigo: string; desconto: number | null } | null> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return code.trim().toUpperCase() === "MIMO10" ? { codigo: "MIMO10", desconto: null } : null;
}

/**
 * Simula a criação do pedido no gateway (Mercado Pago ou Pagar.me, a definir).
 * O número fica como placeholder até existir o backend.
 */
export async function createOrderMock(input: Omit<Order, "numero" | "status" | "criadoEm">): Promise<Order> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { ...input, numero: "[0000]", status: "aguardando_arte", criadoEm: new Date().toISOString() };
}

/** Simula a cotação de frete (Melhor Envio ou Correios, a definir). */
export async function calculateShippingMock(cep: string): Promise<ShippingOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (/^0+$/.test(cep)) return [];
  return [
    { servico: "PAC", prazo: "[X] dias úteis", valor: null },
    { servico: "SEDEX", prazo: "[X] dias úteis", valor: null },
  ];
}
