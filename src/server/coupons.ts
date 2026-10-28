import type { CouponRule } from "@/lib/pricing";

/*
 * Cupons. Por enquanto vêm de CUPONS_SIMULADOS, ex.: "MIMO10:10%,BEMVINDA:500"
 * (com % é percentual; sem, é valor fixo em centavos). Sem a variável, não há
 * cupom válido. Quando houver cadastro de cupons no painel, troque esta função.
 */
export function findCoupon(code: string): CouponRule | null {
  const wanted = code.trim().toUpperCase();
  if (!wanted) return null;
  for (const entry of (process.env.CUPONS_SIMULADOS ?? "").split(",")) {
    const [codigo, valor] = entry.split(":").map((s) => s?.trim());
    if (!codigo || !valor || codigo.toUpperCase() !== wanted) continue;
    const percentual = valor.endsWith("%");
    const numero = Number(percentual ? valor.slice(0, -1) : valor);
    if (!Number.isFinite(numero) || numero <= 0) return null;
    return { codigo: codigo.toUpperCase(), tipo: percentual ? "percentual" : "fixo", valor: numero };
  }
  return null;
}
