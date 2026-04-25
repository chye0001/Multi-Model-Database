#!/bin/bash
set -e

BACKUP_DIR="/neo4j_backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="$BACKUP_DIR/neo4j_$TIMESTAMP.dump"
RETENTION_DAYS=7

echo "=== Neo4j Backup Started: $TIMESTAMP ==="

# ── Step 1: Start neo4j so it can replay WAL and recover ──────────────────
echo "Starting neo4j for recovery..."
docker start neo4j

echo "Waiting for neo4j to finish recovery and become ready..."
until docker exec neo4j cypher-shell -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" "RETURN 1" > /dev/null 2>&1; do
  echo "  ...still waiting"
  sleep 3
done
echo "Neo4j is ready."

# ── Step 2: Clean shutdown — flushes WAL properly ────────────────────────
echo "Stopping neo4j cleanly..."
docker stop neo4j
echo "Waiting for full shutdown..."
sleep 5

# ── Step 3: Dump ──────────────────────────────────────────────────────────
echo "Running dump..."
neo4j-admin database dump neo4j \
  --to-path="$BACKUP_DIR" \
  --overwrite-destination=true

mv "$BACKUP_DIR/neo4j.dump" "$DUMP_FILE"
echo "Backup saved to: $DUMP_FILE"

# ── Step 4: Bring neo4j back up ───────────────────────────────────────────
echo "Restarting neo4j..."
docker start neo4j

# ── Step 5: Prune old backups ─────────────────────────────────────────────
echo "Pruning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.dump" -mtime +$RETENTION_DAYS -delete

echo "=== Backup Complete: $DUMP_FILE ==="