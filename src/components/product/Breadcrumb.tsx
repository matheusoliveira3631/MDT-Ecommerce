import Link from "next/link";
import type { NavLink } from "@/lib/types";

/** O último item é a página atual (sem link). */
export function Breadcrumb({ items, current }: { items: NavLink[]; current: string }) {
  return (
    <nav aria-label="Caminho" className="mb-7 text-sm text-ink-muted">
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map((item) => (
          <li key={item.href} className="flex gap-2">
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
