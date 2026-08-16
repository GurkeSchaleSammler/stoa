#!/bin/sh
set -eu

profile="${1:-dev}"

case "$profile" in
  dev|prod) ;;
  *)
    echo "Usage: docker run <backend-image> [prod]" >&2
    exit 64
    ;;
esac

exec java -jar /app/stoasis.jar --spring.profiles.active="$profile"
