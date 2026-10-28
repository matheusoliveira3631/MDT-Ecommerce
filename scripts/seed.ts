/**
 * Importa o catálogo inicial num banco vazio.
 * Uso: npm run db:seed   (DATABASE_PATH define o arquivo; padrão ./data/loja.db)
 */
import { createDatabase } from "../src/server/db/connect";
import { seedCatalog } from "../src/server/db/seed";

const file = process.env.DATABASE_PATH ?? "./data/loja.db";
const result = seedCatalog(createDatabase(file));
console.log(
  result.categorias
    ? `Catálogo inicial importado em ${file}: ${result.categorias} categorias, ${result.produtos} produtos.`
    : `${file} já tem categorias; nada foi importado.`,
);
