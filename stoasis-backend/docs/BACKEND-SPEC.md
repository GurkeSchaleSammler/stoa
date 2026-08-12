# Stoasis Backend Specification

## Ziel und Architektur

Das Backend stellt die REST-API für das signal-basierte Angular-Frontend bereit. Die fachlichen Grenzen liegen unter `com.stoasis.backend.domains`. Jede Domain trennt HTTP-Vertrag (`api`), Use Cases und Berechtigungen (`application`), Persistenz (`data`) sowie optionale Fachmodelle (`model`). Gemeinsame HTTP- und Security-Infrastruktur liegt unter `shared`.

Aktuelle Domains: Auth, Collection, Pin, Membership, Profile, Search/Tags, Upload und Link Preview.

## Technischer Stand

- Java Toolchain 25
- Kotlin 2.3.21 mit Spring- und JPA-Compiler-Plugins
- Spring Boot 4.1.0, Spring MVC, Spring Security und Actuator
- Spring Data JPA / Hibernate 7
- Flyway für versionierte Schemaänderungen
- Jackson 3 mit Kotlin-Modul
- Spring Mail für SMTP-Versand
- Jsoup 1.22.2 für passives Metadaten-Parsing ohne JavaScript-Ausführung
- H2 In-Memory ausschliesslich im Profil `local`

## Persistenzprofile

`local` ist derzeit das Default-Profil und benötigt keine externe Datenbank. Flyway führt zuerst `db/migration/V1__initial_schema.sql` und danach den lokalen Dump `db/local/V100__local_dump.sql` aus. Durch `jdbc:h2:mem:stoasis` wird die Datenbank bei jedem Prozessstart reproduzierbar neu aufgebaut.

Produktive Profile dürfen `db/local` nicht in `spring.flyway.locations` aufnehmen. Für PostgreSQL wird später eine eigene DataSource-Konfiguration ergänzt; das allgemeine Schema bleibt über Flyway versioniert. `ddl-auto=validate` bleibt aktiv, damit Entity und Migration nicht unbemerkt auseinanderlaufen.

## API- und Sicherheitsregeln

- Authentifizierung erfolgt über eine serverseitige, 30 Tage gültige HttpOnly-Session.
- Passwörter neuer Nutzer werden mit BCrypt gespeichert. `{noop}` ist nur im lokalen Seed zulässig.
- Collections erzwingen die Rollen `owner`, `editor` und `viewer` in den Application Services.
- Schreibzugriff auf Pins ist für Owner und Editor möglich; Mitgliederverwaltung und Collection-Löschung nur für Owner.
- API-Fehler haben ein einheitliches JSON-Format mit `message` und optionalen Feldfehlern.
- CORS erlaubt im lokalen Stand nur das Angular-Frontend auf Port 4200.
- Uploads werden als Binärdaten gespeichert; das Profil kann die erhaltene `imageUrl` direkt verwenden.
- Link-Vorschauen dürfen ausschliesslich serverseitig geladen werden. Erlaubt sind öffentliche HTTP(S)-Ziele auf Port 80/443; private, lokale, reservierte und Link-Local-Adressen sowie jede Redirect-Kette dorthin werden blockiert. DNS-Prüfung und Socket-Verbindung verwenden dieselbe IP.
- Fremdes JavaScript, CSS oder HTML wird niemals im Client ausgeführt. HTML wird grössenbegrenzt mit Jsoup als Datenstruktur gelesen. Nur dekodierbare PNG/JPEG-Vorschaubilder werden nach Pixel-/Grössenprüfung als neues statisches JPEG gespeichert und über Stoasis ausgeliefert.
- Magic Links werden über Spring Mail/SMTP versendet. Tokens besitzen mindestens 256 Bit Entropie, werden nur als SHA-256-Hash persistiert, verfallen nach 15 Minuten, werden durch ein atomisches Datenbank-Update genau einmal eingelöst und pro E-Mail/IP gedrosselt. SMTP-Zeitlimits sind zwingend konfiguriert.
- Das Abo-Modell ist kein fachlich aktiver Backend-Bereich. Das für Frontend-Kompatibilität vorhandene Feld `plan` bleibt lokal immer `free`; Billing-Endpunkte werden nicht angeboten.

Vor einem Produktivbetrieb sind CSRF-Schutz für Cookie-Sessions, sichere Cookies (`Secure`), Rate Limits für Auth/Upload sowie ein externer Object Store für Bilder zu ergänzen.

## Lokale Abnahmekriterien

Automatisierte Integrationstests müssen mindestens Folgendes prüfen:

1. Seed-Login und Sessionprüfung.
2. Laden von Collections, Mitgliedern und Pins aus dem lokalen Dump.
3. Collection und Pin anlegen, Pin ändern und suchen.
4. Pin und Collection löschen.
5. Rollen- und Zugriffsschutz für nicht authentifizierte Nutzer.

Die Tests starten eine frische H2-Datenbank und werden mit `./gradlew test` ausgeführt.
