import {
  Children,
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/format";
import { Spinner } from "./icons";

export type ButtonVariant = "primary" | "secondary" | "soft" | "text";
/**
 * `md` 50px e `lg` 56px. Extras: `sm` (44px) é o "Personalizar" dos cards;
 * `field` (46px) acompanha inputs de CEP e cupom.
 */
export type ButtonSize = "sm" | "field" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Troca o ícone por um spinner, mantém o texto e desabilita o botão. */
  loading?: boolean;
  icon?: ReactNode;
  /** Aplica o estilo ao único filho (ex.: um `<Link>`) em vez de renderizar `<button>`. */
  asChild?: boolean;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-body font-extrabold no-underline " +
  "transition-colors duration-150 ease-out cursor-pointer " +
  "disabled:cursor-default aria-disabled:cursor-default";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover hover:text-white active:bg-primary-hover " +
    "disabled:bg-disabled-bg disabled:text-disabled-fg aria-disabled:bg-disabled-bg aria-disabled:text-disabled-fg",
  secondary:
    "bg-white text-primary border border-rose-300 hover:bg-rose-50 hover:text-primary " +
    "disabled:bg-disabled-bg disabled:text-disabled-fg disabled:border-transparent",
  soft:
    "bg-rose-100 text-primary hover:bg-rose-200 hover:text-primary-hover " +
    "disabled:bg-disabled-bg disabled:text-disabled-fg",
  text: "bg-transparent text-primary hover:text-primary-hover hover:underline disabled:text-disabled-fg",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 max-w-full px-[22px] py-2 text-center text-[15px] leading-tight",
  field: "h-[46px] px-[22px] text-[15px] whitespace-nowrap",
  md: "h-[50px] px-[26px] text-[15px] whitespace-nowrap",
  lg: "h-14 px-7 text-base whitespace-nowrap",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: Pick<ButtonProps, "variant" | "size" | "fullWidth" | "className"> = {}) {
  return cn(
    base,
    variants[variant],
    variant === "text" ? "min-h-11 px-1 text-[15px]" : sizes[size],
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  asChild = false,
  fullWidth,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = buttonClasses({ variant, size, fullWidth, className });
  const leading = loading ? <Spinner /> : icon;

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) return null;
    const el = child as ReactElement<{ className?: string; children?: ReactNode }>;
    return cloneElement(el, {
      className: cn(classes, el.props.className),
      children: (
        <>
          {leading}
          {el.props.children}
        </>
      ),
    });
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {leading}
      {children}
    </button>
  );
}
