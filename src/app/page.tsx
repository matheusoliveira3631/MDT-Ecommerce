import { CategoryList } from "@/components/category/CategoryTile";
import { Benefits } from "@/components/home/Benefits";
import { Hero } from "@/components/home/Hero";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { Newsletter } from "@/components/home/Newsletter";
import { SeasonalBanner } from "@/components/home/SeasonalBanner";
import { SectionHeading } from "@/components/home/SectionHeading";
import { StepsSection } from "@/components/home/StepsSection";
import { TestimonialsSection } from "@/components/home/Testimonial";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  categories,
  featuredProducts,
  helpLinks,
  instagramPosts,
  steps,
  store,
  testimonials,
} from "@/data/mock";

export default function Home() {
  return (
    <>
      <AnnouncementBar message={store.avisoBarra} />
      <Header categories={categories} />

      <main>
        <Hero />
        <Benefits parcelas={store.parcelas} />

        <section aria-labelledby="categorias-title" className="container-page pt-section-sm pb-6 md:pt-section">
          <SectionHeading
            id="categorias-title"
            title="Compre por categoria"
            link={{ label: "Ver todas", href: "/categorias" }}
          />
          <CategoryList categories={categories} />
        </section>

        <section
          id="mais-vendidos"
          aria-labelledby="mais-vendidos-title"
          className="container-page scroll-mt-4 py-section-sm md:py-section"
        >
          <SectionHeading
            id="mais-vendidos-title"
            kicker="os queridinhos"
            title="Mais vendidos"
            link={{ label: "Ver tudo", href: "/busca?q=" }}
          />
          <ProductGrid products={featuredProducts} />
        </section>

        <StepsSection steps={steps} />
        <SeasonalBanner banner={store.bannerSazonal} />
        <TestimonialsSection testimonials={testimonials} />
        <InstagramFeed handle={store.instagram} posts={instagramPosts} />
        <Newsletter />
      </main>

      <Footer store={store} categories={categories} helpLinks={helpLinks} />
    </>
  );
}
