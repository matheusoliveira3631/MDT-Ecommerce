import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/entrar/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/server/auth";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Checagem de verdade (o middleware só barra quem não tem cookie)
  const user = await requireAdminPage("/admin");

  return (
    <div className="min-h-screen bg-rose-50">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-script text-[32px] leading-none text-primary no-underline">
              Mimos da Thaty
            </Link>
            <span className="rounded-pill bg-rose-100 px-2.5 py-1 text-xs font-extrabold text-primary">Painel</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink-muted">{user.nome}</span>
            <Link href="/" className="font-bold hover:underline">
              Ver loja
            </Link>
            <form action={logout}>
              <button type="submit" className="min-h-11 cursor-pointer font-bold text-ink-muted underline hover:text-primary">
                Sair
              </button>
            </form>
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
