"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCouponAction, saveCouponAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { centsToInput, cn, formatPrice, maskBRL, parseBRLToCents } from "@/lib/format";
import type { AdminCoupon } from "@/server/admin-coupons";
import { Checkbox, SelectField } from "./fields";

const SITUACAO: Record<AdminCoupon["situacao"], { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-mint-100 text-mint-ink" },
  agendado: { label: "Agendado", className: "bg-lilac-100 text-lilac-ink" },
  expirado: { label: "Expirado", className: "bg-disabled-bg text-soldout-fg" },
  esgotado: { label: "Esgotado", className: "bg-disabled-bg text-soldout-fg" },
  pausado: { label: "Pausado", className: "bg-disabled-bg text-soldout-fg" },
};

const dateBR = (ymd: string) => ymd.split("-").reverse().join("/");

export function describeDiscount(c: Pick<AdminCoupon, "tipo" | "valor">) {
  return c.tipo === "percentual" ? `${c.valor}% de desconto` : `${formatPrice(c.valor / 100)} de desconto`;
}

function conditions(c: AdminCoupon): string[] {
  const out: string[] = [];
  if (c.pedidoMinimoCentavos) out.push(`compras a partir de ${formatPrice(c.pedidoMinimoCentavos / 100)}`);
  if (c.inicio && c.fim) out.push(`de ${dateBR(c.inicio)} a ${dateBR(c.fim)}`);
  else if (c.inicio) out.push(`a partir de ${dateBR(c.inicio)}`);
  else if (c.fim) out.push(`até ${dateBR(c.fim)}`);
  if (c.umaVezPorCliente) out.push("uma vez por cliente");
  return out;
}

