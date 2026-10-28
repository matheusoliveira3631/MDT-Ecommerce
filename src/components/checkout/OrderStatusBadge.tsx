import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/checkout";
import { cn } from "@/lib/format";

const styles: Record<OrderStatus, string> = {
  aguardando_pagamento: "border border-border-input bg-white text-ink-muted",
  // Pago e esperando a arte: é o que pede ação primeiro
  aguardando_arte: "bg-primary text-white",
  arte_enviada: "bg-rose-100 text-primary",
  aprovada: "bg-rose-100 text-primary",
  em_producao: "bg-rose-200 text-ink",
  enviado: "bg-rose-50 text-ink border border-rose-200",
  cancelado: "bg-disabled-bg text-soldout-fg",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("inline-block rounded-pill px-2.5 py-1 text-xs font-extrabold whitespace-nowrap", styles[status], className)}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
