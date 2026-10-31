"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveHomeSettingsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { FormSection } from "./fields";
import { PhotoUploader, type UploadedPhoto } from "./PhotoUploader";

export function HomeSettingsForm({ foto }: { foto: UploadedPhoto | null }) {
  const router = useRouter();
  const showToast = useToast();
  const [fotos, setFotos] = useState<UploadedPhoto[]>(foto ? [foto] : []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const result = await saveHomeSettingsAction({
      heroFotoChave: fotos[0]?.chave ?? null,
      heroFotoAlt: fotos[0]?.alt ?? "",
    });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    showToast({ message: "Página inicial atualizada", action: { label: "Ver", href: "/" } });
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errors.form && (
        <p role="alert" className="m-0 rounded-md bg-white p-4 text-body font-bold text-error">
          {errors.form}
        </p>
      )}
      <FormSection
        title="Foto principal"
        description="Aparece no topo da página inicial. Prefira uma foto horizontal (5:4), como a mesa de festa com os produtos. Sem foto, a loja mostra o espaço reservado."
      >
        <PhotoUploader pasta="loja" max={1} value={fotos} onChange={setFotos} error={errors.heroFotoChave ?? errors.heroFotoAlt} />
      </FormSection>
      <Button type="submit" size="lg" loading={saving} className="self-start">
        Salvar
      </Button>
    </form>
  );
}
