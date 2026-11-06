import path from "node:path";
import { expect, test } from "@playwright/test";
import { TEST_USERS } from "../../playwright.config";
import { addToCart, loginAs } from "./helpers";

const fixture = (name: string) => path.join(__dirname, "..", "fixtures", name);

test.describe("acesso ao painel", () => {
  test("sem login, /admin manda para o login e volta depois", async ({ page }) => {
    await page.goto("/admin/produtos");
    await expect(page).toHaveURL(/\/entrar\?voltar=%2Fadmin%2Fprodutos/);
    await page.getByLabel("E-mail").fill(TEST_USERS.admin.email);
    await page.getByLabel("Senha").fill(TEST_USERS.admin.senha);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin\/produtos$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Produtos");
  });

  test("senha errada mostra erro genérico", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(TEST_USERS.admin.email);
    await page.getByLabel("Senha").fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  });

  test("cliente logada não vê o painel nem consegue enviar arquivos", async ({ page, request }) => {
    await loginAs(page, TEST_USERS.cliente);
    await expect(page.getByRole("link", { name: "Abrir o painel" })).toHaveCount(0);
    const response = await page.goto("/admin/produtos");
    expect(response?.status()).toBe(404);

    const upload = await page.request.put("/arquivos/produtos/00000000-0000-0000-0000-000000000000.png", {
      headers: { "Content-Type": "image/png" },
      data: Buffer.from("x"),
    });
    expect(upload.status()).toBe(403);
    // Sem sessão nenhuma também
    expect((await request.put("/arquivos/produtos/00000000-0000-0000-0000-000000000000.png", { data: "x" })).status()).toBe(403);
  });
});

