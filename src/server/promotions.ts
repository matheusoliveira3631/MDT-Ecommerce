import { eq } from "drizzle-orm";
import { z } from "zod";
import type { CartTier } from "@/lib/promo";
import type { Database } from "./db/connect";
import { configuracoes } from "./db/schema";

/*
 * Desconto progressivo do carrinho, configurado no painel (Promoções).
 * Recebe o banco como parâmetro: a loja mostra e o fechamento do pedido
 * aplica as mesmas faixas.
 */

export const tiersSchema = z.object({
  ativo: z.boolean(),
  faixas: z
    .array(
      z.object({
        minimoCentavos: z.number({ error: "Informe o valor da compra." }).int().positive("Informe o valor da compra.").max(100_000_000),
        percentual: z.number({ error: "Informe o desconto." }).int().min(1, "Mínimo de 1%.").max(90, "Use até 90%."),
      }),
    )
    .max(5, "Use até 5 faixas.")
    .superRefine((faixas, ctx) => {
      const valores = faixas.map((f) => f.minimoCentavos);
      if (new Set(valores).size !== valores.length) {
        ctx.addIssue({ code: "custom", message: "Duas faixas com o mesmo valor de compra." });
      }
    }),
});

export type CartTierSettings = z.infer<typeof tiersSchema>;

export function getCartTierSettings(db: Pick<Database, "select">): CartTierSettings {
  const row = db.select().from(configuracoes).where(eq(configuracoes.chave, "desconto_progressivo")).get();
  const parsed = tiersSchema.safeParse(row?.valor);
  return parsed.success ? parsed.data : { ativo: false, faixas: [] };
}

/** Faixas que valem agora (vazio com o desconto desligado). */
export function activeCartTiers(db: Pick<Database, "select">): CartTier[] {
  const settings = getCartTierSettings(db);
  return settings.ativo ? settings.faixas : [];
}
