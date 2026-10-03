# PostgreSQL and Upload Backup/Restore Runbook

This runbook keeps the PostgreSQL database and production upload volume recoverable as one
application snapshot. Do not restore over the live database or upload directory while
validating a backup.

## Backup

1. Choose a maintenance window and stop writes from both the backend and MCP services. This
   keeps the database and upload volume at a consistent point in time.
2. Create a new, access-restricted backup directory. Set `PGHOST`, `PGPORT`, `PGDATABASE`,
   `PGUSER`, and `PGPASSWORD` through the approved secret manager; do not put credentials in
   shell history or the archive.
3. Dump PostgreSQL in custom format and archive the complete configured upload directory:

   ```bash
   pg_dump --format=custom --no-owner --no-privileges --file=stoasis-db.dump
   tar --create --file=stoasis-uploads.tar --directory=/data uploads
   ```

   If `STOASIS_UPLOAD_DIRECTORY` differs from `/data/uploads`, use its configured path.
4. Record the UTC timestamp and database name next to the snapshot. Create checksums for both
   archives, verify them, and copy the archives and checksum file to encrypted durable storage
   outside the application host.
5. Resume backend and MCP writes after the database dump and upload archive have completed.

## Restore rehearsal

1. Verify archive checksums and restore into a new, isolated PostgreSQL database and a new
   upload directory. Never point the rehearsal at production storage.
2. Restore the database with `pg_restore --exit-on-error --no-owner --no-privileges` and
   extract the upload archive into the isolated directory.
3. Start a backend configured to use only those restored resources. Confirm Flyway validation,
   Hibernate schema validation, health/readiness, authentication, board reads, and retrieval
   of representative uploaded images.
4. Check foreign-key constraints and compare record counts for users, collections, pins, and
   uploads against the backup metadata. Record restore duration and any missing files.
5. Destroy the isolated rehearsal resources after the result is recorded and retention policy
   permits it.

## Production recovery

1. Declare the incident and stop writes from backend and MCP services.
2. Preserve the current database and upload volume as evidence. Restore into new resources from
   one verified snapshot; do not overwrite the current resources during recovery.
3. Run the restore rehearsal checks against the recovery resources. Confirm the app uses the
   restored database and matching upload directory before routing traffic to it.
4. Resume services and monitor database errors, upload retrieval, and application health.
   Retain the old resources until recovery is accepted and the incident owner authorizes cleanup.

Define and record the service's approved recovery point objective (RPO), recovery time objective
(RTO), backup retention, and restore-rehearsal frequency with the deployment owner.
