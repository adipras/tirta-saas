# Contoh Response API Platform Owner

## Before vs After Refactoring

### 1. GET /api/platform/tenants/:id/statistics

#### ❌ Before (Terlalu Detail - Termasuk Data Operasional)
```json
{
  "status": "success",
  "message": "Tenant statistics retrieved successfully",
  "data": {
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant_name": "PDAM Desa Sukamaju",
    "total_users": 5,
    "active_users": 4,
    "total_customers": 2500,
    "active_customers": 2300,
    "inactive_customers": 200,
    "total_invoices": 2500,
    "paid_invoices": 2100,
    "unpaid_invoices": 400,
    "total_revenue": 125000000,        // ❌ Privacy issue!
    "outstanding_amount": 20000000,    // ❌ Privacy issue!
    "total_water_usage": 15000.5,      // ❌ Not relevant!
    "average_usage_per_customer": 6.0, // ❌ Not relevant!
    "storage_used_gb": 2.5,
    "storage_limit_gb": 10,
    "api_calls_today": 1500,
    "api_calls_limit": 10000,
    "last_activity_at": "2024-01-15T10:30:00Z"
  }
}
```

#### ✅ After (Fokus Subscription Management)
```json
{
  "status": "success",
  "message": "Tenant statistics retrieved successfully",
  "data": {
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant_name": "PDAM Desa Sukamaju",
    "total_users": 5,              // App users (for limit check)
    "active_users": 4,
    "total_customers": 2500,       // For subscription pricing tier
    "storage_used_gb": 2.5,        // For limit enforcement
    "storage_limit_gb": 10,        // From subscription plan
    "api_calls_today": 1500,
    "api_calls_limit": 10000,
    "last_activity_at": "2024-01-15T10:30:00Z"
  }
}
```

**Use Case:** Platform owner bisa lihat tenant ini punya 2500 customers, jadi harus pakai PREMIUM plan (max 5000 customers).

---

### 2. GET /api/platform/analytics/overview

#### ❌ Before (Mixed Revenue Data)
```json
{
  "status": "success",
  "data": {
    "total_tenants": 25,
    "active_tenants": 20,
    "suspended_tenants": 3,
    "trial_tenants": 2,
    "total_revenue": 500000000,      // ❌ Campur dengan water billing!
    "monthly_revenue": 45000000,     // ❌ Misleading!
    "outstanding_revenue": 80000000, // ❌ Tenant's AR!
    "new_tenants_this_month": 3,
    "churned_tenants_this_month": 1,
    "growth_rate": 12.5,
    "total_users": 125,
    "total_customers": 35000,
    "total_storage_used_gb": 45.5
  }
}
```

