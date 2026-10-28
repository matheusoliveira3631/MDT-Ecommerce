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
- `src/components/cart`: sacola (`CartProvider` com `useCart`, `CartDrawer`, `CartLineItem`, `OrderSummary`, `CouponField`). Por enquanto a sacola fica no `localStorage` do navegador.
- `src/lib/cart.ts`: tipos do item (`CartLine`, `Personalizacao`) e cálculo de totais.
- `src/data/mock.ts`: dados mockados. Os valores entre colchetes (`[preço]`, `[X]`, CNPJ, contatos) são placeholders e devem vir dos dados da loja, do produto ou do CMS.
- `src/components/checkout`: identificação, pagamento e confirmação (`CheckoutProvider` guarda os dados na sessão do navegador).
- Rotas: `/`, `/categorias`, `/categoria/[slug]`, `/busca?q=`, `/produto/[slug]` (com `?editar=<id>` para editar um item da sacola), `/sacola`, `/checkout/identificacao`, `/checkout/pagamento`, `/checkout/confirmacao` e `/componentes` (vitrine dos componentes). Endereços inexistentes caem na 404.

## Ainda simulado

Os dados ficam em `src/data/mock.ts`, e as integrações são funções `*Mock` com a mesma assinatura que a versão real terá: frete (`calculateShippingMock`), cupom (`validateCouponMock`, aceita `MIMO10`) e pedido (`createOrderMock`). A sacola fica no `localStorage` e o checkout no `sessionStorage`. Os dados do cartão devem entrar pelos campos seguros do gateway escolhido, nunca por um formulário da loja.
