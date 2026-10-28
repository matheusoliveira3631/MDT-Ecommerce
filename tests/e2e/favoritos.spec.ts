import { expect, test } from "@playwright/test";

test("favoritar mostra o toast, guarda e lista em /favoritos", async ({ page }) => {
  await page.goto("/favoritos");
  await expect(page.getByText("Nenhum favorito ainda")).toBeVisible();

  await page.goto("/");
  const heart = page.getByRole("button", { name: "Favoritar Caixa milk personalizada" });
  await heart.click();
  await expect(heart).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('header a[href="/favoritos"]')).toHaveAttribute("aria-label", "Favoritos, 1");
  await page.getByRole("link", { name: "Ver favoritos" }).click();

  await expect(page).toHaveURL(/\/favoritos$/);
  await expect(page.locator("main article")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("main article")).toHaveCount(1);

  await page.getByRole("button", { name: "Favoritar Caixa milk personalizada" }).click();
  await expect(page.getByText("Nenhum favorito ainda")).toBeVisible();
});

test("produto esgotado: avise-me valida o e-mail e confirma", async ({ page }) => {
  await page.goto("/busca?q=tubete");
  await page.getByRole("link", { name: "Avise-me quando voltar" }).click();
  await expect(page).toHaveURL(/#avise-me$/);
  await page.getByRole("button", { name: "Avise-me quando voltar" }).click();
  await expect(page.getByText("Informe um e-mail válido")).toBeVisible();
  await page.getByLabel("Seu e-mail").fill("ana@email.com");
  await page.getByRole("button", { name: "Avise-me quando voltar" }).click();
  await expect(page.getByText("Pronto! Vamos avisar em ana@email.com quando voltar.")).toBeVisible();
});
