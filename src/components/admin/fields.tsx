"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/format";

/** Caixa de seleção com rótulo clicável e área de toque de 44px. */
export function Checkbox({
  label,
  hint,
  checked,
  onChange,
  name,
}: {
  label: ReactNode;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-3 size-[18px] shrink-0 cursor-pointer accent-primary"
      />
      {/* A dica fica fora do label: o nome acessível é só o rótulo, a dica vem pelo aria-describedby */}
      <div className="flex min-h-11 flex-col justify-center text-body">
        <label htmlFor={id} className="cursor-pointer font-bold">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="text-sm text-ink-muted">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

export function SelectField({
  label,
  error,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "h-12 w-full cursor-pointer rounded-sm bg-white px-3 text-body text-ink outline-none",
          error ? "border-2 border-error" : "border border-border-input focus:border-2 focus:border-primary",
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span id={`${id}-error`} className="text-sm font-bold text-error">
          {error}
        </span>
      )}
    </div>
  );
}

/** Bloco do formulário do admin: título + campos. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-4 rounded-lg border-0 bg-white p-5 md:p-6">
      <legend className="float-left mb-1 w-full p-0 font-heading text-lg font-bold">{title}</legend>
      {description && <p className="m-0 -mt-2 text-sm text-ink-muted">{description}</p>}
      {children}
    </fieldset>
  );
}
