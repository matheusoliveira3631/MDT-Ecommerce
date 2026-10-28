"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/icons";
import { TextField } from "@/components/ui/TextField";
import { calculateShippingMock } from "@/data/mock";
import { UFS, type Address, type Customer } from "@/lib/checkout";
import { cn, formatPrice, isValidCpf, maskCep, maskCpf, maskPhone } from "@/lib/format";
import type { ShippingOption } from "@/lib/types";
import { useCheckout } from "./CheckoutProvider";

type Fields = Customer & Address;
type FieldName = keyof Fields | "frete";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (v: string) => v.replace(/\D/g, "");

/** Ordem do formulário: o foco vai para o primeiro campo com erro. */
const ORDER: FieldName[] = ["nome", "email", "cpf", "whatsapp", "cep", "rua", "numero", "bairro", "cidade", "uf", "frete"];

function validate(f: Fields, frete: ShippingOption | null): Partial<Record<FieldName, string>> {
  const e: Partial<Record<FieldName, string>> = {};
  if (!f.nome.trim()) e.nome = "Informe seu nome completo.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Informe um e-mail válido, ex.: maria@email.com.";
  if (!isValidCpf(f.cpf)) e.cpf = "CPF inválido. Confira os 11 números.";
  if (digits(f.whatsapp).length < 10) e.whatsapp = "Informe o WhatsApp com DDD.";
  if (digits(f.cep).length !== 8) e.cep = "CEP incompleto. Use 8 números, ex.: 37200-000.";
  if (!f.rua.trim()) e.rua = "Informe a rua.";
  if (!f.numero.trim()) e.numero = "Informe o número (ou “s/n”).";
  if (!f.bairro.trim()) e.bairro = "Informe o bairro.";
  if (!f.cidade.trim()) e.cidade = "Informe a cidade.";
  if (!f.uf) e.uf = "Escolha o estado.";
  if (!e.cep && !frete) e.frete = "Escolha uma opção de frete.";
  return e;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-4 rounded-lg border-0 bg-white p-6 md:p-7">
      <legend className="float-left mb-1 w-full p-0 font-heading text-[19px] font-bold">{title}</legend>
      {description && <p className="m-0 -mt-2 text-sm text-ink-muted">{description}</p>}
      {children}
    </fieldset>
  );
}