test("admin cadastra categoria e produto com fotos, e a loja mostra na hora", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  // Nomes únicos: execuções em paralelo não disputam o mesmo endereço
  const id = `${testInfo.workerIndex}${testInfo.repeatEachIndex}${Date.now().toString(36)}`;
  const categoria = `Festa Junina ${id}`;
  const categoriaSlug = `festa-junina-${id}`;
  const produto = `Bandeirinha Junina ${id}`;
  const produtoSlug = `bandeirinha-junina-${id}`;
  await loginAs(page, TEST_USERS.admin, "/admin/categorias");

  // Categoria com foto
  await page.getByRole("button", { name: "Nova categoria" }).click();
  await page.getByLabel("Nome", { exact: true }).fill(categoria);
  // Sem campo de endereço: calculado do nome
  await expect(page.getByText(`Endereço na loja: /categoria/${categoriaSlug}`)).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(fixture("foto-rosa.png"));
  await expect(page.getByRole("button", { name: "Remover foto 1" })).toBeVisible();
  await page.getByRole("button", { name: "Criar categoria" }).click();
  await expect(page.getByText(`/categoria/${categoriaSlug} · 0 produtos`)).toBeVisible();

  // Produto: validação primeiro
  await page.getByRole("link", { name: "Produtos" }).click();
  await page.getByRole("link", { name: "Novo produto" }).click();
  await page.getByRole("button", { name: "Criar produto" }).click();
  await expect(page.getByText("Informe o nome do produto.")).toBeVisible();
  await expect(page.getByLabel("Nome", { exact: true })).toBeFocused();

  await page.getByLabel("Nome", { exact: true }).fill(produto);
  await expect(page.getByText(`Endereço na loja: /produto/${produtoSlug}`)).toBeVisible();
  await page.getByLabel("Categoria").selectOption({ label: categoria });
  await page.getByLabel("Resumo").fill("Bandeirinhas personalizadas para a festa.");
  await page.getByLabel("Preço (R$)").fill("12,50");
  await page.getByLabel("Preço no Pix (R$)").fill("13,00");
  await page.getByLabel("Pedido mínimo").fill("10");
  await page.getByLabel("Estoque").fill("5");
  // Temas viram tags: botão "+" ou Enter; repetido é recusado; o × remove
  const temas = page.getByRole("list", { name: "Temas adicionados" });
  await page.getByLabel("Temas", { exact: true }).fill("Arraiá");
  await page.getByRole("button", { name: "Adicionar tema" }).click();
  await page.getByLabel("Temas", { exact: true }).fill("Caipira");
  await page.getByLabel("Temas", { exact: true }).press("Enter");
  await page.getByLabel("Temas", { exact: true }).fill("Fogueira");
  await page.getByRole("button", { name: "Adicionar tema" }).click();
  await page.getByLabel("Temas", { exact: true }).fill("arraiá");
  await page.getByLabel("Temas", { exact: true }).press("Enter");
  await expect(page.getByText("“arraiá” já está na lista.")).toBeVisible();
  await page.getByLabel("Temas", { exact: true }).fill("");
  await page.getByRole("button", { name: "Remover Fogueira" }).click();
  await expect(temas.getByRole("listitem")).toHaveText(["Arraiá×", "Caipira×"]);
  await page.getByRole("button", { name: "Adicionar cor" }).click();
  await page.getByLabel("Nome da cor 1").fill("Xadrez vermelho");
  await page.getByLabel("Ativo", { exact: true }).check();

  // Arquivo que não é imagem é recusado no navegador
  await page.locator('input[type="file"]').setInputFiles(fixture("nao-e-imagem.txt"));
  await expect(page.getByText("nao-e-imagem.txt: envie JPG, PNG ou WebP de até 8 MB.")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles([fixture("foto-rosa.png"), fixture("foto-lilas.png")]);
  await expect(page.getByLabel("Descrição da foto 2")).toBeVisible();
  await page.getByLabel("Descrição da foto 1").fill("Bandeirinha rosa");
  await page.getByLabel("Descrição da foto 2").fill("Bandeirinha lilás");
  // A lilás vira a capa
  await page.getByRole("button", { name: "Mover foto 2 para a esquerda" }).click();
  await expect(page.getByLabel("Descrição da foto 1")).toHaveValue("Bandeirinha lilás");

  await page.getByRole("button", { name: "Criar produto" }).click();
  await expect(page.getByText("O preço no Pix não pode ser maior que o preço normal.")).toBeVisible();
  // Máscara monetária: os dígitos entram pela direita
  await page.getByLabel("Preço no Pix (R$)").fill("");
  await page.getByLabel("Preço no Pix (R$)").pressSequentially("1190");
  await expect(page.getByLabel("Preço no Pix (R$)")).toHaveValue("11,90");
  await page.getByRole("button", { name: "Criar produto" }).click();
  // Cadastrar volta para a lista de produtos
  await expect(page).toHaveURL(/\/admin\/produtos$/);
  await expect(page.getByText("Produto cadastrado")).toBeVisible();
  await page.getByRole("link", { name: produto }).click();
  await expect(page).toHaveURL(/\/admin\/produtos\/\d+$/);
  await expect(temas.getByRole("listitem")).toHaveCount(2);
  const editUrl = page.url();

  // A loja mostra na hora, sem novo build
  await page.goto(`/categoria/${categoriaSlug}`);
  await expect(page.locator("main article")).toHaveCount(1);
  await expect(page.locator("main article")).toContainText("R$ 12,50");
  await page.goto(`/produto/${produtoSlug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(produto);
  await expect(page.getByText("Pedido mínimo: 10 unidades")).toBeVisible();
  await expect(page.getByText("R$ 11,90")).toBeVisible();
  await expect(page.getByRole("button", { name: /Ver foto/ })).toHaveCount(2);
  await expect(page.getByRole("img", { name: "Bandeirinha lilás" })).toBeVisible();
  await page.getByRole("button", { name: "Ver foto 2" }).click();
  await expect(page.getByRole("img", { name: "Bandeirinha rosa" })).toBeVisible();

  // Categoria com produto não pode ser excluída
  await page.goto("/admin/categorias");
  await page.getByRole("button", { name: `Excluir ${categoria}` }).click();
  await expect(page.getByText("Essa categoria tem 1 produto. Mude-os de categoria antes de excluir.")).toBeVisible();

  // Inativo some da loja
  await page.goto(editUrl);
  await page.getByLabel("Ativo", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Produto salvo")).toBeVisible();
  expect((await page.goto(`/produto/${produtoSlug}`))?.status()).toBe(404);

  // Excluir produto e categoria
  await page.goto(editUrl);
  await page.getByRole("button", { name: "Excluir produto" }).click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page).toHaveURL(/\/admin\/produtos$/);
  await expect(page.getByRole("link", { name: produto })).toHaveCount(0);
  await page.goto("/admin/categorias");
  await page.getByRole("button", { name: `Excluir ${categoria}` }).click();
  await expect(page.getByText(categoria, { exact: true })).toHaveCount(0);
});

test("admin troca a foto principal da página inicial", async ({ page }) => {
  test.setTimeout(60_000);
  await loginAs(page, TEST_USERS.admin, "/admin/loja");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Página inicial");
  const principal = page.locator("fieldset").filter({ hasText: "Foto principal" });
  await principal.locator('input[type="file"]').setInputFiles(fixture("foto-rosa.png"));
  await expect(page.getByLabel("Descrição da foto 1")).toBeVisible();
  await page.getByLabel("Descrição da foto 1").fill("Mesa de festa rosa com caixas milk");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Página inicial atualizada")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("img", { name: "Mesa de festa rosa com caixas milk" })).toBeVisible();
  await expect(page.getByText("Foto principal: mesa de festa com os produtos")).toHaveCount(0);

  // Sem foto, volta o espaço reservado
  await page.goto("/admin/loja");
  await principal.getByRole("button", { name: "Remover foto 1" }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Página inicial atualizada")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Foto principal: mesa de festa com os produtos")).toBeVisible();
});

test("coleções sazonais: o painel cria, ordena e desliga as faixas da página inicial", async ({ page }) => {
  test.setTimeout(60_000);
  await loginAs(page, TEST_USERS.admin, "/admin/loja");
  await expect(page.getByRole("heading", { name: "Coleções sazonais" })).toBeVisible();

  // Nova coleção de Páscoa, levando para Caixas milk, com foto
  await page.getByRole("button", { name: "Adicionar coleção" }).click();
  const pascoa = page.locator("fieldset").last();
  await pascoa.getByLabel("Destaque").fill("coleção de Páscoa");
  await pascoa.getByLabel("Título").fill("Páscoa doce para toda a família");
  await pascoa.getByLabel("Texto", { exact: true }).fill("Encomendas até 20/03.");
  await pascoa.getByLabel("Botão leva para a categoria").selectOption({ label: "Caixas milk" });
  await pascoa.locator('input[type="file"]').setInputFiles(fixture("foto-lilas.png"));
  await expect(pascoa.getByRole("button", { name: "Remover foto 1" })).toBeVisible();
  // A Páscoa sobe para o primeiro lugar e o Natal é desligado
  await page.getByRole("button", { name: "Subir Páscoa doce para toda a família" }).click();
  const natal = page.locator("fieldset").filter({ hasText: "Natal com mimos" });
  await natal.getByLabel("Ativa").uncheck();
  await page.getByRole("button", { name: "Salvar coleções" }).click();
  await expect(page.getByText("Coleções salvas")).toBeVisible();

  await page.goto("/");
  const faixa = page.getByRole("region", { name: "Páscoa doce para toda a família" });
  await expect(faixa).toContainText("coleção de Páscoa");
  await expect(faixa.getByRole("link", { name: "Conhecer a coleção" })).toHaveAttribute("href", "/categoria/caixas-milk");
  await expect(faixa.getByRole("img", { name: "Páscoa doce para toda a família" })).toBeVisible();
  await expect(page.getByText("Natal com mimos para presentear quem você ama")).toHaveCount(0);

  // Volta como estava: só o Natal, ativo
  await page.goto("/admin/loja");
  await page.getByRole("button", { name: "Remover Páscoa doce para toda a família" }).click();
  await page.locator("fieldset").filter({ hasText: "Natal com mimos" }).getByLabel("Ativa").check();
  await page.getByRole("button", { name: "Salvar coleções" }).click();
  await expect(page.getByText("Coleções salvas")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Natal com mimos para presentear quem você ama" })).toBeVisible();
});

test("cupom cadastrado no painel vale na sacola, com compra mínima e pausa", async ({ page, browser }, testInfo) => {
  test.setTimeout(60_000);
  const codigo = `BEMVINDA${testInfo.workerIndex}${testInfo.repeatEachIndex}${Date.now().toString(36).slice(-4)}`.toUpperCase();
  await loginAs(page, TEST_USERS.admin, "/admin/cupons");
  await page.getByRole("button", { name: "Novo cupom" }).click();
  await page.getByLabel("Código").fill(codigo);
  await page.getByLabel("Tipo de desconto").selectOption("fixo");
  await page.getByLabel("Desconto (R$)").pressSequentially("500");
  await page.getByLabel("Compra mínima (R$)").pressSequentially("20000");
  await page.getByRole("button", { name: "Criar cupom" }).click();
  await expect(page.getByText("Cupom criado")).toBeVisible();
  const item = page.getByRole("listitem").filter({ hasText: codigo });
  await expect(item).toContainText("R$ 5,00 de desconto");
  await expect(item).toContainText("compras a partir de R$ 200,00");

  // Na sacola (outra cliente): 20 × R$ 5,50 = R$ 110,00, abaixo do mínimo
  const clienteContext = await browser.newContext();
  const cliente = await clienteContext.newPage();
  await addToCart(cliente, "Bia");
  await cliente.goto("/sacola");
  await cliente.getByLabel("Cupom de desconto").fill(codigo.toLowerCase());
  await cliente.getByRole("button", { name: "Aplicar" }).click();
  await expect(cliente.getByText(/Este cupom vale para compras a partir de R\$\s200,00\./)).toBeVisible();

  // Sem compra mínima, o cupom entra
  await item.getByRole("button", { name: `Editar ${codigo}` }).click();
  await page.getByLabel("Compra mínima (R$)").fill("");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Cupom salvo")).toBeVisible();
  await cliente.getByRole("button", { name: "Aplicar" }).click();
  await expect(cliente.getByText(`Cupom ${codigo} aplicado`)).toBeVisible();

  // Pausado, para de valer na hora
  await page.getByRole("button", { name: `Editar ${codigo}` }).click();
  await page.getByLabel("Ativo").uncheck();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("listitem").filter({ hasText: codigo })).toContainText("Pausado");
  await cliente.getByLabel("Cupom de desconto").fill(codigo);
  await cliente.getByRole("button", { name: "Aplicar" }).click();
  await expect(cliente.getByText("Cupom inválido.")).toBeVisible();
  await clienteContext.close();

  // Nunca usado: pode excluir
  await page.getByRole("button", { name: `Excluir ${codigo}` }).click();
  await expect(page.getByRole("listitem").filter({ hasText: codigo })).toHaveCount(0);
});

test("promoções: preço de/por no produto e desconto progressivo com aviso na sacola", async ({ page, browser }) => {
  test.setTimeout(90_000);
  await loginAs(page, TEST_USERS.admin, "/admin/produtos");
  await page.getByRole("link", { name: "Topo de bolo em camadas" }).click();
  await page.getByLabel("Preço promocional (R$)").pressSequentially("3990");
  await expect(page.getByText("13% de desconto no selo.")).toBeVisible();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Produto salvo")).toBeVisible();

  // Faixa alta o bastante para não mexer nos outros testes; a sacola avisa quanto falta
  await page.goto("/admin/promocoes");
  await expect(page.getByRole("listitem").filter({ hasText: "Topo de bolo em camadas" })).toContainText("valendo");
  await page.getByLabel("Ativo").check();
  await page.getByRole("button", { name: "Adicionar faixa" }).click();
  await page.getByLabel("Faixa 1: compras a partir de (R$)").pressSequentially("500000");
  await page.getByLabel("Faixa 1: desconto (%)").fill("10");
  await page.getByRole("button", { name: "Salvar desconto progressivo" }).click();
  await expect(page.getByText("Desconto progressivo salvo")).toBeVisible();

  const clienteContext = await browser.newContext();
  const cliente = await clienteContext.newPage();
  await cliente.goto("/produto/topo-de-bolo-em-camadas");
  await expect(cliente.locator("main s").first()).toHaveText(/De\s*R\$\s45,90/);
  await expect(cliente.getByText("Promoção", { exact: true })).toBeVisible();
  await cliente.goto("/categoria/topos-de-bolo");
  await expect(cliente.locator("main article").first()).toContainText("-13%");

  await addToCart(cliente, "Lara");
  await cliente.goto("/sacola");
  await expect(cliente.getByRole("status").filter({ hasText: "Faltam" })).toContainText(/Faltam R\$\s4\.890,00 para ganhar 10% de desconto/);
  await clienteContext.close();

  // Volta como estava
  await page.goto("/admin/promocoes");
  await page.getByRole("button", { name: "Remover faixa 1" }).click();
  await page.getByLabel("Ativo").uncheck();
  await page.getByRole("button", { name: "Salvar desconto progressivo" }).click();
  await expect(page.getByText("Desconto progressivo salvo")).toBeVisible();
  await page.getByRole("link", { name: "Topo de bolo em camadas" }).click();
  await page.getByLabel("Preço promocional (R$)").fill("");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Produto salvo")).toBeVisible();
});
