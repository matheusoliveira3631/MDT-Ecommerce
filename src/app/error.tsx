"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";

/** Erro inesperado numa página: mantém o layout e oferece tentar de novo. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Ponto de integração com o monitoramento de erros (Sentry ou similar)
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center gap-5 bg-rose-50 px-4 py-section text-center">
      <span className="font-script text-[64px] leading-[0.9] text-primary md:text-[88px]">Ops!</span>
      <h1 className="m-0 text-h1-sm md:text-[36px]">Algo deu errado por aqui</h1>
      <p className="m-0 max-w-[520px] text-body-lg text-ink-muted">
        Não conseguimos carregar esta página. Tente de novo; se continuar, fale com a gente pelo WhatsApp.
      </p>
      {error.digest && <p className="m-0 text-sm text-ink-muted">Código do erro: {error.digest}</p>}
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          Tentar de novo
        </Button>
        <Link href="/" className={buttonClasses({ variant: "secondary", size: "lg" })}>
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