#### ✅ After (Pure Subscription Metrics)
```json
{
  "status": "success",
  "data": {
    "total_tenants": 25,
    "active_tenants": 20,
    "suspended_tenants": 3,
    "trial_tenants": 2,
    "monthly_revenue": 25000000,           // MRR from subscriptions only
    "total_revenue": 300000000,            // ARR (MRR x 12)
    "outstanding_revenue": 5000000,        // Unpaid subscriptions only
    "new_tenants_this_month": 3,
    "churned_tenants_this_month": 1,
    "growth_rate": 12.5,
    "total_users": 125,                    // For capacity planning
    "total_customers": 35000,              // For pricing analysis
    "total_storage_used_gb": 45.5,
    "average_response_time_ms": 150.0,
    "error_rate": 0.5,
    "uptime": 99.9,
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

**Use Case:** Platform owner bisa lihat MRR Rp 25 juta/bulan dari 20 active tenants = rata-rata Rp 1.25 juta per tenant.

---

### 3. GET /api/platform/analytics/subscription-revenue

#### ✅ New Endpoint (Subscription Revenue Only)
```json
{
  "status": "success",
  "data": {
    "period": "Last 6 months",
    "total_revenue": 150000000,           // ARR from subscriptions
    "monthly_recurring_revenue": 12500000, // MRR
    "average_revenue_per_tenant": 625000,  // MRR / active_tenants
    "outstanding_revenue": 2500000,        // Unpaid subscriptions
    "monthly_breakdown": [
      {
        "month": "August",
        "year": 2024,
        "revenue": 10000000,
        "invoices": 18,
        "paid_invoices": 16,
        "growth_rate": 0
      },
      {
        "month": "September",
        "year": 2024,
        "revenue": 11000000,
        "invoices": 20,
        "paid_invoices": 19,
        "growth_rate": 10.0
      }
    ],
    "revenue_by_plan": {
      "BASIC": 24000000,      // 2 tenants x Rp 1jt/month x 12
      "PREMIUM": 96000000,    // 4 tenants x Rp 2jt/month x 12
      "ENTERPRISE": 180000000 // 3 tenants x Rp 5jt/month x 12
    },
    "payment_method_stats": {
      "MONTHLY": 12,
      "YEARLY": 8
    }
  }
}
```

**Use Case:** Platform owner bisa track pertumbuhan subscription revenue per plan.

---

### 4. GET /api/platform/tenants (List)

```json
{
  "status": "success",
  "message": "Tenants retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "PDAM Desa Sukamaju",
      "village_code": "3201012001",
      "email": "admin@pdam-sukamaju.id",
      "phone": "0812-3456-7890",
      "status": "ACTIVE",
      "subscription_plan": "PREMIUM",
      "subscription_status": "ACTIVE",
      "subscription_ends_at": "2025-12-31T23:59:59Z",
      "total_users": 5,
      "total_customers": 2500,    // Untuk pricing tier
      "storage_used_gb": 2.5,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "PDAM Desa Makmur",
      "village_code": "3201012002",
      "email": "admin@pdam-makmur.id",
      "phone": "0812-9876-5432",
      "status": "TRIAL",
      "subscription_plan": "BASIC",
      "subscription_status": "TRIAL",
      "subscription_ends_at": "2024-02-15T23:59:59Z",
      "total_users": 2,
      "total_customers": 500,     // Masih di bawah limit BASIC (1000)
      "storage_used_gb": 0.8,
      "created_at": "2024-01-16T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "page_size": 20,
    "total_pages": 2,
    "total_items": 25
  }
}
```

**Use Case:** Platform owner bisa lihat:
- Tenant mana yang perlu upgrade (customer count mendekati limit)
- Tenant mana yang trial periode akan habis
- Tenant mana yang subscription akan expired

---

## Key Differences

### ❌ Data Dihapus:
- `total_invoices`, `paid_invoices`, `unpaid_invoices` (tenant's water billing)
- `total_revenue`, `outstanding_amount` (tenant's AR from water customers)
- `total_water_usage`, `average_usage_per_customer` (operational data)
- `active_customers`, `inactive_customers` (detailed breakdown)

### ✅ Data Dipertahankan:
- `total_customers` - untuk subscription pricing tier
- `total_users` - untuk limit enforcement
- `storage_used_gb` - untuk limit enforcement
- `subscription_plan`, `subscription_status`, `subscription_ends_at`
- Tenant contact info untuk communication

## Business Logic Examples

### Pricing Tier Check:
```javascript
if (tenant.total_customers > 5000) {
  recommendedPlan = "ENTERPRISE";
} else if (tenant.total_customers > 1000) {
  recommendedPlan = "PREMIUM";
} else {
  recommendedPlan = "BASIC";
}

if (tenant.subscription_plan !== recommendedPlan) {
  // Alert: Tenant needs upgrade
}
```

### Expiry Alert:
```javascript
const daysUntilExpiry = daysDiff(tenant.subscription_ends_at, now());
if (daysUntilExpiry <= 30) {
  // Send renewal reminder
}
```

### Storage Limit Check:
```javascript
if (tenant.storage_used_gb > tenant.storage_limit_gb * 0.9) {
  // Alert: Tenant approaching storage limit
}
```

---

**Created:** 2024-12-22
**Purpose:** Demonstrate clean separation between subscription management and operational data
