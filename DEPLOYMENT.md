# Deployment

Stoasis besteht aus zwei Images. Das Frontend ist der einzige öffentliche Dienst und leitet `/api` intern an das Backend weiter. Der Browser sieht dadurch nie eine interne Container-Adresse.

## Lokal mit Docker

Ohne Startargument laufen beide Images im Dev-Modus:

```bash
docker compose up --build
```

- App: `http://localhost:8080`
- Backend direkt: `http://localhost:4000`
- Mailpit: `http://localhost:8025`

Die Container erreichen sich im Compose-Netz als `frontend` und `backend`. Abweichende Host-Ports können bei belegten Ports gesetzt werden:

```bash
STOASIS_FRONTEND_PORT=8180 STOASIS_BACKEND_PORT=4100 MAILPIT_UI_PORT=8125 MAILPIT_SMTP_PORT=1125 docker compose up
```

Die Images einzeln:

```bash
docker build -t stoasis-backend ./stoasis-backend
docker build -t stoasis-frontend ./stoasis-frontend

docker run stoasis-backend
docker run stoasis-backend prod
docker run stoasis-frontend
docker run stoasis-frontend prod
```

Ohne Argument wird `dev` geladen; das Argument `prod` aktiviert das Produktionsprofil beziehungsweise das optimierte Angular-Bundle.

## Railway-Produktion

Im Railway-Projekt werden drei Services angelegt:

1. `frontend` aus diesem GitHub-Repository mit Root Directory `/stoasis-frontend`
2. `backend` aus demselben Repository mit Root Directory `/stoasis-backend`
3. ein Railway-PostgreSQL-Service

Für beide App-Services muss unter **Config file path** der absolute Pfad gesetzt werden:

- Frontend: `/stoasis-frontend/railway.toml`
- Backend: `/stoasis-backend/railway.toml`

Die beiden Dateien wählen den jeweiligen Dockerfile, starten mit `prod`, setzen Healthchecks und verhindern über Watch-Patterns unnötige Cross-Builds.

### Frontend-Variablen

```text
BACKEND_URL=http://backend.railway.internal:4000
PORT=8080
```

Nur der Frontend-Service bekommt Public Networking und die Custom Domain `stoasis.gurkeschale.dev` auf Port `8080`. Der Backend-Service bleibt ohne öffentliche Domain.

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
```

`Postgres` muss dabei exakt dem Railway-Service-Namen der Datenbank entsprechen. Für produktive E-Mails kommen zusätzlich `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS` und `STOASIS_MAIL_FROM` hinzu.

## GitHub Actions und Images

- `.github/workflows/backend-image.yml` reagiert ausschließlich auf Änderungen unter `stoasis-backend/**`.
- `.github/workflows/frontend-image.yml` reagiert ausschließlich auf Änderungen unter `stoasis-frontend/**`.
- Ändern sich beide Bereiche, laufen beide Workflows.
- Pull Requests bauen nur; Pushes veröffentlichen Branch-, SHA- und auf dem Default-Branch zusätzlich `latest`-Tags.

Die veröffentlichten Images heißen:

```text
ghcr.io/gurkeschalesammler/stoasis-backend
ghcr.io/gurkeschalesammler/stoasis-frontend
```
