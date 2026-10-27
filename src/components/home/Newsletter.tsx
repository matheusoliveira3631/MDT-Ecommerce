"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NewsletterProps {
  /** Integração com a ferramenta de e-mail; ainda não definida. */
  onSubscribe?: (email: string) => Promise<void>;
}

export function Newsletter({ onSubscribe }: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Informe um e-mail válido, ex.: maria@email.com.");
      e.currentTarget.querySelector("input")?.focus();
      return;
    }
    setError(undefined);
    setStatus("loading");
    await onSubscribe?.(email.trim());
    setStatus("done");
  }

  return (
    <section aria-labelledby="newsletter-title" className="container-page py-section-sm md:py-section">
      <div className="flex flex-wrap items-center justify-between gap-7 rounded-xl border border-rose-200 px-6 py-8 md:px-12 md:py-10">
        <div className="flex-[1_1_320px]">
          <h2 id="newsletter-title" className="mt-0 mb-1.5 text-[24px] md:text-[26px]">
            Receba novidades e cupons
          </h2>
          <p className="m-0 text-base text-ink-muted">Lançamentos de temas e datas para encomendar com antecedência.</p>
        </div>
        <form noValidate onSubmit={handleSubmit} className="flex flex-[1_1_380px] flex-col gap-2">
          <div className="flex flex-wrap gap-2.5">
            <label htmlFor="newsletter-email" className="sr-only">
              Seu e-mail
            </label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "newsletter-error" : undefined}
              className={cn(
                "h-[50px] min-w-0 flex-[1_1_220px] rounded-pill bg-white px-5 text-body text-ink outline-none placeholder:text-ink-muted",
                error ? "border-2 border-error" : "border border-rose-300 focus:border-2 focus:border-primary",
              )}
            />
            <Button type="submit" loading={status === "loading"}>
              Quero receber
            </Button>
          </div>
          {error && (
            <span id="newsletter-error" className="text-sm font-bold text-error">
              {error}
            </span>
          )}
          <span role="status" className="text-sm font-bold text-primary">
            {status === "done" && "Pronto! Você vai receber as novidades por e-mail."}
          </span>
        </form>
      </div>
    </section>
  );
}
