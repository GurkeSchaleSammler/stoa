# Stoasis Backend

Kotlin/Spring-Backend für das Angular-Frontend in `../stoasis-frontend`.

## Stack

- Java 25 Toolchain
- Kotlin 2.3.21
- Spring Boot 4.1.0 / Spring MVC / Spring Security
- Spring Data JPA
- Flyway
- Spring Mail mit SMTP und Resend HTTP API
- Jsoup 1.22.2 für statisches HTML-Metadaten-Parsing
- H2 In-Memory im Profil `dev`
- PostgreSQL im Profil `prod`
- Jackson 3 Kotlin

## Dev starten und bauen

Das Profil `dev` ist das Default-Profil. Die Datenbank bleibt vollständig in-memory. Für echte Magic-Link-Testmails kann Mailpit separat gestartet werden:

```bash
docker compose up -d mailpit
./gradlew bootRun
```

Backend: `http://localhost:4000`  
H2-Konsole: `http://localhost:4000/h2-console`
Mailpit-Postfach: `http://localhost:8025`

- JDBC URL: `jdbc:h2:mem:stoasis`
- User: `sa`
- Passwort: leer

Der Dump `src/main/resources/db/local/V100__local_dump.sql` wird nach dem allgemeinen Schema automatisch durch Flyway geladen. Bei jedem Neustart entsteht eine frische reproduzierbare Datenbank.

Testlogin: `du@stoa.test` / `test1234`

Ein ausführbares Dev-Artefakt bauen und starten:

```bash
./gradlew clean bootJar
java -jar build/libs/stoasis.jar
```

Ohne explizites Profil verwendet die Anwendung automatisch `dev`.

## Prod bauen und starten

Das JAR ist für Dev und Prod identisch; das Spring-Profil wird erst beim Start gewählt:

```bash
./gradlew clean bootJar
java -jar build/libs/stoasis.jar --spring.profiles.active=prod
```

Vor dem Prod-Start müssen mindestens diese Variablen gesetzt sein:

```text
PGHOST
PGPORT
PGDATABASE
PGUSER
PGPASSWORD
STOASIS_FRONTEND_URL
STOASIS_PUBLIC_API_URL
STOASIS_CORS_ALLOWED_ORIGINS
```

Das Profil `prod` verwendet PostgreSQL und lädt ausschließlich die allgemeinen Migrationen unter `db/migration`. Lokale Seeds werden nicht ausgeführt.

## Docker

Image bauen:

```bash
docker build -t stoasis-backend .
```

Dev starten – ohne Argument:

```bash
docker run --rm -p 4000:4000 stoasis-backend
```

Prod starten – mit dem Argument `prod` und einer Datei mit den benötigten Umgebungsvariablen:

```bash
docker run --rm -p 4000:4000 \
  --env-file .env.prod \
  stoasis-backend prod
```

Für den kompletten lokalen Dev-Stack mit Frontend und Mailpit genügt im Repository-Root:

```bash
docker compose up --build
```

Der Container lauscht standardmäßig auf Port `4000`; `PORT` kann ihn überschreiben. Der Healthcheck ist unter `/actuator/health` erreichbar.

## Tests

```bash
./gradlew test
```

## Domain-Struktur

```text
com.stoasis.backend
├── domains
│   ├── auth
│   ├── collection
│   ├── pin
│   ├── membership
│   ├── profile
│   ├── search
│   ├── upload
│   └── link
└── shared
    ├── security
    └── web
```

Jede Domain ist weiter in `api`, `application`, `data` und bei Bedarf `model` gegliedert. Controller definieren den HTTP-Vertrag, Application Services enthalten Use Cases und Berechtigungsregeln, Data enthält JPA-Entities und Repositories.

## Lokale Authentifizierung

Das Frontend erhält ein serverseitiges `HttpOnly`-Session-Cookie. Für lokale Seeds wird `{noop}test1234` verwendet; neu registrierte Konten werden mit BCrypt gespeichert. Der Local-Dump darf nie als Produktionsmigration eingebunden werden.

## Zentrale Endpunkte

- `/api/auth/**`
- `/api/collections/**`
- `/api/collections/{id}/pins/**`
- `/api/collections/{id}/members/**`
- `/api/profile/**`
- `/api/uploads/**`
- `/api/search`
- `/api/tags`
- `/api/links/preview`
- `/api/links/previews/{id}`

## Sichere Link-Vorschauen

