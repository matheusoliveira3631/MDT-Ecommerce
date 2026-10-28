import "server-only";
import { createDatabase, type Database } from "./connect";

const globalForDb = globalThis as unknown as { lojaDb?: Database };

/**
 * Conexão única por processo (o `globalThis` evita abrir várias no hot reload do dev).
 * O caminho vem de DATABASE_PATH; as migrações rodam na primeira conexão.
 */
export const db: Database = globalForDb.lojaDb ?? createDatabase(process.env.DATABASE_PATH ?? "./data/loja.db");
if (process.env.NODE_ENV !== "production") globalForDb.lojaDb = db;
