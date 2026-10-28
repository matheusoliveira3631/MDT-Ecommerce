/** Link do WhatsApp; caracteres que não são dígitos no número são ignorados. */
export function whatsappHref(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
