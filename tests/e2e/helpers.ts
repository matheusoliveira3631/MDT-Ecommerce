import { createHmac } from "node:crypto";
import Database from "better-sqlite3";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { TEST_DATA, TEST_WEBHOOK_SECRET } from "../../playwright.config";

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

export async function loginAs(page: Page, user: { email: string; senha: string }, voltar = "/conta") {
  await page.goto(`/entrar?voltar=${encodeURIComponent(voltar)}`);
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => url.pathname === voltar);
}

/** Id da cobrança do pedido, lido direto do banco de testes (o gateway real mandaria no webhook). */
export function chargeIdOf(numero: string): string {
  const db = new Database(`${TEST_DATA}/loja.db`, { readonly: true });
  try {
    return (db.prepare("select pagamento_id from pedidos where numero = ?").get(numero) as { pagamento_id: string }).pagamento_id;
  } finally {
    db.close();
  }
}

/** Simula o aviso assinado do gateway. */
export function sendPaymentWebhook(request: APIRequestContext, numero: string, status: "aprovado" | "recusado" | "expirado", signature?: string) {
  const body = JSON.stringify({ pagamentoId: chargeIdOf(numero), status });
  return request.post("/api/pagamentos/webhook", {
    data: body,
    headers: {
      "content-type": "application/json",
      "x-assinatura": signature ?? createHmac("sha256", TEST_WEBHOOK_SECRET).update(body).digest("hex"),
    },
  });
}

/**
 * Cada teste que compra se apresenta com um IP próprio (como o Nginx repassa em
 * produção): o limite de 10 pedidos a cada 10 minutos por IP vale por cliente.
 */
export async function asNewVisitor(page: Page) {
  const n = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${n()}.${n()}.${n()}` });
}

/** Cliente fecha um pedido no Pix; devolve o número e a URL da confirmação. */
export async function placeOrder(page: Page, nome: string) {
  await asNewVisitor(page);
  await addToCart(page, nome);
  await page.goto("/checkout/identificacao");
  await fillIdentification(page);
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await expect(page).toHaveURL(/\/checkout\/pagamento$/);
  await page.getByText("Pix", { exact: true }).click();
  await page.getByLabel(/Li e concordo/).check();
  await page.getByRole("button", { name: "Finalizar pedido" }).click();
  await expect(page).toHaveURL(/\/checkout\/confirmacao\?pedido=MT\d{5}&token=/);
  const numero = (await page.getByRole("heading", { level: 1 }).textContent())!.match(/MT\d{5}/)![0];
  return { numero, url: page.url() };
}
