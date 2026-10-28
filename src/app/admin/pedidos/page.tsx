import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { buttonClasses } from "@/components/ui/Button";
import { ORDER_STATUS_LABEL, PAYMENT_LABELS } from "@/lib/checkout";
import { cn, formatDateTime, formatPrice } from "@/lib/format";
import { countOrdersByStatus, listOrdersAdmin, type StatusPedido } from "@/server/admin-orders";
import { requireAdminPage } from "@/server/auth";
import { db } from "@/server/db";
import { STATUS_PEDIDO } from "@/server/db/schema";

export const metadata: Metadata = { title: "Pedidos" };

const PAGAMENTO_STATUS = { pendente: "pendente", aprovado: "pago", recusado: "recusado", expirado: "expirado" } as const;

interface PageProps {
  searchParams: Promise<{ status?: string; busca?: string; pagina?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireAdminPage("/admin/pedidos");
  const params = await searchParams;
  const status = STATUS_PEDIDO.find((s) => s === params.status);
  const busca = params.busca?.trim().slice(0, 100) || undefined;
  const { pedidos, total, pagina, paginas } = listOrdersAdmin(db, { status, busca, pagina: Number(params.pagina) || 1 });
  const counts = countOrdersByStatus(db);
  const todos = Object.values(counts).reduce((a, b) => a + b, 0);

  const href = (next: { status?: StatusPedido; pagina?: number }) => {
    const query = new URLSearchParams();
    if (next.status) query.set("status", next.status);
    if (busca) query.set("busca", busca);
    if (next.pagina && next.pagina > 1) query.set("pagina", String(next.pagina));
    const qs = query.toString();
    return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
  };

  const tabs: Array<{ value?: StatusPedido; label: string; n: number }> = [
    { label: "Todos", n: todos },
    ...STATUS_PEDIDO.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s], n: counts[s] })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-h2-sm">Pedidos</h1>
          <p className="mt-1 mb-0 text-body text-ink-muted">
            {counts.aguardando_arte > 0
              ? `${counts.aguardando_arte} ${counts.aguardando_arte === 1 ? "pedido pago espera" : "pedidos pagos esperam"} a arte`
              : "Nenhum pedido esperando arte"}
          </p>
        </div>
        <form role="search" action="/admin/pedidos" className="flex w-full gap-2 sm:w-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="busca-pedidos" className="sr-only">
            Buscar pedido
          </label>
          <input
            id="busca-pedidos"
            name="busca"
            type="search"
            defaultValue={busca}
            placeholder="Número, nome ou e-mail"
            className="h-[46px] min-w-0 flex-1 rounded-pill border border-border-input bg-white px-4 text-body outline-none focus:border-2 focus:border-primary sm:w-72"
          />
          <button type="submit" className={buttonClasses({ variant: "secondary", size: "field" })}>
            Buscar
          </button>
        </form>
      </div>

      <nav aria-label="Filtrar por status" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="m-0 flex list-none gap-2 p-0">
          {tabs.map((tab) => {
            const current = tab.value === status;
            return (
              <li key={tab.label} className="shrink-0">
                <Link
                  href={href({ status: tab.value })}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-1.5 rounded-pill border px-4 text-sm font-bold no-underline whitespace-nowrap",
                    current ? "border-primary bg-primary text-white hover:text-white" : "border-border-input bg-white text-ink hover:text-primary",
                  )}
                >
                  {tab.label}
                  <span className={cn("font-extrabold", current ? "text-white" : "text-ink-muted")}>{tab.n}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {pedidos.length === 0 ? (
        <p className="m-0 rounded-lg bg-white p-8 text-body">
          {busca ? `Nenhum pedido encontrado para “${busca}”.` : "Nenhum pedido aqui ainda."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white">
          <table className="w-full min-w-[820px] border-collapse text-left text-body">
            <caption className="sr-only">
              Pedidos{status ? ` com status ${ORDER_STATUS_LABEL[status]}` : ""}, do mais novo ao mais antigo
            </caption>
            <thead>
              <tr className="border-b border-border text-sm text-ink-muted">
                <th scope="col" className="px-4 py-3 font-bold">Pedido</th>
                <th scope="col" className="px-4 py-3 font-bold">Cliente</th>
                <th scope="col" className="px-4 py-3 font-bold">Itens</th>
                <th scope="col" className="px-4 py-3 font-bold">Total</th>
                <th scope="col" className="px-4 py-3 font-bold">Pagamento</th>
                <th scope="col" className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${p.numero}`} className="font-bold">
                      {p.numero}
                    </Link>
                    <div className="text-sm whitespace-nowrap text-ink-muted">{formatDateTime(p.criadoEm)}</div>
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <div className="truncate">{p.clienteNome}</div>
                    <div className="truncate text-sm text-ink-muted">{p.clienteEmail}</div>
                  </td>
                  <td className="px-4 py-3">{p.itens}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatPrice(p.totalCentavos / 100)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {PAYMENT_LABELS[p.pagamentoMetodo]}
                    <div className={cn("text-sm", p.pagamentoStatus === "aprovado" ? "font-bold text-primary" : "text-ink-muted")}>
                      {PAGAMENTO_STATUS[p.pagamentoStatus]}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-between gap-4 text-body">
          {pagina > 1 ? (
            <Link href={href({ status, pagina: pagina - 1 })} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-muted">
            Página {pagina} de {paginas} · {total} pedidos
          </span>
          {pagina < paginas ? (
            <Link href={href({ status, pagina: pagina + 1 })} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              Próximos
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
