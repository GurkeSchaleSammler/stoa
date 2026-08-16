#!/bin/sh
set -eu

profile="${1:-dev}"

case "$profile" in
  dev)
    export APP_ROOT=/srv/dev
    ;;
  prod)
    export APP_ROOT=/srv/prod
    ;;
  *)
    echo "Usage: docker run <frontend-image> [prod]" >&2
    exit 64
    ;;
esac

export BACKEND_URL="${BACKEND_URL:-http://backend:4000}"
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
