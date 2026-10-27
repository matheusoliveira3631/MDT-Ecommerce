import Link from "next/link";
import { cn } from "@/lib/format";
import type { NavLink } from "@/lib/types";

export interface SectionHeadingProps {
  id?: string;
  title: string;
  /** Palavra de destaque em Great Vibes acima do título. */
  kicker?: string;
  link?: NavLink;
  align?: "start" | "center";
  className?: string;
}

export function SectionHeading({ id, title, kicker, link, align = "start", className }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap gap-3",
        align === "center" ? "flex-col items-center text-center" : "items-end justify-between",
        className,
      )}
    >
      <div>
        {kicker && <span className="block font-script text-[34px] leading-tight text-primary">{kicker}</span>}
        <h2 id={id} className="m-0 text-h2-sm md:text-h2">
          {title}
        </h2>
      </div>
      {link && (
        <Link href={link.href} className="text-body font-bold hover:underline">
          {link.label}
        </Link>
      )}
    </div>
  );
}
