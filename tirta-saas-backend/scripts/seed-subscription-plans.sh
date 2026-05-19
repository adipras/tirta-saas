#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
BACKEND_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

echo "Seeding subscription plans..."
cd "$BACKEND_DIR"
go run ./scripts/seed_subscription_plans
