import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

import { databaseUrl } from "../../prisma/database-url";

function createClient(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl() }) });
}

// En desarrollo Next.js recarga los módulos con cada cambio: sin esto se abriría el archivo una y otra vez.
const globalForDb = globalThis as unknown as { db?: PrismaClient };

/** El único cliente de la base de datos. Solo lo usan `src/data/` y el inicio de sesión. */
export const db = globalForDb.db ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
