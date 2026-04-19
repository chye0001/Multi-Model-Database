#!/bin/bash
set -euo pipefail

MONGO_HOST="mongo-standalone"
MONGO_PORT="27017"
BACKUP_ROOT="/mongo_backup"
TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
DEST="${BACKUP_ROOT}/${TIMESTAMP}"

# Credentials — read from environment, never hardcoded
MONGO_USER="backup_agent"
MONGO_PASS="${MONGO_BACKUP_PASSWORD}"

# Convenience wrapper so auth flags aren't repeated everywhere
mongosh_cmd() {
  mongosh \
    --host "$MONGO_HOST" \
    --port "$MONGO_PORT" \
    --username "$MONGO_USER" \
    --password "$MONGO_PASS" \
    --authenticationDatabase "admin" \
    --quiet \
    --eval "$1"
}

echo "[$(date)] Starting physical MongoDB backup..."

echo "[$(date)] Acquiring fsyncLock..."
mongosh_cmd "
  const result = db.adminCommand({ fsync: 1, lock: true });
  if (!result.ok) { print('fsyncLock FAILED'); quit(1); }
  print('fsyncLock acquired, lockCount: ' + result.lockCount);
"

echo "[$(date)] Copying data files to ${DEST}..."
mkdir -p "$DEST"
cp -a /data/db/. "$DEST/"

echo "[$(date)] Releasing fsyncLock..."
mongosh_cmd "
  const result = db.adminCommand({ fsyncUnlock: 1 });
  print('Unlocked, lockCount now: ' + result.lockCount);
"

echo "[$(date)] Backup complete → ${DEST}"

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +
echo "[$(date)] Old backups pruned."