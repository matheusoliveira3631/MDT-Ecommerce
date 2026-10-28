"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { slugify } from "@/lib/format";
import { PhotoUploader, type UploadedPhoto } from "./PhotoUploader";

export interface AdminCategory {
  id: number;
  nome: string;
  slug: string;
  posicao: number;
  fotoChave: string | null;
  fotoUrl: string | null;
  totalProdutos: number;
}

function CategoryForm({
  initial,
  onDone,
}: {
  initial?: AdminCategory;
  onDone: () => void;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [posicao, setPosicao] = useState(String(initial?.posicao ?? 0));
  const [foto, setFoto] = useState<UploadedPhoto[]>(
    initial?.fotoChave && initial.fotoUrl ? [{ chave: initial.fotoChave, src: initial.fotoUrl, alt: "" }] : [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const result = await saveCategoryAction({
      id: initial?.id,
      nome,
      slug,
      posicao: Number(posicao) || 0,
      fotoChave: foto[0]?.chave ?? null,
    });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    showToast({ message: initial ? "Categoria salva" : "Categoria criada" });
    onDone();
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-white p-5 md:p-6">
      <h2 className="m-0 text-lg font-bold">{initial ? `Editar “${initial.nome}”` : "Nova categoria"}</h2>
      {errors.form && (
        <p role="alert" className="m-0 text-body font-bold text-error">
          {errors.form}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
        <TextField
          label="Nome"
          value={nome}
          maxLength={60}
          onChange={(e) => {
            setNome(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          error={errors.nome}
        />
        <TextField
          label="Endereço"
          hint={`/categoria/${slug || "…"}`}
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(slugify(e.target.value));
          }}
          error={errors.slug}
        />
        <TextField label="Ordem" type="number" min={0} inputMode="numeric" value={posicao} onChange={(e) => setPosicao(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">Foto (aparece em círculo)</span>
        <PhotoUploader pasta="categorias" max={1} withAlt={false} value={foto} onChange={setFoto} error={errors.fotoChave} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          {initial ? "Salvar" : "Criar categoria"}
        </Button>
        <Button type="button" variant="text" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function CategoriesManager({ categorias }: { categorias: AdminCategory[] }) {
  const router = useRouter();
  const showToast = useToast();
  const [editing, setEditing] = useState<number | "nova" | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null);

  async function handleDelete(categoria: AdminCategory) {
    const result = await deleteCategoryAction(categoria.id);
    if (!result.ok) {
      setDeleteError({ id: categoria.id, message: Object.values(result.errors)[0] });
      return;
    }
    showToast({ message: `Categoria “${categoria.nome}” excluída` });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {editing === "nova" ? (
        <CategoryForm onDone={() => setEditing(null)} />
      ) : (
        <Button className="self-start" onClick={() => setEditing("nova")}>
          Nova categoria
        </Button>
      )}

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {categorias.map((c) =>
          editing === c.id ? (
            <li key={c.id}>
              <CategoryForm initial={c} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={c.id} className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4">
              <Photo src={c.fotoUrl ?? undefined} alt="" sizes="56px" className="size-14 shrink-0 rounded-pill" />
              <div className="min-w-0 flex-1">
                <strong className="block font-heading text-base">{c.nome}</strong>
                <span className="text-sm text-ink-muted">
                  /categoria/{c.slug} · {c.totalProdutos} {c.totalProdutos === 1 ? "produto" : "produtos"} · ordem {c.posicao}
                </span>
                {deleteError?.id === c.id && (
                  <p role="alert" className="mt-1 mb-0 text-sm font-bold text-error">
                    {deleteError.message}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="text" onClick={() => setEditing(c.id)} aria-label={`Editar ${c.nome}`}>
                  Editar
                </Button>
                <Button variant="text" onClick={() => handleDelete(c)} aria-label={`Excluir ${c.nome}`}>
                  Excluir
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
