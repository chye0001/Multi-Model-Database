import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startContainers, stopContainers } from "../setup/containers.js";
import { Neogma } from "neogma";
import { Neo4jAuthRepository } from "../../../repositories/neo4j/Neo4jAuthRepository.js";
import { createTestUser } from "../helpers/testUser.js";
import { seed } from "../../../database/neo4j/scripts/seed.ts";

describe("Neo4jAuthRepository", () => {
  let repo: Neo4jAuthRepository;
  let testNeogma: Neogma;

  beforeAll(async () => {
    const { neo4j: neo4jContainer } = await startContainers();

    // Set env vars BEFORE getNeogma() is ever called
    process.env.NEO4J_URL_TEST      = neo4jContainer.getBoltUri();
    process.env.NEO4J_USERNAME_TEST = neo4jContainer.getUsername();
    process.env.NEO4J_PASSWORD_TEST = neo4jContainer.getPassword();
    process.env.NEO4J_DB_TEST       = "neo4j";

    // Now safe — lazy init reads the env vars above
    const { getNeogma } = await import("../../../database/neo4j/neogma-client.js");
    testNeogma = getNeogma();

    repo = new Neo4jAuthRepository();

    const isTestRun = true;
    await seed(isTestRun);
  });

  afterAll(async () => {
    await testNeogma.driver.close();
    await stopContainers();
  });


  it("should register a user", async () => {
    const user = await createTestUser();
    const result = await repo.register(user);
    const registeredUser = result[0];
 
    expect(registeredUser).not.toBe(undefined);
    expect(registeredUser).not.toBe(null);
    expect(registeredUser!.email).toBe(user.email);
  });

  it("should find user by email", async () => {
    const user = await createTestUser();
    const created = await repo.register(user);
    const registeredUser = created[0];

    const result = await repo.findByEmail(registeredUser!.email);
    const foundUser = result?.users[0];
    expect(foundUser?.email).toBe(user.email);
  });

  it("should return null for non-existent email", async () => {
    const result = await repo.findByEmail("ghost@nowhere.com");
    expect(result).toBeNull();
  });
});