# Mimos da Thaty · e-commerce

Next.js (App Router) + TypeScript + Tailwind CSS v4. Catálogo em SQLite (Drizzle), fotos no S3 e painel admin com login.

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

- `tests/unit`: formatação, preço digitado, slug, máscaras e CPF, totais (centavos, Pix, cupom), busca, ordenação o fechamento do pedido no servidor (banco em memória: preço do banco, estoque, idempotência, falha do gateway, webhook) e as regras de status do painel.
- `tests/e2e`: navegação, produto, sacola, checkout, favoritos, mobile (390px), painel admin (acesso, cadastro com fotos, exclusão, pedidos do pagamento ao envio e cancelamento) e acessibilidade (axe, WCAG 2.1 AA). Os testes usam um banco próprio em `data/test`, com um admin e uma cliente de teste; cada compra simula um IP diferente, por causa do limite de pedidos por IP.

## Implantação no EC2

Pensado para um único servidor: SQLite no disco da instância, fotos no S3 e backup contínuo do banco no S3 com o Litestream. Os arquivos de configuração estão em `deploy/` (troque `SEU-BUCKET`, a região e o domínio).

### 1. AWS

1. **Bucket S3** (mesma região da instância). Em "Bloquear acesso público", desmarque só as opções de *políticas de bucket*, para a política abaixo valer.
2. **Política do bucket**: `deploy/s3-bucket-policy.json` (leitura pública só de `produtos/`, `categorias/` e `loja/`; os backups em `backups/` continuam privados).
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

Para conferir o S3 (credencial, permissão de gravar, leitura pública e CORS), rode `npm run s3:testar` em `/srv/mimos`: ele envia uma imagem de teste, apaga em seguida e diz o que falta em cada etapa.

### 3. Backup do banco (Litestream)

