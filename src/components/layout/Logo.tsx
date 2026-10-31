import Link from "next/link";
import { cn } from "@/lib/format";
import { store } from "@/data/mock";
import { BrandIcon } from "./BrandIcon";

export interface LogoProps {
  variant?: "default" | "compact" | "monogram";
  href?: string;
  className?: string;
}

/**
 * Faixa da marca, como na cartilha: potinho de lápis, nome em degradê rosa → lilás
 * e "Papelaria personalizada" embaixo (some no mobile e na variante compacta).
 */
export function Logo({ variant = "default", href = "/", className }: LogoProps) {
  if (variant === "monogram") {
    return (
      <Link
        href={href}
        aria-label={store.nome}
        className={cn(
          "flex size-[92px] items-center justify-center rounded-pill border-2 border-gold bg-rose-100 no-underline",
          className,
        )}
      >
        <BrandIcon size={56} />
      </Link>
    );
  }

  return (
    <Link href={href} className={cn("flex items-center gap-2 no-underline md:gap-2.5", className)}>
      <BrandIcon size={44} className={cn("shrink-0", variant === "compact" ? "size-[38px]" : "size-8 min-[400px]:size-9 md:size-11")} />
      <span className="flex flex-col">
        <span
          className={cn(
            "text-brand-gradient pr-1 font-script leading-none font-bold whitespace-nowrap",
            variant === "compact" ? "text-[30px]" : "text-[24px] min-[400px]:text-[26px] md:text-[36px]",
          )}
        >
          {store.nome}
        </span>
        {variant === "default" && (
          <span className="mt-0.5 hidden items-center gap-1.5 text-xs font-bold tracking-[0.04em] text-ink-muted md:flex">
            Papelaria personalizada
            <span aria-hidden="true" className="text-gold">
              ♥
            </span>
          </span>
        )}
      </span>
    </Link>
  );
}
