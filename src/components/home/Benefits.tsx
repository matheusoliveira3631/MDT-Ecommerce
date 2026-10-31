import type { ReactNode } from "react";
import { CardIcon, ChatIcon, PencilIcon, TruckIcon } from "@/components/ui/icons";

interface Benefit {
  icon: ReactNode;
  title: string;
  text: string;
  tone: string;
}

// Selos coloridos como na cartilha: rosa, lilás e menta, com contorno dourado
const TONES = {
  rose: "bg-rose-100 text-primary",
  lilac: "bg-lilac-100 text-lilac-ink",
  mint: "bg-mint-100 text-mint-ink",
};

export function Benefits({ parcelas }: { parcelas: string }) {
  const items: Benefit[] = [
    { icon: <PencilIcon />, title: "Seu tema, seu nome", text: "Personalização em cada peça", tone: TONES.rose },
    { icon: <ChatIcon />, title: "Arte para aprovação", text: "Enviada pelo WhatsApp", tone: TONES.lilac },
    { icon: <TruckIcon />, title: "Envio para todo o Brasil", text: "Embalagem protegida", tone: TONES.mint },
    { icon: <CardIcon />, title: "Pix ou cartão", text: `Em até ${parcelas}x sem juros`, tone: TONES.rose },
  ];

  return (
    <section aria-label="Vantagens" className="border-b border-border bg-white">
      <ul className="container-page m-0 grid list-none gap-5 py-7 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="flex items-center gap-3.5">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-pill border border-gold/60 ${item.tone}`}>
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
