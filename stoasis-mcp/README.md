# Stoasis MCP

Deploybarer Remote-MCP-Server für Stoasis. ChatGPT kann damit komplette räumliche Boards lesen, verändern und direkt als interaktive Boardansicht darstellen.

## Was der Dienst bereitstellt

- Streamable HTTP unter `POST /mcp`
- OAuth 2.1 Authorization Code mit PKCE und Dynamic Client Registration
- Anmeldung mit einem bestehenden Stoasis-Konto
- verschlüsselte Stoasis-Sitzungen und ausschliesslich gehashte OAuth-Tokens in PostgreSQL
- vollständiges Board-Modell mit Pins, Koordinaten, Ebenen, Stacks, Verbindungen, Zonen, Labels und Stickern
- visuelle MCP-App unter `ui://stoasis/board.html`, die ChatGPT bei `render_board` anzeigt
- sichere Tool-Annotationen für Lese-, Schreib- und Löschaktionen

Basic Auth oder ein statischer API-Key sind für die ChatGPT-Verbindung nicht vorgesehen. Der Browser sieht beim Verbinden eine Stoasis-Anmeldeseite; das Passwort wird unmittelbar an das bestehende Stoasis-Backend weitergegeben und vom MCP-Dienst nicht gespeichert.

## Tools

### Lesen und Anzeigen

- `list_boards`
- `get_board`
- `render_board`
- `search_pins`
- `preview_link`

### Boards und Pins

- `create_board`, `update_board`, `delete_board`
- `create_pin`, `update_pin`, `move_pin`, `delete_pin`
- `add_pin_comment`

### Räumliche Board-Struktur

- `create_stack`, `add_pin_to_stack`, `update_stack`, `release_pin_from_stack`, `dissolve_stack`
- `create_connector`, `delete_connector`
- `create_zone`, `update_zone`, `delete_zone`
- `create_label`, `update_label`, `delete_label`
- `create_sticker`, `update_sticker`, `delete_sticker`

`get_board` liefert keine flache Pin-Liste, sondern einen gemeinsamen Snapshot mit Geometrie und abgeleiteten Beziehungen. ChatGPT soll diesen Snapshot vor Layoutänderungen lesen.

## Lokal starten

Zuerst muss das Stoasis-Backend auf Port `4000` laufen. Der lokale Seed-Login lautet `du@stoa.test` / `test1234`.

```bash
cp .env.example .env
npm ci
npm run dev
```

Der Dienst läuft anschliessend unter:

- MCP: `http://localhost:3000/mcp`
- Healthcheck: `http://localhost:3000/healthz`
- OAuth-Metadaten: `http://localhost:3000/.well-known/oauth-authorization-server`
- Protected-Resource-Metadaten: `http://localhost:3000/.well-known/oauth-protected-resource/mcp`

Alternativ startet `docker compose up --build` im Repository-Root den gesamten lokalen Stack inklusive MCP. Lokal verwendet der MCP absichtlich flüchtigen Speicher. Nach einem Neustart muss der Client neu verbunden werden.

## Testen

```bash
npm run check
npm audit
```

Für einen Protokolltest kann der MCP Inspector verwendet werden:

```bash
npx @modelcontextprotocol/inspector@latest
```

Im Inspector `Streamable HTTP` und `http://localhost:3000/mcp` auswählen. Für ChatGPT muss der lokale Dienst über einen sicheren Entwicklungstunnel oder eine öffentliche HTTPS-Adresse erreichbar sein.

## Produktion

Erforderliche Variablen:

```text
NODE_ENV=production
PORT=3000
PUBLIC_BASE_URL=https://mcp.example.com
STOASIS_API_BASE_URL=http://backend.internal:4000
STOASIS_WEB_BASE_URL=https://stoasis.example.com
OAUTH_STORAGE=postgres
DATABASE_URL=postgresql://...
SESSION_ENCRYPTION_KEY=<base64-encoded 32-byte key>
TRUST_PROXY=true
```

Schlüssel erzeugen:

```bash
openssl rand -base64 32
```

`PUBLIC_BASE_URL` muss exakt der öffentlichen HTTPS-Origin entsprechen und darf keinen zusätzlichen Pfad enthalten. ChatGPT verbindet danach die URL `${PUBLIC_BASE_URL}/mcp`.

Der Dienst legt beim Start folgende Tabellen mit dem Präfix `stoasis_mcp_` an:

- OAuth-Clients
- Login-Transaktionen
- Autorisierungscodes
- Access- und Refresh-Tokens

Passwörter und Klartext-Tokens werden nicht persistiert. Der verschlüsselte Wert ist ausschliesslich das bestehende Stoasis-Session-Cookie. Bei einer Änderung von `SESSION_ENCRYPTION_KEY` verlieren bestehende Verbindungen ihre Gültigkeit.

### Railway

Einen neuen Railway-Service aus demselben Repository anlegen:

1. Root Directory: `/stoasis-mcp`
2. Config file path: `/stoasis-mcp/railway.toml`
3. Public Networking auf Port `3000`
4. stabile Domain, beispielsweise `mcp.stoasis.gurkeschale.dev`
5. die oben aufgeführten Variablen setzen

Für das bestehende Projekt können beispielsweise diese Referenzen verwendet werden:

```text
PUBLIC_BASE_URL=https://mcp.stoasis.gurkeschale.dev
STOASIS_API_BASE_URL=http://backend.railway.internal:4000
STOASIS_WEB_BASE_URL=https://stoasis.gurkeschale.dev
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Das Backend sollte derzeit mit einer Replica laufen, weil seine HTTP-Sessions pro Backend-Prozess gehalten werden. Nach einem Backend-Neustart fordert ChatGPT bei der nächsten Benutzung gegebenenfalls eine erneute Verbindung an. Für mehrere Backend-Replicas ist ein gemeinsamer Spring-Session-Store erforderlich.

## Mit ChatGPT verbinden

Nach dem Deployment:

1. In ChatGPT den Entwicklermodus aktivieren.
2. Unter Plugins eine neue Verbindung anlegen.
3. `https://mcp.example.com/mcp` als MCP-URL eintragen.
4. Die erkannten Tools prüfen.
5. Beim ersten Tool-Aufruf mit dem Stoasis-Konto anmelden und die Berechtigungen bestätigen.

Für eine veröffentlichte Integration bleiben zusätzlich Domain-Verifikation, Datenschutzangaben und der OpenAI-Review-Prozess erforderlich.
