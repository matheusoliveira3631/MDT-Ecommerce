# Mimos da Thaty · e-commerce

Next.js (App Router) + TypeScript + Tailwind CSS v4, a partir do handoff de design. Catálogo em SQLite (Drizzle), fotos no S3 e painel admin com login.

## Rodando localmente

```bash
npm install
cp .env.example .env.local        # sem S3_BUCKET, as fotos ficam em ./data/uploads
npm run db:seed                   # cria o banco e importa o catálogo inicial
npm run admin:criar -- voce@email.com "Seu Nome"   # pede a senha no terminal
npm run dev                       # http://localhost:3000  (painel em /admin)
```

As migrações do banco rodam sozinhas na primeira conexão. Ao mudar `src/server/db/schema.ts`, gere uma nova com `npm run db:generate` e faça commit da pasta `drizzle/`.

## Testes

```bash
npx playwright install chromium   # só na primeira vez, numa máquina nova
npm test                          # recria o banco de testes, gera o build, sobe o servidor e roda tudo
npm run test:unit                 # só os testes unitários
```

- `tests/unit`: formatação, preço digitado, slug, máscaras e CPF, totais da sacola, busca e ordenação.
- `tests/e2e`: navegação, produto, sacola, checkout, favoritos, mobile (390px), painel admin (acesso, cadastro com fotos, exclusão) e acessibilidade (axe, WCAG 2.1 AA). Os testes usam um banco próprio em `data/test`, com um admin e uma cliente de teste.

## Implantação no EC2

Pensado para um único servidor: SQLite no disco da instância, fotos no S3 e backup contínuo do banco no S3 com o Litestream. Os arquivos de configuração estão em `deploy/` (troque `SEU-BUCKET`, a região e o domínio).

### 1. AWS

1. **Bucket S3** (mesma região da instância). Em "Bloquear acesso público", desmarque só as opções de *políticas de bucket*, para a política abaixo valer.
2. **Política do bucket**: `deploy/s3-bucket-policy.json` (leitura pública só de `produtos/` e `categorias/`; os backups em `backups/` continuam privados).
3. **CORS do bucket**: `deploy/s3-cors.json` (o navegador do admin envia as fotos direto para o S3).
4. **Papel IAM da instância** com `deploy/iam-policy.json`. O app e o Litestream usam esse papel: nenhuma chave de acesso fica no servidor.
5. **Security group**: libere só 80 e 443 (e 22 para você). A porta 3000 fica fechada; o Nginx fala com o app por dentro.

### 2. Servidor (Ubuntu)

```bash
# Node 22, Nginx e certbot
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx build-essential

sudo mkdir -p /srv/mimos && sudo chown ubuntu: /srv/mimos
git clone <repositório> /srv/mimos && cd /srv/mimos
cp .env.example .env.production   # preencha NEXT_PUBLIC_SITE_URL, DATABASE_PATH=/srv/mimos/data/loja.db, S3_BUCKET e S3_REGION
npm ci
npm run build                     # o S3 precisa estar no .env.production já no build (libera as fotos no next/image)
npm run db:seed                   # só na primeira vez
npm run admin:criar -- thaty@email.com "Thaty"

sudo cp deploy/mimos.service /etc/systemd/system/
sudo systemctl enable --now mimos

sudo cp deploy/nginx.conf /etc/nginx/sites-available/mimos
sudo ln -s /etc/nginx/sites-available/mimos /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br   # HTTPS (o cookie de sessão exige)
```

### 3. Backup do banco (Litestream)

Instale o Litestream (pacote `.deb` em https://litestream.io/install/), copie `deploy/litestream.yml` para `/etc/litestream.yml` e `deploy/litestream.service` para `/etc/systemd/system/`, e rode `sudo systemctl enable --now litestream`.

Para restaurar num servidor novo, antes de subir o app: `litestream restore -config /etc/litestream.yml /srv/mimos/data/loja.db`.

### 4. Atualizações

```bash
cd /srv/mimos && git pull && npm ci && npm run build && sudo systemctl restart mimos
```

As migrações novas rodam sozinhas quando o app sobe.

## Estrutura

- `src/server/db`: schema, conexão (aplica as migrações) e o catálogo inicial (`seed.ts`).
- `src/server/catalog.ts`: leitura do catálogo para a loja. Ler daqui torna a página dinâmica, então o que o admin salva aparece na hora, sem novo build.
- `src/server/admin-catalog.ts`: escrita do catálogo, com validação (zod).
- `src/server/auth.ts`: login, sessão (cookie httpOnly; no banco só o SHA-256 do token) e `requireAdmin`/`requireAdminPage`.
- `src/server/storage.ts`: fotos no S3 (URL pré-assinada) ou numa pasta local, servida por `/arquivos/...`.
- `src/app/admin`: painel (produtos e categorias). Toda gravação passa por `requireAdmin()` nas Server Actions de `src/app/admin/actions.ts`.
- `src/app/api/produtos`: `GET /api/produtos?slugs=a,b`, dados públicos para sacola, checkout e favoritos (hook `useProducts`).
- `src/app/globals.css`: tokens de design (`@theme`); `src/app/fonts.ts`: Great Vibes, Quicksand e Nunito via `next/font`.
- `src/components`: `ui` (botões, campos, toast, gaveta), `layout`, `product`, `cart`, `checkout`, `favorites`, `admin`.
- `src/data/mock.ts`: configuração da loja e integrações ainda simuladas. Valores entre colchetes (`[X]`, CNPJ, contatos) são placeholders.
- `src/data/content.ts`: textos das páginas de ajuda e legais (as legais pedem revisão jurídica).

## Ainda simulado

Frete (`calculateShippingMock`), cupom (`validateCouponMock`, aceita `MIMO10`), pedido (`createOrderMock`), newsletter e "Avise-me". A sacola fica no `localStorage` e o checkout no `sessionStorage`; o pedido real precisa recalcular os preços no servidor. Os dados do cartão devem entrar pelos campos seguros do gateway escolhido, nunca por um formulário da loja. Fotos enviadas no painel e descartadas antes de salvar ficam no armazenamento (falta uma limpeza periódica).
