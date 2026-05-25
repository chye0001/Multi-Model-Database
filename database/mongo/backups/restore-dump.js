import { execFileSync } from "child_process";
import { readdirSync, statSync, existsSync } from "fs";
import { resolve, sep, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, "../../..");
const dumpsDir = resolve(projectRoot, "database/mongo/backups/dumps");
const envFile = resolve(projectRoot, ".env");

if (!existsSync(dumpsDir)) {
  console.error(`No dumps directory at ${dumpsDir}`);
  process.exit(1);
}

const arg = process.argv[2];
const folders = readdirSync(dumpsDir).filter((f) =>
  statSync(resolve(dumpsDir, f)).isDirectory()
);

if (folders.length === 0) {
  console.error(`No dumps found in ${dumpsDir}`);
  process.exit(1);
}

const dumpFolder = arg ?? folders.sort().reverse()[0];
if (!folders.includes(dumpFolder)) {
  console.error(`Dump folder "${dumpFolder}" not found. Available: ${folders.join(", ")}`);
  process.exit(1);
}

// Docker on Windows needs forward slashes and /c/ style drive letters
const toDockerPath = (p) => {
  const fwd = p.split(sep).join("/");
  return process.platform === "win32"
    ? "/" + fwd.replace(":", "").toLowerCase()
    : fwd;
};

console.log(`Restoring from /dump/${dumpFolder}...`);

execFileSync(
  "docker",
  [
    "run", "--rm",
    "--network", "database_network",
    "--env-file", envFile,
    "-v", `${toDockerPath(dumpsDir)}:/dump`,
    "mongo:7",
    "bash", "-c",
    `mongorestore --host mongo-replicaset:27017 ` +
      `--username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" ` +
      `--authenticationDatabase admin --gzip --drop /dump/${dumpFolder}`,
  ],
  { stdio: "inherit", cwd: projectRoot }
);

console.log("Restore complete.");
