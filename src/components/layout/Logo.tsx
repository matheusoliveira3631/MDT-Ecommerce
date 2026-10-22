import Link from "next/link";
import { cn } from "@/lib/format";
import { store } from "@/data/mock";

export interface LogoProps {
  variant?: "default" | "onDark" | "monogram";
  href?: string;
  className?: string;
}

/** Provisório em Great Vibes: troque pelo SVG oficial mantendo ~44px de altura. */
export function Logo({ variant = "default", href = "/", className }: LogoProps) {
  if (variant === "monogram") {
    return (
      <Link
        href={href}
        aria-label={store.nome}
        className={cn(
          "flex size-[92px] items-center justify-center rounded-pill bg-rose-100 font-script text-[50px] leading-none text-primary no-underline",
          className,
        )}
      >
        <span aria-hidden="true">Mt</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "pt-1 font-script leading-none no-underline",
        variant === "onDark" ? "text-[40px] text-rose-200 hover:text-white" : "text-[38px] text-primary md:text-[44px]",
        className,
      )}
    >
      {store.nome}
    </Link>
  );
}
