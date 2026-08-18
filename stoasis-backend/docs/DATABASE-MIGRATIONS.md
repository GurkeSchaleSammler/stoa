# Datenbank-Migrationen

Das produktive Backend migriert die Datenbank nicht beim Start. `application-prod.yaml`
deaktiviert Flyway im App-Prozess; Hibernate validiert das bereits migrierte Schema beim
Boot weiterhin mit `ddl-auto=validate`.

Der freigegebene Pipeline-Einstiegspunkt ist:

```bash
scripts/db/migrate_and_verify.sh
```

Er führt zwingend nacheinander Verbindungsschutz, Backup-/Staging-Nachweis,
`flyway validate`, `flyway migrate` und die SQL-Nachprüfung aus. Benötigte Variablen:

- `FLYWAY_URL`, `FLYWAY_USER`, `FLYWAY_PASSWORD`
- `EXPECTED_DATABASE_NAME`
- `DEPLOY_ENVIRONMENT` (`staging` oder `production`)
- für Produktion zusätzlich `BACKUP_CREATED_AT` (UTC, maximal 24 Stunden alt) und
  `STAGING_MIGRATION_VERIFIED=true`
- optional `FLYWAY_COMMAND`, falls der Flyway-Binary nicht `flyway` heißt

Erst nach einem erfolgreichen Exit-Code darf das neue Backend-Image ausgerollt werden.
Bei einem Fehler wird kein automatischer Schema-Rollback versucht. Das alte Backend-Image
kann wegen der additiven Migrationen weiterverwendet werden; Datenkorrekturen oder ein
Restore werden separat geprüft und ausgeführt.

Das Feature ist im Produktionsprofil standardmäßig deaktiviert und kann während des
Rollouts mit `STOASIS_SKILLS_ENABLED=true` schrittweise aktiviert werden.
