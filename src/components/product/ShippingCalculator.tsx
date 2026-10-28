"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn, formatPrice, maskCep } from "@/lib/format";
import type { ShippingOption } from "@/lib/types";

export interface ShippingCalculatorProps {
  onCalculate: (cep: string) => Promise<ShippingOption[]>;
  label?: string;
}

export function ShippingCalculator({ onCalculate, label = "Calcular frete" }: ShippingCalculatorProps) {
  const id = useId();
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [chosen, setChosen] = useState<string>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("CEP incompleto. Use 8 números, ex.: 37200-000.");
      setOptions(null);
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const result = await onCalculate(digits);
      if (result.length === 0) {
        setError("Não encontramos esse CEP.");
        setOptions(null);
      } else {
        setOptions(result);
        setChosen(result[0].servico);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form noValidate onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2.5">
        <div className="flex flex-[1_1_180px] flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-bold">
            {label}
          </label>
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(maskCep(e.target.value))}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(
              "h-[46px] w-full rounded-pill bg-white px-[18px] text-body text-ink outline-none placeholder:text-ink-muted",
              error ? "border-2 border-error" : "border border-border-input focus:border-2 focus:border-primary",
            )}
          />
        </div>
        <Button type="submit" variant="soft" size="field" loading={loading}>
          Calcular
        </Button>
      </form>
      {error && (
        <span id={`${id}-error`} className="text-sm font-bold text-error">
          {error}
        </span>
      )}
      {options && (
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="sr-only">Opções de frete para {cep}</legend>
          {options.map((option) => (
            <label
              key={option.servico}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border px-4 py-2.5 text-sm",
                chosen === option.servico ? "border-primary bg-rose-50" : "border-border",
              )}
            >
              <input
                type="radio"
                name={`${id}-frete`}
                value={option.servico}
                checked={chosen === option.servico}
                onChange={() => setChosen(option.servico)}
                className="size-4 accent-primary"
              />
              <span className="flex-1">
                <strong className="block">{option.servico}</strong>
                <span className="text-ink-muted">{option.prazo}</span>
              </span>
              <strong>{formatPrice(option.valor, "R$ [valor]")}</strong>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
