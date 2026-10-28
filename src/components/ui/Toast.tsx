"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/format";
import type { NavLink } from "@/lib/types";
import { CheckIcon } from "./icons";

export interface ToastProps {
  /** `null` esconde o toast. */
  message: string | null;
  action?: NavLink;
  onDismiss: () => void;
  /** Some sozinho depois deste tempo (ms). */
  duration?: number;
  className?: string;
}

/**
 * Fundo ink, check em círculo rose-100. A região `role="status"` fica sempre montada
 * para o leitor de tela anunciar cada mensagem nova.
 */
export function Toast({ message, action, onDismiss, duration = 4000, className }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  return (
    <div
      role="status"
      className={cn("pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center md:bottom-6", className)}
    >
      {message && (
        <div className="pointer-events-auto flex w-full max-w-md animate-toast-in items-center motion-reduce:animate-fade-in gap-3.5 rounded-md bg-ink px-[18px] py-3.5 text-white">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-rose-100 text-primary">
            <CheckIcon size={18} />
          </span>
          <span className="flex-1 text-body font-semibold">{message}</span>
          {action && (
            <Link href={action.href} className="flex min-h-11 items-center text-sm font-extrabold text-rose-200 hover:text-white">
              {action.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
