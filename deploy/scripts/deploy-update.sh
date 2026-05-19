#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/tirta-saas/app
BACKUP_SCRIPT=/opt/tirta-saas/scripts/backup.sh
CAPTURE_SCRIPT=/opt/tirta-saas/scripts/capture-release.sh
HEALTH_URL=http://127.0.0.1/health
RELEASE_LOG=/opt/tirta-saas/backup/release-history.log

cd "$APP_DIR"
BEFORE_SHA=$(git rev-parse --short HEAD)
PRE_DEPLOY_SNAPSHOT=$("$CAPTURE_SCRIPT" "pre-deploy-${BEFORE_SHA}")
"$BACKUP_SCRIPT"
git pull --ff-only origin main
AFTER_SHA=$(git rev-parse --short HEAD)
docker compose up -d --build
curl -fsS "$HEALTH_URL" >/dev/null
printf '%s deploy %s -> %s snapshot=%s\n' "$(date '+%F %T')" "$BEFORE_SHA" "$AFTER_SHA" "$PRE_DEPLOY_SNAPSHOT" >> "$RELEASE_LOG"
docker compose ps
