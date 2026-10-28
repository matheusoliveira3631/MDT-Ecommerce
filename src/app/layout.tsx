import type { Metadata, Viewport } from "next";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { store } from "@/data/mock";
import { SITE_URL } from "@/lib/site";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: store.nome,
    template: `%s · ${store.nome}`,
  },
  description: store.descricao,
  openGraph: {
    siteName: store.nome,
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#ad3560",
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
