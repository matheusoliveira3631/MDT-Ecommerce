import { Photo } from "@/components/ui/Photo";
import type { Testimonial as TestimonialData } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

export function Testimonial({ quote, author, occasion, photo }: TestimonialData) {
  return (
    <figure className="m-0 flex flex-col gap-[18px] rounded-lg border border-border p-7">
      <blockquote className="m-0 text-base leading-relaxed text-ink">{quote}</blockquote>
      <figcaption className="flex items-center gap-3">
        <Photo src={photo} alt="" sizes="44px" placeholder="Foto" className="size-11 shrink-0 rounded-pill" />
        <span className="text-sm leading-snug">
          <strong className="block">{author}</strong>
          <span className="text-ink-muted">{occasion}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Sem depoimentos, a seção inteira some. */
export function TestimonialsSection({ testimonials }: { testimonials: TestimonialData[] }) {
  if (testimonials.length === 0) return null;
  return (
    <section aria-labelledby="depoimentos-title" className="container-page pt-10 pb-section-sm md:pb-section">
      <SectionHeading
        id="depoimentos-title"
        kicker="quem recebeu, amou"
        title="Clientes que já fizeram festa com a gente"
        align="center"
        className="mb-9"
      />
      <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        {testimonials.map((t, i) => (
          <li key={i}>
            <Testimonial {...t} />
          </li>
        ))}
      </ul>
    </section>
  );
}
