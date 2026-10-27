import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export interface PhotoProps {
  src?: string;
  alt: string;
  sizes: string;
  /** Classes do contêiner: proporção (`aspect-*`), raio e tamanho. */
  className?: string;
  priority?: boolean;
  /** Legenda do placeholder enquanto não há foto. */
  placeholder?: ReactNode;
  /** Fundo do placeholder: rosa (padrão) ou branco, para seções sobre rose-50. */
  surface?: "rose" | "white";
}

/** Foto com `next/image` ou, sem foto, o placeholder de pontos (nunca imagem quebrada). */
export function Photo({ src, alt, sizes, className, priority, placeholder, surface = "rose" }: PhotoProps) {
  return (
    <div className={cn("relative overflow-hidden", surface === "white" ? "bg-placeholder-white" : "bg-placeholder", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <span
          {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-[13px] text-ink-muted"
        >
          {placeholder}
        </span>
      )}
    </div>
  );
}
