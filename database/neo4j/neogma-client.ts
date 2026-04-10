import "dotenv/config";
import { Neogma } from "neogma";

// TODO - add test env config to .env and config object if we decide to test this as exam project 
type Environment = "dev" | "prod";

const ENV = (process.env.NODE_ENV ?? "dev") as Environment;

const config: Record<Environment, {
  url: string | undefined;
  username: string | undefined;
  password: string | undefined;
  database: string | undefined;
  encrypted: boolean;
}> = {
  dev: {
    url:      process.env.NEO4J_URL_DEV,
    username: process.env.NEO4J_USERNAME_DEV,
    password: process.env.NEO4J_PASSWORD_DEV,
    database: process.env.NEO4J_DB_DEV,
    encrypted: false
  },
  //   // TODO implment test section if we decide to test this as exam project
  // test: {
  //   url:      "neo4j://localhost:7688",  // separate port so tests don"t hit dev DB
  //   username: "neo4j",
  //   password: "password",
  //   database: "neo4j-test",
  //   encrypted: false
  // },
  prod: {
    url:      process.env.NEO4J_URL_PROD,
    username: process.env.NEO4J_USERNAME_PROD,
    password: process.env.NEO4J_PASSWORD_PROD,
    database: process.env.NEO4J_DATABASE_PROD,
    encrypted: true
  },
};


const { url, username, password, database } = config[ENV];
if (!url || !username || !password || !database) {
  throw new Error(`Missing required Neo4j env vars for environment: ${ENV}`);
}
const { encrypted, ...connectionConfig } = config[ENV];


export const neogma = new Neogma(
  //@ts-ignore
  connectionConfig, {
    encrypted: encrypted ? "ENCRYPTION_ON" : "ENCRYPTION_OFF",
  }
);


let isConnected = false;
export async function connectNeo4j(): Promise<void> {
  const MAX_RETRIES = 10;
  const DELAY_MS = 60000; // 1 minute

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await neogma.verifyConnectivity();
      isConnected = true;
      console.log(`[Neo4j / Neogma] Connected on attempt ${attempt}`);
      break;

    } catch (error) {
      console.warn(`[Neo4j / Neogma] Connection attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${DELAY_MS}ms...`);

      if (attempt === MAX_RETRIES) {
        throw new Error(`[Neo4j / Neogma] Failed to connect after ${MAX_RETRIES} attempts`);
      }

      await new Promise((res) => setTimeout(res, DELAY_MS));
    }
  }
}

export async function disconnectNeo4j(): Promise<void> {
  try {    
    await neogma.driver.close();
    isConnected = false;
    console.log("[Neo4j / Neogma] connection closed");

  } catch (error) {
    console.error("[Neo4j / Neogma] Failed to disconnect:", error);
  }
}