#!/bin/sh
set -eu

PUBLIC_PORT="${PORT:-8080}"
sed "s/__PUBLIC_PORT__/${PUBLIC_PORT}/g" /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Starting CareSync API on internal port 5000..."
PORT=5000 node src/server.js &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "Starting CareSync web gateway on port ${PUBLIC_PORT}..."
nginx -g 'daemon off;'
