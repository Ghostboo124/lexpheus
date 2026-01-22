#!/bin/sh
set -e

mkdir -p "/usr/src/app/cache"

if [ ! -f "/usr/src/app/cache/.setup" ]; then
  echo "Running migrations..."
  su-exec bun bun run migrate
  su-exec bun touch "/usr/src/app/cache/.setup"
fi

echo "Starting app..."
exec su-exec bun bun run src/index.ts

