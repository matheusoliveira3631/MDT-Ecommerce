import path from "node:path";
import { expect, test } from "@playwright/test";
import { TEST_USERS } from "../../playwright.config";
import { loginAs } from "./helpers";

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
  await expect(page.getByLabel("Endereço")).toHaveValue(categoriaSlug);
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
  await expect(page.getByLabel("Endereço na loja")).toHaveValue(produtoSlug);
  await page.getByLabel("Categoria").selectOption({ label: categoria });
  await page.getByLabel("Resumo").fill("Bandeirinhas personalizadas para a festa.");
  await page.getByLabel("Preço (R$)").fill("12,50");
  await page.getByLabel("Preço no Pix (R$)").fill("13,00");
  await page.getByLabel("Pedido mínimo").fill("10");
  await page.getByLabel("Estoque").fill("5");
  await page.getByLabel("Temas").fill("Arraiá\nCaipira");
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
  await page.getByLabel("Preço no Pix (R$)").fill("11,90");
  await page.getByRole("button", { name: "Criar produto" }).click();
  await expect(page).toHaveURL(/\/admin\/produtos\/\d+$/);
  await expect(page.getByText("Produto salvo")).toBeVisible();
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
