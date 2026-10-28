import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { PaymentMethod } from "@/lib/checkout";

/*
 * Cobrança no gateway (Mercado Pago ou Pagar.me, a definir). Por enquanto
 * simulada: a integração real troca createCharge mantendo a assinatura, e o
 * webhook do gateway chama /api/pagamentos/webhook com o resultado.
 */

export interface ChargeRequest {
  pedidoNumero: string;
  valorCentavos: number;
  metodo: PaymentMethod;
  cliente: { nome: string; email: string; cpf: string };
}

export interface Charge {
  id: string;
  status: "pendente" | "aprovado";
  /** O que a cliente precisa para pagar (Pix copia e cola, linha do boleto...). */
  instrucoes: Record<string, string>;
}

export async function createCharge(request: ChargeRequest): Promise<Charge> {
  void request.valorCentavos;
  const id = `sim_${randomUUID()}`;
  if (request.metodo === "pix") {
    return { id, status: "pendente", instrucoes: { pixCopiaECola: "[código Pix copia e cola]" } };
  }
  if (request.metodo === "boleto") {
    return { id, status: "pendente", instrucoes: { linhaDigitavel: "[linha digitável do boleto]" } };
  }
  // Cartão: os dados vêm dos campos seguros do gateway; aqui fica pendente até a confirmação
  return { id, status: "pendente", instrucoes: {} };
}

/** Assinatura HMAC-SHA256 (hex) do corpo cru, como o webhook espera receber. */
export function signWebhook(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = Buffer.from(signWebhook(rawBody, secret), "hex");
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
