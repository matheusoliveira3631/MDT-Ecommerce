import type { Metadata } from "next";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { store } from "@/data/mock";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: store.nome,
    template: `%s · ${store.nome}`,
  },
  description: store.descricao,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={fontVariables}>
      <body>
        <ToastProvider>
          <CartProvider>
            <FavoritesProvider>
              {children}
              <CartDrawer />
              <WhatsAppFab phone={store.whatsapp.numero} message={store.whatsapp.mensagemPadrao} />
            </FavoritesProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
