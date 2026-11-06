import type { Metadata } from "next";
import Link from "next/link";
import { CartTiersForm } from "@/components/admin/CartTiersForm";
import { formatPrice } from "@/lib/format";
import { promoActive, promoPercent } from "@/lib/promo";
import { adminListProducts } from "@/server/admin-catalog";
import { requireAdminPage } from "@/server/auth";
import { db } from "@/server/db";
import { getCartTierSettings } from "@/server/promotions";

export const metadata: Metadata = { title: "Promoções" };

const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

export default async function AdminPromotionsPage() {
  await requireAdminPage("/admin/promocoes");
  const agora = Date.now();
  const comPromocao = adminListProducts().filter(
    (p) => p.precoPromoCentavos != null && p.precoBaseCentavos != null && !(p.promoFimEm && p.promoFimEm.getTime() < agora),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="m-0 text-h2-sm">Promoções</h1>
        <p className="mt-1 mb-0 text-body text-ink-muted">
          Preço “de/por” fica no cadastro de cada produto. Aqui ficam o desconto progressivo do carrinho e a lista do que está em promoção.
        </p>
      </div>

      <CartTiersForm initial={getCartTierSettings(db)} />

      <section aria-labelledby="produtos-promo-title" className="flex flex-col gap-3 rounded-lg bg-white p-5 md:p-6">
        <h2 id="produtos-promo-title" className="m-0 font-heading text-lg font-bold">
          Produtos em promoção
        </h2>
        {comPromocao.length === 0 ? (
          <p className="m-0 text-body text-ink-muted">
            Nenhum. Para criar, abra o produto e preencha “Preço promocional”.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-body">
            {comPromocao.map((p) => {
              const ativa = promoActive(p, agora);
              const periodo = [p.promoInicioEm && `de ${dayMonth.format(p.promoInicioEm)}`, p.promoFimEm && `até ${dayMonth.format(p.promoFimEm)}`]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
                  <Link href={`/admin/produtos/${p.id}`} className="font-bold">
                    {p.nome}
                  </Link>
                  <span className="text-sm">
                    <s className="text-ink-muted">{formatPrice(p.precoBaseCentavos! / 100)}</s>{" "}
                    <strong className="text-lilac-ink">{formatPrice(p.precoPromoCentavos! / 100)}</strong> (-
                    {promoPercent(p.precoBaseCentavos!, p.precoPromoCentavos!)}%) · {ativa ? "valendo" : "agendada"}
                    {periodo ? ` · ${periodo}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
