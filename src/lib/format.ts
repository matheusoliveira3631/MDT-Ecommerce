const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Texto exibido enquanto o preço não vem dos dados. */
export const PRICE_PLACEHOLDER = "R$ [preço]";

export function formatPrice(value: number | null | undefined, placeholder = PRICE_PLACEHOLDER): string {
  return value == null ? placeholder : brl.format(value);
}

/** Máscara de CEP: 00000-000 */
export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/** "1 item" / "2 itens" */
export function pluralItens(count: number): string {
  return `${count} ${count === 1 ? "item" : "itens"}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
