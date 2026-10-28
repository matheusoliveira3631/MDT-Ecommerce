"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/format";
import type { NavLink } from "@/lib/types";

const linkClass =
  "py-1.5 font-heading text-nav no-underline transition-colors duration-150 ease-out hover:text-primary-hover hover:underline";

export interface CategoryNavProps {
  links: NavLink[];
  highlight?: NavLink;
  /** Links extras só na gaveta do mobile (ex.: favoritos, ajuda). */
  extraLinks?: NavLink[];
}

/** Menu de categorias: em linha no desktop; no mobile, botão "Menu" que abre uma gaveta pela esquerda. */
export function CategoryNav({ links, highlight, extraLinks = [] }: CategoryNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Navegou: fecha a gaveta
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <nav aria-label="Categorias" className="container-page pb-3.5">
        <button
          type="button"
          className="flex min-h-11 cursor-pointer items-center gap-2 font-heading text-nav text-ink md:hidden"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <MenuIcon size={20} />
          Menu
        </button>
        <ul className="m-0 hidden list-none flex-row flex-wrap gap-x-7 gap-y-1.5 p-0 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={cn(linkClass, "block text-ink")}>
                {link.label}
              </Link>
            </li>
          ))}
          {highlight && (
            <li>
              <Link href={highlight.href} className={cn(linkClass, "block text-primary")}>
                {highlight.label}
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <Drawer open={open} onClose={() => setOpen(false)} side="left" labelledBy="menu-title" className="max-w-[320px]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="menu-title" className="m-0 text-xl font-bold">
            Menu
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="flex size-11 cursor-pointer items-center justify-center rounded-pill bg-rose-50 text-ink hover:bg-rose-100"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <nav aria-label="Menu" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="m-0 flex list-none flex-col p-0">
            {[...links, ...(highlight ? [highlight] : [])].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center rounded-pill px-4 font-heading text-base font-bold no-underline hover:bg-rose-50",
                    link === highlight ? "text-primary" : "text-ink",
                    pathname === link.href && "bg-rose-100 text-primary",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {extraLinks.length > 0 && (
            <ul className="m-0 mt-4 flex list-none flex-col border-t border-border p-0 pt-4">
              {extraLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-pill px-4 text-body text-ink no-underline hover:bg-rose-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </Drawer>
    </>
  );
}
