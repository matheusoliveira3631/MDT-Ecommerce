import { expect, test } from "@playwright/test";
import { addToCart, cartLabel } from "./helpers";

test("mesma personalização soma; diferente vira outra linha", async ({ page }) => {
  await addToCart(page, "Helena");
  await addToCart(page, "Helena");
  await expect(cartLabel(page)).toHaveAttribute("aria-label", "Sacola, 40 itens");
  await addToCart(page, "Miguel");
  await page.goto("/sacola");
  await expect(page.locator("main article")).toHaveCount(2);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("60 itens");
});

test("remover com desfazer, cupom e persistência", async ({ page }) => {
  await addToCart(page, "Helena");
  await addToCart(page, "Miguel");
  await page.goto("/sacola");
  const items = page.locator("main article");
  await expect(items).toHaveCount(2);

  await page.getByRole("button", { name: /^Remover/ }).nth(1).click();
  await expect(items).toHaveCount(1);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(items).toHaveCount(2);

  await page.getByLabel("Cupom de desconto").fill("ERRADO");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByText("Cupom inválido ou expirado.")).toBeVisible();
  await page.getByLabel("Cupom de desconto").fill("mimo10");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByText("Cupom MIMO10 aplicado")).toBeVisible();
  await expect(page.locator("aside dl")).toContainText("Desconto");

  await page.reload();
  await expect(items).toHaveCount(2);
  await expect(page.getByText("Cupom MIMO10 aplicado")).toBeVisible();
});

test("editar personalização volta para a sacola com a linha atualizada", async ({ page }) => {
  await addToCart(page, "Helena");
  await page.goto("/sacola");
  await page.getByRole("link", { name: "Editar personalização" }).click();
  await expect(page.getByLabel("Nome na arte")).toHaveValue("Helena");
  await page.getByLabel("Nome na arte").fill("Helena Maria");
  await page.locator("form").getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page).toHaveURL(/\/sacola$/);
  await expect(page.locator("main article")).toHaveCount(1);
  await expect(page.locator("main article dl")).toContainText("Helena Maria");
});

test("sacola vazia mostra o estado desenhado", async ({ page }) => {
  await page.goto("/sacola");
  await expect(page.getByRole("heading", { name: "Sua sacola está esperando um mimo" })).toBeVisible();
});
