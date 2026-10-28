"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/format";

export interface FileDropProps {
  name: string;
  accept: string;
  /** `null` mostra o placeholder "[X]" e não valida o tamanho. */
  maxSizeMB: number | null;
  title: string;
  /** Texto dos formatos aceitos, ex.: "JPG ou PNG". */
  formats: string;
  onChange?: (file: File | null) => void;
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
    </svg>
  );
}

/** Label tracejada envolvendo um `input type=file` visualmente oculto. */
export function FileDrop({ name, accept, maxSizeMB, title, formats, onChange }: FileDropProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    if (chosen && maxSizeMB != null && chosen.size > maxSizeMB * 1024 * 1024) {
      setError(`A imagem tem mais de ${maxSizeMB} MB. Escolha um arquivo menor.`);
      e.target.value = "";
      setFile(null);
      onChange?.(null);
      return;
    }
    setError(undefined);
    setFile(chosen);
    onChange?.(chosen);
  }

  const limit = `${formats}, até ${maxSizeMB ?? "[X]"} MB`;

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        onChange={handleChange}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className="peer sr-only"
      />
      {file && preview ? (
        <div className="flex items-center gap-3.5 rounded-md border-[1.5px] border-rose-300 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob local, sem otimização */}
          <img src={preview} alt="" className="size-14 shrink-0 rounded-sm object-cover" />
          <span className="min-w-0 flex-1 text-sm">
            <strong className="block truncate text-body">{file.name}</strong>
            <span className="text-ink-muted">{limit}</span>
          </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="min-h-11 cursor-pointer px-2 text-[15px] font-bold text-primary hover:text-primary-hover hover:underline"
          >
            Trocar
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex cursor-pointer items-center gap-3.5 rounded-md border-[1.5px] border-dashed bg-white p-5",
            "transition-colors duration-150 ease-out hover:bg-rose-50",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
            error ? "border-error" : "border-rose-300",
          )}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-rose-100 text-primary">
            <UploadIcon />
          </span>
          <span className="text-sm leading-snug">
            <strong className="block text-body">{title}</strong>
            <span className="text-ink-muted">{limit}</span>
          </span>
        </label>
      )}
      {error && (
        <span id={`${id}-error`} className="text-sm font-bold text-error">
          {error}
        </span>
      )}
    </div>
  );
}