export function IdentificationForm({
  onShippingChange,
}: {
  /** Mantém o resumo ao lado em dia com o frete escolhido. */
  onShippingChange?: (option: ShippingOption | null) => void;
}) {
  const router = useRouter();
  const { cliente, endereco, frete: savedFrete, saveIdentification } = useCheckout();
  const formRef = useRef<HTMLFormElement>(null);
  const ufId = useId();

  const [f, setF] = useState<Fields>({
    nome: cliente?.nome ?? "",
    email: cliente?.email ?? "",
    cpf: cliente?.cpf ?? "",
    whatsapp: cliente?.whatsapp ?? "",
    cep: endereco?.cep ?? "",
    rua: endereco?.rua ?? "",
    numero: endereco?.numero ?? "",
    complemento: endereco?.complemento ?? "",
    bairro: endereco?.bairro ?? "",
    cidade: endereco?.cidade ?? "",
    uf: endereco?.uf ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [frete, setFrete] = useState<ShippingOption | null>(savedFrete);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string>();

  useEffect(() => {
    onShippingChange?.(frete);
  }, [frete, onShippingChange]);

  const set = (name: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((current) => ({ ...current, [name]: e.target.value }));

  // Calcula o frete quando o CEP do endereço fica completo
  const cepDigits = digits(f.cep);
  useEffect(() => {
    if (cepDigits.length !== 8) {
      setOptions(null);
      setFrete(null);
      setShippingError(undefined);
      return;
    }
    let cancelled = false;
    setLoadingShipping(true);
    calculateShippingMock(cepDigits).then((result) => {
      if (cancelled) return;
      setLoadingShipping(false);
      if (result.length === 0) {
        setShippingError("Não encontramos esse CEP.");
        setOptions(null);
        setFrete(null);
        return;
      }
      setShippingError(undefined);
      setOptions(result);
      setFrete((current) => result.find((o) => o.servico === current?.servico) ?? result[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [cepDigits]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = validate(f, frete);
    if (shippingError) next.cep = shippingError;
    setErrors(next);
    const firstInvalid = ORDER.find((name) => next[name]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name=${firstInvalid}]`)?.focus();
      return;
    }
    const { nome, email, cpf, whatsapp, ...address } = f;
    saveIdentification({
      cliente: { nome: nome.trim(), email: email.trim(), cpf, whatsapp },
      endereco: { ...address, complemento: address.complemento?.trim() || undefined },
      frete: frete!,
    });
    router.push("/checkout/pagamento");
  }

  const field = (name: keyof Fields) => ({ name, value: f[name] ?? "", onChange: set(name), error: errors[name] });

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5">
      <Section title="Seus dados">
        <TextField label="Nome completo" autoComplete="name" {...field("nome")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="E-mail" type="email" autoComplete="email" {...field("email")} />
          <TextField
            label="CPF"
            inputMode="numeric"
            placeholder="000.000.000-00"
            {...field("cpf")}
            onChange={(e) => setF((c) => ({ ...c, cpf: maskCpf(e.target.value) }))}
          />
        </div>
        <TextField
          label="WhatsApp"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="(00) 00000-0000"
          hint="Enviamos a arte por aqui para você aprovar antes da produção."
          {...field("whatsapp")}
          onChange={(e) => setF((c) => ({ ...c, whatsapp: maskPhone(e.target.value) }))}
        />
      </Section>

      <Section title="Endereço de entrega">
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <TextField
            label="CEP"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            {...field("cep")}
            error={errors.cep ?? shippingError}
            onChange={(e) => setF((c) => ({ ...c, cep: maskCep(e.target.value) }))}
          />
          <TextField label="Rua" autoComplete="address-line1" {...field("rua")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <TextField label="Número" inputMode="numeric" {...field("numero")} />
          <TextField label="Complemento (opcional)" autoComplete="address-line2" {...field("complemento")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
          <TextField label="Bairro" {...field("bairro")} />
          <TextField label="Cidade" autoComplete="address-level2" {...field("cidade")} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ufId} className="text-sm font-bold">
              Estado
            </label>
            <select
              id={ufId}
              name="uf"
              autoComplete="address-level1"
              value={f.uf}
              onChange={set("uf")}
              aria-invalid={errors.uf ? true : undefined}
              aria-describedby={errors.uf ? `${ufId}-error` : undefined}
              className={cn(
                "h-12 w-full cursor-pointer rounded-sm bg-white px-3 text-body text-ink outline-none",
                errors.uf ? "border-2 border-error" : "border border-border-input focus:border-2 focus:border-primary",
              )}
            >
              <option value="">UF</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
            {errors.uf && (
              <span id={`${ufId}-error`} className="text-sm font-bold text-error">
                {errors.uf}
              </span>
            )}
          </div>
        </div>
      </Section>

      <Section title="Frete" description="As opções aparecem quando o CEP estiver completo.">
        {loadingShipping && (
          <span role="status" className="flex items-center gap-2 text-sm text-ink-muted">
            <Spinner /> Calculando o frete…
          </span>
        )}
        {!loadingShipping && options && (
          <div role="radiogroup" aria-label="Opções de frete" className="flex flex-col gap-2">
            {options.map((option) => (
              <label
                key={option.servico}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 text-body",
                  frete?.servico === option.servico ? "border-primary bg-rose-50" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="frete"
                  checked={frete?.servico === option.servico}
                  onChange={() => setFrete(option)}
                  className="size-4 accent-primary"
                />
                <span className="flex-1">
                  <strong className="block">{option.servico}</strong>
                  <span className="text-sm text-ink-muted">{option.prazo} após a produção</span>
                </span>
                <strong>{formatPrice(option.valor, "R$ [valor]")}</strong>
              </label>
            ))}
          </div>
        )}
        {errors.frete && !options && <span className="text-sm font-bold text-error">{errors.frete}</span>}
      </Section>

      <Button type="submit" size="lg" fullWidth>
        Continuar para o pagamento
      </Button>
    </form>
  );
}
