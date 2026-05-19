#!/usr/bin/env bash
set -euo pipefail
umask 077

APP_DIR=/opt/tirta-saas/app
RELEASE_DIR=/opt/tirta-saas/releases
BACKUP_SCRIPT=/opt/tirta-saas/scripts/backup.sh
CAPTURE_SCRIPT=/opt/tirta-saas/scripts/capture-release.sh
HEALTH_URL=http://127.0.0.1/health
RELEASE_LOG=/opt/tirta-saas/backup/release-history.log
ROLLBACK_BUILD=${ROLLBACK_BUILD:-1}

resolve_snapshot() {
  if [[ $# -gt 0 && -n "$1" ]]; then
    if [[ -f "$1" ]]; then
      printf '%s\n' "$1"
      return 0
    fi

    if [[ -f "${RELEASE_DIR}/$1" ]]; then
      printf '%s\n' "${RELEASE_DIR}/$1"
      return 0
    fi

    echo "[rollback.sh] snapshot not found: $1" >&2
    exit 1
  fi

  find "$RELEASE_DIR" -maxdepth 1 -type f -name '*.tar.gz' | sort | tail -n 1
}

SNAPSHOT_PATH=$(resolve_snapshot "${1:-}")
if [[ -z "${SNAPSHOT_PATH:-}" || ! -f "$SNAPSHOT_PATH" ]]; then
  echo "[rollback.sh] no snapshot available in $RELEASE_DIR" >&2
  exit 1
fi

if [[ -f "${SNAPSHOT_PATH}.sha256" ]]; then
  sha256sum -c "${SNAPSHOT_PATH}.sha256"
fi

CURRENT_SHA=$(git -C "$APP_DIR" rev-parse --short HEAD 2>/dev/null || echo "no-git")
PRE_ROLLBACK_SNAPSHOT=$("$CAPTURE_SCRIPT" "pre-rollback-${CURRENT_SHA}")
"$BACKUP_SCRIPT"

find "$APP_DIR" -mindepth 1 -maxdepth 1 ! -name '.env' ! -name 'deploy' -exec rm -rf {} +
if [[ -d "$APP_DIR/deploy" ]]; then
  find "$APP_DIR/deploy" -mindepth 1 -maxdepth 1 ! -name 'certs' ! -name 'www' -exec rm -rf {} +
fi

tar -xzf "$SNAPSHOT_PATH" -C "$APP_DIR"

cd "$APP_DIR"
if [[ "$ROLLBACK_BUILD" == "1" ]]; then
  docker compose up -d --build
else
  docker compose up -d
fi
curl -fsS "$HEALTH_URL" >/dev/null

ROLLED_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")
printf '%s rollback %s -> %s target=%s pre_snapshot=%s build=%s\n' \
  "$(date '+%F %T')" \
  "$CURRENT_SHA" \
  "$ROLLED_SHA" \
  "$SNAPSHOT_PATH" \
  "$PRE_ROLLBACK_SNAPSHOT" \
  "$ROLLBACK_BUILD" >> "$RELEASE_LOG"

echo "[rollback.sh] rollback completed to $SNAPSHOT_PATH"
docker compose ps
