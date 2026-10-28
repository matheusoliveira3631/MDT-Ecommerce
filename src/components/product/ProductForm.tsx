"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useRef, useState, type ReactNode } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ColorSwatches } from "@/components/ui/ColorSwatches";
import { FileDrop } from "@/components/ui/FileDrop";
import { BagIcon, ChatIcon, PencilIcon } from "@/components/ui/icons";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { TextArea, TextField } from "@/components/ui/TextField";
import { ThemeChips } from "@/components/ui/ThemeChips";
import { useToast } from "@/components/ui/ToastProvider";
import { calculateShippingMock } from "@/data/mock";
import { OTHER_THEME, type CartLine, type Personalizacao } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";
import { NotifyMeForm } from "./NotifyMeForm";
import { ShippingCalculator } from "./ShippingCalculator";

export interface ProductFormProps {
  product: Product;
  whatsapp: string;
  referenciaMaxMB: number | null;
}

interface Errors {
  temaOutro?: string;
  nome?: string;
}

function Legend({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <legend className="mb-3 p-0 font-heading text-[17px] font-bold">
      {children}
      {hint && <span className="font-body text-sm font-semibold text-ink-muted"> {hint}</span>}
    </legend>
  );
}

/**
 * Formulário de personalização. Com `?editar=<id da linha>` abre preenchido e salva
 * a linha da sacola em vez de adicionar outra.
 */
export function ProductForm(props: ProductFormProps) {
  // useSearchParams precisa de Suspense para a página continuar estática
  return (
    <Suspense fallback={<ProductFormFields {...props} />}>
      <EditAwareForm {...props} />
    </Suspense>
  );
}

function EditAwareForm(props: ProductFormProps) {
  const editId = useSearchParams().get("editar");
  const { lines } = useCart();
  const editLine = lines.find((l) => l.id === editId && l.produtoSlug === props.product.slug);
  // Remonta quando a linha aparece (a sacola é lida do navegador depois da hidratação)
  return <ProductFormFields key={editLine?.id ?? "novo"} {...props} editLine={editLine} />;
}

const optional = (value: FormDataEntryValue | null) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
};

