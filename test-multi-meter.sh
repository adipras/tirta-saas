#!/bin/bash

# ============================================================
# Multi-Meter Water Usage API Validation
# ============================================================
# Validates water usage creation with and without MeterID
# Usage: bash test-multi-meter.sh
# Requirements: backend running on localhost:8081, test data setup

API_BASE="http://localhost:8081/api"
TENANT_ID="${TENANT_ID:-}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

echo "Multi-Meter Water Usage Test Scenarios"
echo "======================================"

# Scenario 1: Create water usage with explicit MeterID (multi-meter customer)
echo -e "\n1. Creating water usage WITH MeterID (multi-meter scenario):"
cat << 'EOF'
POST /water-usage
{
  "customer_id": "<customer-id>",
  "meter_id": "<meter-id>",
  "usage_month": "2025-06",
  "meter_end": 150.5,
  "notes": "Multi-meter reading for specific meter"
}
Expected: 201 Created
- MeterID stored in WaterUsage record
- Uses meter's SubscriptionTypeID for tariff lookup (if set)
- Queries previous month's usage for same meter
EOF

# Scenario 2: Create water usage without MeterID (single-meter customer)
echo -e "\n2. Creating water usage WITHOUT MeterID (fallback scenario):"
cat << 'EOF'
POST /water-usage
{
  "customer_id": "<customer-id>",
  "usage_month": "2025-06",
  "meter_end": 150.5,
  "notes": "Standard single-meter reading"
}
Expected: 201 Created
- Auto-detects active meter for customer
- Falls back to meter's InitialReading if no previous usage
- Uses customer's SubscriptionID for tariff lookup
- MeterID stored (auto-populated from active meter)
EOF

# Scenario 3: Bulk import with multi-meter awareness
echo -e "\n3. Bulk import CSV with meter-aware processing:"
cat << 'EOF'
POST /bulk-operations/water-usage/import
multipart/form-data:
  - file: water_usage.csv
  - usage_month: 2025-06

CSV Format (existing):
meter_number,meter_end,notes
M-001,150.5,Standard reading
M-002,245.0,Second meter reading

Processing logic:
- For each customer's meter_number:
  1. Lookup customer
  2. Find active meter matching meter_number
  3. Query previous month's usage for that specific meter
  4. Use meter's SubscriptionTypeID for tariff (if set)
  5. Store MeterID in WaterUsage record

Expected: 200 OK
- Handles multi-meter customers correctly
- Each meter's usage tracked separately
EOF

# Scenario 4: Tariff resolution priority
echo -e "\n4. Tariff lookup priority for multi-meter:"
cat << 'EOF'
Priority Order:
1. If Meter.SubscriptionTypeID is set → use meter's rate
   (Allows different meter types with different tariffs)
2. Otherwise → use Customer.SubscriptionID
   (Standard single-meter or meter with no override)

Benefits:
- Supports mixed meter types per customer (residential + commercial)
- Backward compatible: existing customers work as before
- Explicit override possible for special meter configurations
EOF

# Scenario 5: Idempotent water usage creation
echo -e "\n5. Idempotent creation with client-generated ID:"
cat << 'EOF'
POST /water-usage
{
  "id": "<client-uuid>",
  "customer_id": "<customer-id>",
  "meter_id": "<meter-id>",
  "usage_month": "2025-06",
  "meter_end": 150.5
}

Behavior:
- If record with same ID exists → return 409 or existing record
- Enables safe retries for offline-first mobile apps
- Works with both single and multi-meter scenarios
EOF

echo -e "\n✓ Validation scenarios documented"
echo "Run with backend and test data to verify API responses"
