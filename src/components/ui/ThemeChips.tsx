"use client";

import { cn } from "@/lib/format";

export interface ThemeChipsProps {
  /** `name` do grupo de rádios. */
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

/** Chips de 44px. Radiogroup nativo: Tab entra no grupo, setas trocam a opção. */
export function ThemeChips({ name, options, value, onChange }: ThemeChipsProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => (
        <label key={option} className="relative">
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="peer sr-only"
          />
          <span
            className={cn(
              "flex min-h-11 cursor-pointer items-center rounded-pill border px-[18px] text-sm font-bold",
              "transition-colors duration-150 ease-out",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
              value === option
                ? "border-primary bg-primary text-white"
                : "border-border-input bg-white text-ink hover:bg-rose-50",
            )}
          >
            {option}
          </span>
        </label>
      ))}
    </div>
  );
}
