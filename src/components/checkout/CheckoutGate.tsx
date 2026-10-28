"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useCheckout } from "./CheckoutProvider";

export interface CheckoutGateProps {
  /** Exige os dados da identificação (etapa de pagamento). */
  requireIdentification?: boolean;
  /** Enquanto o pedido é criado a sacola é esvaziada: não redirecione nesse meio-tempo. */
  paused?: boolean;
  children: ReactNode;
}

/**
 * Só mostra a etapa quando faz sentido: sem itens volta para a sacola; sem
 * identificação volta para a etapa 2. Mostra um skeleton enquanto lê o navegador.
 */
export function CheckoutGate({ requireIdentification, paused, children }: CheckoutGateProps) {
  const router = useRouter();
  const cart = useCart();
  const checkout = useCheckout();
  const ready = cart.hydrated && checkout.hydrated;
  const missingCart = ready && cart.lines.length === 0;
  const missingIdentification = ready && requireIdentification && !(checkout.cliente && checkout.endereco && checkout.frete);
  const redirect = paused ? null : missingCart ? "/sacola" : missingIdentification ? "/checkout/identificacao" : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (!ready || redirect) {
    return (
      <div aria-busy="true" aria-label="Carregando" className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <div className="h-72 animate-pulse rounded-lg bg-white" />
          <div className="h-56 animate-pulse rounded-lg bg-white" />
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-white" />
      </div>
    );
  }
  return <>{children}</>;
}
