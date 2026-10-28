import { expect, test } from "@playwright/test";
import { addToCart, fillIdentification } from "./helpers";

const PAGES = [
  "/",
  "/categorias",
  "/categoria/caixas-milk",
  "/busca?q=",
  "/produto/caixa-milk-personalizada",
  "/sacola",
  "/favoritos",
  "/ajuda/perguntas-frequentes",
  "/pagina-x",
];

test("nenhuma página rola na horizontal a 390px", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, path).toBeLessThanOrEqual(390);
  }
});

test("menu abre como gaveta, prende o foco e fecha ao navegar", async ({ page }) => {
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Menu" });
  await menuButton.click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeVisible();
  await expect(page.getByRole("button", { name: "Fechar menu" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menuButton).toBeFocused();

  await menuButton.click();
  await drawer.getByRole("link", { name: "Cestas" }).click();
  await expect(page).toHaveURL(/\/categoria\/cestas$/);
  await expect(drawer).toBeHidden();
});

test("no mobile, adicionar mostra o toast em vez da sacola lateral", async ({ page }) => {
  await addToCart(page, "Ana");
  await expect(page.getByText("Adicionado à sacola: Caixa milk personalizada")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("checkout no mobile sem rolagem horizontal", async ({ page }) => {
  await addToCart(page, "Ana");
  await page.goto("/checkout/identificacao");
  await fillIdentification(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await expect(page).toHaveURL(/\/checkout\/pagamento$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
