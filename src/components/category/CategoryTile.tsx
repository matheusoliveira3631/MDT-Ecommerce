import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import type { Category } from "@/lib/types";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/categoria/${category.slug}`}
      className="group flex flex-col items-center gap-3.5 text-ink no-underline hover:text-primary-hover"
    >
      <Photo
        src={category.foto}
        alt=""
        sizes="(min-width: 768px) 180px, 120px"
        placeholder="Foto"
        className="aspect-square w-full rounded-pill transition-transform duration-250 ease-out motion-safe:group-hover:scale-[1.03]"
      />
      <span className="text-center font-heading text-base font-bold group-hover:underline">{category.nome}</span>
    </Link>
  );
}

/** Grade no desktop; carrossel horizontal com scroll-snap no mobile. */
export function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <ul className="-mx-4 my-0 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:gap-6 md:overflow-visible md:px-0 md:pb-0">
      {categories.map((c) => (
        <li key={c.slug} className="w-[120px] shrink-0 snap-start md:w-auto">
          <CategoryTile category={c} />
        </li>
      ))}
    </ul>
  );
}
