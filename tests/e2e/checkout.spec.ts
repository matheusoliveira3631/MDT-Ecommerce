import { expect, test } from "@playwright/test";
import { addToCart, cartLabel, fillIdentification } from "./helpers";

test("sem itens, o checkout volta para a sacola", async ({ page }) => {
  await page.goto("/checkout/pagamento");
  await expect(page).toHaveURL(/\/sacola$/);
});

test("compra completa: identificação, pagamento e confirmação", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
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
  await expect(page.locator("aside dl")).toContainText("R$ [frete]");
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

  await expect(page).toHaveURL(/\/checkout\/confirmacao$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedido [0000] recebido");
  await expect(page.locator("[aria-current=step]")).toContainText("Pedido recebido");
  await page.getByRole("button", { name: "Copiar" }).click();
  await expect(page.getByText("Código copiado")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedido [0000] recebido");

  await page.goto("/");
  await expect(cartLabel(page)).toHaveAttribute("aria-label", "Sacola vazia");
});
