import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { TEST_USERS } from "../../playwright.config";
import { addToCart, loginAs, placeOrder } from "./helpers";

const PAGES = [
  "/",
  "/categorias",
  "/categoria/caixas-milk",
  "/busca?q=",
  "/busca?q=unicornio",
  "/produto/caixa-milk-personalizada",
  "/produto/lembrancinha-tubete",
  "/sacola",
  "/favoritos",
  "/ajuda/perguntas-frequentes",
  "/privacidade",
  "/pagina-x",
  "/entrar",
];

async function scan(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
}

for (const path of PAGES) {
  test(`WCAG 2.1 AA sem violações: ${path}`, async ({ page }) => {
    await page.goto(path);
    expect(await scan(page)).toEqual([]);
  });
}

test("WCAG 2.1 AA sem violações: sacola com itens e checkout", async ({ page }) => {
  await addToCart(page, "Helena");
  for (const path of ["/sacola", "/checkout/identificacao"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await scan(page), path).toEqual([]);
  }
});

test("WCAG 2.1 AA sem violações: conta e painel do admin", async ({ page }) => {
  test.setTimeout(90_000);
  await loginAs(page, TEST_USERS.admin);
  expect(await scan(page), "/conta").toEqual([]);
  const { numero } = await placeOrder(page, "Alice");
  for (const path of [
    "/admin/pedidos",
    `/admin/pedidos/${numero}`,
    "/admin/produtos",
    "/admin/produtos/novo",
    "/admin/categorias",
    "/admin/produtos/1",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await scan(page), path).toEqual([]);
  }
});
