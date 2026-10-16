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

`V15` legt die PostgreSQL-Tabellen für gemeinsam genutzte HTTP-Sessions an. Die Migration
ist additiv und verändert keine vorhandenen Nutzerdaten. Beim erstmaligen Wechsel vom
prozesslokalen Session-Speicher gehen noch aktive Backend-Sessions verloren; betroffene
Nutzer melden sich einmal neu an. Danach überstehen Backend-Neustarts und mehrere
Backend-Replikas den Wechsel ohne erneute Anmeldung.

Das Feature ist im Produktionsprofil standardmäßig deaktiviert und kann während des
Rollouts mit `STOASIS_SKILLS_ENABLED=true` schrittweise aktiviert werden.

`V16` ergänzt `user_flags` für versionierte Tutorials. Die Migration ist additiv und
benötigt keinen Backfill. Vor dem neuen Backend-Image den vorhandenen Pipeline-Einstieg
ausführen. Ein App-Rollback kann die Tabelle unverändert stehen lassen. Pro Nutzer und
Tutorial bleibt die erste Auswahl (`completed`/`skipped`) erhalten; Kontolöschung entfernt
die Flags über den Foreign Key. Vertrag und Verifikation: `spec/09-board-templates-and-reuse.md`.

`V19` ergänzt die gespeicherte Breite, die ursprüngliche Höhe und den Status manuell
vergrösserter Pins. Bestehende Pins behalten ihre Größe; die ursprüngliche Höhe wird
aus `height_clips` übernommen. Die Migration ist additiv und muss vor dem neuen
Backend-Image über den vorhandenen Pipeline-Einstieg ausgeführt werden.

`V20` ergänzt Verbindungsbeschriftungen, Präsentationspfade mit geordneten Stationen
und explizite Zeitstrahl-Daten. Bestehende Verbindungen erhalten eine leere Beschriftung;
es ist kein Backfill erforderlich. Pfadstationen und Datumszuordnungen werden beim
Löschen des jeweiligen Pins entfernt. Vor dem neuen Backend-Image die Migration
über den bestehenden Pipeline-Einstieg ausführen. Ein App-Rollback lässt die neuen
Tabellen und die Spalte stehen. Vertrag: `docs/api/board-experience.md` im Repository-Root.
