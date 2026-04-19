import { spawnSync } from "child_process";
import { createInterface } from "readline";
import { readdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

// ── Config ────────────────────────────────────────────────────────────────────

const BACKUPS_DIR = "./database/postgres/backups/base";
const POSTGRESQL_CONF = "./database/postgres/postgresql.conf";
const DATA_VOLUME = "postgres_data";
const CONTAINER_DATA_PATH = "/var/lib/postgresql/data";
const CONTAINER_BACKUP_PATH = "/backup";

const RECOVERY_SETTINGS = `
# ── Recovery (auto-added by restore.ts — remove after recovery is complete) ──
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_action = 'promote'
`;

const RECOVERY_MARKER_START =
  "# ── Recovery (auto-added by restore.ts — remove after recovery is complete) ──";

// ── Helpers ───────────────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve));

// Converts Windows backslashes to forward slashes for Docker volume mounts
const toDockerPath = (p: string): string => p.replace(/\\/g, "/");

const run = (label: string, args: string[]): void => {
  console.log(`\n⏳ ${label}...`);

  const result = spawnSync("docker", args, { stdio: "inherit" });

  if (result.error) {
    console.error(`❌ ${label} failed:`, result.error.message);
    rl.close();
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`❌ ${label} failed with exit code ${result.status}`);
    rl.close();
    process.exit(1);
  }

  console.log(`✅ ${label} complete`);
};

// ── postgresql.conf helpers ───────────────────────────────────────────────────

const addRecoverySettings = (): void => {
  console.log("\n⏳ Adding recovery settings to postgresql.conf...");

  if (!existsSync(POSTGRESQL_CONF)) {
    console.error(`❌ postgresql.conf not found at: ${POSTGRESQL_CONF}`);
    rl.close();
    process.exit(1);
  }

  const contents = readFileSync(POSTGRESQL_CONF, "utf8");

  if (contents.includes(RECOVERY_MARKER_START)) {
    console.log("ℹ️  Recovery settings already present in postgresql.conf, skipping...");
    return;
  }

  writeFileSync(POSTGRESQL_CONF, contents + RECOVERY_SETTINGS, "utf8");
  console.log("✅ Recovery settings added to postgresql.conf");
};

const removeRecoverySettings = (): void => {
  console.log("\n⏳ Removing recovery settings from postgresql.conf...");

  const contents = readFileSync(POSTGRESQL_CONF, "utf8");
  const markerIndex = contents.indexOf(RECOVERY_MARKER_START);

  if (markerIndex === -1) {
    console.log("ℹ️  No recovery settings found in postgresql.conf, skipping...");
    return;
  }

  const cleaned = contents.substring(0, markerIndex).trimEnd() + "\n";
  writeFileSync(POSTGRESQL_CONF, cleaned, "utf8");
  console.log("✅ Recovery settings removed from postgresql.conf");
};

// ── List available backups ────────────────────────────────────────────────────

