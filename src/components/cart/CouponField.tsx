"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";

export interface CouponFieldProps {
  /** Devolve `true` se o cupom foi aceito. */
  onApply: (code: string) => Promise<boolean>;
  applied?: string | null;
}

/** Mesmo padrão do frete: input pill + botão `soft`. */
export function CouponField({ onApply, applied }: CouponFieldProps) {
  const id = useId();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Digite o código do cupom.");
      return;
    }
    setLoading(true);
    try {
      const ok = await onApply(code.trim());
      setError(ok ? undefined : "Cupom inválido ou expirado.");
      if (ok) setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <form noValidate onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-bold">
            Cupom de desconto
          </label>
          <input
            id={id}
            type="text"
            autoCapitalize="characters"
            placeholder="Digite o código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : applied ? `${id}-ok` : undefined}
            className={cn(
              "h-[46px] w-full min-w-0 rounded-pill bg-white px-4 text-body text-ink outline-none placeholder:text-ink-muted",
              error ? "border-2 border-error" : "border border-border-input focus:border-2 focus:border-primary",
            )}
          />
        </div>
        <Button type="submit" variant="soft" size="field" loading={loading}>
          Aplicar
        </Button>
      </form>
      {error && (
        <span id={`${id}-error`} className="text-sm font-bold text-error">
          {error}
        </span>
      )}
      {!error && applied && (
        <span id={`${id}-ok`} role="status" className="text-sm font-bold text-primary">
          Cupom {applied} aplicado
        </span>
      )}
    </div>
  );
}
