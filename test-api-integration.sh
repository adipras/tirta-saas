#!/bin/bash

# API Integration Testing Script
# Tests all major API endpoints to ensure frontend-backend connectivity

API_BASE="http://localhost:8081"
AUTH_EMAIL="admin@tirtasaas.com"
AUTH_PASSWORD="admin123"

echo "🧪 Tirta SaaS - API Integration Testing"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for tests
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_code=$5
    local use_token=$6
    
    echo -n "Testing $name... "
    
    if [ "$use_token" = "true" ] && [ -n "$TOKEN" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $method "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $method "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $HTTP_CODE)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_code, Got: $HTTP_CODE)"
        echo "  Response: $BODY"
        ((FAILED++))
    fi
}

# 1. Health Check
echo "1️⃣  Health & System Endpoints"
echo "----------------------------"
test_endpoint "Health Check" "GET" "/health" "" "200" "false"
echo ""

# 2. Authentication
echo "2️⃣  Authentication"
echo "----------------------------"
test_endpoint "Login" "POST" "/api/auth/login" "{\"email\":\"$AUTH_EMAIL\",\"password\":\"$AUTH_PASSWORD\"}" "200" "false"

# Extract token from login response
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$AUTH_EMAIL\",\"password\":\"$AUTH_PASSWORD\"}")
    
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get authentication token. Cannot continue with authenticated tests.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Token obtained successfully${NC}"
echo ""

# 3. Subscription Types
echo "3️⃣  Subscription Types"
echo "----------------------------"
test_endpoint "List Subscription Types" "GET" "/api/subscription-types" "" "200" "true"
test_endpoint "Create Subscription Type" "POST" "/api/subscription-types" \
    '{"name":"Residential","description":"For residential customers","registration_fee":100000,"monthly_fee":50000,"maintenance_fee":20000,"late_fee":25000}' \
    "201" "true"
echo ""

# 4. Customers
echo "4️⃣  Customers"
echo "----------------------------"
test_endpoint "List Customers" "GET" "/api/customers" "" "200" "true"
test_endpoint "Customer Stats" "GET" "/api/customers/stats" "" "200" "true"
echo ""

# 5. Water Rates
echo "5️⃣  Water Rates"
echo "----------------------------"
test_endpoint "List Water Rates" "GET" "/api/water-rates" "" "200" "true"
test_endpoint "Current Water Rate" "GET" "/api/water-rates/current" "" "200" "true"
echo ""

# 6. Water Usage
echo "6️⃣  Water Usage"
echo "----------------------------"
test_endpoint "List Water Usage" "GET" "/api/water-usage" "" "200" "true"
echo ""

# 7. Invoices
echo "7️⃣  Invoices"
echo "----------------------------"
test_endpoint "List Invoices" "GET" "/api/invoices" "" "200" "true"
echo ""

# 8. Payments
echo "8️⃣  Payments"
echo "----------------------------"
test_endpoint "List Payments" "GET" "/api/payments" "" "200" "true"
echo ""

# 9. Reports
echo "9️⃣  Reports"
echo "----------------------------"
test_endpoint "Revenue Report" "GET" "/api/reports/revenue?start_date=2024-01-01&end_date=2024-12-31" "" "200" "true"
test_endpoint "Customer Report" "GET" "/api/reports/customers?start_date=2024-01-01&end_date=2024-12-31" "" "200" "true"
test_endpoint "Payment Report" "GET" "/api/reports/payments?start_date=2024-01-01&end_date=2024-12-31" "" "200" "true"
echo ""

# 10. Platform (Admin Only)
echo "🔟 Platform Management"
echo "----------------------------"
test_endpoint "List Tenants" "GET" "/api/platform/tenants" "" "200" "true"
test_endpoint "Platform Analytics" "GET" "/api/platform/analytics/overview" "" "200" "true"
echo ""

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
