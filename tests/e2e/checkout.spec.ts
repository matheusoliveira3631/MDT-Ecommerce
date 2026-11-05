import path from "node:path";
import { expect, test } from "@playwright/test";
import { TEST_USERS } from "../../playwright.config";
import { addToCart, asNewVisitor, cartLabel, fillIdentification, loginAs, sendPaymentWebhook } from "./helpers";

test("sem itens, o checkout volta para a sacola", async ({ page }) => {
  await page.goto("/checkout/pagamento");
  await expect(page).toHaveURL(/\/sacola$/);
});

test("compra completa: identificação, pagamento e confirmação", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await asNewVisitor(page);
  await addToCart(page, "Helena");

  await page.goto("/checkout/pagamento");
  await expect(page).toHaveURL(/\/checkout\/identificacao$/);

  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await expect(page.getByLabel("Nome completo")).toBeFocused();

  await fillIdentification(page);
  await page.getByLabel("CPF").fill("52998224724");
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await expect(page.getByText("CPF inválido. Confira os 11 números.")).toBeVisible();
  await expect(page.getByLabel("CPF")).toBeFocused();
  await page.getByLabel("CPF").fill("52998224725");
  // 20 × R$ 5,50 + frete PAC simulado (R$ 25,90)
  await expect(page.locator("aside dl")).toContainText("R$ 25,90");
  await expect(page.locator("aside dl")).toContainText("R$ 135,90");
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();

  await expect(page).toHaveURL(/\/checkout\/pagamento$/);
  await expect(page.getByText("Rua das Flores, 10")).toBeVisible();
  await page.getByText("Cartão de crédito", { exact: true }).click();
  await expect(page.getByText("Campos seguros do cartão")).toBeVisible();
  await page.getByText("Pix", { exact: true }).click();

  await page.getByRole("button", { name: "Finalizar pedido" }).click();
  await expect(page.getByText("Para continuar, confirme que leu a política de trocas.")).toBeVisible();
  await page.getByLabel(/Li e concordo/).check();
  await page.getByRole("button", { name: "Finalizar pedido" }).click();

  await expect(page).toHaveURL(/\/checkout\/confirmacao\?pedido=MT\d{5}&token=/);
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(/^Pedido MT\d{5} recebido$/);
  const numero = (await heading.textContent())!.match(/MT\d{5}/)![0];
  // Pix: 20 × R$ 5,00 (preço do Pix) + frete R$ 25,90, calculado no servidor
  await expect(page.getByText("Pague R$ 125,90")).toBeVisible();
  await expect(page.locator("[aria-current=step]")).toContainText("Pedido recebido");
  await page.getByRole("button", { name: "Copiar" }).click();
  await expect(page.getByText("Código copiado")).toBeVisible();

  // Sem o token, ninguém vê o pedido
  expect((await page.request.get(`/checkout/confirmacao?pedido=${numero}`)).status()).toBe(404);
  expect((await page.request.get(`/checkout/confirmacao?pedido=${numero}&token=errado`)).status()).toBe(404);

  // Webhook do gateway: assinatura inválida é recusada; a válida confirma o pagamento
  expect((await sendPaymentWebhook(page.request, numero, "aprovado", "00")).status()).toBe(401);
  expect((await sendPaymentWebhook(page.request, numero, "aprovado")).status()).toBe(200);

  await page.reload();
  await expect(heading).toHaveText(/^Pedido MT\d{5} recebido$/);
  await expect(page.locator("[aria-current=step]")).toContainText("Pagamento confirmado");
  await expect(page.getByText("Pagamento confirmado. Obrigada!")).toBeVisible();

  await page.goto("/");
  await expect(cartLabel(page)).toHaveAttribute("aria-label", "Sacola vazia");
});

test("Mococa e região podem retirar sem custo", async ({ page }) => {
  await page.goto("/produto/caixa-milk-personalizada");
  await page.getByLabel("Calcular frete").fill("13732000");
  await page.getByRole("button", { name: "Calcular" }).click();
  const retirada = page.locator("label").filter({ hasText: "Retirada em Mococa/SP" });
  await expect(retirada).toContainText("Grátis");
  // Fora da região, só as transportadoras
  await page.getByLabel("Calcular frete").fill("37200000");
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByText("SEDEX")).toBeVisible();
  await expect(page.getByText("Retirada em Mococa/SP")).toHaveCount(0);
});

test("a imagem de referência vai com o pedido e só quem tem o link do pedido vê", async ({ page, browser }) => {
  test.setTimeout(90_000);
  await asNewVisitor(page);
  await page.goto("/produto/caixa-milk-personalizada");
  await page.getByLabel("Nome na arte").fill("Lis");
  await page.locator('input[name="referencia"]').setInputFiles(path.join(__dirname, "..", "fixtures", "foto-lilas.png"));
  await expect(page.getByText("Imagem enviada ✓")).toBeVisible();
  await page.locator("form").getByRole("button", { name: "Adicionar à sacola" }).click();
  await page.keyboard.press("Escape");

  await page.goto("/checkout/identificacao");
  await fillIdentification(page);
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await page.getByText("Pix", { exact: true }).click();
  await page.getByLabel(/Li e concordo/).check();
  await page.getByRole("button", { name: "Finalizar pedido" }).click();
  await expect(page).toHaveURL(/\/checkout\/confirmacao\?pedido=MT\d{5}&token=/);
  const numero = (await page.getByRole("heading", { level: 1 }).textContent())!.match(/MT\d{5}/)![0];

  const link = page.getByRole("link", { name: /Sua referência/ });
  await expect(link).toContainText("foto-lilas.png");
  const src = (await link.locator("img").getAttribute("src"))!;
  expect((await page.request.get(src)).status()).toBe(200);
  // Sem a assinatura (ou com ela adulterada), a imagem não abre
  const semAssinatura = src.split("?")[0];
  expect((await page.request.get(semAssinatura)).status()).toBe(404);
  expect((await page.request.get(src.replace(/sig=[^&]+/, "sig=abc"))).status()).toBe(404);
  // Nem dá para enviar arquivo para a pasta das referências sem o link de envio
  expect((await page.request.put(semAssinatura, { headers: { "Content-Type": "image/png" }, data: Buffer.from("x") })).status()).toBe(403);

  // No painel, a referência aparece no pedido
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await loginAs(admin, TEST_USERS.admin, `/admin/pedidos/${numero}`);
  await expect(admin.getByRole("img", { name: "Referência enviada pela cliente: foto-lilas.png" })).toBeVisible();
  await adminContext.close();
});
