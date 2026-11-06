"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveCartTiersAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { centsToInput, maskBRL, parseBRLToCents } from "@/lib/format";
import type { CartTier } from "@/lib/promo";
import { Checkbox, FormSection } from "./fields";

interface Row {
  minimo: string;
  percentual: string;
}

/** Desconto progressivo: "comprando a partir de R$ X, Y% no pedido", em até 5 faixas. */
export function CartTiersForm({ initial }: { initial: { ativo: boolean; faixas: CartTier[] } }) {
  const router = useRouter();
  const showToast = useToast();
  const [ativo, setAtivo] = useState(initial.ativo);
  const [faixas, setFaixas] = useState<Row[]>(
    initial.faixas.map((f) => ({ minimo: centsToInput(f.minimoCentavos), percentual: String(f.percentual) })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const update = (i: number, patch: Partial<Row>) => setFaixas((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const result = await saveCartTiersAction({
      ativo,
      faixas: faixas.map((f) => ({ minimoCentavos: parseBRLToCents(f.minimo) ?? 0, percentual: Number(f.percentual) || 0 })),
    });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    showToast({ message: "Desconto progressivo salvo" });
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormSection
        title="Desconto progressivo no carrinho"
        description="Automático, sem código: quanto maior a compra, maior o desconto. Não soma com cupom: a loja aplica sozinha o que der mais desconto. A sacola avisa quanto falta para a próxima faixa."
      >
        {(errors.form || errors.faixas) && (
          <p role="alert" className="m-0 text-body font-bold text-error">
            {errors.form ?? errors.faixas}
          </p>
        )}
        <Checkbox label="Ativo" hint="Desligado, as faixas ficam guardadas e a loja não aplica." checked={ativo} onChange={setAtivo} />
        {faixas.map((f, i) => (
          <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <TextField
              label={`Faixa ${i + 1}: compras a partir de (R$)`}
              inputMode="numeric"
              placeholder="0,00"
              value={f.minimo}
              onChange={(e) => update(i, { minimo: maskBRL(e.target.value) })}
              error={errors[`faixas.${i}.minimoCentavos`]}
            />
            <TextField
              label={`Faixa ${i + 1}: desconto (%)`}
              type="number"
              min={1}
              max={90}
              inputMode="numeric"
              value={f.percentual}
              onChange={(e) => update(i, { percentual: e.target.value })}
              error={errors[`faixas.${i}.percentual`]}
            />
            <Button type="button" variant="text" onClick={() => setFaixas(faixas.filter((_, j) => j !== i))} aria-label={`Remover faixa ${i + 1}`}>
              Remover
            </Button>
          </div>
        ))}
        {faixas.length < 5 && (
          <Button
            type="button"
            variant="soft"
            size="field"
            className="self-start"
            onClick={() => setFaixas([...faixas, { minimo: "", percentual: "" }])}
          >
            Adicionar faixa
          </Button>
        )}
      </FormSection>
      <Button type="submit" size="lg" loading={saving} className="self-start">
        Salvar desconto progressivo
      </Button>
    </form>
  );
}
