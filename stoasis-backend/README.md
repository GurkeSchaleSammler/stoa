# Stoasis Backend

Kotlin/Spring-Backend für das Angular-Frontend in `../stoasis-frontend`.

## Stack

- Java 25 Toolchain
- Kotlin 2.3.21
- Spring Boot 4.1.0 / Spring MVC / Spring Security
- Spring Data JPA
- Flyway
- Spring Mail mit SMTP
- Jsoup 1.22.2 für statisches HTML-Metadaten-Parsing
- H2 In-Memory im Profil `local`
- Jackson 3 Kotlin

## Lokal starten

Das Profil `local` ist das Default-Profil. Die Datenbank bleibt vollständig in-memory. Für echte Magic-Link-Testmails wird Mailpit als lokaler SMTP-Server gestartet:

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

## SMTP in Produktion

Der produktive Versand nutzt dieselbe Spring-Mail-Integration. Folgende Umgebungsvariablen konfigurieren den SMTP-Anbieter: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS`, `STOASIS_MAIL_FROM`, `STOASIS_FRONTEND_URL` und `STOASIS_PUBLIC_API_URL`. Magic-Link-Tokens werden nur gehasht gespeichert, laufen nach 15 Minuten ab, sind auch bei parallelen Aufrufen atomar einmalig und werden pro E-Mail/IP gedrosselt.
