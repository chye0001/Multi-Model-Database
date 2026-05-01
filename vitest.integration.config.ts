import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include:     ["tests/integrations/**/*.test.ts"],
    environment: "node",
    testTimeout: 120000,
    hookTimeout: 120000,
    maxWorkers:  1,
    isolate:     true,
    reporters:   ["verbose"],
  },
});