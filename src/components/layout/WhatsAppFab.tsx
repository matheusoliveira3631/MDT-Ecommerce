"use client";

import { usePathname } from "next/navigation";
import { ChatIcon } from "@/components/ui/icons";
import { cn } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";

export interface WhatsAppFabProps {
  /** Número com DDI e DDD; caracteres que não são dígitos são ignorados. */
  phone: string;
  message?: string;
  /** Prefixos de rota onde o botão não aparece (checkout). */
  hiddenOn?: string[];
  /** `fixed` no canto da tela; `inline` para a página de componentes. */
  position?: "fixed" | "inline";
}


export function WhatsAppFab({
  phone,
  message,
  hiddenOn = ["/sacola", "/checkout", "/admin"],
  position = "fixed",
}: WhatsAppFabProps) {
  const pathname = usePathname();
  if (position === "fixed" && hiddenOn.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <a
      href={whatsappHref(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      className={cn(
        "flex size-[60px] shrink-0 items-center justify-center rounded-pill bg-primary text-white shadow-fab",
        "transition-colors duration-150 ease-out hover:bg-primary-hover hover:text-white",
        position === "fixed" && "fixed right-4 bottom-4 z-40 md:right-6 md:bottom-6",
        // Na página de produto o mobile tem a barra fixa de compra embaixo
        position === "fixed" && pathname.startsWith("/produto/") && "max-md:bottom-24",
      )}
    >
      <ChatIcon size={28} strokeWidth={1.8} />
    </a>
  );
}
