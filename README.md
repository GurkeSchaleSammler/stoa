# Stoasis

Stoasis ist eine visuelle Web-App zum Sammeln und gemeinsamen Organisieren von Links, Notizen und Bildern.

## Architektur

Stoasis ist als Monorepo mit drei unabhängig gebauten Anwendungen organisiert. Browser-API-Aufrufe bleiben unter derselben Origin und werden intern an das Backend weitergeleitet; ChatGPT erreicht den separaten MCP-Endpunkt über HTTPS und OAuth 2.1.

```mermaid
flowchart LR
    Browser["Browser"] -->|"HTTPS"| Frontend["Frontend-Container<br/>Angular + Caddy"]
    ChatGPT["ChatGPT"] -->|"HTTPS + OAuth 2.1"| MCP["MCP-Container<br/>Node + Streamable HTTP"]
    Frontend -->|"/api über internes Netzwerk"| Backend["Backend-Container<br/>Kotlin + Spring Boot"]
    MCP -->|"Session-authentifizierte API-Aufrufe"| Backend
    Backend --> Database["Datenbank<br/>H2 in Dev / PostgreSQL in Prod"]
    Backend --> Mail["SMTP-Dienst<br/>Mailpit in Dev / Mail-Provider in Prod"]
    Backend --> Web["Externe Websites<br/>abgesicherte Link-Vorschau"]
```

### Komponenten

- `stoasis-frontend`: Angular-Single-Page-App. Caddy liefert die statischen Dateien aus, übernimmt den SPA-Fallback und leitet `/api` an das Backend weiter.
- `stoasis-backend`: Spring-Boot-API mit Session-Authentifizierung, Domain-Services, Flyway-Migrationen, Uploads und abgesichertem Abruf von Link-Metadaten.
- `stoasis-mcp`: Remote-MCP mit OAuth 2.1/PKCE, vollständigem räumlichem Board-Modell und visueller Boardansicht für ChatGPT.
- `compose.yaml`: Lokales Netzwerk für Frontend, Backend, MCP und Mailpit. Service-Namen dienen als interne DNS-Namen.
- `.github/workflows`: Drei unabhängige Image-Builds für Frontend, Backend und MCP.

### Request- und Datenfluss

1. Der Browser lädt die Anwendung ausschließlich über den Frontend-Service.
2. Alle Requests an `/api` werden vom Frontend-Proxy intern an das Backend gesendet.
3. ChatGPT verbindet den öffentlichen MCP-Endpunkt und autorisiert den Benutzer über OAuth 2.1/PKCE.
4. MCP-Aufrufe verwenden serverseitig eine verschlüsselt gespeicherte Stoasis-Sitzung; Zugangspasswörter werden nicht gespeichert.
5. Das Backend authentifiziert Benutzer über ein serverseitiges `HttpOnly`-Session-Cookie.
6. Flyway verwaltet dasselbe relationale Schema in beiden Umgebungen.
7. Absolute Upload-, Einladungs- und Magic-Link-URLs werden aus konfigurierten öffentlichen Basis-URLs erzeugt; interne Service-Adressen gelangen nicht zum Browser.

### Umgebungen

| Modus | Frontend | Backend | MCP | Infrastruktur |
|---|---|---|---|---|
| Dev | unoptimiertes Bundle mit Source Maps | Profil `dev`, H2 und lokale Seeds | lokaler, flüchtiger OAuth-Speicher | Mailpit, lokale Ports |
| Prod | optimiertes und gehashtes Bundle | Profil `prod`, PostgreSQL, sichere Cookies | HTTPS, OAuth 2.1 und PostgreSQL | externer SMTP-Dienst, internes Servicenetz |

Die konkreten Befehle und Variablen stehen in den jeweiligen Projekt-READMEs:

- [Frontend starten und bauen](stoasis-frontend/README.md)
- [Backend starten und bauen](stoasis-backend/README.md)
- [MCP starten, testen und mit ChatGPT verbinden](stoasis-mcp/README.md)
- [Container- und Deployment-Konfiguration](DEPLOYMENT.md)

## Lokal mit allen Services starten

```bash
docker compose up --build
```

- Anwendung: `http://localhost:8080`
- Backend direkt: `http://localhost:4000`
- Mailpit: `http://localhost:8025`
- MCP: `http://localhost:3000/mcp`

## Weitere Architekturartefakte

- [Komponentendiagramm](stoa_uml_component_diagram.svg)
- [UI-Wireframe](stoa-wireframe.html)
- [Relationales Datenmodell](stoa_erd_relational.html)
- [Dokumentenmodell](stoa_document_model.html)
