# Mimos da Thaty · e-commerce

Next.js (App Router) + TypeScript + Tailwind CSS v4, a partir do handoff de design.

```bash
npm install
npm run dev   # http://localhost:3000/componentes
```

## Estrutura

- `src/app/globals.css`: tokens de design (`@theme`): cores, tipografia, espaçamento, raios, sombras e container.
- `src/app/fonts.ts`: Great Vibes, Quicksand e Nunito via `next/font` (`--font-script`, `--font-heading`, `--font-body`).
- `src/components/ui`: `Button`, `Badge`, `QuantityStepper`, `TextField`/`TextArea`, ícones.
- `src/components/layout`: `Header` (`full`/`checkout`), `Footer` (`full`/`compact`), `Logo`, `WhatsAppFab`.
- `src/components/product`: `ProductCard` (`default`/`compact`).
- `src/data/mock.ts`: dados mockados. Os valores entre colchetes (`[preço]`, `[X]`, CNPJ, contatos) são placeholders e devem vir dos dados da loja, do produto ou do CMS.
- `/componentes`: página para conferir os componentes.
