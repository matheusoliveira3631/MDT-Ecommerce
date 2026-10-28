import Link from "next/link";
import type { ContentPage } from "@/data/content";
import { Breadcrumb } from "@/components/product/Breadcrumb";
import { Accordion } from "@/components/ui/Accordion";
import { buttonClasses } from "@/components/ui/Button";
import { ChatIcon } from "@/components/ui/icons";
import { cn } from "@/lib/format";
import type { NavLink } from "@/lib/types";
import { whatsappHref } from "@/lib/whatsapp";

export interface ContentArticleProps {
  page: ContentPage;
  /** Caminho acima da página atual (ex.: Início › Ajuda). */
  trail: NavLink[];
  /** Links laterais (outras páginas de ajuda); o atual fica marcado. */
  nav?: { title: string; links: NavLink[]; current: string };
  whatsapp: string;
}

/** Página de texto: ajuda, perguntas frequentes e páginas legais. */
export function ContentArticle({ page, trail, nav, whatsapp }: ContentArticleProps) {
  return (
    <main className="container-page pt-6 pb-section-sm md:pb-section">
      <Breadcrumb items={trail} current={page.titulo} />
      <div className={cn("grid grid-cols-1 items-start gap-10", nav && "lg:grid-cols-[240px_minmax(0,1fr)]")}>
        {nav && (
          <nav aria-label={nav.title} className="lg:sticky lg:top-6">
            <span className="mb-3 block font-heading text-sm font-bold text-ink-muted uppercase">{nav.title}</span>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0 lg:flex-col lg:gap-1">
              {nav.links.map((link) => {
                const current = link.href === nav.current;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center rounded-pill px-4 text-body font-bold no-underline",
                        current ? "bg-rose-100 text-primary" : "text-ink hover:bg-rose-50 hover:text-primary",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <article className="flex max-w-[760px] min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="m-0 text-h1-sm md:text-h1">{page.titulo}</h1>
            <p className="m-0 text-body-lg text-ink-muted">{page.resumo}</p>
            {page.atualizadoEm && <p className="m-0 text-sm text-ink-muted">Atualizado em {page.atualizadoEm}</p>}
          </header>

          {page.secoes?.map((secao) => (
            <section key={secao.titulo} className="flex flex-col gap-3">
              <h2 className="m-0 text-[22px] font-bold">{secao.titulo}</h2>
              {secao.paragrafos.map((p, i) => (
                <p key={i} className="m-0 text-base leading-[1.7]">
                  {p}
                </p>
              ))}
            </section>
          ))}

          {page.perguntas && (
            <Accordion items={page.perguntas.map((q) => ({ title: q.pergunta, content: <p className="m-0">{q.resposta}</p> }))} />
          )}

          <aside className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-rose-50 p-6">
            <span className="flex items-center gap-3 text-body">
              <span className="text-primary">
                <ChatIcon />
              </span>
              Ficou alguma dúvida? Fale com a gente.
            </span>
            <a
              href={whatsappHref(whatsapp, `Olá! Tenho uma dúvida sobre ${page.titulo.toLowerCase()}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Conversar no WhatsApp
            </a>
          </aside>
        </article>
      </div>
    </main>
  );
}
