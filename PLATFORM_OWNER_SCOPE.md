# Platform Owner - Scope dan Data Access

## Ringkasan
Platform Owner adalah pengelola platform SaaS Tirta yang menyewakan aplikasi kepada tenant (PDAM/Desa). Platform Owner **TIDAK** mengelola operasional air bersih, melainkan mengelola langganan tenant yang menggunakan aplikasi.

## Perubahan yang Dilakukan

### ❌ Data yang TIDAK Boleh Diakses Platform Owner
Platform Owner **tidak perlu melihat** data operasional pengelolaan air bersih tenant seperti:
- Water usage (penggunaan air m³) 
- Invoices tagihan air pelanggan
- Payments pembayaran tagihan air
- Water rates & tariff details
- Meter readings
- Customer water consumption reports

Data ini adalah privasi operasional tenant dan tidak relevan untuk pengelolaan langganan platform.

### ✅ Data yang Boleh Diakses Platform Owner
Platform Owner hanya melihat data terkait **subscription management**:

1. **Tenant Management**
   - List data tenant pengguna aplikasi
   - Nama tenant, kode desa, status (active/suspended)
   - Tanggal mulai berlangganan (`created_at`)
   - Tanggal expired langganan (`subscription_ends_at`)
   - Jumlah customer yang dimiliki tenant (`total_customers`)
   - Jumlah user aplikasi tenant (`total_users`)
   - Storage usage untuk enforcement limit

2. **Subscription Analytics**
   - Tenant growth (pertumbuhan pelanggan platform)
   - Churn rate (tenant yang berhenti berlangganan)
   - Subscription revenue (MRR - Monthly Recurring Revenue, ARR)
   - Revenue by plan (BASIC, PREMIUM, ENTERPRISE)
   - Trial vs Active vs Suspended tenants

3. **Subscription Plan Management**
   - Create/Update subscription plans
   - Set pricing (monthly/yearly)
   - Set limits (max_users, max_customers, max_storage_gb)
   - Assign subscription to tenant
   - View billing history

## API Endpoints - Platform Owner

### Tenant Management
```
GET    /api/platform/tenants                    # List all tenants
GET    /api/platform/tenants/:id                # Tenant detail
PUT    /api/platform/tenants/:id                # Update tenant info
POST   /api/platform/tenants/:id/suspend        # Suspend tenant
POST   /api/platform/tenants/:id/activate       # Activate tenant
DELETE /api/platform/tenants/:id                # Delete tenant
GET    /api/platform/tenants/:id/statistics     # Tenant subscription stats
```

### Platform Analytics (Subscription Focused)
```
GET    /api/platform/analytics/overview              # Platform overview
GET    /api/platform/analytics/tenants               # Tenant growth analytics
GET    /api/platform/analytics/subscription-revenue  # Subscription revenue (MRR/ARR)
GET    /api/platform/analytics/platform-usage        # Platform usage metrics
```

### Subscription Plan Management
```
GET    /api/platform/subscription-plans              # List plans
POST   /api/platform/subscription-plans              # Create plan
PUT    /api/platform/subscription-plans/:id          # Update plan
POST   /api/platform/tenants/:id/subscription        # Assign subscription
GET    /api/platform/tenants/:id/billing-history     # Subscription billing
```

## Controller Changes

### Modified Functions:

1. **GetTenantStatistics** - Sekarang hanya menampilkan:
   - Total users (app users, bukan water customers)
   - Total customers (untuk perhitungan harga subscription)
   - Storage usage & limits
   - Last activity timestamp
   - ❌ Removed: water usage, invoices, payments, revenue

2. **GetPlatformAnalyticsOverview** - Fokus pada:
   - Tenant count (total, active, suspended, trial)
   - MRR (Monthly Recurring Revenue dari subscription)
   - Growth rate & churn
   - ❌ Removed: water billing revenue, payment stats

3. **GetSubscriptionRevenueAnalytics** (renamed from GetRevenueAnalytics):
   - MRR/ARR from tenant subscriptions
   - Revenue by subscription plan
   - Outstanding subscription payments
   - ❌ Removed: tenant's water billing data

4. **GetPlatformUsageAnalytics** (renamed from GetUsageAnalytics):
   - App users & customers count (for tier pricing)
   - Storage usage across platform
   - Top tenants by customer count
   - ❌ Removed: water usage, tenant revenue details

## Use Case: Subscription Pricing

Platform Owner dapat menggunakan data `total_customers` untuk menghitung harga langganan:

**Contoh Pricing Tier:**
```
BASIC Plan:
- Max 5 users
- Max 1,000 customers
- Price: Rp 500,000/month

PREMIUM Plan:
- Max 20 users
- Max 5,000 customers
- Price: Rp 2,000,000/month

ENTERPRISE Plan:
- Unlimited users
- Unlimited customers
- Price: Custom (contact sales)
```

Jika tenant memiliki 3,000 customers, mereka harus upgrade ke PREMIUM plan.

## Response Structure Changes

### TenantStatisticsResponse
```json
{
  "tenant_id": "uuid",
  "tenant_name": "PDAM Desa ABC",
  "total_users": 5,           // App users
  "active_users": 4,
  "total_customers": 2500,    // For subscription pricing
  "storage_used_gb": 2.5,
  "storage_limit_gb": 10,
  "api_calls_today": 1500,
  "api_calls_limit": 10000,
  "last_activity_at": "2024-01-15T10:30:00Z"
}
```

**Removed fields:**
- `active_customers`, `inactive_customers`
- `total_invoices`, `paid_invoices`, `unpaid_invoices`
- `total_revenue`, `outstanding_amount`
- `total_water_usage`, `average_usage_per_customer`

## Security & Privacy

✅ **Benefit:**
- Tenant operational data tetap private
- Platform Owner hanya lihat metrics yang relevan untuk subscription management
- Lebih clean separation of concerns
- Better data privacy compliance

## Middleware

Route platform owner menggunakan:
```go
platform.Use(middleware.JWTAuthMiddleware())
platform.Use(middleware.AdminOnly()) // TODO: Create PlatformOwnerOnly middleware
```

**Recommended:** Buat middleware khusus `PlatformOwnerOnly()` yang:
- Check `role == "PLATFORM_OWNER"`
- Check `tenant_id IS NULL` (platform owner tidak belong ke tenant spesifik)

## Frontend Implications

Dashboard Platform Owner harus menampilkan:
- List tenant dengan info subscription
- Subscription analytics (MRR, growth, churn)
- Tenant management (suspend/activate)
- Subscription plan management

**Tidak perlu menampilkan:**
- Water usage charts
- Customer payment reports
- Invoice management tenant
- Water tariff details

---

**Created:** 2024-12-22
**Purpose:** Memisahkan tanggung jawab Platform Owner (subscription management) dari Tenant Admin (water utility operations)
