#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/lib/postgresql/base_backup/${TIMESTAMP}"

echo "Waiting for postgres to be ready..."
until pg_isready -h postgres -U "$POSTGRES_USER"; do
  echo "Postgres not ready yet, retrying in 5 seconds..."
  sleep 5
done

echo "Starting base backup at ${TIMESTAMP}..."

PGPASSWORD="$POSTGRES_BACKUP_PASSWORD" pg_basebackup \
  -h postgres \
  -U "$POSTGRES_BACKUP_USER" \
  -D "$BACKUP_DIR" \
  -Ft \
  -Xstream \
  -z \
  -P

if [ $? -eq 0 ]; then
  echo "Base backup complete: ${BACKUP_DIR}"
else
  echo "Base backup FAILED"
  exit 1
fi