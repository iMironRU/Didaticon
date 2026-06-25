#!/usr/bin/env bash
# Деплой на VPS. Запускать на сервере после первоначальной настройки.
# Предполагает: Docker, Docker Compose v2, git.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

echo "==> Pulling latest images from ghcr.io..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

echo "==> Restarting services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

echo "==> Done. Checking health..."
sleep 3
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
