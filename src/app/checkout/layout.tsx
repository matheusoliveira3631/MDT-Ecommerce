import type { Metadata } from "next";
import { CheckoutProvider } from "@/components/checkout/CheckoutProvider";
import { Footer } from "@/components/layout/Footer";
import { store } from "@/data/mock";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CheckoutProvider>
      <div className="flex min-h-screen flex-col bg-rose-50">
        {children}
        <Footer variant="compact" store={store} />
      </div>
    </CheckoutProvider>
  );
}
