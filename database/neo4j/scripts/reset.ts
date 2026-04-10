// truncate.ts

import { neogma } from "../neogma-client.js";

async function truncate() {
  console.log("🗑️  Truncating database...");
  await neogma.queryRunner.run("MATCH (n) DETACH DELETE n");
  console.log("✅  Database truncated.");
  await neogma.driver.close();
}

truncate().catch((err) => {
  console.error("❌  Truncation failed:", err);
  process.exit(1);
});