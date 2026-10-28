import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { addToCart } from "./helpers";

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
