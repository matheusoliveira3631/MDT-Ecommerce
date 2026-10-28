"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { subscribeRestockMock } from "@/data/mock";
import type { Product } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Produto esgotado: pede o e-mail para avisar quando voltar (âncora #avise-me). */
export function NotifyMeForm({ product }: { product: Product }) {
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
    await subscribeRestockMock(product.slug, email.trim());
    setStatus("done");
  }

  return (
    <section
      id="avise-me"
      aria-labelledby="avise-me-title"
      className="flex scroll-mt-6 flex-col gap-3 rounded-md bg-rose-50 px-[22px] py-5"
    >
      <h2 id="avise-me-title" className="m-0 text-[17px] font-bold">
        Esgotado no momento
      </h2>
      {status === "done" ? (
        <p role="status" className="m-0 text-body font-bold text-primary">
          Pronto! Vamos avisar em {email.trim()} quando voltar.
        </p>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
          <TextField
            label="Seu e-mail"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            hint="Avisamos uma única vez, quando o produto voltar."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Button type="submit" variant="secondary" size="lg" fullWidth loading={status === "loading"}>
            Avise-me quando voltar
          </Button>
        </form>
      )}
    </section>
  );
}
