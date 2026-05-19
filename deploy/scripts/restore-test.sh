#!/usr/bin/env bash
set -euo pipefail
umask 077

APP_DIR=/opt/tirta-saas/app
BACKUP_DIR=/opt/tirta-saas/backup
ENV_FILE=${APP_DIR}/.env

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[restore-test.sh] env file not found: $ENV_FILE" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD is required}"

if [[ $# -gt 0 ]]; then
  BACKUP_FILE=$1
else
  BACKUP_FILE=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'db-*.sql.gz' | sort | tail -n 1)
fi

if [[ -z "${BACKUP_FILE:-}" || ! -f "$BACKUP_FILE" ]]; then
  echo "[restore-test.sh] backup file not found" >&2
  exit 1
fi

TEST_DB="restore_verify_$(date +%Y%m%d%H%M%S)"
cleanup() {
  docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" tirta-mysql \
    mysql -uroot -e "DROP DATABASE IF EXISTS ${TEST_DB};" >/dev/null
}
trap cleanup EXIT

echo "[restore-test.sh] restoring ${BACKUP_FILE} into ${TEST_DB}"
docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" tirta-mysql \
  mysql -uroot -e "CREATE DATABASE ${TEST_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

gunzip -c "$BACKUP_FILE" | docker exec -i -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" tirta-mysql \
  mysql -uroot "$TEST_DB"

TABLE_COUNT=$(docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" tirta-mysql \
  mysql -uroot -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${TEST_DB}';")

if [[ "$TABLE_COUNT" -eq 0 ]]; then
  echo "[restore-test.sh] restore verification failed: no tables restored" >&2
  exit 1
fi

echo "[restore-test.sh] restore verification passed with ${TABLE_COUNT} tables"
