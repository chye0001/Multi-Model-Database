#!/bin/bash
set -euo pipefail

BACKUP_ROOT="/mongo_backup/base"

# ── 1. List available backups ─────────────────────────────────────────────────
echo ""
echo "Available backups:"
echo "──────────────────"
i=1
declare -a BACKUPS
while IFS= read -r dir; do
  BACKUPS[$i]="$dir"
  echo "  [$i] $(basename "$dir")"
  ((i++))
done < <(find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d | sort)

if [ ${#BACKUPS[@]} -eq 0 ]; then
  echo "No backups found in $BACKUP_ROOT"
  exit 1
fi

# ── 2. Prompt user to pick one ────────────────────────────────────────────────
echo ""
read -rp "Enter backup number to restore: " CHOICE

if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt ${#BACKUPS[@]} ]; then
  echo "Invalid choice: $CHOICE"
  exit 1
fi

SELECTED="${BACKUPS[$CHOICE]}"
echo ""
echo "Selected: $(basename "$SELECTED")"
echo ""
read -rp "This will OVERWRITE current MongoDB data. Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# ── 3. Wipe current data and copy backup in ───────────────────────────────────
# No lock/unlock needed — mongo must be stopped before swapping physical files.
# The npm script handles stop/start around this script.
echo ""
echo "[$(date)] Clearing current data files..."
rm -rf /data/db/*

echo "[$(date)] Copying backup files from $(basename "$SELECTED")..."
cp -a "$SELECTED/." /data/db/

echo ""
echo "[$(date)] Restore complete from: $(basename "$SELECTED")"