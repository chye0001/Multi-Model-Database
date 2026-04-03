import "dotenv/config";
import { PrismaClient } from "./generated/postgres/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";



const env = process.env.NODE_ENV ?? "dev";
if (!["dev", "test", "prod"].includes(env)) {
  throw new Error(`Invalid NODE_ENV value: ${env}. Expected "dev", "test", or "prod".`);
}

const databaseUrl = process.env[`POSTGRES_DATABASE_URL_${env.toUpperCase()}`];

if (!databaseUrl) {
  throw new Error("POSTGRES_DATABASE_URL environment variable is required");
}

const globalForPrisma = globalThis as { prisma?: PrismaClient };
const adapter = new PrismaPg(new Pool({ connectionString: databaseUrl }));

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
