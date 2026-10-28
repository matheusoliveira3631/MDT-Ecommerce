import type { CartLine } from "./cart";
import type { ShippingOption } from "./types";

export interface Customer {
  nome: string;
  email: string;
  cpf: string;
  /** A arte é enviada por aqui para aprovação. */
  whatsapp: string;
}

export interface Address {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export type PaymentMethod = "pix" | "cartao" | "boleto";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  boleto: "Boleto",
};

/** Status da arte e do pedido (HANDOFF.md, seção 9). */
export const ORDER_STATUS = [
  { value: "aguardando_arte", label: "Pedido recebido", text: "Com o pagamento confirmado, preparamos a sua arte." },
  { value: "arte_enviada", label: "Arte enviada", text: "Enviamos a arte pelo WhatsApp para você aprovar." },
  { value: "aprovada", label: "Arte aprovada", text: "Com o seu ok, a produção entra na fila." },
  { value: "em_producao", label: "Em produção", text: "Imprimindo, cortando e montando cada peça." },
  { value: "enviado", label: "Enviado", text: "Seu pedido está a caminho." },
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number]["value"];

export interface Order {
  numero: string;
  status: OrderStatus;
  criadoEm: string;
  cliente: Customer;
  endereco: Address;
  frete: ShippingOption;
  pagamento: PaymentMethod;
  linhas: CartLine[];
  cupom?: string;
  total: number | null;
  totalPix: number | null;
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
