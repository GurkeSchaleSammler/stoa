#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
flyway_command="${FLYWAY_COMMAND:-flyway}"

"$script_dir/pre_migration_check.sh"

"$flyway_command" \
  -url="$FLYWAY_URL" \
  -user="$FLYWAY_USER" \
  -password="$FLYWAY_PASSWORD" \
  migrate

PGPASSWORD="$FLYWAY_PASSWORD" psql "${FLYWAY_URL#jdbc:}" -U "$FLYWAY_USER" \
  -v ON_ERROR_STOP=1 -f "$script_dir/post_migration_verify.sql"

