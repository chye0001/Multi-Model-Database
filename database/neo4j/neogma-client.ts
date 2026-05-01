import "dotenv/config";
import { Neogma } from "neogma";

type Environment = "dev" | "test" | "prod";
const ENV = (process.env.NODE_ENV ?? "dev") as Environment;

// ── Lazy singleton ─────────────────────────────────────────────────────────
let _neogma: Neogma | null = null;

export function getNeogma(): Neogma {
  if (_neogma) return _neogma;

  const config = {
    url:      process.env[`NEO4J_URL_${ENV.toUpperCase()}`],
    username: process.env[`NEO4J_USERNAME_${ENV.toUpperCase()}`],
    password: process.env[`NEO4J_PASSWORD_${ENV.toUpperCase()}`],
    database: process.env[`NEO4J_DB_${ENV.toUpperCase()}`],
    encrypted: false,
  };

  if (!config.url || !config.username || !config.password || !config.database) {
    throw new Error(`Missing required Neo4j env vars for environment: ${ENV}`);
  }

  const { encrypted, ...connectionConfig } = config;

  _neogma = new Neogma(
    //@ts-ignore
    connectionConfig,
    { encrypted: encrypted ? "ENCRYPTION_ON" : "ENCRYPTION_OFF" }
  );

  return _neogma;
}

// Proxy for backward compat — existing code using `neogma` directly still works
export const neogma = new Proxy({} as Neogma, {
  get(_target, prop) {
    return (getNeogma() as any)[prop];
  },
});

let isConnected = false;

export async function connectNeo4j(): Promise<void> {
  const MAX_RETRIES = 10;
  const DELAY_MS = 60000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await getNeogma().verifyConnectivity();
      isConnected = true;
      console.log(`[Neo4j / Neogma] Connected on attempt ${attempt}`);
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Neo4j / Neogma] Connection attempt ${attempt}/${MAX_RETRIES} failed: ${message}. Retrying in ${DELAY_MS}ms...`);

      if (attempt === MAX_RETRIES) {
        throw new Error(`[Neo4j / Neogma] Failed to connect after ${MAX_RETRIES} attempts`);
      }

      await new Promise((res) => setTimeout(res, DELAY_MS));
    }
  }
}

export async function disconnectNeo4j(): Promise<void> {
  try {
    await getNeogma().driver.close();
    _neogma = null;
    isConnected = false;
    console.log("[Neo4j / Neogma] connection closed");
  } catch (error) {
    console.error("[Neo4j / Neogma] Failed to disconnect:", error);
  }
}