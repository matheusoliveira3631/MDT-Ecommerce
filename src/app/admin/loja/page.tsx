import type { Metadata } from "next";
import { HomeSettingsForm } from "@/components/admin/HomeSettingsForm";
import { requireAdminPage } from "@/server/auth";
import { getHomeSettings } from "@/server/settings";
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
    </div>
  );
}