const getAvailableBackups = (): string[] => {
  if (!existsSync(BACKUPS_DIR)) {
    console.error(`❌ Backup directory not found: ${BACKUPS_DIR}`);
    process.exit(1);
  }

  const backups = readdirSync(BACKUPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse(); // most recent first

  if (backups.length === 0) {
    console.error("❌ No backups found in", BACKUPS_DIR);
    process.exit(1);
  }

  return backups;
};

// ── Main ──────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  console.log("╔══════════════════════════════════════╗");
  console.log("║     Postgres Backup Restore Tool     ║");
  console.log("╚══════════════════════════════════════╝\n");

  // 1. List backups and prompt user to choose
  const backups = getAvailableBackups();

  console.log("📦 Available backups (most recent first):\n");
  backups.forEach((name, index) => {
    console.log(`  [${index + 1}] ${name}`);
  });

  console.log();
  const input = await ask(`Select a backup to restore [1-${backups.length}]: `);
  const choice = parseInt(input, 10);

  if (isNaN(choice) || choice < 1 || choice > backups.length) {
    console.error("❌ Invalid selection");
    rl.close();
    process.exit(1);
  }

  const selectedBackup = backups[choice - 1]!;

  // Resolve absolute path and normalize slashes for Docker
  const hostBackupPath = toDockerPath(resolve(join(BACKUPS_DIR, selectedBackup)));

  console.log(`\n📂 Selected: ${selectedBackup}`);
  console.log(`📁 Resolved path: ${hostBackupPath}`);

  // 2. Ask for optional PITR target time
  const pitrInput = await ask(
    "\n⏱️  Enter a PITR target time to restore to a specific moment,\n   or press Enter to restore to the latest state.\n   Format: YYYY-MM-DD HH:MM:SS\n   > "
  );
  const pitrTime = pitrInput.trim();

  if (pitrTime) {
    const valid = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(pitrTime);
    if (!valid) {
      console.error("❌ Invalid date format. Expected: YYYY-MM-DD HH:MM:SS");
      rl.close();
      process.exit(1);
    }
    console.log(`🕐 Will restore to: ${pitrTime}`);
  } else {
    console.log("🕐 Will restore to: latest state");
  }

  // 3. Confirm
  const confirm = await ask(
    `\n⚠️  This will overwrite the current database with backup "${selectedBackup}".\n   Are you sure? (yes/no): `
  );

  if (confirm.trim().toLowerCase() !== "yes") {
    console.log("\n🚫 Restore cancelled.");
    rl.close();
    process.exit(0);
  }

  // 4. Check postgres container is stopped
  console.log("\n🔍 Checking postgres container status...");

  const inspect = spawnSync(
    "docker",
    ["inspect", "-f", "{{.State.Running}}", "postgres_database"],
    { encoding: "utf8" }
  );

  if (inspect.error || inspect.status !== 0) {
    console.log("ℹ️  Container not found or already stopped, proceeding...");
  } else {
    const isRunning = inspect.stdout.trim() === "true";
    if (isRunning) {
      console.error(
        "❌ postgres_database container is still running.\n   Stop it first with: docker compose stop postgres"
      );
      rl.close();
      process.exit(1);
    }
    console.log("✅ Container is stopped, proceeding...");
  }

  // 5. Restore base backup into volume
  run("Restoring base backup", [
    "run", "--rm",
    "-v", `${DATA_VOLUME}:${CONTAINER_DATA_PATH}`,
    "-v", `${hostBackupPath}:${CONTAINER_BACKUP_PATH}`,
    "ubuntu",
    "bash", "-c",
    `tar xzf ${CONTAINER_BACKUP_PATH}/base.tar.gz -C ${CONTAINER_DATA_PATH}`,
  ]);

  // 6. Fix ownership
  run("Fixing ownership", [
    "run", "--rm",
    "-v", `${DATA_VOLUME}:${CONTAINER_DATA_PATH}`,
    "ubuntu",
    "bash", "-c",
    `chown -R 999:999 ${CONTAINER_DATA_PATH} && chmod 700 ${CONTAINER_DATA_PATH}`,
  ]);

  // 7. Create recovery.signal in the data volume
  run("Creating recovery.signal", [
    "run", "--rm",
    "-v", `${DATA_VOLUME}:${CONTAINER_DATA_PATH}`,
    "ubuntu",
    "bash", "-c",
    `touch ${CONTAINER_DATA_PATH}/recovery.signal`,
  ]);

  // 8. Add recovery settings to postgresql.conf on host
  addRecoverySettings();

  // 9. If PITR time was provided, append recovery_target_time to postgresql.conf
  if (pitrTime) {
    console.log("\n⏳ Adding recovery_target_time to postgresql.conf...");
    const contents = readFileSync(POSTGRESQL_CONF, "utf8");
    const updated = contents.replace(
      "recovery_target_action = 'promote'",
      `recovery_target_time = '${pitrTime}'\nrecovery_target_action = 'promote'`
    );
    writeFileSync(POSTGRESQL_CONF, updated, "utf8");
    console.log("✅ recovery_target_time added");
  }

  // 10. Done
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     Restore Complete ✅                      ║
╚══════════════════════════════════════════════════════════════╝

📋 Remaining steps:

  1. Start postgres:

       docker compose start postgres

  2. Verify recovery is complete (should return 'f'):

       docker exec postgres_database psql -U postgres -c "SELECT pg_is_in_recovery();"

  3. Remove recovery settings from postgresql.conf by running:

       npm run postgres:restore:cleanup

`);

  rl.close();
};

// ── Cleanup mode ─────────────────────────────────────────────────────────────
// Run with: npm run db:restore:cleanup
// Removes recovery settings from postgresql.conf after recovery is confirmed complete

const cleanup = (): void => {
  console.log("╔══════════════════════════════════════╗");
  console.log("║     Postgres Recovery Cleanup        ║");
  console.log("╚══════════════════════════════════════╝\n");

  removeRecoverySettings();

  console.log(`
✅ Cleanup complete.

   Restart postgres to apply:
   docker compose restart postgres
`);
};

// ── Entry point ───────────────────────────────────────────────────────────────

if (process.argv[2] === "cleanup") {
  cleanup();
} else {
  main();
}