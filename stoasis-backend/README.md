# Stoasis Backend

Kotlin/Spring-Backend für das Angular-Frontend in `../stoasis-frontend`.

## Stack

- Java 25 Toolchain
- Kotlin 2.3.21
- Spring Boot 4.1.0 / Spring MVC / Spring Security
- Spring Data JPA
- Flyway
- H2 In-Memory im Profil `local`
- Jackson 3 Kotlin

## Lokal starten

Das Profil `local` ist das Default-Profil. Es benötigt keine externe Datenbank:

```bash
./gradlew bootRun
```

Backend: `http://localhost:4000`  
H2-Konsole: `http://localhost:4000/h2-console`

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
