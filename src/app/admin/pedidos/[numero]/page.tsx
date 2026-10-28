import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/OrderActions";
import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { buttonClasses } from "@/components/ui/Button";
import { ChatIcon } from "@/components/ui/icons";
import { ORDER_STATUS_LABEL, PAYMENT_LABELS } from "@/lib/checkout";
import { formatDateTime, formatPrice, maskCep, maskCpf } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";
import { customerWhatsappDigits, getOrderAdmin } from "@/server/admin-orders";
import { requireAdminPage } from "@/server/auth";
import { db } from "@/server/db";

interface PageProps {
  params: Promise<{ numero: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { numero } = await params;
  return { title: `Pedido ${numero}` };
}

const reais = (cents: number) => formatPrice(cents / 100);

const PAGAMENTO_STATUS = { pendente: "Pendente", aprovado: "Aprovado", recusado: "Recusado", expirado: "Expirado" } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `secao-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3 rounded-lg bg-white p-5 md:p-6">
      <h2 id={id} className="m-0 font-heading text-lg font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function AdminOrderPage({ params }: PageProps) {
  const { numero } = await params;
  await requireAdminPage(`/admin/pedidos/${numero}`);
  const data = getOrderAdmin(db, numero);
  if (!data) notFound();
  const { pedido, itens, historico, proximos } = data;
  const e = pedido.endereco;
  const primeiroNome = pedido.clienteNome.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/pedidos" className="self-start text-sm font-bold">
          ← Pedidos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 text-h2-sm">Pedido {pedido.numero}</h1>
          <OrderStatusBadge status={pedido.status} className="text-sm" />
        </div>
        <p className="m-0 text-body text-ink-muted">
          Feito em {formatDateTime(pedido.criadoEm)} · {reais(pedido.totalCentavos)} no {PAYMENT_LABELS[pedido.pagamentoMetodo]}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section title="Itens">
            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {itens.map((item) => {
                const p = item.personalizacao;
                const detalhes: Array<[string, string | undefined]> = [
                  ["Tema", item.tema],
                  ["Nome na arte", p.nome],
                  ["Idade ou ocasião", p.idadeOcasiao],
                  ["Cor", p.cor || undefined],
                  ["Referência", p.referenciaNome ? `${p.referenciaNome} (peça o arquivo pelo WhatsApp)` : undefined],
                  ["Observações", p.observacoes],
                ];
                return (
                  <li key={item.id} className="flex flex-col gap-2 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap justify-between gap-2">
                      <strong className="text-body">
                        {item.produtoId ? (
                          <Link href={`/admin/produtos/${item.produtoId}`}>{item.produtoNome}</Link>
                        ) : (
                          item.produtoNome
                        )}
                      </strong>
                      <span className="text-body whitespace-nowrap">
                        {item.quantidade} × {reais(item.precoUnitarioCentavos)} ={" "}
                        <strong>{reais(item.quantidade * item.precoUnitarioCentavos)}</strong>
                      </span>
                    </div>
                    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      {detalhes
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="text-ink-muted">{k}</dt>
                            <dd className="m-0 break-words whitespace-pre-line">{v}</dd>
                          </div>
                        ))}
                    </dl>
                  </li>
                );
              })}
            </ol>
            <dl className="m-0 grid grid-cols-[1fr_auto] gap-2 border-t border-border pt-3 text-body">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="m-0 text-right">{reais(pedido.subtotalCentavos)}</dd>
              <dt className="text-ink-muted">Frete ({pedido.freteServico})</dt>
              <dd className="m-0 text-right">{reais(pedido.freteCentavos)}</dd>
              {pedido.descontoCentavos > 0 && (
                <>
                  <dt className="text-ink-muted">Desconto{pedido.cupomCodigo ? ` (${pedido.cupomCodigo})` : ""}</dt>
                  <dd className="m-0 text-right">−{reais(pedido.descontoCentavos)}</dd>
                </>
              )}
              <dt className="font-extrabold">Total</dt>
              <dd className="m-0 text-right font-extrabold">{reais(pedido.totalCentavos)}</dd>
            </dl>
          </Section>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Section title="Cliente">
              <dl className="m-0 flex flex-col gap-1 text-body">
                <dt className="sr-only">Nome</dt>
                <dd className="m-0 font-bold">{pedido.clienteNome}</dd>
                <dt className="sr-only">E-mail</dt>
                <dd className="m-0 break-all">
                  <a href={`mailto:${pedido.clienteEmail}`}>{pedido.clienteEmail}</a>
                </dd>
                <dt className="sr-only">WhatsApp</dt>
                <dd className="m-0">{pedido.clienteWhatsapp}</dd>
                <dt className="sr-only">CPF</dt>
                <dd className="m-0 text-ink-muted">CPF {maskCpf(pedido.clienteCpf)}</dd>
              </dl>
              <a
                href={whatsappHref(
                  customerWhatsappDigits(pedido.clienteWhatsapp),
                  `Oi, ${primeiroNome}! Aqui é da Mimos da Thaty, sobre o seu pedido ${pedido.numero}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "secondary", size: "sm", className: "self-start" })}
              >
                <ChatIcon size={18} strokeWidth={1.8} />
                Abrir conversa
              </a>
            </Section>

            <Section title="Entrega">
              <address className="text-body not-italic">
                {e.rua}, {e.numero}
                {e.complemento ? ` · ${e.complemento}` : ""}
                <br />
                {e.bairro} · {e.cidade}/{e.uf}
                <br />
                CEP {maskCep(e.cep)}
              </address>
              <p className="m-0 text-sm text-ink-muted">
                {pedido.freteServico} · {pedido.fretePrazo}
              </p>
              {pedido.codigoRastreio && (
                <p className="m-0 text-body">
                  Rastreio: <strong>{pedido.codigoRastreio}</strong>
                </p>
              )}
            </Section>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Section title="Status">
            <OrderActions
              numero={pedido.numero}
              status={pedido.status}
              proximos={proximos}
              rastreio={pedido.codigoRastreio}
              pago={pedido.pagamentoStatus === "aprovado"}
              podeCancelar={pedido.status !== "cancelado" && pedido.status !== "enviado"}
            />
          </Section>

          <Section title="Pagamento">
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body">
              <dt className="text-ink-muted">Forma</dt>
              <dd className="m-0">{PAYMENT_LABELS[pedido.pagamentoMetodo]}</dd>
              <dt className="text-ink-muted">Situação</dt>
              <dd className="m-0 font-bold">{PAGAMENTO_STATUS[pedido.pagamentoStatus]}</dd>
              {pedido.pagamentoId && (
                <>
                  <dt className="text-ink-muted">Cobrança</dt>
                  <dd className="m-0 text-sm break-all">{pedido.pagamentoId}</dd>
                </>
              )}
            </dl>
          </Section>

          <Section title="Histórico">
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {historico.map((h) => (
                <li key={h.id} className="flex flex-col text-sm">
                  <strong className="text-body">{ORDER_STATUS_LABEL[h.status]}</strong>
                  <span className="text-ink-muted">
                    {formatDateTime(h.criadoEm)} · {h.autor}
                  </span>
                  {h.nota && <span className="break-words whitespace-pre-line">{h.nota}</span>}
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </div>
  );
}