Instale o Litestream (pacote `.deb` em https://litestream.io/install/), copie `deploy/litestream.yml` para `/etc/litestream.yml` e `deploy/litestream.service` para `/etc/systemd/system/`, e rode `sudo systemctl enable --now litestream`.

Para restaurar num servidor novo, antes de subir o app: `litestream restore -config /etc/litestream.yml /srv/mimos/data/loja.db`.

### 4. Atualizações

Automáticas: cada push na `main` roda o workflow `.github/workflows/deploy.yml`, que confere tipos e lint, entra no servidor por SSH, atualiza o código, gera o build, reinicia a loja e confere se ela respondeu. Usa os segredos `EC2_HOST`, `EC2_USER` e `EC2_PRIVATE_KEY` do repositório. Também dá para rodar à mão em Actions → Deploy → Run workflow.

À mão, no servidor:

```bash
cd /srv/mimos && git pull && npm ci && npm run build && sudo systemctl restart mimos
```

As migrações novas rodam sozinhas quando o app sobe.

## Pedido e pagamento

O navegador manda só intenções (produtos, quantidades, personalização, endereço, serviço de frete, cupom e forma de pagamento). O servidor (`src/server/orders.ts`, chamado por `src/app/checkout/actions.ts`):

1. confere cada produto no banco (ativo, preço cadastrado, pedido mínimo, tema e cor válidos, estoque);
2. recalcula frete e cupom e calcula o total em centavos com a mesma função da sacola (`src/lib/pricing.ts`);
3. grava o pedido, com cópia de nome e preço de cada item, e reserva o estoque numa transação;
4. cria a cobrança no gateway com o valor calculado aqui. Se a cobrança falhar, o pedido é cancelado e o estoque volta.

Uma chave de idempotência por tentativa evita pedido duplicado (duplo clique, rede instável). A confirmação (`/checkout/confirmacao?pedido=…&token=…`) é montada no servidor e exige o token do pedido. O gateway avisa o resultado em `POST /api/pagamentos/webhook`, assinado com `PAGAMENTO_WEBHOOK_SECRET`; aprovado libera a arte, recusado ou expirado cancela e devolve o estoque (uma vez só).

### No painel (`/admin/pedidos`)

Lista com filtro por status, busca por número, nome ou e-mail e um contador de pedidos pagos esperando arte no menu. No detalhe ficam os itens com toda a personalização, o contato da cliente (botão que abre o WhatsApp dela já com o número do pedido), a entrega e o histórico de quem mudou o quê.

- O status só avança depois do pagamento confirmado: Pagamento confirmado → Arte enviada → Arte aprovada → Em produção → Enviado (com código de rastreio, que aparece para a cliente). Se marcar errado, é só escolher o status certo.
- Cancelar pede um motivo e devolve o estoque. Se o pagamento já tinha sido aprovado, o reembolso é feito no gateway; se ele chegar depois do cancelamento, o pedido continua cancelado e o histórico avisa para reembolsar.
- A cliente logada vê os pedidos dela em `/conta`.

### Frete

Sai sempre do CEP da loja (`CEP_ORIGEM`, 13732-000). Com `MELHOR_ENVIO_TOKEN` no `.env.production`, a cotação é real no Melhor Envio (Correios, Jadlog e outras), com o peso e as medidas de uma unidade embalada que você informa em cada produto no painel (vazio usa 200 g e 16 × 11 × 2 cm). A mesma cotação vale por 10 minutos, então a sacola, o checkout e o pedido mostram o mesmo valor. Para gerar o token: no Melhor Envio, Configurações → Permissões de acesso → Gerar novo token, marcando o cálculo de frete.

Sem token, o frete vem de `FRETE_SIMULADO`. Nesse caso, o pedido só fecha com essa variável definida e com produtos que tenham preço: o servidor não cobra valor indefinido.

## Estrutura

- `src/server/db`: schema, conexão (aplica as migrações) e o catálogo inicial (`seed.ts`).
- `src/server/catalog.ts`: leitura do catálogo para a loja. Ler daqui torna a página dinâmica, então o que o admin salva aparece na hora, sem novo build.
- `src/server/admin-catalog.ts`: escrita do catálogo, com validação (zod).
- `src/server/auth.ts`: login, sessão (cookie httpOnly; no banco só o SHA-256 do token) e `requireAdmin`/`requireAdminPage`.
- `src/server/storage.ts`: fotos no S3 (URL pré-assinada) ou numa pasta local, servida por `/arquivos/...`.
- `src/server/admin-orders.ts`: pedidos no painel (lista, detalhe, regras de status e cancelamento).
- `src/server/shipping.ts` e `melhor-envio.ts`: cotação de frete.
- `src/server/settings.ts`: ajustes da loja editáveis no painel (foto principal da página inicial).
- `src/app/admin`: painel (pedidos, produtos, categorias e página inicial). Toda gravação passa por `requireAdmin()` nas Server Actions de `src/app/admin/actions.ts`.
- `src/app/api/produtos`: `GET /api/produtos?slugs=a,b`, dados públicos para sacola, checkout e favoritos (hook `useProducts`).
- `src/app/globals.css`: tokens de design (`@theme`); `src/app/fonts.ts`: Great Vibes, Quicksand e Nunito via `next/font`.
- `src/components`: `ui` (botões, campos, toast, gaveta), `layout`, `product`, `cart`, `checkout`, `favorites`, `admin`.
- `src/data/mock.ts`: configuração da loja e integrações ainda simuladas. Valores entre colchetes (`[X]`, CNPJ, contatos) são placeholders.
- `src/data/content.ts`: textos das páginas de ajuda e legais (as legais pedem revisão jurídica).

## Ainda simulado

Frete sem `MELHOR_ENVIO_TOKEN` (`FRETE_SIMULADO`), cupons (`src/server/coupons.ts`, de `CUPONS_SIMULADOS`), gateway de pagamento (`src/server/payments.ts`: Pix e boleto com dados de exemplo; o formato do webhook precisa ser adaptado ao gateway escolhido), newsletter e "Avise-me". A sacola fica no `localStorage` e os dados do checkout no `sessionStorage`; o pedido em si fica no banco. Pedidos não pagos não expiram sozinhos (falta um agendamento que cancele os vencidos e devolva o estoque). Os dados do cartão devem entrar pelos campos seguros do gateway escolhido, nunca por um formulário da loja. Fotos enviadas no painel e descartadas antes de salvar ficam no armazenamento (falta uma limpeza periódica).
