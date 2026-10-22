import { cn } from "@/lib/format";
import type { BadgeVariant } from "@/lib/types";

export interface BadgeProps {
  variant: BadgeVariant;
  /** Texto do selo. Obrigatório em `deadline`; nas outras variantes há um texto padrão. */
  label?: string;
  /** Sobre a foto do produto os selos claros ganham fundo branco (como nas vitrines). */
  onImage?: boolean;
  className?: string;
}

const defaultLabels: Record<BadgeVariant, string> = {
  customizable: "Personalizável",
  bestseller: "Mais vendido",
  new: "Novo",
  soldout: "Esgotado",
  deadline: "",
};

const filled = "px-3 py-1.5";
const outlined = "border px-[11px] py-[5px]";

const styles: Record<BadgeVariant, { base: string; onImage?: string }> = {
  customizable: { base: cn(filled, "bg-rose-100 text-primary"), onImage: cn(filled, "bg-white text-primary") },
  bestseller: { base: cn(filled, "bg-primary text-white") },
  new: { base: cn(outlined, "border-rose-300 bg-white text-primary") },
  soldout: { base: cn(filled, "bg-disabled-bg text-soldout-fg") },
  deadline: { base: cn(outlined, "border-rose-200 bg-rose-50 text-ink"), onImage: cn(outlined, "border-rose-200 bg-white text-ink") },
};

export function Badge({ variant, label, onImage, className }: BadgeProps) {
  const style = styles[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill text-xs leading-none font-extrabold",
        onImage && style.onImage ? style.onImage : style.base,
        className,
      )}
    >
      {label ?? defaultLabels[variant]}
    </span>
  );
}
