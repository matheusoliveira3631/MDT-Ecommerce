import { expect, test } from "@playwright/test";
import { TEST_USERS } from "../../playwright.config";
import { loginAs, placeOrder, sendPaymentWebhook } from "./helpers";

test("admin acompanha o pedido pago até o envio e a cliente vê o rastreio", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const { numero, url } = await placeOrder(page, "Laura");

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await loginAs(admin, TEST_USERS.admin, "/admin/pedidos");

  // Antes do pagamento: aparece, mas não avança
  await admin.getByRole("searchbox", { name: "Buscar pedido" }).fill(numero);
  await admin.getByRole("button", { name: "Buscar" }).click();
  const row = admin.getByRole("row").filter({ hasText: numero });
  await expect(row).toContainText("Pedido recebido");
  await expect(row).toContainText("Maria Souza");
  await row.getByRole("link", { name: numero }).click();
  await expect(admin.getByRole("heading", { level: 1 })).toHaveText(`Pedido ${numero}`);
  await expect(admin.getByText("Aguardando a confirmação do pagamento.")).toBeVisible();
  await expect(admin.getByText("Laura", { exact: true })).toBeVisible();
  const whatsapp = admin.getByRole("link", { name: "Abrir conversa" });
  await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/5535999998888\?text=/);

  expect((await sendPaymentWebhook(page.request, numero, "aprovado")).status()).toBe(200);
  await admin.reload();
  await expect(admin.getByRole("navigation", { name: "Painel" }).getByRole("link", { name: /Pedidos/ })).toContainText(
    "aguardando arte",
  );

  // Arte enviada (o select já sugere o próximo passo)
  const status = admin.getByLabel("Novo status");
  await expect(status).toHaveValue("arte_enviada");
  await admin.getByLabel("Observação (opcional)").fill("Arte mandada às 10h");
  await admin.getByRole("button", { name: "Salvar status" }).click();
  await expect(admin.getByText(`${numero}: Arte enviada`)).toBeVisible();
  const historico = admin.getByRole("region", { name: "Histórico" });
  await expect(historico.getByRole("listitem").first()).toContainText("Arte enviada");
  await expect(historico.getByRole("listitem").first()).toContainText("Arte mandada às 10h");
  await expect(status).toHaveValue("aprovada");

  // Direto para enviado, com rastreio
  await status.selectOption("enviado");
  await admin.getByLabel("Código de rastreio").fill("qb123456789br");
  await admin.getByRole("button", { name: "Salvar status" }).click();
  await expect(historico.getByRole("listitem").first()).toContainText("Rastreio: QB123456789BR");
  await expect(admin.getByRole("button", { name: "Cancelar pedido" })).toHaveCount(0);

  await page.goto(url);
  await expect(page.locator("[aria-current=step]")).toContainText("Enviado");
  await expect(page.getByText("QB123456789BR")).toBeVisible();

  await adminContext.close();
});

test("admin cancela um pedido não pago e o motivo fica no histórico", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const { numero, url } = await placeOrder(page, "Sofia");

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await loginAs(admin, TEST_USERS.admin, `/admin/pedidos/${numero}`);
  await admin.getByRole("button", { name: "Cancelar pedido" }).click();
  await expect(admin.getByLabel("Motivo do cancelamento")).toBeFocused();
  await admin.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(admin.getByText("Conte o motivo do cancelamento.")).toBeVisible();
  await admin.getByLabel("Motivo do cancelamento").fill("Cliente pediu por WhatsApp");
  await admin.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(admin.getByText("Pedido cancelado. O estoque reservado já voltou.")).toBeVisible();
  await expect(admin.getByRole("region", { name: "Histórico" }).getByRole("listitem").first()).toContainText(
    "Cliente pediu por WhatsApp",
  );

  // Pagamento que chega depois do cancelamento não ressuscita o pedido
  expect((await sendPaymentWebhook(page.request, numero, "aprovado")).status()).toBe(200);
  await page.goto(url);
  await expect(page.getByText("Próximos passos")).toHaveCount(0);
  await expect(page.getByText("Este pedido foi cancelado. O valor pago é devolvido pela mesma forma de pagamento.")).toBeVisible();
  await admin.reload();
  await expect(admin.getByRole("region", { name: "Histórico" }).getByRole("listitem").first()).toContainText("reembolso");

  await adminContext.close();
});

test("pedidos da cliente logada aparecem na conta dela", async ({ page }) => {
  test.setTimeout(90_000);
  await loginAs(page, TEST_USERS.cliente);
  const { numero } = await placeOrder(page, "Clara");
  await page.goto("/conta");
  const link = page.getByRole("link", { name: new RegExp(`Pedido ${numero}`) });
  await expect(link).toContainText("Pedido recebido");
  await link.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Pedido ${numero} recebido`);
});
