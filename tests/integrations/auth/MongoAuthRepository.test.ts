import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startContainers, stopContainers } from "../setup/containers.js";
import mongoose from "mongoose";
import { MongoAuthRepository } from "../../../repositories/mongo/MongoAuthRepository.js";
import { createTestUser } from "../helpers/testUser.js";

describe("MongoAuthRepository", () => {
  let repo: MongoAuthRepository;

  beforeAll(async () => {
    const { mongo } = await startContainers();

    // Connect mongoose to test container
    await mongoose.connect(mongo.getConnectionString(), {
      directConnection: true,
    });

    repo = new MongoAuthRepository();

    // Lazy-load seed script after environment is set up
    const { seed } = await import("../../../database/mongo/scripts/seed.js");
    const shouldDisconnect = false, isTestRun = true;
    await seed(shouldDisconnect, isTestRun);
  });

  afterAll(async () => {
    await mongoose.disconnect();
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

    const found = await repo.findByEmail(registeredUser!.email);
    //@ts-ignore
    const foundUser = found.users[0];
    expect(foundUser).not.toBe(null);
    expect(foundUser).not.toBe(undefined);
    expect(foundUser!.email).toBe(user.email);
  });

  it("should return null for non-existent email", async () => {
    const result = await repo.findByEmail("ghost@nowhere.com");
    expect(result).toBeNull();
  });
});