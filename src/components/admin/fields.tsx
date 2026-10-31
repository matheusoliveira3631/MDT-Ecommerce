"use client";

import { useId, useRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";
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

/**
 * Lista de valores curtos (ex.: temas): digita, adiciona com "+" ou Enter e
 * cada valor vira uma tag com botão para remover.
 */
export function TagsInput({
  label,
  itemLabel,
  hint,
  value,
  onChange,
  maxLength = 60,
  placeholder,
  error,
}: {
  label: string;
  /** Nome de um item, para o botão "+": "tema" → "Adicionar tema". */
  itemLabel: string;
  hint?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  maxLength?: number;
  placeholder?: string;
  error?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string>();
  const describedBy = [hint && `${id}-hint`, (error || message) && `${id}-error`].filter(Boolean).join(" ") || undefined;

  function add() {
    const tag = draft.trim().replace(/\s+/g, " ");
    if (!tag) {
      inputRef.current?.focus();
      return;
    }
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setMessage(`“${tag}” já está na lista.`);
      return;
    }
    onChange([...value, tag]);
    setDraft("");
    setMessage(undefined);
    inputRef.current?.focus();
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
    inputRef.current?.focus();
  }

  const shownError = error ?? message;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <div className="flex max-w-sm gap-2">
        <input
          ref={inputRef}
          id={id}
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            setDraft(e.target.value);
            setMessage(undefined);
          }}
          onKeyDown={(e) => {
            // Enter adiciona a tag em vez de enviar o formulário
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-sm bg-white px-3 text-body text-ink outline-none placeholder:text-ink-muted",
            shownError ? "border-2 border-error" : "border border-border-input focus:border-2 focus:border-primary",
          )}
        />
        <button
          type="button"
          onClick={add}
          aria-label={`Adicionar ${itemLabel}`}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-rose-100 text-2xl leading-none font-bold text-primary hover:bg-rose-200"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      {hint && (
        <span id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </span>
      )}
      {shownError && (
        <span id={`${id}-error`} className="text-sm font-bold text-error">
          {shownError}
        </span>
      )}
      {value.length > 0 && (
        <ul aria-label={`${label} adicionados`} className="m-0 mt-1 flex list-none flex-wrap gap-2 p-0">
          {value.map((tag, i) => (
            <li
              key={tag}
              className="flex items-center gap-1 rounded-pill border border-rose-200 bg-rose-50 py-1 pr-1 pl-3.5 text-sm font-bold text-ink"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remover ${tag}`}
                className="flex size-7 cursor-pointer items-center justify-center rounded-pill text-base leading-none text-ink-muted hover:bg-rose-200 hover:text-primary"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
