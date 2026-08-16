FROM node:22-alpine AS build

WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY angular.json proxy.conf.json tsconfig.app.json tsconfig.json tsconfig.spec.json ./
COPY public public
COPY src src
RUN npm run build -- --configuration development --output-path=dist/dev \
    && npm run build -- --configuration production --output-path=dist/prod

FROM caddy:2.10-alpine

COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh /usr/local/bin/stoasis-entrypoint
COPY --from=build /workspace/dist/dev/browser /srv/dev
COPY --from=build /workspace/dist/prod/browser /srv/prod
RUN chmod +x /usr/local/bin/stoasis-entrypoint

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/stoasis-entrypoint"]
