# UI/UX Refactor Progress Tracker

**Tujuan:** Konsistensi UI/UX dan mobile-friendly di seluruh halaman proyek Tirta SaaS  
**Dimulai:** 22 Februari 2026  
**Build status:** ✅ `npm run build` bersih (no errors)

---

## ✅ Phase 1 — Foundation (SELESAI)

| Komponen | Status | Keterangan |
|---|---|---|
| `DashboardLayout.tsx` | ✅ | Hapus debug border biru, p-6 → p-4 sm:p-6, sidebarOpen state |
| `Sidebar.tsx` | ✅ | Mobile overlay drawer + hamburger, close on nav click/Escape/backdrop |
| `Header.tsx` | ✅ | Hamburger button (mobile only), hapus hardcode "Dashboard", hapus console.log |
| `PageHeader.tsx` | ✅ | **NEW** — komponen shared: title, subtitle?, actions? |
| `components/index.ts` | ✅ | Export PageHeader |

---

## ✅ Phase 2 — Apply PageHeader ke Admin Pages (SELESAI)

### Dashboard Pages
| File | Status |
|---|---|
| `pages/Dashboard.tsx` | ✅ |
| `pages/dashboards/TenantAdminDashboard.tsx` | ✅ |
| `pages/dashboards/PlatformOwnerDashboard.tsx` | ✅ |
| `pages/dashboards/MeterReaderDashboard.tsx` | ✅ |

### Customer Management
| File | Status |
|---|---|
| `pages/customers/CustomerList.tsx` | ✅ |
| `pages/customers/CustomerForm.tsx` | ⬜ Skipped (struktur berbeda) |
| `pages/customers/CustomerDetails.tsx` | ⬜ Skipped (struktur berbeda) |

### Invoices
| File | Status |
|---|---|
| `pages/invoices/InvoiceList.tsx` | ✅ |
| `pages/invoices/InvoiceForm.tsx` | ⬜ Skipped |
| `pages/invoices/InvoiceDetails.tsx` | ⬜ Skipped |

### Payments
| File | Status |
|---|---|
| `pages/payments/PaymentList.tsx` | ✅ |
| `pages/payments/PaymentForm.tsx` | ✅ |
| `pages/payments/PaymentReceipt.tsx` | ✅ |

### Water Usage
| File | Status |
|---|---|
| `pages/usage/UsageList.tsx` | ✅ |
| `pages/usage/MeterReadingForm.tsx` | ✅ |
| `pages/usage/BulkImportWaterUsage.tsx` | ✅ |
| `pages/usage/UsageHistory.tsx` | ✅ |

### Water Rates
| File | Status |
|---|---|
| `pages/water-rates/WaterRateList.tsx` | ✅ |
| `pages/water-rates/WaterRateForm.tsx` | ✅ |

### Subscriptions
| File | Status |
|---|---|
| `pages/subscriptions/SubscriptionTypeList.tsx` | ✅ |
| `pages/subscriptions/SubscriptionTypeForm.tsx` | ✅ |

### Reports
| File | Status |
|---|---|
| `pages/reports/ReportsDashboard.tsx` | ✅ |
| `pages/reports/PaymentReport.tsx` | ✅ |
| `pages/reports/RevenueReport.tsx` | ✅ |
| `pages/reports/UsageReport.tsx` | ✅ |
| `pages/reports/OutstandingReport.tsx` | ✅ |
| `pages/reports/CustomerAnalytics.tsx` | ✅ |

### Settings
| File | Status |
|---|---|
| `pages/settings/TenantPaymentSettings.tsx` | ✅ |
| `pages/settings/PlatformPaymentSettings.tsx` | ✅ |

### Platform (Platform Owner)
| File | Status |
|---|---|
| `pages/platform/PlatformAnalytics.tsx` | ✅ |
| `pages/platform/TenantManagement.tsx` | ✅ |
| `pages/platform/SubscriptionPlans.tsx` | ✅ |

### Lainnya
| File | Status |
|---|---|
| `pages/user-management/UserManagementList.tsx` | ✅ |
| `pages/tenant-payments/TenantPaymentVerification.tsx` | ✅ |

---

## ✅ Phase 3 — Mobile-Friendly Layout (SELESAI)

| Item | Status | Keterangan |
|---|---|---|
| Main content padding | ✅ | `p-6` → `p-4 sm:p-6` di DashboardLayout |
| SubscriptionPlans forms | ✅ | `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` |
| TenantManagement grids | ✅ | `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` |
| PaymentReceipt grid | ✅ | `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` |
| TenantPaymentVerification | ✅ | `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` |

---

## ⬜ Phase 4 — Halaman Customer Portal (BELUM)

Halaman customer portal (`/customer/...`) belum di-review untuk mobile-friendliness.
Menggunakan `CustomerLayout.tsx` terpisah — perlu audit tersendiri.

| File | Status |
|---|---|
| `pages/customer/CustomerDashboard.tsx` | ⬜ |
| `pages/customer/CustomerInvoices.tsx` | ⬜ |
| `pages/customer/CustomerPayments.tsx` | ⬜ |
| `pages/customer/CustomerProfile.tsx` | ⬜ |
| `pages/customer/CustomerUsage.tsx` | ⬜ |
| `pages/customer/CustomerPayInvoice.tsx` | ⬜ |

---

## ⬜ Phase 5 — Halaman Yang Belum Ada PageHeader

Halaman yang masih pakai h1 inline (belum urgent, skipped karena struktur berbeda):

| File | Catatan |
|---|---|
| `pages/customers/CustomerDetails.tsx` | Detail view — perlu custom header |
| `pages/customers/CustomerForm.tsx` | Form — perlu custom header |
| `pages/invoices/InvoiceDetails.tsx` | Detail view — perlu custom header |
| `pages/invoices/InvoiceForm.tsx` | Form |
| `pages/invoices/bulk-generation/BulkInvoiceGeneration.tsx` | Halaman baru |
| `pages/payment-proofs/PaymentProofManagement.tsx` | Admin proof management |
| `pages/water-rates/RateHistory.tsx` | History view |
| `pages/platform-payments/PlatformSubscriptionVerification.tsx` | Platform page |

---

## 📌 Catatan Teknis

### Sidebar Mobile Pattern
- Desktop (≥ `md`): fixed sidebar `w-64`, selalu visible
- Mobile (< `md`): hidden, buka dengan hamburger di Header, overlay + backdrop
- Close: klik backdrop, klik menu item, tekan Escape

### PageHeader Component
```tsx
import { PageHeader } from '../../components';

// Minimal
<PageHeader title="Customers" />

// Dengan subtitle
<PageHeader title="Customers" subtitle="Manage all registered customers" />

// Dengan action button
<PageHeader
  title="Customers"
  actions={
    <button onClick={handleAdd} className="btn-primary">
      <PlusIcon className="h-5 w-5 mr-2" />
      Add Customer
    </button>
  }
/>
```

### Standar Button Style (untuk actions di PageHeader)
```tsx
// Primary action
className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"

// Secondary action
className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
```

### Build Status
- `npx tsc --noEmit` → ✅ 0 errors
- `npm run build` → ✅ success (warning chunk size bukan error)
