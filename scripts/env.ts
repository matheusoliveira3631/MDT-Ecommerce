import fs from "node:fs";

/**
 * Carrega as mesmas variáveis que o Next usa (.env.production no servidor,
 * .env.local no desenvolvimento), para os scripts usarem o mesmo banco que a loja.
 * Variáveis já definidas no ambiente têm prioridade.
 */
for (const file of [".env.production", ".env.local", ".env"]) {
  if (fs.existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}
