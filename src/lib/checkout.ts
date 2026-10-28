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

/** Status do pedido (HANDOFF.md, seção 9), na ordem em que acontecem. */
export const ORDER_STATUS = [
  { value: "aguardando_pagamento", label: "Pedido recebido", text: "Aguardando a confirmação do pagamento." },
  { value: "aguardando_arte", label: "Pagamento confirmado", text: "Estamos preparando a sua arte." },
  { value: "arte_enviada", label: "Arte enviada", text: "Enviamos a arte pelo WhatsApp para você aprovar." },
  { value: "aprovada", label: "Arte aprovada", text: "Com o seu ok, a produção entra na fila." },
  { value: "em_producao", label: "Em produção", text: "Imprimindo, cortando e montando cada peça." },
  { value: "enviado", label: "Enviado", text: "Seu pedido está a caminho." },
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number]["value"] | "cancelado";

/** O que a página de confirmação mostra (valores em centavos, calculados no servidor). */
export interface OrderView {
  numero: string;
  status: OrderStatus;
  criadoEm: string;
  cliente: { nome: string; email: string; whatsapp: string };
  pagamento: { metodo: PaymentMethod; status: "pendente" | "aprovado" | "recusado" | "expirado"; instrucoes: Record<string, string> };
  itens: Array<{ nome: string; quantidade: number; precoUnitarioCentavos: number; tema: string; nomeNaArte: string }>;
  subtotalCentavos: number;
  freteCentavos: number;
  freteServico: string;
  descontoCentavos: number;
  cupom: string | null;
  totalCentavos: number;
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
