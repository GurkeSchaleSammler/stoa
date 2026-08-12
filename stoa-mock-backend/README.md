# Stoa Mock-Backend

Ein dokumentbasierter In-Memory-Server, der die komplette Stoa-API abbildet –
Auth (inkl. Magic Link), Collections, Pins, Membership, Suche, Tags, Uploads
und Profilfunktionen. Kein echtes
Kotlin-Backend nötig, um das Angular-Frontend zu entwickeln.

**Wichtig:** Kein echtes Sicherheitsmodell (Klartext-Passwörter, keine
Ablauf-Validierung für Sessions). Nur für lokale Entwicklung gedacht.

## Setup

```bash
cd stoa-mock-backend
npm install
npm start
```

Server läuft dann auf `http://localhost:4000`. Für den Angular-Dev-Server
(läuft typischerweise auf `:4200`) ist CORS mit `credentials: true` bereits
konfiguriert.

Mit `npm run dev` startet der Server im Watch-Mode (Node's `--watch`) und
lädt bei Code-Änderungen automatisch neu.

## Testnutzer

Passwort für alle: `test1234`

| E-Mail | Name | Plan |
|---|---|---|
| `du@stoa.test` | Du | premium |
| `anna@stoa.test` | Anna Lehmann | free |
| `marco@stoa.test` | Marco Keller | free |
| `sara@stoa.test` | Sara Roth | premium |

## Testdaten

Drei vorbereitete Sammlungen (siehe `seed-data.mjs`):

- **coll-japan** – "Japan-Trip 2027", geteilt (Du + Anna + Marco), 5 Pins
  aller drei Typen (Link, Foto, Notiz), inklusive einem Kommentar
- **coll-dev** – "Stoa Dev-Ressourcen", privat, nur Links + Notizen erlaubt
- **coll-rezepte** – "Rezepte mit Sara", geteilt, mit aktivem Invite-Token

## Magic Link testen

`POST /api/auth/magic-link` verschickt keine echte E-Mail, sondern gibt den
fertigen Verify-Link direkt in der Server-Konsole aus:

```
📧  Magic Link für anna@stoa.test:
    http://localhost:4200/auth/verify?token=abc123...
```

Link kopieren, im Browser öffnen (oder die Query-Param `token` direkt an
`POST /api/auth/verify` schicken) – fertig eingeloggt.

## Endpunkte im Überblick

### Auth
```
POST   /api/auth/login          { email, password }
POST   /api/auth/register       { email, name, password }
POST   /api/auth/magic-link     { email }
POST   /api/auth/verify         { token }
GET    /api/auth/me
POST   /api/auth/logout
```

### Collections
```
GET    /api/collections?filter=all|personal|shared
GET    /api/collections/:id
POST   /api/collections         { name, emoji, allowedTypes }
PATCH  /api/collections/:id     { name?, emoji?, allowedTypes?, visibility? }
DELETE /api/collections/:id
POST   /api/collections/join/:inviteToken
```

### Membership
```
GET    /api/collections/:id/members
PATCH  /api/collections/:id/members/:userId   { role }
DELETE /api/collections/:id/members/:userId
```

### Pins
```
GET    /api/collections/:id/pins
POST   /api/collections/:id/pins              { type, data, tags }
PATCH  /api/collections/:id/pins/:pinId       { data?, tags?, sortOrder? }
DELETE /api/collections/:id/pins/:pinId
POST   /api/collections/:id/pins/:pinId/comments   { body }
```

### Suche
```
GET    /api/search?q=...&type=...&tag=...
GET    /api/tags
POST   /api/tags                 { name }
DELETE /api/tags/:id
```

### Vorschau, Upload und Profil
```
GET    /api/links/preview?url=...
POST   /api/uploads
PATCH  /api/profile
DELETE /api/profile
GET    /api/profile/export?format=json|csv
POST   /api/profile/import/pocket
GET    /api/billing/portal-url
```

## Beispiel-Requests

```bash
# Login (Cookie wird gespeichert)
curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"du@stoa.test","password":"test1234"}'

# Eigene Sammlungen abrufen (mit gespeichertem Cookie)
curl -b cookies.txt http://localhost:4000/api/collections

# Neuen Link-Pin anlegen
curl -b cookies.txt -X POST http://localhost:4000/api/collections/coll-japan/pins \
  -H "Content-Type: application/json" \
  -d '{
    "type": "link",
    "data": { "url": "https://example.com", "title": "Test-Link" },
    "tags": ["test"]
  }'
```

## Angular-Anbindung

Der `HttpClient` in `AuthApi` erwartet Cookies automatisch mitzuschicken.
In der Angular-Config `withCredentials: true` auf dem `HttpClient` aktivieren,
z. B. via Interceptor oder direkt in `provideHttpClient(withFetch())` mit
`{ withCredentials: true }` je Request, damit der `stoa_session`-Cookie
mitgesendet wird.

Environment-Variable für die Base-URL (`environment.ts`):

```typescript
export const environment = {
  apiUrl: 'http://localhost:4000/api',
};
```
