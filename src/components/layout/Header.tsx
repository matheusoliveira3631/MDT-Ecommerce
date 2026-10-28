import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";
import { HeartIcon, LockIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { cn } from "@/lib/format";
import type { Category } from "@/lib/types";
import { CategoryNav } from "./CategoryNav";
import { Logo } from "./Logo";

const iconLink =
  "relative flex size-11 items-center justify-center rounded-pill text-ink transition-colors duration-150 ease-out hover:bg-rose-50 hover:text-primary";

export function SearchBar({ defaultQuery, className }: { defaultQuery?: string; className?: string }) {
  return (
    <form
      role="search"
      action="/busca"
      method="get"
      className={cn(
        "flex h-12 items-center gap-2.5 rounded-pill border border-rose-200 bg-rose-50 pr-2 pl-[18px]",
        "focus-within:border-primary",
        className,
      )}
    >
      <label htmlFor="busca-header" className="sr-only">
        Buscar produtos
      </label>
      <input
        id="busca-header"
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder="Buscar caixa milk, topo de bolo, cestas…"
        className="min-w-0 flex-1 border-0 bg-transparent text-body text-ink outline-none placeholder:text-ink-muted"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-primary text-white transition-colors duration-150 ease-out hover:bg-primary-hover"
      >
        <SearchIcon size={18} />
      </button>
    </form>
  );
}

export type CheckoutStep = 1 | 2 | 3;

const checkoutSteps = ["Sacola", "Identificação", "Pagamento"] as const;

export function CheckoutSteps({ current }: { current: CheckoutStep }) {
  return (
    <ol aria-label="Etapas da compra" className="m-0 flex list-none flex-wrap items-center gap-2.5 p-0 text-sm font-bold">
      {checkoutSteps.map((step, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <li key={step} aria-current={active ? "step" : undefined} className="flex items-center gap-2.5">
            {i > 0 && <span aria-hidden="true" className="h-px w-5 bg-border-input sm:w-7" />}
            <span className={cn("flex items-center gap-2", active || done ? "text-primary" : "text-ink-muted")}>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-pill text-[13px]",
                  active ? "bg-primary text-white" : "border border-border-input",
                )}
              >
                {n}
              </span>
              {/* No mobile só a etapa atual mostra o nome; as outras continuam legíveis para leitor de tela */}
              <span className={cn(!active && "max-sm:sr-only")}>{step}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export type HeaderProps =
  | { variant?: "full"; categories: Category[]; checkoutStep?: never }
  | { variant: "checkout"; checkoutStep: CheckoutStep; categories?: never };

export function Header(props: HeaderProps) {
  if (props.variant === "checkout") {
    return (
      <header className="border-b border-border bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-5 py-[18px]">
          <Logo />
          <CheckoutSteps current={props.checkoutStep} />
          <span className="flex items-center gap-2 text-sm font-bold text-ink-muted">
            <LockIcon size={18} strokeWidth={1.8} />
            Compra segura
          </span>
        </div>
      </header>
    );
  }

  const { categories } = props;
  return (
    <header className="border-b border-border bg-white">
      <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-3 py-[18px]">
        <Logo />
        <SearchBar className="order-last basis-full md:order-none md:basis-[280px] md:flex-1" />
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <Link href="/conta" aria-label="Minha conta" className={iconLink}>
            <UserIcon />
          </Link>
          <Link href="/favoritos" aria-label="Favoritos" className={iconLink}>
            <HeartIcon />
          </Link>
          <CartButton className={iconLink} />
        </div>
      </div>
      <CategoryNav
        links={categories.map((c) => ({ label: c.nome, href: `/categoria/${c.slug}` }))}
        highlight={{ label: "Como funciona", href: "/#como-funciona" }}
      />
    </header>
  );
}
