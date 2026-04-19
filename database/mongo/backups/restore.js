import { execFileSync } from "child_process";
import { resolve, sep, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const composeFile = "docker-compose.db.yml";
const backupsDir = resolve(__dirname, "../../..");
const mongoBackups = resolve(backupsDir, "database/mongo/backups");

// Convert to forward slashes (required for Docker on Windows)
const backupsDirDocker = mongoBackups.split(sep).join("/");

// On Windows, convert C:/Users/... → /c/Users/... for Docker Desktop
const normalized =
  process.platform === "win32"
    ? "/" + backupsDirDocker.replace(":", "").toLowerCase()
    : backupsDirDocker;

const runCompose = (action) =>
  execFileSync(
    "docker",
    ["compose", "-f", composeFile, action, "mongo", "mongo-backup"],
    { stdio: "inherit" }
  );

console.log("Stopping mongo containers...");
runCompose("stop");

console.log("Running restore...");
execFileSync(
  "docker",
  [
    "run", "--rm", "-it",
    "-v", "mongo_data:/data/db",
    "-v", `${normalized}:/mongo_backup`,
    "mongo:7",
    "bash", "/mongo_backup/restore.sh",
  ],
  { stdio: "inherit" }
);

console.log("Starting mongo containers...");
runCompose("start");