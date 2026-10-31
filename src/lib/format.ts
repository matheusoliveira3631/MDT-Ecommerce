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

/** Máscara de CPF: 000.000.000-00 */
export function maskCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** Máscara de celular: (00) 00000-0000 */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Valida os dígitos verificadores do CPF. */
export function isValidCpf(value: string): boolean {
  const d = value.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

/** "Caixa Milk Café!" → "caixa-milk-cafe" */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Converte o que a pessoa digita ("12", "12,5", "1.234,56", "R$ 12,50") em centavos.
 * Vazio → null (preço ainda não cadastrado). Inválido → NaN.
 */
export function parseBRLToCents(input: string): number | null {
  const text = input.replace(/R\$|\s/g, "");
  if (!text) return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(text)) return NaN;
  const [reais, centavos = ""] = text.replace(/\./g, "").split(",");
  return Number(reais) * 100 + Number(centavos.padEnd(2, "0"));
}

/**
 * Máscara monetária enquanto digita: os dígitos entram pela direita
 * ("1" → "0,01", "1250" → "12,50", "123456" → "1.234,56"). Vazio continua vazio.
 */
export function maskBRL(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
  if (!digits) return "";
  return centsToInput(Number(digits));
}

/** 1250 → "12,50" (para preencher o campo de preço). */
export function centsToInput(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "1 item" / "2 itens" */
export function pluralItens(count: number): string {
  return `${count} ${count === 1 ? "item" : "itens"}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

/** "28/10/2026, 14:05" no horário de Brasília (o servidor roda em UTC). */
export function formatDateTime(date: Date | string): string {
  return dateTime.format(typeof date === "string" ? new Date(date) : date);
}

