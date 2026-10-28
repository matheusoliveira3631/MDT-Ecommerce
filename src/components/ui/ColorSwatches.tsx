"use client";

import { cn } from "@/lib/format";
import type { ProductColor } from "@/lib/types";

export interface ColorSwatchesProps {
  name: string;
  options: ProductColor[];
  /** Nome da cor escolhida. */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Círculos de 48px com anel de 2px (selecionado: primary). Cada rádio tem o nome da cor
 * como rótulo, e a legenda do fieldset repete a escolha: nunca só pela cor.
 */
export function ColorSwatches({ name, options, value, onChange }: ColorSwatchesProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((color) => {
        const selected = value === color.nome;
        return (
          <label key={color.nome} title={color.nome} className="relative">
            <input
              type="radio"
              name={name}
              value={color.nome}
              checked={selected}
              onChange={() => onChange(color.nome)}
              className="peer sr-only"
            />
            <span className="sr-only">{color.nome}</span>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-12 cursor-pointer rounded-pill border-2 bg-white p-1",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
                selected ? "border-primary" : "border-border hover:border-border-input",
              )}
            >
              <span className="flex-1 rounded-pill border border-ink/10" style={{ backgroundColor: color.hex }} />
            </span>
          </label>
        );
      })}
    </div>
  );
}
