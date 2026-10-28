import { expect, test } from "@playwright/test";
import { addToCart, asNewVisitor, cartLabel, fillIdentification, sendPaymentWebhook } from "./helpers";

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
