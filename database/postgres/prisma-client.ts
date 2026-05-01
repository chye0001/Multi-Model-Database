import "dotenv/config";
import { PrismaClient } from "./generated/postgres/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const env = process.env.NODE_ENV ?? "dev";
if (!["dev", "test", "prod"].includes(env)) {
  throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
}

// ── Lazy singleton ────────────────────────────────────────────────────────────
// Do NOT read env vars at module load time — they may not be set yet
// (e.g. when Testcontainers sets them in beforeAll)

let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;

  const databaseUrl = process.env[`POSTGRES_DATABASE_URL_${env.toUpperCase()}`];
  if (!databaseUrl) {
    throw new Error(`POSTGRES_DATABASE_URL_${env.toUpperCase()} environment variable is required`);
  }

  const adapter = new PrismaPg(new Pool({ connectionString: databaseUrl }));
  _prisma = new PrismaClient({ adapter, log: ["query", "error", "warn"] });
  return _prisma;
}

// Keep backward compat — existing code using `prisma` directly still works
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop];
  },
});