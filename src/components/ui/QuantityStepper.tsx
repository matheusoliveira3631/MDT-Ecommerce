"use client";

import { cn } from "@/lib/format";

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Vem do pedido mínimo do produto. */
  min?: number;
  max?: number;
  step?: number;
  size?: "md" | "lg";
  /** Nome acessível do grupo. */
  label?: string;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  size = "md",
  label = "Quantidade",
  className,
}: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = max != null && value >= max;
  const clamp = (v: number) => Math.max(min, max != null ? Math.min(max, v) : v);

  const button =
    "flex shrink-0 items-center justify-center rounded-pill text-xl font-bold text-primary cursor-pointer " +
    "transition-colors duration-150 ease-out hover:bg-rose-50 " +
    "disabled:cursor-default disabled:text-disabled-fg disabled:hover:bg-transparent";
  const buttonSize = size === "lg" ? "size-[52px]" : "size-11";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-pill border border-border-input bg-white",
        size === "lg" ? "h-[54px]" : "h-[46px]",
        className,
      )}
    >
      <button
        type="button"
        className={cn(button, buttonSize)}
        onClick={() => onChange(clamp(value - step))}
        disabled={atMin}
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <span aria-live="polite" aria-atomic="true" className="min-w-9 text-center font-extrabold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        className={cn(button, buttonSize)}
        onClick={() => onChange(clamp(value + step))}
        disabled={atMax}
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  );
}