function ProductFormFields({
  product,
  whatsapp,
  referenciaMaxMB,
  editLine,
}: ProductFormProps & { editLine?: CartLine }) {
  const router = useRouter();
  const { addLine, updateLine, openDrawer } = useCart();
  const initial = editLine?.personalizacao;
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const soldOut = !product.ativo || product.estoque <= 0;
  const temas = [...product.temas, OTHER_THEME];

  const [tema, setTema] = useState(initial?.tema ?? temas[0]);
  const [temaOutro, setTemaOutro] = useState(initial?.temaOutro ?? "");
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [cor, setCor] = useState(initial?.cor ?? product.cores[0]?.nome ?? "");
  const [quantidade, setQuantidade] = useState(editLine?.quantidade ?? product.pedidoMinimo);
  const [errors, setErrors] = useState<Errors>({});
  const showToast = useToast();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Errors = {};
    if (tema === OTHER_THEME && !temaOutro.trim()) next.temaOutro = "Conte qual é o tema da festa";
    if (!nome.trim()) next.nome = "Informe o nome que vai na arte";
    setErrors(next);

    // Foca o primeiro campo inválido, na ordem do formulário
    const firstInvalid = (["temaOutro", "nome"] as const).find((field) => next[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name=${firstInvalid}]`)?.focus();
      return;
    }

    const data = new FormData(e.currentTarget);
    const file = data.get("referencia");
    const personalizacao: Personalizacao = {
      tema,
      temaOutro: tema === OTHER_THEME ? temaOutro.trim() : undefined,
      nome: nome.trim(),
      idadeOcasiao: optional(data.get("idadeOcasiao")),
      cor,
      referenciaNome: file instanceof File && file.name ? file.name : initial?.referenciaNome,
      observacoes: optional(data.get("observacoes")),
    };

    if (editLine) {
      updateLine(editLine.id, { quantidade, personalizacao });
      router.push("/sacola");
      return;
    }

    addLine({ produtoSlug: product.slug, quantidade, personalizacao });
    // Desktop: sacola lateral. Mobile: toast com "Ver sacola".
    if (window.matchMedia("(min-width: 1024px)").matches) {
      openDrawer(e.nativeEvent instanceof SubmitEvent ? (e.nativeEvent.submitter as HTMLElement | null) : null);
    } else {
      showToast({ message: `Adicionado à sacola: ${product.nome}`, action: { label: "Ver sacola", href: "/sacola" } });
    }
  }

  const submitLabel = editLine ? "Salvar alterações" : "Adicionar à sacola";

  const unitPrice = formatPrice(product.precoBase);

  return (
    <>
      <form id={formId} ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        {product.temas.length > 0 && (
          <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
            <Legend>1. Tema da festa</Legend>
            <ThemeChips name="tema" options={temas} value={tema} onChange={setTema} />
            {tema === OTHER_THEME && (
              <TextField
                name="temaOutro"
                label="Qual tema?"
                placeholder="Ex.: Pequeno príncipe"
                value={temaOutro}
                onChange={(e) => setTemaOutro(e.target.value)}
                error={errors.temaOutro}
              />
            )}
          </fieldset>
        )}

        <fieldset className="m-0 border-0 p-0">
          <Legend>2. Nome e idade</Legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              name="nome"
              label="Nome na arte"
              placeholder="Ex.: Helena"
              maxLength={30}
              counterFrom={20}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              error={errors.nome}
            />
            <TextField
              name="idadeOcasiao"
              label="Idade ou ocasião (opcional)"
              placeholder="Ex.: 3 aninhos, Batizado"
              defaultValue={initial?.idadeOcasiao}
            />
          </div>
        </fieldset>

        {product.cores.length > 0 && (
          <fieldset className="m-0 border-0 p-0">
            <Legend hint={`· ${cor}`}>3. Cores da arte</Legend>
            <ColorSwatches name="cor" options={product.cores} value={cor} onChange={setCor} />
          </fieldset>
        )}

        {product.aceitaReferencia && (
          <fieldset className="m-0 border-0 p-0">
            <Legend hint="(opcional)">4. Referência</Legend>
            <FileDrop
              name="referencia"
              accept="image/jpeg,image/png"
              maxSizeMB={referenciaMaxMB}
              title="Envie uma imagem do convite ou da decoração"
              formats="JPG ou PNG"
            />
            {initial?.referenciaNome && (
              <p className="mt-2 mb-0 text-sm text-ink-muted">Referência atual: {initial.referenciaNome}</p>
            )}
          </fieldset>
        )}

        <TextArea
          name="observacoes"
          label="5. Observações"
          placeholder="Algum detalhe que não pode faltar?"
          rows={3}
          maxLength={500}
          counterFrom={400}
          labelClassName="font-heading text-[17px]"
          defaultValue={initial?.observacoes}
        />

        {!soldOut && (
          <div className="flex flex-wrap items-stretch gap-3">
            <QuantityStepper value={quantidade} onChange={setQuantidade} min={product.pedidoMinimo} size="lg" />
            <Button type="submit" size="lg" icon={<BagIcon size={20} strokeWidth={1.8} />} className="flex-[1_1_220px]">
              {submitLabel}
            </Button>
          </div>
        )}
      </form>

      {soldOut && <NotifyMeForm product={product} />}

      <a
        href={whatsappHref(whatsapp, `Olá! Tenho uma dúvida sobre o produto ${product.nome}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ variant: "secondary", fullWidth: true, className: "-mt-2.5" })}
      >
        <ChatIcon size={20} strokeWidth={1.8} />
        Tirar dúvidas no WhatsApp
      </a>

      <div className="flex flex-col gap-4 rounded-md border border-border px-[22px] py-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-primary">
            <PencilIcon />
          </span>
          <span className="text-sm leading-normal">
            <strong className="block text-body">Produção em {product.prazoProducaoDias} dias úteis</strong>
            <span className="text-ink-muted">contados a partir da aprovação da arte</span>
          </span>
        </div>
        <ShippingCalculator onCalculate={calculateShippingMock} />
      </div>

      {/* Barra fixa no mobile: o formulário é longo e o botão de compra fica fora da tela */}
      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-border bg-white px-4 py-3 shadow-drawer md:hidden">
          <span className="flex flex-col leading-tight">
            <strong className="font-heading text-lg font-extrabold">{unitPrice}</strong>
            <span className="text-xs text-ink-muted">por unidade</span>
          </span>
          <Button type="submit" form={formId} className="flex-1">
            {submitLabel}
          </Button>
        </div>
      )}

    </>
  );
}
