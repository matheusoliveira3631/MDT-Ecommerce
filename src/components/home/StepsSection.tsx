import type { Step } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

export function StepsSection({ steps }: { steps: Step[] }) {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-title" className="scroll-mt-4 bg-rose-50">
      <div className="container-page py-section-sm md:py-20">
        <SectionHeading
          id="como-funciona-title"
          kicker="simples assim"
          title="Como funciona a personalização"
          align="center"
          className="mb-11"
        />
        <ol className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.titulo} className="flex flex-col gap-3 rounded-lg bg-white p-7">
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-pill bg-rose-100 font-heading text-lg font-bold text-primary"
              >
                {i + 1}
              </span>
              <strong className="font-heading text-[19px]">{step.titulo}</strong>
              <span className="text-body text-ink-muted">{step.texto}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
