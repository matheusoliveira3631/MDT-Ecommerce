import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { applyPaymentUpdate } from "@/server/orders";
import { verifyWebhookSignature } from "@/server/payments";

const bodySchema = z.object({
  pagamentoId: z.string().min(1).max(200),
  status: z.enum(["aprovado", "recusado", "expirado"]),
});

/**
 * Aviso do gateway sobre o pagamento. Só aceita mensagens assinadas com
 * PAGAMENTO_WEBHOOK_SECRET (HMAC-SHA256 do corpo, no cabeçalho x-assinatura).
 * Na integração real, adapte a leitura do corpo e da assinatura ao formato do gateway.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.PAGAMENTO_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ erro: "Webhook não configurado." }, { status: 503 });

  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-assinatura"), secret)) {
    return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });

  const result = applyPaymentUpdate(db, parsed.data.pagamentoId, parsed.data.status);
  if (result === "pedido_nao_encontrado") return NextResponse.json({ erro: "Pagamento desconhecido." }, { status: 404 });
  return NextResponse.json({ ok: true, resultado: result });
}
