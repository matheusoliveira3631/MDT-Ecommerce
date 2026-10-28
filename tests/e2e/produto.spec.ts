import { expect, test } from "@playwright/test";
import { cartLabel, PRODUTO } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto(PRODUTO);
});

test("galeria troca a foto e a quantidade começa no pedido mínimo", async ({ page }) => {
  await page.getByRole("button", { name: "Ver foto 3" }).click();
  await expect(page.getByRole("button", { name: "Ver foto 3" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Diminuir quantidade" })).toBeDisabled();
  await expect(page.locator("form [aria-live=polite]").first()).toHaveText("20");
});

test("valida e foca o primeiro campo inválido", async ({ page }) => {
  const submit = page.locator("form").getByRole("button", { name: "Adicionar à sacola" });
  await submit.click();
  await expect(page.getByText("Informe o nome que vai na arte")).toBeVisible();
  await expect(page.getByLabel("Nome na arte")).toBeFocused();

  await page.getByText("Outro tema", { exact: true }).click();
  await page.getByLabel("Nome na arte").fill("Helena");
  await submit.click();
  await expect(page.getByLabel("Qual tema?")).toBeFocused();
});

test("a legenda das cores diz o nome da cor escolhida", async ({ page }) => {
  await page.getByText("Lilás", { exact: true }).locator("..").click();
  await expect(page.locator("legend", { hasText: "Cores da arte" })).toHaveText("3. Cores da arte · Lilás");
});

test("adicionar abre a sacola lateral com foco preso e Esc devolve o foco", async ({ page }) => {
  await expect(cartLabel(page)).toHaveAttribute("aria-label", "Sacola vazia");
  await page.getByLabel("Nome na arte").fill("Helena");
  const submit = page.locator("form").getByRole("button", { name: "Adicionar à sacola" });
  await submit.click();

  const drawer = page.getByRole("dialog", { name: /Sua sacola/ });
  await expect(drawer).toBeVisible();
  await expect(page.getByRole("button", { name: "Fechar sacola" })).toBeFocused();
  for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(submit).toBeFocused();
  await expect(cartLabel(page)).toHaveAttribute("aria-label", "Sacola, 20 itens");
});

test("frete: CEP incompleto, máscara, opções e CEP não encontrado", async ({ page }) => {
  const cep = page.getByLabel("Calcular frete");
  const calcular = page.getByRole("button", { name: "Calcular" });
  await cep.fill("3720");
  await calcular.click();
  await expect(page.getByText("CEP incompleto. Use 8 números, ex.: 37200-000.")).toBeVisible();

  await cep.fill("37200000");
  await expect(cep).toHaveValue("37200-000");
  await calcular.click();
  await expect(page.getByText("SEDEX")).toBeVisible();

  await cep.fill("00000000");
  await calcular.click();
  await expect(page.getByText("Não encontramos esse CEP.")).toBeVisible();
});
