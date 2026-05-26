#!/usr/bin/env sh

set -eu

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${DOMAIN_NAME:?DOMAIN_NAME is required}"
: "${DEPLOY_TARGET:?DEPLOY_TARGET is required}"

compose() {
  docker compose --env-file "$DEPLOY_PATH/.env" -f "$DEPLOY_PATH/docker-compose.yml" "$@"
}

wait_for_running() {
  service="$1"
  attempts="${2:-20}"
  delay_seconds="${3:-5}"

  for attempt in $(seq 1 "$attempts"); do
    container_id="$(compose ps -q "$service")"
    if [ -n "$container_id" ]; then
      running="$(docker inspect -f '{{.State.Running}}' "$container_id" 2>/dev/null || printf 'false')"
      health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container_id" 2>/dev/null || printf 'missing')"

      if [ "$running" = "true" ] && { [ "$health" = "healthy" ] || [ "$health" = "no-healthcheck" ]; }; then
        return 0
      fi
    fi

    if [ "$attempt" -eq "$attempts" ]; then
      echo "Service $service is not ready after ${attempts} attempts" >&2
      compose ps >&2 || true
      return 1
    fi

    sleep "$delay_seconds"
  done
}

check_https() {
  path="$1"
  output_file="$2"

  curl -kfsSL \
    --resolve "${DOMAIN_NAME}:443:127.0.0.1" \
    "https://${DOMAIN_NAME}${path}" \
    -o "$output_file"
}

assert_contains() {
  file_path="$1"
  pattern="$2"
  error_message="$3"

  if ! grep -qi "$pattern" "$file_path"; then
    echo "$error_message" >&2
    return 1
  fi
}

wait_for_http() {
  path="$1"
  output_file="$2"
  attempts="${3:-20}"
  delay_seconds="${4:-5}"

  for attempt in $(seq 1 "$attempts"); do
    if check_https "$path" "$output_file"; then
      return 0
    fi

    if [ "$attempt" -eq "$attempts" ]; then
      echo "HTTP smoke check failed for path $path" >&2
      return 1
    fi

    sleep "$delay_seconds"
  done
}

cd "$DEPLOY_PATH"

case "$DEPLOY_TARGET" in
  fe)
    wait_for_running frontend
    wait_for_running nginx
    wait_for_http / /tmp/tirta-smoke-home.html
    wait_for_http /admin/login /tmp/tirta-smoke-admin-login.html
    wait_for_http /customer/login /tmp/tirta-smoke-customer-login.html
    assert_contains /tmp/tirta-smoke-home.html "<html" "Frontend root did not return HTML"
    assert_contains /tmp/tirta-smoke-admin-login.html "<html" "Admin login deep link did not return HTML shell"
    assert_contains /tmp/tirta-smoke-customer-login.html "<html" "Customer login deep link did not return HTML shell"
    ;;
  be)
    wait_for_running backend
    wait_for_running nginx
    wait_for_http /health /tmp/tirta-smoke-health.json
    wait_for_http /api/public/subscription-plans /tmp/tirta-smoke-subscription-plans.json
    assert_contains /tmp/tirta-smoke-health.json '"status"' "Health endpoint response missing status field"
    assert_contains /tmp/tirta-smoke-subscription-plans.json '"status":"success"' "Public subscription plans endpoint did not return success status"
    assert_contains /tmp/tirta-smoke-subscription-plans.json '"data"' "Public subscription plans endpoint response missing data payload"
    ;;
  all)
    wait_for_running backend
    wait_for_running frontend
    wait_for_running nginx
    wait_for_http /health /tmp/tirta-smoke-health.json
    wait_for_http / /tmp/tirta-smoke-home.html
    wait_for_http /admin/login /tmp/tirta-smoke-admin-login.html
    wait_for_http /customer/login /tmp/tirta-smoke-customer-login.html
    wait_for_http /api/public/subscription-plans /tmp/tirta-smoke-subscription-plans.json
    assert_contains /tmp/tirta-smoke-health.json '"status"' "Health endpoint response missing status field"
    assert_contains /tmp/tirta-smoke-home.html "<html" "Frontend root did not return HTML"
    assert_contains /tmp/tirta-smoke-admin-login.html "<html" "Admin login deep link did not return HTML shell"
    assert_contains /tmp/tirta-smoke-customer-login.html "<html" "Customer login deep link did not return HTML shell"
    assert_contains /tmp/tirta-smoke-subscription-plans.json '"status":"success"' "Public subscription plans endpoint did not return success status"
    assert_contains /tmp/tirta-smoke-subscription-plans.json '"data"' "Public subscription plans endpoint response missing data payload"
    ;;
  *)
    echo "Unsupported DEPLOY_TARGET: $DEPLOY_TARGET" >&2
    exit 1
    ;;
esac

echo "Smoke checks passed for target $DEPLOY_TARGET"
