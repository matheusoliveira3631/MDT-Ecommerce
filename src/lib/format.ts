const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Texto exibido enquanto o preço não vem dos dados. */
export const PRICE_PLACEHOLDER = "R$ [preço]";

export function formatPrice(value: number | null | undefined): string {
  return value == null ? PRICE_PLACEHOLDER : brl.format(value);
}

/** "1 item" / "2 itens" */
export function pluralItens(count: number): string {
  return `${count} ${count === 1 ? "item" : "itens"}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
