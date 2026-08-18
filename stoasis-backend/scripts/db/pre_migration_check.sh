#!/usr/bin/env bash
set -euo pipefail

: "${FLYWAY_URL:?FLYWAY_URL (jdbc:postgresql://...) is required}"
: "${FLYWAY_USER:?FLYWAY_USER is required}"
: "${FLYWAY_PASSWORD:?FLYWAY_PASSWORD is required}"
: "${EXPECTED_DATABASE_NAME:?EXPECTED_DATABASE_NAME is required}"

deploy_environment="${DEPLOY_ENVIRONMENT:-staging}"
flyway_command="${FLYWAY_COMMAND:-flyway}"

if [[ "$deploy_environment" == "production" ]]; then
  : "${BACKUP_CREATED_AT:?BACKUP_CREATED_AT is required for production}"
  : "${STAGING_MIGRATION_VERIFIED:?STAGING_MIGRATION_VERIFIED is required for production}"
  if [[ "$STAGING_MIGRATION_VERIFIED" != "true" ]]; then
    echo "The staging migration has not been verified." >&2
    exit 1
  fi

  backup_epoch="$(date -u -d "$BACKUP_CREATED_AT" +%s 2>/dev/null || date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$BACKUP_CREATED_AT" +%s)"
  now_epoch="$(date -u +%s)"
  if (( now_epoch - backup_epoch > 86400 )); then
    echo "The production backup is older than 24 hours." >&2
    exit 1
  fi
fi

actual_database="$(PGPASSWORD="$FLYWAY_PASSWORD" psql "${FLYWAY_URL#jdbc:}" -U "$FLYWAY_USER" \
  -v ON_ERROR_STOP=1 -Atc 'SELECT current_database();')"
if [[ "$actual_database" != "$EXPECTED_DATABASE_NAME" ]]; then
  echo "Connected to '$actual_database', expected '$EXPECTED_DATABASE_NAME'." >&2
  exit 1
fi

"$flyway_command" \
  -url="$FLYWAY_URL" \
  -user="$FLYWAY_USER" \
  -password="$FLYWAY_PASSWORD" \
  validate

