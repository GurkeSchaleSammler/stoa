# Deployment

Stoasis besteht aus drei Images. Das Frontend ist der öffentliche Einstieg für die Web-App und leitet `/api` intern an das Backend weiter. Der MCP-Dienst besitzt für ChatGPT einen eigenen öffentlichen HTTPS-Endpunkt und erreicht dasselbe Backend über das interne Netzwerk.

## Lokal mit Docker

Ohne Startargument laufen alle Images im Dev-Modus:

```bash
docker compose up --build
```

- App: `http://localhost:8080`
- Backend direkt: `http://localhost:4000`
- Mailpit: `http://localhost:8025`
- MCP: `http://localhost:3000/mcp`

Die Container erreichen sich im Compose-Netz als `frontend`, `backend` und `mcp`. Abweichende Host-Ports können bei belegten Ports gesetzt werden:

```bash
STOASIS_FRONTEND_PORT=8180 STOASIS_BACKEND_PORT=4100 STOASIS_MCP_PORT=3100 MAILPIT_UI_PORT=8125 MAILPIT_SMTP_PORT=1125 docker compose up
```

Die Images einzeln:

```bash
docker build -t stoasis-backend ./stoasis-backend
docker build -t stoasis-frontend ./stoasis-frontend
docker build -t stoasis-mcp ./stoasis-mcp

docker run stoasis-backend
docker run stoasis-backend prod
docker run stoasis-frontend
docker run stoasis-frontend prod
docker run --env-file stoasis-mcp/.env.prod -p 3000:3000 stoasis-mcp
```

Ohne Argument wird `dev` geladen; das Argument `prod` aktiviert das Produktionsprofil beziehungsweise das optimierte Angular-Bundle.

## Railway-Produktion

Im Railway-Projekt werden vier Services angelegt:

1. `frontend` aus diesem GitHub-Repository mit Root Directory `/stoasis-frontend`
2. `backend` aus demselben Repository mit Root Directory `/stoasis-backend`
3. `mcp` aus demselben Repository mit Root Directory `/stoasis-mcp`
4. ein Railway-PostgreSQL-Service

Für alle drei App-Services muss unter **Config file path** der absolute Pfad gesetzt werden:

- Frontend: `/stoasis-frontend/railway.toml`
- Backend: `/stoasis-backend/railway.toml`
- MCP: `/stoasis-mcp/railway.toml`

Die Dateien wählen den jeweiligen Dockerfile, setzen Healthchecks und verhindern über Watch-Patterns unnötige Cross-Builds.

### Frontend-Variablen

```text
BACKEND_URL=http://backend.railway.internal:4000
PORT=8080
```

Der Frontend-Service bekommt die Custom Domain `stoasis.gurkeschale.dev` auf Port `8080`. Der MCP-Service bekommt eine eigene stabile HTTPS-Domain, beispielsweise `mcp.stoasis.gurkeschale.dev`, auf Port `3000`. Der Backend-Service bleibt ohne öffentliche Domain.

### Backend-Variablen

```text
PORT=4000
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
PGDATABASE=${{Postgres.PGDATABASE}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
STOASIS_FRONTEND_URL=https://stoasis.gurkeschale.dev
STOASIS_PUBLIC_API_URL=https://stoasis.gurkeschale.dev
STOASIS_CORS_ALLOWED_ORIGINS=https://stoasis.gurkeschale.dev
STOASIS_MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxx
STOASIS_MAIL_FROM=Stoasis <no-reply@stoasis.gurkeschale.dev>
```

`Postgres` muss dabei exakt dem Railway-Service-Namen der Datenbank entsprechen. Für `RESEND_API_KEY` wird in Resend ein API-Key erstellt. Die Domain aus `STOASIS_MAIL_FROM` muss in Resend verifiziert sein, bevor Magic-Link-Mails zuverlässig zugestellt werden. `RESEND_API_URL` ist optional und wird ohne Angabe auf `https://api.resend.com/emails` gesetzt.

Falls ein anderer Host mit SMTP genutzt wird, kann der Versand weiterhin auf SMTP umgestellt werden. Dafür `STOASIS_MAIL_PROVIDER=smtp` setzen und zusätzlich `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS` und `STOASIS_MAIL_FROM` konfigurieren.

### MCP-Variablen

```text
NODE_ENV=production
PORT=3000
PUBLIC_BASE_URL=https://mcp.stoasis.gurkeschale.dev
STOASIS_API_BASE_URL=http://backend.railway.internal:4000
STOASIS_WEB_BASE_URL=https://stoasis.gurkeschale.dev
OAUTH_STORAGE=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_ENCRYPTION_KEY=<openssl rand -base64 32>
TRUST_PROXY=true
```

ChatGPT verbindet `https://mcp.stoasis.gurkeschale.dev/mcp`. Der MCP legt seine OAuth-Tabellen mit dem Präfix `stoasis_mcp_` in PostgreSQL an. Details zu Authentifizierung, Tests und ChatGPT-Verbindung stehen in [`stoasis-mcp/README.md`](stoasis-mcp/README.md).

## GitHub Actions und Images

- `.github/workflows/backend-image.yml` reagiert ausschließlich auf Änderungen unter `stoasis-backend/**`.
- `.github/workflows/frontend-image.yml` reagiert ausschließlich auf Änderungen unter `stoasis-frontend/**`.
- `.github/workflows/mcp-image.yml` reagiert ausschließlich auf Änderungen unter `stoasis-mcp/**`.
- Ändern sich mehrere Bereiche, laufen die entsprechenden Workflows.
- Pull Requests bauen nur; Pushes veröffentlichen Branch-, SHA- und auf dem Default-Branch zusätzlich `latest`-Tags.

Die veröffentlichten Images heißen:

```text
ghcr.io/gurkeschalesammler/stoasis-backend
ghcr.io/gurkeschalesammler/stoasis-frontend
ghcr.io/gurkeschalesammler/stoasis-mcp
```