function CouponForm({ initial, onDone }: { initial?: AdminCoupon; onDone: () => void }) {
  const router = useRouter();
  const showToast = useToast();
  const [codigo, setCodigo] = useState(initial?.codigo ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [tipo, setTipo] = useState<"percentual" | "fixo">(initial?.tipo ?? "percentual");
  const [percentual, setPercentual] = useState(initial?.tipo === "percentual" ? String(initial.valor) : "");
  const [fixo, setFixo] = useState(initial?.tipo === "fixo" ? centsToInput(initial.valor) : "");
  const [minimo, setMinimo] = useState(centsToInput(initial?.pedidoMinimoCentavos ?? null));
  const [inicio, setInicio] = useState(initial?.inicio ?? "");
  const [fim, setFim] = useState(initial?.fim ?? "");
  const [limite, setLimite] = useState(initial?.limiteUsos ? String(initial.limiteUsos) : "");
  const [umaVez, setUmaVez] = useState(initial?.umaVezPorCliente ?? false);
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const result = await saveCouponAction({
      id: initial?.id,
      codigo,
      descricao,
      tipo,
      valor: tipo === "percentual" ? Number(percentual) || 0 : (parseBRLToCents(fixo) ?? 0),
      pedidoMinimoCentavos: parseBRLToCents(minimo),
      inicio,
      fim,
      limiteUsos: limite ? Number(limite) : null,
      umaVezPorCliente: umaVez,
      ativo,
    });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    showToast({ message: initial ? "Cupom salvo" : "Cupom criado" });
    onDone();
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-white p-5 md:p-6">
      <h2 className="m-0 text-lg font-bold">{initial ? `Editar ${initial.codigo}` : "Novo cupom"}</h2>
      {errors.form && (
        <p role="alert" className="m-0 text-body font-bold text-error">
          {errors.form}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Código"
          hint="O que a cliente digita na sacola, ex.: BEMVINDA10."
          value={codigo}
          maxLength={30}
          autoCapitalize="characters"
          onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s/g, ""))}
          error={errors.codigo}
        />
        <TextField
          label="Anotação (opcional)"
          hint="Só aparece aqui no painel."
          value={descricao}
          maxLength={200}
          onChange={(e) => setDescricao(e.target.value)}
          error={errors.descricao}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="Tipo de desconto" value={tipo} onChange={(e) => setTipo(e.target.value as "percentual" | "fixo")}>
          <option value="percentual">Porcentagem (%)</option>
          <option value="fixo">Valor fixo (R$)</option>
        </SelectField>
        {tipo === "percentual" ? (
          <TextField
            label="Desconto (%)"
            type="number"
            min={1}
            max={100}
            inputMode="numeric"
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            error={errors.valor}
          />
        ) : (
          <TextField
            label="Desconto (R$)"
            inputMode="numeric"
            placeholder="0,00"
            value={fixo}
            onChange={(e) => setFixo(maskBRL(e.target.value))}
            error={errors.valor}
          />
        )}
        <TextField
          label="Compra mínima (R$)"
          hint="Vazio = qualquer valor."
          inputMode="numeric"
          placeholder="0,00"
          value={minimo}
          onChange={(e) => setMinimo(maskBRL(e.target.value))}
          error={errors.pedidoMinimoCentavos}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Válido a partir de" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} error={errors.inicio} />
        <TextField label="Válido até" type="date" value={fim} onChange={(e) => setFim(e.target.value)} error={errors.fim} />
        <TextField
          label="Limite de usos"
          hint="Total de pedidos. Vazio = sem limite."
          type="number"
          min={1}
          inputMode="numeric"
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
          error={errors.limiteUsos}
        />
      </div>
      <Checkbox label="Uma vez por cliente" hint="Conferido pelo CPF no fechamento do pedido." checked={umaVez} onChange={setUmaVez} />
      <Checkbox label="Ativo" hint="Pausado, o cupom para de valer na hora." checked={ativo} onChange={setAtivo} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          {initial ? "Salvar" : "Criar cupom"}
        </Button>
        <Button type="button" variant="text" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function CouponsManager({ cupons }: { cupons: AdminCoupon[] }) {
  const router = useRouter();
  const showToast = useToast();
  const [editing, setEditing] = useState<number | "novo" | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null);

  async function handleDelete(cupom: AdminCoupon) {
    const result = await deleteCouponAction(cupom.id);
    if (!result.ok) {
      setDeleteError({ id: cupom.id, message: Object.values(result.errors)[0] });
      return;
    }
    showToast({ message: `Cupom ${cupom.codigo} excluído` });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {editing === "novo" ? (
        <CouponForm onDone={() => setEditing(null)} />
      ) : (
        <Button className="self-start" onClick={() => setEditing("novo")}>
          Novo cupom
        </Button>
      )}

      {cupons.length === 0 && <p className="m-0 rounded-lg bg-white p-6 text-body text-ink-muted">Nenhum cupom ainda.</p>}

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {cupons.map((c) =>
          editing === c.id ? (
            <li key={c.id}>
              <CouponForm initial={c} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={c.id} className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="font-heading text-base tracking-wide">{c.codigo}</strong>
                  <span className={cn("rounded-pill px-2.5 py-1 text-xs font-extrabold", SITUACAO[c.situacao].className)}>
                    {SITUACAO[c.situacao].label}
                  </span>
                </div>
                <span className="block text-sm">
                  {describeDiscount(c)}
                  {conditions(c).length > 0 && <span className="text-ink-muted"> · {conditions(c).join(" · ")}</span>}
                </span>
                <span className="block text-sm text-ink-muted">
                  {c.usos} {c.usos === 1 ? "uso" : "usos"}
                  {c.limiteUsos ? ` de ${c.limiteUsos}` : ""}
                  {c.descricao ? ` · ${c.descricao}` : ""}
                </span>
                {deleteError?.id === c.id && (
                  <p role="alert" className="mt-1 mb-0 text-sm font-bold text-error">
                    {deleteError.message}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="text" onClick={() => setEditing(c.id)} aria-label={`Editar ${c.codigo}`}>
                  Editar
                </Button>
                <Button variant="text" onClick={() => handleDelete(c)} aria-label={`Excluir ${c.codigo}`}>
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
