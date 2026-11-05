import type { Metadata } from "next";
import { HomeSettingsForm } from "@/components/admin/HomeSettingsForm";
import { SeasonalCollectionsForm } from "@/components/admin/SeasonalCollectionsForm";
import { adminListCategories } from "@/server/admin-catalog";
import { requireAdminPage } from "@/server/auth";
import { getHomeSettings, getSeasonalCollections } from "@/server/settings";
import { publicUrl } from "@/server/storage";

export const metadata: Metadata = { title: "Página inicial" };

export default async function AdminStorePage() {
  await requireAdminPage("/admin/loja");
  const home = getHomeSettings();
  const foto = home.heroFotoChave ? { chave: home.heroFotoChave, src: publicUrl(home.heroFotoChave), alt: home.heroFotoAlt } : null;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="m-0 text-h2-sm">Página inicial</h1>
        <p className="mt-1 mb-0 text-body text-ink-muted">O que aparece para quem chega na loja.</p>
      </div>
      <HomeSettingsForm foto={foto} />

      <div className="mt-6">
        <h2 className="m-0 text-h2-sm">Coleções sazonais</h2>
        <p className="mt-1 mb-0 text-body text-ink-muted">
          Faixas da página inicial para datas especiais (Natal, Páscoa, Dia das Mães...). Cada coleção ativa aparece, na ordem desta lista.
        </p>
      </div>
      <SeasonalCollectionsForm
        initial={getSeasonalCollections().map(({ fotoChave, ...c }) => ({
          ...c,
          foto: fotoChave ? { chave: fotoChave, src: publicUrl(fotoChave), alt: "" } : null,
        }))}
        categorias={adminListCategories().map((c) => ({ id: c.id, nome: c.nome }))}
      />
    </div>
  );
}
