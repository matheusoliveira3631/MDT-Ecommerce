import type { InstagramPost } from "@/lib/types";

/**
 * Posts recentes do Instagram (src/server/instagram.ts). Sem posts (sem
 * INSTAGRAM_TOKEN ou API fora do ar), a seção inteira some.
 */
export function InstagramFeed({ handle, posts }: { handle: string; posts: InstagramPost[] }) {
  if (posts.length === 0) return null;
  const profile = `https://www.instagram.com/${handle}/`;
  return (
    <section aria-labelledby="instagram-title" className="bg-mint-50">
      <div className="container-page py-section-sm md:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="instagram-title" className="m-0 text-[24px] md:text-[28px]">
            Acompanhe no Instagram <span className="break-all text-primary">@{handle}</span>
          </h2>
          <a href={profile} target="_blank" rel="noopener noreferrer" className="text-body font-bold hover:underline">
            Seguir
          </a>
        </div>
        <ul className="m-0 mt-7 grid list-none grid-cols-3 gap-2.5 p-0 md:grid-cols-6 md:gap-3.5">
          {posts.map((post) => (
            <li key={post.href}>
              <a
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden rounded-sm bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Instagram, com endereço temporário */}
                <img
                  src={post.foto}
                  alt={post.alt ?? "Post do Instagram"}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="size-full object-cover transition-transform duration-200 ease-out hover:scale-105"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
