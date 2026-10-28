import type { ReactNode } from "react";

export interface AccordionItem {
  title: string;
  content: ReactNode;
}

/** `<details>`/`<summary>` nativos. O primeiro item começa aberto. */
export function Accordion({ items }: { items: AccordionItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <details key={item.title} open={i === 0} className="group rounded-md border border-border px-6">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 font-heading text-lg font-bold [&::-webkit-details-marker]:hidden">
            {item.title}
            <span
              aria-hidden="true"
              className="relative size-4 shrink-0 text-primary before:absolute before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:rounded-pill before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:rounded-pill after:bg-current after:transition-transform after:duration-200 after:ease-in-out group-open:after:scale-y-0"
            />
          </summary>
          <div className="mb-[22px] text-base leading-[1.7] text-ink-muted">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
