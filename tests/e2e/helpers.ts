import { expect, type Page } from "@playwright/test";

export const PRODUTO = "/produto/caixa-milk-personalizada";

/** Personaliza a caixa milk e adiciona à sacola (no desktop, fecha a sacola lateral). */
export async function addToCart(page: Page, nome: string) {
  await page.goto(PRODUTO);
  await page.getByLabel("Nome na arte").fill(nome);
  await page.locator("form").getByRole("button", { name: "Adicionar à sacola" }).click();
  const drawer = page.getByRole("dialog", { name: /Sua sacola/ });
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  }
}

export async function fillIdentification(page: Page) {
  await page.getByLabel("Nome completo").fill("Maria Souza");
  await page.getByLabel("E-mail").fill("maria@email.com");
  await page.getByLabel("CPF").fill("52998224725");
  await page.getByLabel("WhatsApp").fill("35999998888");
  await page.getByLabel("CEP").fill("37200000");
  await expect(page.getByText("SEDEX")).toBeVisible();
  await page.getByLabel("Rua").fill("Rua das Flores");
  await page.getByLabel("Número").fill("10");
  await page.getByLabel("Bairro").fill("Centro");
  await page.getByLabel("Cidade").fill("Lavras");
  await page.getByLabel("Estado").selectOption("MG");
}

export const cartLabel = (page: Page) => page.locator('header a[href="/sacola"]');
