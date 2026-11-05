import Link from "next/link";
import type { Category, NavLink, StoreConfig } from "@/lib/types";
import { Logo } from "./Logo";

export type FooterProps =
  | { variant?: "full"; store: StoreConfig; categories: Category[]; helpLinks: NavLink[] }
  | { variant: "compact"; store: StoreConfig; categories?: never; helpLinks?: never };

const footerLink = "text-ink no-underline hover:text-primary hover:underline";
const columnTitle = "mb-1 font-heading font-bold text-lilac-ink";

const legalLinks = [
  { label: "Privacidade", href: "/privacidade" },
  { label: "Termos de uso", href: "/termos" },
];

function LegalRow({ store }: { store: StoreConfig }) {
  return (
    <>
      <span>
        © {new Date().getFullYear()} {store.nome} · CNPJ {store.cnpj}
      </span>
      <span className="flex flex-wrap gap-x-4 gap-y-1">
        {legalLinks.map((l) => (
          <Link key={l.href} href={l.href} className={footerLink}>
            {l.label}
          </Link>
        ))}
        <span>{store.meiosPagamento.join(" · ")}</span>
      </span>
    </>
  );
}

export function Footer(props: FooterProps) {
  const { store } = props;

  if (props.variant === "compact") {
    return (
      <footer className="border-t-2 border-gold/40 bg-lilac-100 text-ink">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-9 text-sm">
          <Logo variant="compact" />
          <div className="flex flex-col gap-1 md:items-end">
            <LegalRow store={store} />
          </div>
        </div>
      </footer>
    );
  }

  const { categories, helpLinks } = props;
  return (
    <footer className="border-t-2 border-gold/40 bg-lilac-100 text-ink">
      <div className="container-page grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-9 pt-16 pb-8">
        <div className="flex flex-col gap-3.5">
          <Logo variant="compact" />
          <p className="m-0 text-sm leading-relaxed text-ink-muted">{store.descricao}</p>
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

        <div className="flex flex-col gap-2.5 text-body text-ink">
          <strong className={columnTitle}>Fale com a gente</strong>
          <a href={`https://wa.me/${store.whatsapp.numero}`} target="_blank" rel="noopener noreferrer" className={footerLink}>
            WhatsApp {store.whatsapp.exibicao}
          </a>
          <a href={`mailto:${store.email}`} className={`${footerLink} break-all`}>
            {store.email}
          </a>
          <a href={`https://www.instagram.com/${store.instagram}/`} target="_blank" rel="noopener noreferrer" className={footerLink}>
            Instagram @{store.instagram}
          </a>
        </div>
      </div>
      <div className="container-page">
        <div className="flex flex-wrap justify-between gap-3 border-t border-lilac-200 pt-5 pb-8 text-[13px] text-ink-muted">
          <LegalRow store={store} />
        </div>
      </div>
    </footer>
  );
}
