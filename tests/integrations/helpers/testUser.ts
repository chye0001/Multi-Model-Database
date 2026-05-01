import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export const createTestUser = async () => ({
  userId:        crypto.randomUUID(),
  email:     `test-${randomUUID()}@example.com`,
  passwordHash:  await bcrypt.hash("test1234", 10),
  firstName: "Test",
  lastName:  "User",
  roleId:    1,
  countryId: 1,
});