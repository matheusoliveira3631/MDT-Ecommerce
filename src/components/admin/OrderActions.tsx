"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelOrderAction, updateOrderStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/checkout";
import { SelectField } from "./fields";

export interface OrderActionsProps {
  numero: string;
  status: OrderStatus;
  /** Status que o servidor aceita para este pedido (vazio: não pago ou cancelado). */
  proximos: OrderStatus[];
  rastreio: string | null;
  pago: boolean;
  /** Já enviado: não cancela mais pelo painel. */
  podeCancelar: boolean;
}

/** Muda o status do pedido pago e cancela; as regras de verdade ficam no servidor. */
export function OrderActions({ numero, status, proximos, rastreio, pago, podeCancelar }: OrderActionsProps) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, startTransition] = useTransition();
  const currentIndex = proximos.indexOf(status);
  const sugerido = proximos[currentIndex + 1] ?? status;
  const [novo, setNovo] = useState<OrderStatus>(sugerido);
  const [codigo, setCodigo] = useState(rastreio ?? "");
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string>();
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [cancelError, setCancelError] = useState<string>();

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await updateOrderStatusAction({
        numero,
        status: novo,
        rastreio: novo === "enviado" ? codigo : undefined,
        nota: nota || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNota("");
      showToast({ message: `${numero}: ${ORDER_STATUS_LABEL[novo]}` });
      router.refresh();
    });
  }

  function cancelar(e: React.FormEvent) {
    e.preventDefault();
    setCancelError(undefined);
    startTransition(async () => {
      const result = await cancelOrderAction({ numero, motivo });
      if (!result.ok) {
        setCancelError(result.error);
        return;
      }
      setCancelando(false);
      showToast({ message: `${numero} cancelado; o estoque voltou` });
      router.refresh();
    });
  }

  // Status do select acompanha o pedido depois do refresh
  const [lastStatus, setLastStatus] = useState(status);
  if (lastStatus !== status) {
    setLastStatus(status);
    setNovo(sugerido);
  }

  return (
    <div className="flex flex-col gap-5">
      {proximos.length > 0 ? (
        <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
          <SelectField label="Novo status" value={novo} onChange={(e) => setNovo(e.target.value as OrderStatus)}>
            {proximos.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
                {s === status ? " (atual)" : ""}
              </option>
            ))}
          </SelectField>
          {novo === "enviado" && (
            <TextField
              label="Código de rastreio"
              hint="Aparece para a cliente na página do pedido."
              value={codigo}
              maxLength={40}
              autoCapitalize="characters"
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            />
          )}
          <TextArea
            label="Observação (opcional)"
            hint="Fica no histórico do pedido; a cliente não vê."
            value={nota}
            maxLength={500}
            rows={2}
            onChange={(e) => setNota(e.target.value)}
          />
          {error && (
            <p role="alert" className="m-0 text-sm font-bold text-error">
              {error}
            </p>
          )}
          <Button type="submit" loading={pending} className="self-start">
            Salvar status
          </Button>
        </form>
      ) : (
        <p className="m-0 text-body text-ink-muted">
          {status === "cancelado"
            ? "Pedido cancelado. O estoque reservado já voltou."
            : "Aguardando a confirmação do pagamento. Quando o gateway confirmar, o pedido passa para “Pagamento confirmado” sozinho."}
        </p>
      )}

      {podeCancelar && (
        <div className="border-t border-border pt-5">
          {cancelando ? (
            <form onSubmit={cancelar} noValidate className="flex flex-col gap-3">
              <TextArea
                label="Motivo do cancelamento"
                hint={
                  pago
                    ? "O pagamento já foi aprovado: faça o reembolso no gateway. Aqui o pedido é cancelado e o estoque volta."
                    : "Cancele também a cobrança no gateway, para a cliente não pagar um pedido cancelado."
                }
                value={motivo}
                maxLength={500}
                rows={2}
                error={cancelError}
                autoFocus
                onChange={(e) => setMotivo(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="secondary" loading={pending}>
                  Confirmar cancelamento
                </Button>
                <Button type="button" variant="text" onClick={() => setCancelando(false)}>
                  Voltar
                </Button>
              </div>
            </form>
          ) : (
            <Button type="button" variant="text" onClick={() => setCancelando(true)}>
              Cancelar pedido
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
