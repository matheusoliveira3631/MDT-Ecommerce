import { Photo } from "@/components/ui/Photo";
import type { InstagramPost } from "@/lib/types";

/** Sem posts, a seção inteira some. */
export function InstagramFeed({ handle, posts }: { handle: string; posts: InstagramPost[] }) {
  if (posts.length === 0) return null;
  const profile = `https://instagram.com/${handle}`;
  return (
    <section aria-labelledby="instagram-title" className="bg-rose-50">
      <div className="container-page py-section-sm md:py-16">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <h2 id="instagram-title" className="m-0 text-[24px] md:text-[28px]">
            Acompanhe no Instagram <span className="text-primary">@{handle}</span>
          </h2>
          <a href={profile} target="_blank" rel="noopener noreferrer" className="text-body font-bold hover:underline">
            Seguir
          </a>
        </div>
        <ul className="m-0 grid list-none grid-cols-3 gap-3.5 p-0 md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {posts.map((post, i) => (
            <li key={i}>
              <a href={post.href} target="_blank" rel="noopener noreferrer" className="block rounded-sm">
                <Photo
                  src={post.foto}
                  alt={post.alt ?? `Post ${i + 1} do Instagram`}
                  sizes="(min-width: 768px) 200px, 33vw"
                  placeholder="Post"
                  surface="white"
                  className="aspect-square rounded-sm"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
