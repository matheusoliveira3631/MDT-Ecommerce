"use client";

import { useId, useRef, useState } from "react";
import { requestUploadAction } from "@/app/admin/actions";
import { Spinner } from "@/components/ui/icons";
import { cn } from "@/lib/format";

export interface UploadedPhoto {
  chave: string;
  src: string;
  alt: string;
}

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export interface PhotoUploaderProps {
  pasta: "produtos" | "categorias";
  value: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  /** 1 = foto única (categoria). */
  max?: number;
  /** Mostra o campo de texto alternativo de cada foto. */
  withAlt?: boolean;
  error?: string;
}

async function upload(file: File, pasta: PhotoUploaderProps["pasta"]): Promise<UploadedPhoto> {
  const result = await requestUploadAction({ pasta, contentType: file.type, tamanho: file.size });
  if (!result.ok) throw new Error(Object.values(result.errors)[0] ?? "Não foi possível enviar.");
  const { ticket } = result;
  const response = await fetch(ticket.url, { method: "PUT", headers: ticket.headers, body: file });
  if (!response.ok) throw new Error(`O envio de ${file.name} falhou (${response.status}).`);
  return { chave: ticket.chave, src: ticket.publicUrl, alt: "" };
}

/**
 * Envia as fotos direto ao armazenamento (S3 com URL pré-assinada, ou a rota
 * local) e devolve as chaves. A ordem da lista é a ordem na loja: a primeira é a capa.
 */
export function PhotoUploader({ pasta, value, onChange, max = 12, withAlt = true, error }: PhotoUploaderProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string>();
  const remaining = max - value.length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(undefined);
    const chosen = Array.from(files).slice(0, Math.max(remaining, 0));
    const invalid = chosen.find((f) => !ACCEPT.includes(f.type) || f.size > MAX_BYTES);
    if (invalid) {
      setUploadError(`${invalid.name}: envie JPG, PNG ou WebP de até 8 MB.`);
      return;
    }
    setUploading(chosen.length);
    const results = await Promise.allSettled(chosen.map((f) => upload(f, pasta)));
    setUploading(0);
    if (inputRef.current) inputRef.current.value = "";

    const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failed) setUploadError(failed.reason instanceof Error ? failed.reason.message : "Não foi possível enviar.");
    onChange(max === 1 ? ok.slice(0, 1) : [...value, ...ok]);
  }

  function move(index: number, delta: -1 | 1) {
    const next = value.slice();
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  const shownError = uploadError ?? error;

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((photo, i) => (
            <li key={photo.chave} className="flex flex-col gap-2 rounded-md border border-border p-3">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do painel, sem otimização */}
                <img src={photo.src} alt="" className="aspect-square w-full rounded-sm bg-rose-50 object-cover" />
                {max > 1 && i === 0 && (
                  <span className="absolute top-2 left-2 rounded-pill bg-primary px-2.5 py-1 text-xs font-extrabold text-white">
                    Capa
                  </span>
                )}
              </div>
              {withAlt && (
                <div className="flex flex-col gap-1">
                  <label htmlFor={`${id}-alt-${i}`} className="text-sm font-bold">
                    Descrição da foto {i + 1}
                  </label>
                  <input
                    id={`${id}-alt-${i}`}
                    value={photo.alt}
                    maxLength={200}
                    placeholder="Ex.: caixa milk tema safari, vista de frente"
                    onChange={(e) => onChange(value.map((p, j) => (j === i ? { ...p, alt: e.target.value } : p)))}
                    className="h-11 w-full rounded-sm border border-border-input bg-white px-3 text-sm outline-none focus:border-2 focus:border-primary"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {max > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Mover foto ${i + 1} para a esquerda`}
                      className="min-h-11 min-w-11 cursor-pointer rounded-pill text-lg text-primary hover:bg-rose-50 disabled:cursor-default disabled:text-disabled-fg"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === value.length - 1}
                      aria-label={`Mover foto ${i + 1} para a direita`}
                      className="min-h-11 min-w-11 cursor-pointer rounded-pill text-lg text-primary hover:bg-rose-50 disabled:cursor-default disabled:text-disabled-fg"
                    >
                      →
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  aria-label={`Remover foto ${i + 1}`}
                  className="ml-auto min-h-11 cursor-pointer px-2 text-sm font-bold text-ink-muted underline hover:text-primary"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {remaining > 0 && (
        <div>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={ACCEPT.join(",")}
            multiple={max > 1}
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading > 0}
            className="peer sr-only"
            aria-describedby={shownError ? `${id}-error` : `${id}-hint`}
          />
          <label
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-dashed bg-white p-4 text-body hover:bg-rose-50",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
              shownError ? "border-error" : "border-rose-300",
            )}
          >
            {uploading > 0 ? <Spinner /> : <span className="text-xl text-primary" aria-hidden="true">+</span>}
            <span>
              <strong className="block">
                {uploading > 0
                  ? `Enviando ${uploading} ${uploading === 1 ? "foto" : "fotos"}…`
                  : max === 1
                    ? "Escolher foto"
                    : "Adicionar fotos"}
              </strong>
              <span id={`${id}-hint`} className="text-sm text-ink-muted">
                JPG, PNG ou WebP, até 8 MB{max > 1 ? ` · ainda cabem ${remaining}` : ""}
              </span>
            </span>
          </label>
        </div>
      )}
      {shownError && (
        <span id={`${id}-error`} role="alert" className="text-sm font-bold text-error">
          {shownError}
        </span>
      )}
    </div>
  );
}
