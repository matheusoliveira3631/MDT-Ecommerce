"use client";

import { useState } from "react";
import type { ShippingOption } from "@/lib/types";
import { CheckoutGate } from "./CheckoutGate";
import { useCheckout } from "./CheckoutProvider";
import { CheckoutSummary } from "./CheckoutSummary";
import { IdentificationForm } from "./IdentificationForm";

function Step({ parcelas }: { parcelas: string }) {
  const { frete } = useCheckout();
  const [shipping, setShipping] = useState<ShippingOption | null>(frete);
  return (
    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
      <IdentificationForm onShippingChange={setShipping} />
      <CheckoutSummary shipping={shipping} parcelas={parcelas} />
    </div>
  );
}

export function IdentificationStep({ parcelas }: { parcelas: string }) {
  return (
    <CheckoutGate>
      <Step parcelas={parcelas} />
    </CheckoutGate>
  );
}
