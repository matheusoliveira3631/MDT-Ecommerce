"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteProductAction, saveProductAction } from "@/app/admin/actions";
import { Button, buttonClasses } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { centsToInput, maskBRL, parseBRLToCents, slugify } from "@/lib/format";
import type { BadgeVariant, ProductColor } from "@/lib/types";
import { Checkbox, FormSection, SelectField, TagsInput } from "./fields";
import { PhotoUploader, type UploadedPhoto } from "./PhotoUploader";

export interface ProductEditorInitial {
  id?: number;
  nome: string;
  slug: string;
  categoriaId: number | null;
  resumo: string;
  descricao: string;
  medidas: string;
  precoBaseCentavos: number | null;
  precoPixCentavos: number | null;
  precoVaria: boolean;
  pedidoMinimo: number;
  prazoProducaoDias: number | null;
  estoque: number;
  pesoGramas: number | null;
  alturaCm: number | null;
  larguraCm: number | null;
  comprimentoCm: number | null;
  temas: string[];
  cores: ProductColor[];
  aceitaReferencia: boolean;
  selos: Array<{ tipo: BadgeVariant; label?: string }>;
  ativo: boolean;
  destaque: boolean;
  fotos: UploadedPhoto[];
}

const EDITABLE_BADGES: Array<{ tipo: "customizable" | "bestseller" | "new"; label: string }> = [
  { tipo: "customizable", label: "Personalizável" },
  { tipo: "bestseller", label: "Mais vendido" },
  { tipo: "new", label: "Novo" },
];

/** Ordem dos campos na tela: o foco vai para o primeiro com erro. */
const FIELD_ORDER = [
  "nome", "slug", "categoriaId", "resumo", "descricao", "medidas", "precoBaseCentavos", "precoPixCentavos",
  "pedidoMinimo", "prazoProducaoDias", "estoque", "pesoGramas", "alturaCm", "larguraCm", "comprimentoCm", "temas", "cores", "selos", "fotos",
];

const toInt = (value: string): number | null => (value.trim() === "" ? null : Number(value));

