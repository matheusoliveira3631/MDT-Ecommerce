"use client";

import { useState } from "react";
import { ImageIcon } from "@/components/ui/icons";
import { Photo } from "@/components/ui/Photo";
import { cn } from "@/lib/format";
import type { ProductPhoto } from "@/lib/types";

/** Foto principal 1:1 e miniaturas; a miniatura escolhida troca a foto sem recarregar. */
export function ProductGallery({ photos }: { photos: ProductPhoto[] }) {
  const [current, setCurrent] = useState(0);
  const main = photos[current];

  if (!main) {
    return <Photo alt="" sizes="(min-width: 1024px) 590px, 100vw" className="aspect-square rounded-xl" />;
  }

  return (
    <div className="flex flex-col gap-3.5">
      <Photo
        src={main.src}
        alt={main.alt}
        sizes="(min-width: 1024px) 590px, 100vw"
        priority
        className="aspect-square rounded-xl"
        placeholder={
          <>
            <ImageIcon size={40} strokeWidth={1.4} />
            <span className="text-[15px]">Foto {current + 1}</span>
          </>
        }
      />
      {photos.length > 1 && (
        <ul className="m-0 grid list-none grid-cols-4 gap-3 p-0">
          {photos.map((photo, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={current === i}
                className={cn(
                  "block w-full cursor-pointer rounded-sm border-2 p-0",
                  current === i ? "border-primary" : "border-transparent hover:border-rose-300",
                )}
              >
                <Photo
                  src={photo.src}
                  alt=""
                  sizes="140px"
                  placeholder={<span className="text-xs">Foto {i + 1}</span>}
                  className="aspect-square rounded-[12px]"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