Das Backend lädt ausschliesslich öffentliche HTTP(S)-Ziele auf Port 80/443. DNS-Ergebnisse werden vor dem Abruf gegen lokale, private, Link-Local-, Multicast- und Cloud-Metadatenbereiche geprüft und dieselbe validierte IP wird für die Socket-Verbindung verwendet. Weiterleitungen werden einzeln neu geprüft. HTML und Bilder besitzen harte Grössen- und Zeitlimits.

Es wird niemals JavaScript einer Zielseite ausgeführt. Jsoup liest nur statische Open-Graph-/Twitter-Metadaten. Ein gefundenes PNG/JPEG wird vollständig dekodiert, auf feste Abmessungen begrenzt und als neues JPEG gespeichert. SVG, HTML, Skripte, Animationen und unbekannte Bildformate werden nicht an den Browser weitergereicht. Fehlt ein geeignetes Bild, erzeugt Stoasis aus den Metadaten einen statischen Snapshot.

## E-Mail in Produktion

Der lokale Versand nutzt standardmäßig SMTP mit Mailpit. In Produktion nutzt Stoasis im Profil `prod` standardmäßig Resend über HTTPS, damit Deployments auf Hosts mit eingeschränkten SMTP-Ports funktionieren.

Für Railway mit Resend werden im Backend-Service diese Variablen gesetzt:

```text
STOASIS_MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxx
STOASIS_MAIL_FROM=Stoasis <no-reply@deine-domain.ch>
STOASIS_FRONTEND_URL=https://deine-frontend-domain
STOASIS_PUBLIC_API_URL=https://deine-backend-domain
STOASIS_CORS_ALLOWED_ORIGINS=https://deine-frontend-domain
```

Optional kann `RESEND_API_URL` gesetzt werden. Ohne Wert wird `https://api.resend.com/emails` verwendet.

SMTP bleibt weiterhin unterstützt. Dafür `STOASIS_MAIL_PROVIDER=smtp` setzen und diese Variablen konfigurieren: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS`, `STOASIS_MAIL_FROM`, `STOASIS_FRONTEND_URL` und `STOASIS_PUBLIC_API_URL`.

Magic-Link-Tokens werden nur gehasht gespeichert, laufen nach 15 Minuten ab, sind auch bei parallelen Aufrufen atomar einmalig und werden pro E-Mail/IP gedrosselt.

## Feature limits and image storage

Free accounts can activate 2 shared boards with 3 members each, create 50 photo pins and maintain 12 skills. Premium allows 25 shared boards with 25 members, 2,000 photos and up to 10,000 skills. Membership in another user's boards does not consume the owned-board capacity. Existing content remains accessible after a downgrade.

Uploads accept decoded JPEG, PNG and WebP images up to 5 MB (Free) or 20 MB (Premium), with at most 12,000 pixels per side and 40 megapixels. Stored previews strip metadata, are limited to 1,600 or 3,200 pixels, and include a 480-pixel thumbnail. Accounts are limited to 20 upload attempts per minute. Unused uploads can be discarded through `DELETE /api/uploads/{fileKey}`; referenced photos and avatars are retained. Upload storage allows 10 spare files beyond the photo capacity for pending photos and avatars.

Development stores image variants in the database. Production writes new images to `STOASIS_UPLOAD_DIRECTORY` (default `/data/uploads`) and still reads existing database images. Mount a persistent volume at that path, writable by the `stoasis` container user, and back it up with PostgreSQL. All replicas must share the same durable volume. A separate object-store integration is not required for this setup.

CSV imports require UTF-8 with `url` or `resolved_url`, optional `title` and `tags` columns, at most 10 MB, and 100 or 10,000 rows per batch. Quoted fields and multiline values are supported. Preview with `POST /api/profile/import/pocket/preview?collectionId=...`, then confirm the same file and destination in the same session through `POST /api/profile/import/pocket?collectionId=...`. Duplicate, invalid and non-link rows are reported separately. Rows without free board space are reported as failed; valid rows commit together. Imports never fetch URLs. JSON export is available once per UTC calendar day with Free. Premium adds repeated CSV exports and `scope=account`, including owned image bytes, tags and saved searches; account archives allow up to 64 MB of image data.

MCP authorization requires Premium and a separate MCP session. `DELETE /api/profile/mcp` invalidates all current MCP sessions and grants without signing the browser out. Set `STOASIS_MCP_PUBLIC_URL` to the public MCP endpoint including `/mcp` to show setup instructions in the profile. Production OAuth storage remains PostgreSQL in the MCP service.
