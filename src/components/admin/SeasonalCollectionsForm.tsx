"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSeasonalCollectionsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { Checkbox, FormSection, SelectField } from "./fields";
import { PhotoUploader, type UploadedPhoto } from "./PhotoUploader";

export interface CollectionDraft {
  ativa: boolean;
  destaque: string;
  titulo: string;
  texto: string;
  botao: string;
  categoriaId: number | null;
  foto: UploadedPhoto | null;
}

const EMPTY: CollectionDraft = {
  ativa: true,
  destaque: "",
  titulo: "",
  texto: "",
  botao: "Conhecer a coleção",
  categoriaId: null,
  foto: null,
};

/** Coleções sazonais (Natal, Páscoa, Dia das Mães...): cada ativa vira uma faixa na página inicial, nesta ordem. */
export function SeasonalCollectionsForm({
  initial,
  categorias,
}: {
  initial: CollectionDraft[];
  categorias: Array<{ id: number; nome: string }>;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [colecoes, setColecoes] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const update = (index: number, patch: Partial<CollectionDraft>) =>
    setColecoes((current) => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  function move(index: number, delta: -1 | 1) {
    setColecoes((current) => {
      const next = current.slice();
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const result = await saveSeasonalCollectionsAction(
      colecoes.map(({ foto, ...c }) => ({ ...c, fotoChave: foto?.chave ?? null })),
    );
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    showToast({ message: "Coleções salvas", action: { label: "Ver", href: "/" } });
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {(errors.form || errors[""]) && (
        <p role="alert" className="m-0 rounded-md bg-white p-4 text-body font-bold text-error">
          {errors.form ?? errors[""]}
        </p>
      )}
      {colecoes.length === 0 && (
        <p className="m-0 rounded-lg bg-white p-6 text-body text-ink-muted">
          Nenhuma coleção. Sem coleção ativa, a faixa some da página inicial.
        </p>
      )}
      {colecoes.map((c, i) => {
        const err = (field: string) => errors[`${i}.${field}`];
        const nome = c.titulo || `Coleção ${i + 1}`;
        return (
          <FormSection key={i} title={nome}>
            <Checkbox
              label="Ativa"
              hint="Aparece na página inicial. Desmarque quando a temporada acabar, sem perder o texto."
              checked={c.ativa}
              onChange={(ativa) => update(i, { ativa })}
            />
            <TextField
              label="Destaque"
              hint="Frase curta em letra cursiva acima do título, ex.: coleção de Páscoa."
              value={c.destaque}
              maxLength={40}
              onChange={(e) => update(i, { destaque: e.target.value })}
              error={err("destaque")}
            />
            <TextField
              label="Título"
              value={c.titulo}
              maxLength={90}
              onChange={(e) => update(i, { titulo: e.target.value })}
              error={err("titulo")}
            />
            <TextArea
              label="Texto"
              hint="Ex.: prazo para encomendar."
              rows={2}
              maxLength={300}
              value={c.texto}
              onChange={(e) => update(i, { texto: e.target.value })}
              error={err("texto")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Botão leva para a categoria"
                value={c.categoriaId ?? ""}
                onChange={(e) => update(i, { categoriaId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Sem botão</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Texto do botão"
                value={c.botao}
                maxLength={30}
                onChange={(e) => update(i, { botao: e.target.value })}
                error={err("botao")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">Foto da coleção</span>
              <PhotoUploader
                pasta="loja"
                max={1}
                withAlt={false}
                value={c.foto ? [c.foto] : []}
                onChange={(fotos) => update(i, { foto: fotos[0] ?? null })}
                error={err("fotoChave")}
              />
            </div>
            <div className="flex flex-wrap gap-1 border-t border-border pt-3">
              <Button type="button" variant="text" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Subir ${nome}`}>
                ↑ Subir
              </Button>
              <Button
                type="button"
                variant="text"
                disabled={i === colecoes.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Descer ${nome}`}
              >
                ↓ Descer
              </Button>
              <Button
                type="button"
                variant="text"
                className="ml-auto"
                onClick={() => {
                  setColecoes(colecoes.filter((_, j) => j !== i));
                  setErrors({});
                }}
                aria-label={`Remover ${nome}`}
              >
                Remover
              </Button>
            </div>
          </FormSection>
        );
      })}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={saving}>
          Salvar coleções
        </Button>
        {colecoes.length < 6 && (
          <Button type="button" variant="secondary" size="lg" onClick={() => setColecoes([...colecoes, { ...EMPTY }])}>
            Adicionar coleção
          </Button>
        )}
      </div>
    </form>
  );
}
