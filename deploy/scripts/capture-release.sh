#!/usr/bin/env bash
set -euo pipefail
umask 077

APP_DIR=/opt/tirta-saas/app
RELEASE_DIR=/opt/tirta-saas/releases
KEEP_COUNT=${KEEP_COUNT:-10}
LABEL=${1:-manual}

if [[ ! -d "$APP_DIR" ]]; then
  echo "[capture-release.sh] app dir not found: $APP_DIR" >&2
  exit 1
fi

mkdir -p "$RELEASE_DIR"

TIMESTAMP=$(date +%F-%H%M%S)
GIT_SHA=$(git -C "$APP_DIR" rev-parse --short HEAD 2>/dev/null || echo "no-git")
SAFE_LABEL=$(printf '%s' "$LABEL" | tr -cs 'A-Za-z0-9._-' '_')
ARCHIVE_PATH="${RELEASE_DIR}/${TIMESTAMP}-${GIT_SHA}-${SAFE_LABEL}.tar.gz"

tar \
  --exclude=.env \
  --exclude=deploy/certs \
  --exclude=deploy/www \
  --exclude=node_modules \
  --exclude=tirta-saas-frontend/node_modules \
  --exclude=tirta-saas-frontend/dist \
  --exclude=tirta-saas-backend/tmp \
  --exclude='*.bak-*' \
  -czf "$ARCHIVE_PATH" \
  -C "$APP_DIR" .

sha256sum "$ARCHIVE_PATH" > "${ARCHIVE_PATH}.sha256"

mapfile -t archives < <(find "$RELEASE_DIR" -maxdepth 1 -type f -name '*.tar.gz' | sort)
if (( ${#archives[@]} > KEEP_COUNT )); then
  delete_count=$(( ${#archives[@]} - KEEP_COUNT ))
  for archive in "${archives[@]:0:delete_count}"; do
    rm -f "$archive" "${archive}.sha256"
  done
fi

echo "$ARCHIVE_PATH"
