import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import type { SeasonalBanner as SeasonalBannerData } from "@/lib/types";

/** Faixa de uma coleção sazonal; as coleções são configuradas no painel (Página inicial). */
export function SeasonalBanner({ banner, id = "sazonal-title" }: { banner: SeasonalBannerData; id?: string }) {
  return (
    <section aria-labelledby={id} className="container-page pt-section-sm pb-6 md:pt-20 md:pb-10">
      <div className="grid overflow-hidden rounded-xl bg-rose-100 md:grid-cols-2">
        <div className="flex flex-col items-start justify-center gap-[18px] p-8 md:p-14">
          <span className="font-script text-[40px] leading-none text-primary">{banner.destaque}</span>
          <h2 id={id} className="m-0 text-h2-sm md:text-[36px] md:leading-[1.15]">
            {banner.titulo}
          </h2>
          <p className="m-0 text-body-lg text-ink-muted">{banner.texto}</p>
          {banner.cta && (
            <Link href={banner.cta.href} className={buttonClasses({ size: "lg" })}>
              {banner.cta.label}
            </Link>
          )}
        </div>
        <Photo
          src={banner.imagem}
          alt={banner.titulo}
          sizes="(min-width: 768px) 620px, 100vw"
          placeholder="Foto da coleção sazonal"
          className="min-h-[260px] md:min-h-[360px]"
        />
      </div>
    </section>
  );
}
