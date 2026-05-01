import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startContainers, stopContainers } from "../setup/containers.js";
import mongoose from "mongoose";
import { createTestUser } from "../helpers/testUser.js";
import type { IAuthRepository } from "../../../repositories/interfaces/IAuthRepository.js";

describe("CompositeAuthRepository — all DBs in parallel", () => {
  let repo: IAuthRepository;

  beforeAll(async () => {
    const { postgres, mongo, neo4j: neo4jContainer } = await startContainers();

    // ── Postgres ────────────────────────────────────────────────────────────
    process.env.POSTGRES_DATABASE_URL_TEST = postgres.getConnectionUri();

    const { execSync } = await import("child_process");
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, POSTGRES_DATABASE_URL_TEST: postgres.getConnectionUri() },
      stdio: "inherit",
    });
    execSync("npm run prisma:seed", {
      env: { ...process.env, POSTGRES_DATABASE_URL_TEST: postgres.getConnectionUri() },
      stdio: "inherit",
    });

    // ── MongoDB ─────────────────────────────────────────────────────────────
    await mongoose.connect(mongo.getConnectionString(), { directConnection: true });

    const { seed: mongoSeed } = await import("../../../database/mongo/scripts/seed.js");
    const shouldDisconnect = false, isTestRun = true;
    await mongoSeed(shouldDisconnect, isTestRun);

    // ── Neo4j ───────────────────────────────────────────────────────────────
    process.env.NEO4J_URL_TEST      = neo4jContainer.getBoltUri();
    process.env.NEO4J_USERNAME_TEST = neo4jContainer.getUsername();
    process.env.NEO4J_PASSWORD_TEST = neo4jContainer.getPassword();
    process.env.NEO4J_DB_TEST       = "neo4j";

    // ── Enable all DBs for composite ────────────────────────────────────────
    process.env.POSTGRES_ENABLED_TEST = "true";
    process.env.MONGO_ENABLED_TEST    = "true";
    process.env.NEO4J_ENABLED_TEST    = "true";
    const { seed: neo4jSeed } = await import("../../../database/neo4j/scripts/seed.ts");
    await neo4jSeed(isTestRun);

    // Lazy import AFTER all env vars are set
    const { authRepositoryFactory } = await import("../../../repositories/factories/AuthRepositoryFactory.js");
    repo = authRepositoryFactory();
  });

  afterAll(async () => {
    const { getPrisma } = await import("../../../database/postgres/prisma-client.js");
    const { getNeogma } = await import("../../../database/neo4j/neogma-client.js");

    await getPrisma().$disconnect();
    await mongoose.disconnect();
    await getNeogma().driver.close();

    await new Promise((res) => setTimeout(res, 500));
    await stopContainers();
  });

  it("should register user across all enabled DBs", async () => {
    const user = await createTestUser();
    const result = await repo.register(user);

    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
    expect(result.length).not.toBe(0);
    expect(result.length).toBe(3);
    
    expect(result[0]?.email).toBe(user.email);
    expect(result[1]?.email).toBe(user.email);
    expect(result[2]?.email).toBe(user.email);
  });

  it("should find user by email across all enabled DBs", async () => {
    const user = await createTestUser();
    await repo.register(user);

    const found = await repo.findByEmail(user.email);
    expect(found).not.toBeNull();
    expect(found).not.toBeUndefined();

    expect(found!.users[0]!.email).toBe(user.email);
    expect(found!.users[1]!.email).toBe(user.email);
    expect(found!.users[2]!.email).toBe(user.email);
  });

  it("should return null for non-existent email", async () => {
    const result = await repo.findByEmail("ghost@nowhere.com");
    expect(result).toBeNull();
  });
});