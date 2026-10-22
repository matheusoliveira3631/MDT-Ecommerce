import type { Category, NavLink, Product, StoreConfig } from "@/lib/types";

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

const baseProduct = {
  fotos: [],
  precoBase: null,
  precoPix: null,
  precoVaria: true,
  pedidoMinimo: 1,
  prazoProducaoDias: "[X]",
  temas: ["Jardim encantado", "Safari", "Fundo do mar", "Princesas"],
  cores: [
    { nome: "Rosa e branco", hex: "#F3CBD6" },
    { nome: "Lilás", hex: "#D9C8F0" },
    { nome: "Azul bebê", hex: "#CFE3F5" },
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
    categoria: "Caixas milk",
    pedidoMinimo: 20,
    selos: [{ tipo: "bestseller" }],
  },
  {
    ...baseProduct,
    slug: "topo-de-bolo-em-camadas",
    nome: "Topo de bolo em camadas",
    categoria: "Topos de bolo",
    selos: [{ tipo: "customizable" }],
  },
  {
    ...baseProduct,
    slug: "cesta-de-cafe-da-manha",
    nome: "Cesta de café da manhã",
    categoria: "Cestas",
    selos: [{ tipo: "customizable" }],
  },
  {
    ...baseProduct,
    slug: "kit-festa-na-caixa",
    nome: "Kit festa na caixa",
    categoria: "Kits festa",
    selos: [{ tipo: "new" }],
  },
  {
    ...baseProduct,
    slug: "kit-natal-personalizado",
    nome: "Kit de Natal personalizado com caixa, tag, cartão e laço de cetim para presentear",
    categoria: "Datas especiais",
    selos: [{ tipo: "deadline", label: "Encomenda até [data]" }],
  },
  {
    ...baseProduct,
    slug: "lembrancinha-tubete",
    nome: "Tubete personalizado",
    categoria: "Lembrancinhas",
    selos: [{ tipo: "soldout" }],
    estoque: 0,
  },
];

export const cartCount = 2;
