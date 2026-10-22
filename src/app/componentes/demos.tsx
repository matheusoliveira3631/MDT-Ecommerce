"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { TextArea, TextField } from "@/components/ui/TextField";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

export function LoadingButtonDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      loading={loading}
      onClick={() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
      }}
    >
      {loading ? "Calculando" : "Clique para carregar"}
    </Button>
  );
}

export function StepperDemo({ min, size, label }: { min: number; size: "md" | "lg"; label: string }) {
  const [value, setValue] = useState(min);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold">{label}</span>
      <QuantityStepper value={value} onChange={setValue} min={min} size={size} />
    </div>
  );
}

export function FieldsDemo() {
  const [nome, setNome] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const nomeError = submitted && !nome.trim() ? "Informe o nome que vai na arte" : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Padrão" placeholder="Ex.: Helena" />
      <TextField label="Com dica" hint="Aparece na arte exatamente como escrito." placeholder="Ex.: 3 aninhos" />
      <TextField
        label="Com erro"
        defaultValue="1234"
        inputMode="numeric"
        error="CEP incompleto. Use 8 números, ex.: 37200-000."
        className="sm:col-span-2"
      />
      <form
        className="flex flex-col gap-3 sm:col-span-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (!nome.trim()) e.currentTarget.querySelector<HTMLInputElement>("input")?.focus();
        }}
      >
        <TextField
          label="Nome na arte"
          maxLength={30}
          counterFrom={20}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={nomeError}
          placeholder="Ex.: Helena"
          hint="Até 30 caracteres. O contador aparece a partir de 20."
        />
        <Button type="submit" variant="soft" className="self-start">
          Validar campo
        </Button>
      </form>
      <TextArea
        label="Observações"
        maxLength={500}
        counterFrom={400}
        placeholder="Conte detalhes do tema, referências de cores…"
        className="sm:col-span-2"
      />
    </div>
  );
}

export function ProductGridDemo({ products }: { products: Product[] }) {
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-grid">
        {products.map((p, i) => (
          <ProductCard
            key={p.slug}
            product={p}
            priority={i < 2}
            onFavorite={(product, fav) => setSaved(fav ? `${product.nome} salvo nos favoritos` : null)}
          />
        ))}
      </div>
      <p role="status" className="m-0 min-h-6 text-sm text-ink-muted">
        {saved}
      </p>
    </div>
  );
}
