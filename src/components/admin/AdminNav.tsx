"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const links = [
  { label: "Produtos", href: "/admin/produtos" },
  { label: "Categorias", href: "/admin/categorias" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel" className="mx-auto max-w-[1240px] px-4 md:px-6">
      <ul className="m-0 flex list-none gap-1 p-0">
        {links.map((link) => {
          const current = pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center border-b-2 px-3 font-heading text-nav no-underline",
                  current ? "border-primary text-primary" : "border-transparent text-ink hover:text-primary",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
