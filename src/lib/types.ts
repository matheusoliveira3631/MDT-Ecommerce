/** Tipos de dados que o design pressupõe (HANDOFF.md, seção 9). */

export type BadgeVariant = "customizable" | "bestseller" | "new" | "soldout" | "deadline";

export interface ProductBadge {
  tipo: BadgeVariant;
  /** Obrigatório para `deadline` (ex.: "Encomenda até [data]"). */
  label?: string;
}

export interface ProductColor {
  nome: string;
  hex: string;
}

export interface Product {
  id: number;
  slug: string;
  nome: string;
  /** Nome da categoria. */
  categoria: string;
  categoriaSlug: string;
  /** Texto curto abaixo do título. */
  resumo: string;
  /** Texto completo do acordeão "Descrição". */
  descricao: string;
  medidas: string;
  /** Sem `src`, a foto vira o placeholder de pontos. */
  fotos: ProductPhoto[];
  /** `null` enquanto o preço não estiver cadastrado. */
  precoBase: number | null;
  precoPix: number | null;
  /** Mostra "a partir de" quando o preço varia por quantidade ou opção. */
  precoVaria: boolean;
  pedidoMinimo: number;
  /** `null` enquanto não cadastrado (aparece como "[X]"). */
  prazoProducaoDias: number | null;
  temas: string[];
  cores: ProductColor[];
  aceitaReferencia: boolean;
  selos: ProductBadge[];
  estoque: number;
  ativo: boolean;
  /** Aparece na vitrine "Mais vendidos" da página inicial. */
  destaque: boolean;
}

export interface ProductPhoto {
  src?: string;
  alt: string;
  /** Chave no armazenamento (para o admin reordenar e remover). */
  chave?: string;
}

export interface ShippingOption {
  servico: string;
  prazo: string;
  /** `null` enquanto o valor não vem da transportadora. */
  valor: number | null;
}

export interface Category {
  slug: string;
  nome: string;
  foto?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface StoreConfig {
  nome: string;
  descricao: string;
  avisoBarra: string;
  descontoPix: string;
  parcelas: string;
  whatsapp: {
    /** Número em formato internacional, só dígitos (ex.: 5535999999999). */
    numero: string;
    exibicao: string;
    mensagemPadrao: string;
  };
  email: string;
  instagram: string;
  cnpj: string;
  meiosPagamento: string[];
  /** Limite das imagens de referência; `null` enquanto não definido (não valida o tamanho). */
  referenciaMaxMB: number | null;
  /** Prazo de produção exibido na sacola (cada produto tem o seu na página dele). */
  prazoProducaoPadrao: string;
  /** Texto do acordeão "Prazos, entrega e trocas". */
  politicaEntrega: string;
  /** `null` esconde o banner. */
  bannerSazonal: SeasonalBanner | null;
}

export interface SeasonalBanner {
  destaque: string;
  titulo: string;
  texto: string;
  cta: NavLink;
  imagem?: string;
}

export interface Step {
  titulo: string;
  texto: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  occasion: string;
  photo?: string;
}

export interface InstagramPost {
  href: string;
  foto?: string;
  alt?: string;
}
