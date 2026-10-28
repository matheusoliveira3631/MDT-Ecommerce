"use client";

import { useId, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/format";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  /** Mostra o contador de caracteres a partir deste comprimento (requer `maxLength`). */
  counterFrom?: number;
  /** Troca o tamanho padrão do label (14px), ex.: quando ele é o título de um passo. */
  labelClassName?: string;
}

const controlBase =
  "w-full rounded-sm border bg-white text-body text-ink placeholder:text-ink-muted " +
  "transition-colors duration-150 ease-out outline-none";

function controlState(invalid: boolean) {
  return invalid
    ? "border-2 border-error px-[15px]"
    : "border-border-input px-4 focus:border-2 focus:border-primary focus:px-[15px]";
}

function useField({ hint, error }: Pick<FieldProps, "hint" | "error">, id?: string) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { fieldId, hintId, errorId, describedBy };
}

function FieldFooter({
  hint,
  hintId,
  error,
  errorId,
  length,
  maxLength,
  counterFrom,
}: {
  hint?: string;
  hintId?: string;
  error?: string;
  errorId?: string;
  length: number;
  maxLength?: number;
  counterFrom?: number;
}) {
  const showCounter = maxLength != null && counterFrom != null && length >= counterFrom;
  if (!hint && !error && !showCounter) return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        {hint && (
          <span id={hintId} className="text-sm text-ink-muted">
            {hint}
          </span>
        )}
        {error && (
          <span id={errorId} className="text-sm font-bold text-error">
            {error}
          </span>
        )}
      </div>
      {showCounter && (
        <span className="text-sm font-semibold text-ink-muted tabular-nums" aria-live="polite">
          {length}/{maxLength}
        </span>
      )}
    </div>
  );
}

export type TextFieldProps = FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

export function TextField({
  label,
  hint,
  error,
  counterFrom,
  labelClassName,
  id,
  className,
  onChange,
  ...props
}: TextFieldProps) {
  const { fieldId, hintId, errorId, describedBy } = useField({ hint, error }, id);
  const [length, setLength] = useState(String(props.value ?? props.defaultValue ?? "").length);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className={cn("font-bold", labelClassName ?? "text-sm")}>
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(controlBase, controlState(!!error), "h-12")}
        onChange={(e) => {
          setLength(e.target.value.length);
          onChange?.(e);
        }}
        {...props}
      />
      <FieldFooter
        hint={hint}
        hintId={hintId}
        error={error}
        errorId={errorId}
        length={length}
        maxLength={props.maxLength}
        counterFrom={counterFrom}
      />
    </div>
  );
}

export type TextAreaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({
  label,
  hint,
  error,
  counterFrom,
  labelClassName,
  id,
  className,
  onChange,
  rows = 4,
  ...props
}: TextAreaProps) {
  const { fieldId, hintId, errorId, describedBy } = useField({ hint, error }, id);
  const [length, setLength] = useState(String(props.value ?? props.defaultValue ?? "").length);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className={cn("font-bold", labelClassName ?? "text-sm")}>
        {label}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(controlBase, controlState(!!error), "py-3 resize-y")}
        onChange={(e) => {
          setLength(e.target.value.length);
          onChange?.(e);
        }}
        {...props}
      />
      <FieldFooter
        hint={hint}
        hintId={hintId}
        error={error}
        errorId={errorId}
        length={length}
        maxLength={props.maxLength}
        counterFrom={counterFrom}
      />
    </div>
  );
}