export function ProductEditor({
  initial,
  categorias,
}: {
  initial: ProductEditorInitial;
  categorias: Array<{ id: number; nome: string }>;
}) {
  const router = useRouter();
  const showToast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !initial.id;

  const [nome, setNome] = useState(initial.nome);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [categoriaId, setCategoriaId] = useState(initial.categoriaId ? String(initial.categoriaId) : "");
  const [resumo, setResumo] = useState(initial.resumo);
  const [descricao, setDescricao] = useState(initial.descricao);
  const [medidas, setMedidas] = useState(initial.medidas);
  const [precoBase, setPrecoBase] = useState(centsToInput(initial.precoBaseCentavos));
  const [precoPix, setPrecoPix] = useState(centsToInput(initial.precoPixCentavos));
  const [precoVaria, setPrecoVaria] = useState(initial.precoVaria);
  const [pedidoMinimo, setPedidoMinimo] = useState(String(initial.pedidoMinimo));
  const [prazo, setPrazo] = useState(initial.prazoProducaoDias == null ? "" : String(initial.prazoProducaoDias));
  const [estoque, setEstoque] = useState(String(initial.estoque));
  const numberText = (n: number | null) => (n == null ? "" : String(n));
  const [peso, setPeso] = useState(numberText(initial.pesoGramas));
  const [altura, setAltura] = useState(numberText(initial.alturaCm));
  const [largura, setLargura] = useState(numberText(initial.larguraCm));
  const [comprimento, setComprimento] = useState(numberText(initial.comprimentoCm));
  const [temas, setTemas] = useState<string[]>(initial.temas);
  const [cores, setCores] = useState<ProductColor[]>(initial.cores);
  const [aceitaReferencia, setAceitaReferencia] = useState(initial.aceitaReferencia);
  const [selos, setSelos] = useState(initial.selos.filter((s) => s.tipo !== "soldout"));
  const [ativo, setAtivo] = useState(initial.ativo);
  const [destaque, setDestaque] = useState(initial.destaque);
  const [fotos, setFotos] = useState<UploadedPhoto[]>(initial.fotos);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deadline = selos.find((s) => s.tipo === "deadline");
  const hasBadge = (tipo: BadgeVariant) => selos.some((s) => s.tipo === tipo);
  const toggleBadge = (tipo: BadgeVariant, on: boolean) =>
    setSelos((current) => (on ? [...current, { tipo }] : current.filter((s) => s.tipo !== tipo)));

  function focusFirstError(next: Record<string, string>) {
    const first = FIELD_ORDER.find((f) => next[f]) ?? (next.form ? "form" : undefined);
    if (!first) return;
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"] :is(input, textarea, select, button)`);
      (el ?? formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`))?.focus();
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const precoBaseCentavos = parseBRLToCents(precoBase);
    const precoPixCentavos = parseBRLToCents(precoPix);
    const local: Record<string, string> = {};
    if (Number.isNaN(precoBaseCentavos)) local.precoBaseCentavos = "Use o formato 12,50.";
    if (Number.isNaN(precoPixCentavos)) local.precoPixCentavos = "Use o formato 12,50.";
    if (Object.keys(local).length) {
      setErrors(local);
      focusFirstError(local);
      return;
    }

    setSaving(true);
    const result = await saveProductAction({
      id: initial.id,
      nome,
      slug,
      categoriaId: categoriaId ? Number(categoriaId) : undefined,
      resumo,
      descricao,
      medidas,
      precoBaseCentavos,
      precoPixCentavos,
      precoVaria,
      pedidoMinimo: toInt(pedidoMinimo) ?? 1,
      prazoProducaoDias: toInt(prazo),
      estoque: toInt(estoque) ?? 0,
      pesoGramas: toInt(peso),
      alturaCm: toInt(altura),
      larguraCm: toInt(largura),
      comprimentoCm: toInt(comprimento),
      temas,
      cores,
      aceitaReferencia,
      selos,
      ativo,
      destaque,
      fotos: fotos.map(({ chave, alt }) => ({ chave, alt })),
    });
    setSaving(false);

    if (!result.ok) {
      setErrors(result.errors);
      focusFirstError(result.errors);
      return;
    }
    setErrors({});
    showToast({ message: isNew ? "Produto cadastrado" : "Produto salvo", action: ativo ? { label: "Ver na loja", href: `/produto/${result.slug}` } : undefined });
    if (isNew) router.push("/admin/produtos");
    else router.refresh();
  }

  async function handleDelete() {
    if (!initial.id) return;
    const result = await deleteProductAction(initial.id);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    showToast({ message: `“${nome}” excluído` });
    router.replace("/admin/produtos");
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errors.form && (
        <p data-field="form" tabIndex={-1} role="alert" className="m-0 rounded-md bg-white p-4 text-body font-bold text-error">
          {errors.form}
        </p>
      )}

      <FormSection title="Informações">
        <div data-field="nome">
          <TextField
            label="Nome"
            value={nome}
            maxLength={120}
            onChange={(e) => {
              setNome(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            error={errors.nome}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-field="slug">
            <TextField
              label="Endereço na loja"
              hint={`mimosdathaty.com.br/produto/${slug || "…"}`}
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              error={errors.slug}
            />
          </div>
          <div data-field="categoriaId">
            <SelectField label="Categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} error={errors.categoriaId}>
              <option value="">Escolha…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
        <div data-field="resumo">
          <TextArea
            label="Resumo"
            hint="Uma ou duas frases abaixo do título."
            rows={2}
            maxLength={300}
            counterFrom={250}
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            error={errors.resumo}
          />
        </div>
        <div data-field="descricao">
          <TextArea label="Descrição completa" rows={5} maxLength={5000} value={descricao} onChange={(e) => setDescricao(e.target.value)} error={errors.descricao} />
        </div>
        <div data-field="medidas">
          <TextArea label="Medidas e material" rows={3} maxLength={1000} value={medidas} onChange={(e) => setMedidas(e.target.value)} error={errors.medidas} />
        </div>
      </FormSection>

      <FormSection title="Fotos" description="A primeira é a capa. Descreva cada foto para quem usa leitor de tela.">
        <div data-field="fotos">
          <PhotoUploader pasta="produtos" value={fotos} onChange={setFotos} error={errors.fotos} />
        </div>
      </FormSection>

      <FormSection title="Preço e pedido" description="Deixe o preço vazio enquanto não estiver definido: a loja mostra “R$ [preço]”.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-field="precoBaseCentavos">
            <TextField label="Preço (R$)" inputMode="numeric" placeholder="0,00" value={precoBase} onChange={(e) => setPrecoBase(maskBRL(e.target.value))} error={errors.precoBaseCentavos} />
          </div>
          <div data-field="precoPixCentavos">
            <TextField label="Preço no Pix (R$)" inputMode="numeric" placeholder="0,00" value={precoPix} onChange={(e) => setPrecoPix(maskBRL(e.target.value))} error={errors.precoPixCentavos} />
          </div>
        </div>
        <Checkbox label="Mostrar “a partir de”" hint="Quando o preço muda com a quantidade ou as opções." checked={precoVaria} onChange={setPrecoVaria} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div data-field="pedidoMinimo">
            <TextField label="Pedido mínimo" type="number" min={1} inputMode="numeric" value={pedidoMinimo} onChange={(e) => setPedidoMinimo(e.target.value)} error={errors.pedidoMinimo} />
          </div>
          <div data-field="prazoProducaoDias">
            <TextField label="Produção (dias úteis)" type="number" min={0} inputMode="numeric" value={prazo} onChange={(e) => setPrazo(e.target.value)} error={errors.prazoProducaoDias} />
          </div>
          <div data-field="estoque">
            <TextField label="Estoque" hint="0 = esgotado" type="number" min={0} inputMode="numeric" value={estoque} onChange={(e) => setEstoque(e.target.value)} error={errors.estoque} />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Embalagem para o frete"
        description="Peso e medidas de uma unidade já embalada. O frete é calculado com eles a partir do CEP da loja; vazio usa 200 g e 16 × 11 × 2 cm."
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <div data-field="pesoGramas">
            <TextField label="Peso (g)" type="number" min={1} inputMode="numeric" value={peso} onChange={(e) => setPeso(e.target.value)} error={errors.pesoGramas} />
          </div>
          <div data-field="comprimentoCm">
            <TextField label="Comprimento (cm)" type="number" min={1} inputMode="numeric" value={comprimento} onChange={(e) => setComprimento(e.target.value)} error={errors.comprimentoCm} />
          </div>
          <div data-field="larguraCm">
            <TextField label="Largura (cm)" type="number" min={1} inputMode="numeric" value={largura} onChange={(e) => setLargura(e.target.value)} error={errors.larguraCm} />
          </div>
          <div data-field="alturaCm">
            <TextField label="Altura (cm)" type="number" min={1} inputMode="numeric" value={altura} onChange={(e) => setAltura(e.target.value)} error={errors.alturaCm} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Personalização">
        <div data-field="temas">
          <TagsInput
            label="Temas"
            itemLabel="tema"
            hint="Digite e clique em + (ou Enter). “Outro tema” entra sozinho no fim."
            placeholder="Ex.: Safari"
            value={temas}
            onChange={setTemas}
            error={errors.temas}
          />
        </div>
        <div data-field="cores" className="flex flex-col gap-2">
          <span className="text-sm font-bold">Cores da arte</span>
          {cores.map((cor, i) => (
            <div key={i} className="flex items-end gap-2">
              <label className="flex flex-col gap-1.5">
                <span className="sr-only">Cor {i + 1}</span>
                <input
                  type="color"
                  value={cor.hex}
                  onChange={(e) => setCores(cores.map((c, j) => (j === i ? { ...c, hex: e.target.value.toUpperCase() } : c)))}
                  className="h-12 w-14 cursor-pointer rounded-sm border border-border-input bg-white p-1"
                />
              </label>
              <TextField
                label={`Nome da cor ${i + 1}`}
                className="flex-1"
                value={cor.nome}
                maxLength={40}
                onChange={(e) => setCores(cores.map((c, j) => (j === i ? { ...c, nome: e.target.value } : c)))}
              />
              <button
                type="button"
                onClick={() => setCores(cores.filter((_, j) => j !== i))}
                aria-label={`Remover cor ${cor.nome || i + 1}`}
                className="min-h-12 cursor-pointer px-2 text-sm font-bold text-ink-muted underline hover:text-primary"
              >
                Remover
              </button>
            </div>
          ))}
          <Button type="button" variant="soft" size="field" className="self-start" onClick={() => setCores([...cores, { nome: "", hex: "#F3CBD6" }])}>
            Adicionar cor
          </Button>
          {errors.cores && <span className="text-sm font-bold text-error">{errors.cores}</span>}
        </div>
        <Checkbox label="Aceita imagem de referência" hint="Mostra o campo de upload na página do produto." checked={aceitaReferencia} onChange={setAceitaReferencia} />
      </FormSection>

      <FormSection title="Vitrine">
        <Checkbox label="Ativo" hint="Inativo some da loja, mas continua aqui no painel." checked={ativo} onChange={setAtivo} />
        <Checkbox label="Destaque na página inicial" hint="Entra na vitrine “Mais vendidos”." checked={destaque} onChange={setDestaque} />
        <div data-field="selos" className="flex flex-col gap-1">
          <span className="text-sm font-bold">Selo no card</span>
          <span className="text-sm text-ink-muted">O primeiro marcado aparece na foto. “Esgotado” é automático quando o estoque é 0.</span>
          {EDITABLE_BADGES.map((b) => (
            <Checkbox key={b.tipo} label={b.label} checked={hasBadge(b.tipo)} onChange={(on) => toggleBadge(b.tipo, on)} />
          ))}
          <Checkbox label="Data limite de encomenda" checked={Boolean(deadline)} onChange={(on) => toggleBadge("deadline", on)} />
          {deadline && (
            <TextField
              label="Texto do selo"
              placeholder="Encomenda até 10/12"
              maxLength={40}
              value={deadline.label ?? ""}
              onChange={(e) => setSelos(selos.map((s) => (s.tipo === "deadline" ? { ...s, label: e.target.value } : s)))}
            />
          )}
          {errors.selos && <span className="text-sm font-bold text-error">{errors.selos}</span>}
        </div>
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <Button type="submit" size="lg" loading={saving}>
          {isNew ? "Criar produto" : "Salvar alterações"}
        </Button>
        <Link href="/admin/produtos" className={buttonClasses({ variant: "text" })}>
          Voltar
        </Link>
        {!isNew && (
          <div className="ml-auto flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-sm font-bold text-error">Excluir de vez, com as fotos?</span>
                <Button type="button" variant="secondary" size="field" onClick={handleDelete}>
                  Confirmar exclusão
                </Button>
                <Button type="button" variant="text" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button type="button" variant="text" onClick={() => setConfirmDelete(true)}>
                Excluir produto
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
