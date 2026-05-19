#!/usr/bin/env bash
set -euo pipefail
umask 077

APP_DIR=/opt/tirta-saas/app
BACKUP_DIR=/opt/tirta-saas/backup
ENV_FILE=${APP_DIR}/.env

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[backup.sh] env file not found: $ENV_FILE" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

: "${MYSQL_DATABASE:?MYSQL_DATABASE is required}"
: "${MYSQL_USER:?MYSQL_USER is required}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"

TIMESTAMP=$(date +%F-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db-${TIMESTAMP}.sql.gz"
TMP_FILE="${BACKUP_FILE}.tmp"

echo "[backup.sh] starting backup ${BACKUP_FILE}"
docker exec -e MYSQL_PWD="$MYSQL_PASSWORD" tirta-mysql \
  mysqldump -u"$MYSQL_USER" --single-transaction --quick --routines --triggers --no-tablespaces "$MYSQL_DATABASE" \
  | gzip -c > "$TMP_FILE"

mv "$TMP_FILE" "$BACKUP_FILE"
gzip -t "$BACKUP_FILE"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'db-*.sql.gz' -mtime +14 -delete

echo "[backup.sh] completed backup ${BACKUP_FILE}"
