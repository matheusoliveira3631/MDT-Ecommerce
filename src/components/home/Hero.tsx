import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { CheckIcon, ImageIcon } from "@/components/ui/icons";
import { Photo } from "@/components/ui/Photo";

export function Hero({ image }: { image?: string }) {
  return (
    <section aria-labelledby="hero-title" className="bg-rose-50">
      <div className="container-page grid items-center gap-10 py-section-sm md:py-section lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col items-start gap-[22px]">
          <span className="rounded-pill border border-rose-200 bg-white px-3.5 py-2 text-[13px] font-bold tracking-[0.06em] text-primary uppercase">
            Papelaria personalizada feita à mão
          </span>
          <h1 id="hero-title" className="m-0 text-display-sm md:text-display">
            Cada detalhe da sua festa, do jeitinho que você{" "}
            <span className="font-script text-[52px] leading-[0.9] font-normal text-primary md:text-[72px]">sonhou</span>
          </h1>
          <p className="m-0 max-w-[520px] text-body-lg text-ink-muted">
            Caixas milk, topos de bolo, cestas e kits personalizados com o tema, o nome e as cores que você escolher.
            Você aprova a arte antes de produzirmos.
          </p>
          <div className="mt-1.5 flex flex-wrap gap-3">
            <Link href="#mais-vendidos" className={buttonClasses({ size: "lg" })}>
              Ver produtos
            </Link>
            <Link href="#como-funciona" className={buttonClasses({ variant: "secondary", size: "lg" })}>
              Como funciona
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:relative">
          <Photo
            src={image}
            alt="Mesa de festa com os produtos personalizados"
            sizes="(min-width: 1024px) 580px, 100vw"
            priority
            className="aspect-[5/4] rounded-xl border-8 border-white"
            placeholder={
              <>
                <ImageIcon size={36} />
                Foto principal: mesa de festa com os produtos
              </>
            }
          />
          {/* Card flutuante: estático abaixo da imagem no mobile e tablet */}
          <div className="flex items-center gap-3 self-start rounded-md bg-white px-[18px] py-3.5 shadow-float lg:absolute lg:bottom-7 lg:-left-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-rose-100 text-primary">
              <CheckIcon size={20} strokeWidth={2} />
            </span>
            <span className="text-sm leading-snug">
              <strong className="block">Arte aprovada por você</strong>
              <span className="text-ink-muted">antes de ir para a produção</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
