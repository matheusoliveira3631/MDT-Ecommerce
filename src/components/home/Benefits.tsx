import type { ReactNode } from "react";
import { CardIcon, ChatIcon, PencilIcon, TruckIcon } from "@/components/ui/icons";

interface Benefit {
  icon: ReactNode;
  title: string;
  text: string;
}

export function Benefits({ parcelas }: { parcelas: string }) {
  const items: Benefit[] = [
    { icon: <PencilIcon />, title: "Seu tema, seu nome", text: "Personalização em cada peça" },
    { icon: <ChatIcon />, title: "Arte para aprovação", text: "Enviada pelo WhatsApp" },
    { icon: <TruckIcon />, title: "Envio para todo o Brasil", text: "Embalagem protegida" },
    { icon: <CardIcon />, title: "Pix ou cartão", text: `Em até ${parcelas}x sem juros` },
  ];

  return (
    <section aria-label="Vantagens" className="border-b border-border">
      <ul className="container-page m-0 grid list-none gap-5 py-7 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="flex items-center gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-rose-50 text-primary">
              {item.icon}
            </span>
            <span className="text-sm leading-snug">
              <strong className="block text-body">{item.title}</strong>
              <span className="text-ink-muted">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
