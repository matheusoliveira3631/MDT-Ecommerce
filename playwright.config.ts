import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3200);
const baseURL = `http://localhost:${PORT}`;

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
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
