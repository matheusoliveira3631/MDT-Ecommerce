import { expect, test } from "@playwright/test";

test("página inicial mostra as seções principais", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cada detalhe da sua festa");
  await expect(page.getByRole("heading", { name: "Mais vendidos" })).toBeVisible();
  await expect(page.locator("#mais-vendidos article")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "Como funciona a personalização" })).toBeVisible();
});

test("endereço inexistente mostra a 404 com busca", async ({ page }) => {
  const response = await page.goto("/pagina-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Essa página se perdeu no meio dos papéis");
  await page.locator("#busca-destaque").fill("topo");
  await page.locator("#busca-destaque").press("Enter");
  await expect(page).toHaveURL(/\/busca\?q=topo/);
  await expect(page.locator("main article")).toHaveCount(1);
});

test("categoria lista os produtos dela; categoria inexistente dá 404", async ({ page }) => {
  await page.goto("/categoria/caixas-milk");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Caixas milk");
  await expect(page.locator("main article")).toHaveCount(1);
  expect((await page.goto("/categoria/nao-existe"))?.status()).toBe(404);
});

test("busca ignora acentos e ordena pela URL", async ({ page }) => {
  await page.goto("/busca?q=CAFE");
  await expect(page.locator("main article")).toHaveCount(1);
  await expect(page.locator("main article")).toContainText("Cesta de café da manhã");

  await page.goto("/busca?q=");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Todos os produtos");
  await page.getByLabel("Ordenar por").selectOption("novidades");
  await expect(page).toHaveURL(/ordem=novidades/);
  await expect(page.locator("main article").first()).toContainText("Kit festa na caixa");
  await expect(page.locator("main article").last()).toContainText("Tubete personalizado");
});

test("busca sem resultado reaproveita a 404 e mantém o termo", async ({ page }) => {
  await page.goto("/busca?q=unicornio%20azul");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nada encontrado para “unicornio azul”");
  await expect(page.locator("#busca-destaque")).toHaveValue("unicornio azul");
  await expect(page.locator("#busca-header")).toHaveValue("unicornio azul");
});

test("páginas de ajuda e legais", async ({ page }) => {
  for (const [path, title] of [
    ["/ajuda", "Como podemos ajudar?"],
    ["/ajuda/trocas", "Trocas e cancelamentos"],
    ["/privacidade", "Política de privacidade"],
    ["/termos", "Termos de uso"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  }
  await page.goto("/ajuda/perguntas-frequentes");
  const second = page.locator("details").nth(1);
  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
  expect((await page.goto("/ajuda/nao-existe"))?.status()).toBe(404);
});

test("SEO: robots, sitemap e dados estruturados do produto", async ({ page, request }) => {
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /checkout/");
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/produto/caixa-milk-personalizada");
  await page.goto("/produto/caixa-milk-personalizada");
  const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "[]");
  expect(jsonLd[0]["@type"]).toBe("Product");
  // O banco de testes tem preços: a oferta entra com o valor em reais
  expect(jsonLd[0].offers).toMatchObject({ priceCurrency: "BRL", price: "5.50" });
});
