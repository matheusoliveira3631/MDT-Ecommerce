"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/format";
import type { NavLink } from "@/lib/types";

const linkClass =
  "py-1.5 font-heading text-nav no-underline transition-colors duration-150 ease-out hover:text-primary-hover hover:underline";

/** Menu de categorias: em linha no desktop, botão "Menu" que expande a lista no mobile. */
export function CategoryNav({ links, highlight }: { links: NavLink[]; highlight?: NavLink }) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <nav aria-label="Categorias" className="container-page pb-3.5">
      <button
        type="button"
        className="flex min-h-11 items-center gap-2 font-heading text-nav text-ink md:hidden"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
        Menu
      </button>
      <ul
        id={listId}
        className={cn(
          "m-0 list-none flex-col gap-1 p-0 md:flex md:flex-row md:flex-wrap md:gap-x-7 md:gap-y-1.5",
          open ? "flex" : "hidden",
        )}
      >
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
  );
}
