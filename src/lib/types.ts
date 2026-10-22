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
  slug: string;
  nome: string;
  categoria: string;
  descricao?: string;
  medidas?: string;
  fotos: string[];
  /** `null` enquanto o preço não estiver cadastrado. */
  precoBase: number | null;
  precoPix: number | null;
  /** Mostra "a partir de" quando o preço varia por quantidade ou opção. */
  precoVaria: boolean;
  pedidoMinimo: number;
  prazoProducaoDias: number | string;
  temas: string[];
  cores: ProductColor[];
  aceitaReferencia: boolean;
  selos: ProductBadge[];
  estoque: number;
  ativo: boolean;
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
}
