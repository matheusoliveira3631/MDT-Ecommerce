import Link from "next/link";
import type { Category, NavLink, StoreConfig } from "@/lib/types";
import { Logo } from "./Logo";

export type FooterProps =
  | { variant?: "full"; store: StoreConfig; categories: Category[]; helpLinks: NavLink[] }
  | { variant: "compact"; store: StoreConfig; categories?: never; helpLinks?: never };

const footerLink = "text-ink-on-dark no-underline hover:text-white hover:underline";
const columnTitle = "mb-1 font-heading font-bold text-white";

function LegalRow({ store }: { store: StoreConfig }) {
  return (
    <>
      <span>
        © {new Date().getFullYear()} {store.nome} · CNPJ {store.cnpj}
      </span>
      <span>{store.meiosPagamento.join(" · ")}</span>
    </>
  );
}

export function Footer(props: FooterProps) {
  const { store } = props;

  if (props.variant === "compact") {
    return (
      <footer className="bg-ink text-ink-on-dark">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-9 text-sm">
          <Logo variant="onDark" />
          <div className="flex flex-col gap-1 md:items-end">
            <LegalRow store={store} />
          </div>
        </div>
      </footer>
    );
  }

  const { categories, helpLinks } = props;
  return (
    <footer className="bg-ink text-rose-50">
      <div className="container-page grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-9 pt-16 pb-8">
        <div className="flex flex-col gap-3.5">
          <Logo variant="onDark" />
          <p className="m-0 text-sm leading-relaxed text-ink-on-dark">{store.descricao}</p>
        </div>

        <nav aria-label="Loja" className="flex flex-col gap-2.5 text-body">
          <strong className={columnTitle}>Loja</strong>
          {categories.slice(0, 4).map((c) => (
            <Link key={c.slug} href={`/categoria/${c.slug}`} className={footerLink}>
              {c.nome}
            </Link>
          ))}
        </nav>

        <nav aria-label="Ajuda" className="flex flex-col gap-2.5 text-body">
          <strong className={columnTitle}>Ajuda</strong>
          {helpLinks.map((l) => (
            <Link key={l.href} href={l.href} className={footerLink}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2.5 text-body text-ink-on-dark">
          <strong className={columnTitle}>Fale com a gente</strong>
          <span>WhatsApp {store.whatsapp.exibicao}</span>
          <span>{store.email}</span>
          <span>Instagram @{store.instagram}</span>
        </div>
      </div>
      <div className="container-page">
        <div className="flex flex-wrap justify-between gap-3 border-t border-border-on-dark pt-5 pb-8 text-[13px] text-ink-on-dark">
          <LegalRow store={store} />
        </div>
      </div>
    </footer>
  );
}
