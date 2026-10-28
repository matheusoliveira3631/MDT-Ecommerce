import fs from "node:fs";
import path from "node:path";
import Sqlite from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

/** Abre o SQLite, liga WAL e chaves estrangeiras e aplica as migrações de ./drizzle. */
export function createDatabase(file: string) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const sqlite = new Sqlite(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}
