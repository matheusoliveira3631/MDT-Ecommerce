import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3200);
const baseURL = `http://localhost:${PORT}`;
export const TEST_DATA = "./data/test";
/** Usuários criados no banco de testes antes de subir o servidor. */
export const TEST_USERS = {
  admin: { email: "admin@teste.com", senha: "senha-do-admin-123" },
  cliente: { email: "cliente@teste.com", senha: "senha-da-cliente-123" },
};

/**
 * Testes unitários (sem navegador) e ponta a ponta no build de produção.
 * `npm test` gera o build e sobe o servidor; com um servidor já rodando na
 * porta, ele é reaproveitado fora do CI.
 */
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    locale: "pt-BR",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "unit", testDir: "tests/unit" },
    {
      name: "desktop",
      testDir: "tests/e2e",
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      testDir: "tests/e2e",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: false, hasTouch: true },
    },
  ],
  webServer: {
    // Banco e uploads só dos testes, recriados a cada execução a partir do catálogo inicial
    command: [
      `rm -rf ${TEST_DATA}`,
      "npm run db:seed",
      `ADMIN_SENHA=${TEST_USERS.admin.senha} npm run admin:criar -- ${TEST_USERS.admin.email} "Admin Teste"`,
      `ADMIN_SENHA=${TEST_USERS.cliente.senha} npm run admin:criar -- --cliente ${TEST_USERS.cliente.email} "Cliente Teste"`,
      "npm run build",
      `npm run start -- --port ${PORT}`,
    ].join(" && "),
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      DATABASE_PATH: `${TEST_DATA}/loja.db`,
      UPLOADS_DIR: `${TEST_DATA}/uploads`,
      // Sem S3 nos testes: as fotos vão para a pasta local
      S3_BUCKET: "",
    },
  },
});
