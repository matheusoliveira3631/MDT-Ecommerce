import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import type { Category } from "@/lib/types";
import { SearchBar } from "./Header";
import { whatsappHref } from "@/lib/whatsapp";

export interface LostStateProps {
  /** Palavra em Great Vibes acima do título (88px). */
  kicker: string;
  title: string;
  text: string;
  categories: Category[];
  whatsapp: string;
  defaultQuery?: string;
}

/** Layout da 404, reaproveitado na busca sem resultados. */
export function LostState({ kicker, title, text, categories, whatsapp, defaultQuery }: LostStateProps) {
  return (
    <div className="mx-auto flex max-w-[760px] flex-col items-center gap-[22px] px-4 py-section-sm text-center md:px-6 md:pt-24 md:pb-28">
      <svg width="180" height="130" viewBox="0 0 180 130" fill="none" aria-hidden="true" className="max-w-full">
        <rect x="34" y="34" width="112" height="78" rx="10" fill="var(--color-white)" stroke="var(--color-rose-300)" strokeWidth="2" />
        <path d="M34 46l56 36 56-36" stroke="var(--color-rose-300)" strokeWidth="2" strokeLinejoin="round" />
        <path
          d="M90 20c-6-10-20-8-20 2 0 9 20 18 20 18s20-9 20-18c0-10-14-12-20-2z"
          fill="var(--color-rose-200)"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="96" r="4" fill="var(--color-rose-200)" />
        <circle cx="160" cy="28" r="5" fill="var(--color-rose-200)" />
        <circle cx="158" cy="104" r="3" fill="var(--color-rose-300)" />
      </svg>
      <span className="font-script text-[64px] leading-[0.9] text-primary md:text-[88px]">{kicker}</span>
      <h1 className="m-0 text-h1-sm md:text-[36px] md:leading-[1.2]">{title}</h1>
      <p className="m-0 max-w-[520px] text-body-lg text-ink-muted">{text}</p>
      <SearchBar variant="hero404" defaultQuery={defaultQuery} className="mt-2 w-full max-w-[480px]" />
      <div className="mt-1.5 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClasses({ size: "lg" })}>
          Voltar para o início
        </Link>
        <a
          href={whatsappHref(whatsapp, "Olá! Não encontrei o que procurava no site.")}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "secondary", size: "lg" })}
        >
          Falar no WhatsApp
        </a>
      </div>
      <nav aria-labelledby="explore-title" className="mt-[22px] flex flex-col items-center gap-3">
        <span id="explore-title" className="text-sm font-bold text-ink-muted">
          Ou explore uma categoria
        </span>
        <ul className="m-0 flex list-none flex-wrap justify-center gap-2.5 p-0">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/categoria/${c.slug}`}
                className="flex min-h-11 items-center rounded-pill border border-rose-200 bg-white px-[18px] text-sm font-bold text-ink no-underline hover:bg-rose-50 hover:text-ink"
              >
                {c.nome}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
