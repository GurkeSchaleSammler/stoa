# Stoasis Frontend

Angular-Single-Page-App für Stoasis. Im Container liefert Caddy das gebaute Frontend aus und leitet `/api` an das Backend weiter.

## Voraussetzungen

- Node.js 22
- npm 10
- Backend auf `http://localhost:4000`, wenn das Frontend ohne Docker gestartet wird

Abhängigkeiten installieren:

```bash
npm ci
```

## Dev starten und bauen

Dev-Server mit automatischem Neuladen starten:

```bash
npm start
```

Die App läuft unter `http://localhost:4200`. Requests an `/api` leitet der Angular-Dev-Server über `proxy.conf.json` an `http://localhost:4000` weiter.

Ein explizites Dev-Bundle bauen:

```bash
npm run build -- --configuration development
```

Das Dev-Bundle ist nicht optimiert und enthält Source Maps.

## Prod bauen und lokal prüfen

Optimiertes Produktionsbundle bauen:

```bash
npm run build -- --configuration production
```

Das Ergebnis liegt unter `dist/stoasis-frontend/browser` und enthält optimierte, gehashte Assets.

Für eine lokale Vorschau mit Produktions-Build-Konfiguration:

```bash
npm start -- --configuration production
```

Dieser Dev-Server dient nur zur lokalen Vorschau. Im echten Produktionsbetrieb wird das Bundle aus dem Caddy-Container ausgeliefert.

## Docker

Das Image enthält sowohl das Dev- als auch das Prod-Bundle:

```bash
docker build -t stoasis-frontend .
```

Dev starten – ohne Argument:

```bash
docker run --rm -p 8080:8080 \
  -e BACKEND_URL=http://host.docker.internal:4000 \
  stoasis-frontend
```

Prod starten – mit dem Argument `prod`:

```bash
docker run --rm -p 8080:8080 \
  -e BACKEND_URL=http://host.docker.internal:4000 \
  stoasis-frontend prod
```

`BACKEND_URL` muss aus dem Container erreichbar sein. Im gemeinsamen Container-Netz ist der Wert `http://backend:4000`. Für den kompletten lokalen Stack genügt im Repository-Root:

```bash
docker compose up --build
```

Der Container lauscht standardmäßig auf Port `8080`; `PORT` kann ihn überschreiben. Der Healthcheck ist unter `/healthz` erreichbar.

## Tests

```bash
npm test -- --watch=false
```
