import { execSync, spawnSync } from "child_process";
import { createInterface } from "readline";
import { readdirSync, statSync, copyFileSync, unlinkSync } from "fs";
import { join, basename } from "path";

const BACKUP_DIR = "./database/neo4j/backups/base";
const CONTAINER  = "neo4j";
const NEO4J_IMAGE = "neo4j:5";
const VOLUME     = "neo4j_data";

// ── Helpers ───────────────────────────────────────────────────────────────

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function run(cmd) {
  console.log(`  > ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ── List dumps ────────────────────────────────────────────────────────────

const dumps = readdirSync(BACKUP_DIR)
  .filter((f) => f.endsWith(".dump") && f !== "neo4j.dump")
  .map((f) => {
    const fullPath = join(BACKUP_DIR, f);
    const { size, mtime } = statSync(fullPath);
    return { name: f, fullPath, size, mtime };
  })
  .sort((a, b) => b.mtime - a.mtime); // newest first

if (dumps.length === 0) {
  console.error(`❌  No dump files found in ${BACKUP_DIR}`);
  process.exit(1);
}

console.log("\n=== Available Neo4j Dumps ===\n");
dumps.forEach(({ name, size, mtime }, i) => {
  const date = mtime.toISOString().replace("T", " ").substring(0, 19);
  console.log(`  [${i + 1}] ${name}   (${formatSize(size)}, ${date})`);
});

// ── Pick dump ─────────────────────────────────────────────────────────────

const choice = await ask(`\nPick a dump to restore [1-${dumps.length}]: `);
const index  = parseInt(choice, 10) - 1;

if (isNaN(index) || index < 0 || index >= dumps.length) {
  console.error(`❌  Invalid choice: ${choice}`);
  process.exit(1);
}

const selected = dumps[index];
console.log(`\nSelected: ${selected.name}`);

const confirm = await ask("⚠️  This will OVERWRITE the current Neo4j database. Continue? [y/N]: ");
if (confirm.toLowerCase() !== "y") {
  console.log("Aborted.");
  process.exit(0);
}

// ── Restore ───────────────────────────────────────────────────────────────

const stagingFile = join(BACKUP_DIR, "neo4j.dump");
const cwd = process.cwd().replace(/\\/g, "/"); // normalize Windows paths

try {
  console.log("\nStaging dump file...");
  copyFileSync(selected.fullPath, stagingFile);

  console.log(`Stopping ${CONTAINER}...`);
  run(`docker stop ${CONTAINER}`);

  console.log("Loading dump...");
  run(
    `docker run --rm ` +
    `-v ${VOLUME}:/data ` +
    `-v "${cwd}/database/neo4j/backups/base":/neo4j_backup ` +
    `${NEO4J_IMAGE} ` +
    `neo4j-admin database load neo4j --from-path=/neo4j_backup --overwrite-destination=true`
  );

  console.log(`Starting ${CONTAINER}...`);
  run(`docker start ${CONTAINER}`);

  console.log(`\n✅  Restore complete: ${selected.name}\n`);
} finally {
  // Always clean up staging file even if restore fails
  try { unlinkSync(stagingFile); } catch {}
}