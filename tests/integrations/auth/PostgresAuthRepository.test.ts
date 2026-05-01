import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startContainers, stopContainers } from "../setup/containers.js";
import { PostgresAuthRepository } from "../../../repositories/postgres/PostgresAuthRepository.js";
import { createTestUser } from "../helpers/testUser.js";

describe("PostgresAuthRepository", () => {
  let repo: PostgresAuthRepository;
  let prisma: any;

  beforeAll(async () => {
    const { postgres } = await startContainers();

    // Set before any prisma code runs
    process.env.POSTGRES_DATABASE_URL_TEST = postgres.getConnectionUri();

    // Run migrations against test container
    const { execSync } = await import("child_process");
    execSync("npx prisma migrate deploy", {
      env: {
        ...process.env,
        POSTGRES_DATABASE_URL_TEST: postgres.getConnectionUri(),
      },
      stdio: "inherit",
    });
    execSync("npm run prisma:seed", {
      env: {
        ...process.env,
        POSTGRES_DATABASE_URL_TEST: postgres.getConnectionUri(),
      },
      stdio: "inherit",
    });

    // Now safe to import — env var is set
    const { getPrisma } = await import("../../../database/postgres/prisma-client.js");
    prisma = getPrisma();

    repo = new PostgresAuthRepository();
  });


  afterAll(async () => {
    await prisma.$disconnect();
    await stopContainers();
  });

  it("should register a user", async () => {
    const user = await createTestUser();
    const result = await repo.register(user);
    const registeredUser = result[0];

    expect(registeredUser).not.toBe(null);
    expect(registeredUser).not.toBe(undefined);
    expect(registeredUser!.email).toBe(user.email);
    expect(registeredUser!.id).toBeDefined();
  });

  it("should find user by email", async () => {
    const user = await createTestUser();
    const created = await repo.register(user);
    const registeredUser = created[0];

    const found = await repo.findByEmail(registeredUser!.email);
    const foundUser = found?.users[0];

    expect(foundUser?.email).toBe(user.email);
  });

  it("should return null for non-existent email", async () => {
    const result = await repo.findByEmail("ghost@nowhere.com");
    expect(result).toBeNull();
  });

});