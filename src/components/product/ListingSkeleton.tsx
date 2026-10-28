/** Skeleton nas dimensões finais da listagem (título, contagem e cards). */
export function ListingSkeleton() {
  return (
    <main aria-busy="true" aria-label="Carregando produtos" className="container-page pt-10 pb-section-sm md:pb-section">
      <div className="mb-8 flex flex-col gap-3">
        <div className="h-10 w-64 max-w-full animate-pulse rounded-pill bg-rose-50" />
        <div className="h-4 w-24 animate-pulse rounded-pill bg-rose-50" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-square animate-pulse rounded-md bg-rose-50" />
            <div className="h-3 w-1/3 animate-pulse rounded-pill bg-rose-50" />
            <div className="h-5 w-3/4 animate-pulse rounded-pill bg-rose-50" />
            <div className="h-4 w-1/2 animate-pulse rounded-pill bg-rose-50" />
          </div>
        ))}
      </div>
    </main>
  );
}
