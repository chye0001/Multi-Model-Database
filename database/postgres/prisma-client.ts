import "dotenv/config";
import { PrismaClient } from "./generated/postgres/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.POSTGRES_DATABASE_URL;

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
