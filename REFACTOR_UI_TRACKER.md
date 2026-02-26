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

## ✅ Phase 3.5 — Replace window.confirm/alert → ConfirmModal & Toast (SELESAI)

**Tujuan:** Hapus semua `window.confirm()` dan `alert()` native browser, ganti dengan UI component yang proper.

### ✅ ConfirmModal (confirm dialog)
| File | Perubahan |
|---|---|
| `payments/PaymentList.tsx` | void confirm → ConfirmModal |
| `settings/PlatformPaymentSettings.tsx` | delete bank/QR → ConfirmModal |
| `settings/TenantPaymentSettings.tsx` | delete bank/QR → ConfirmModal |
| `subscriptions/SubscriptionTypeList.tsx` | delete → ConfirmModal (hapus double-click pattern) |
| `usage/UsageList.tsx` | delete → ConfirmModal (hapus double-click pattern) |
| `user-management/UserManagementList.tsx` | delete → ConfirmModal (hapus double-click pattern) |
| `water-rates/WaterRateList.tsx` | delete → ConfirmModal (hapus double-click pattern) |

### ✅ Toast (alert → useToast)
| File | Alert | Diganti |
|---|---|---|
| `reports/OutstandingReport.tsx` | Failed to export | toast.error |
| `reports/PaymentReport.tsx` | Failed to export | toast.error |
| `reports/UsageReport.tsx` | Failed to export | toast.error |
| `reports/RevenueReport.tsx` | Failed to export | toast.error |
| `payments/PaymentList.tsx` | Failed to export | toast.error |
| `payments/PaymentReceipt.tsx` | Failed to load receipt | toast.error |
| `payments/PaymentForm.tsx` | Failed to save payment | toast.error |
| `customer-invoices/CustomerInvoiceDetail.tsx` | Failed to download invoice | toast.error |
| `platform/TenantManagement.tsx` | Action failed | toast.error |
| `platform/SubscriptionPlans.tsx` | Failed to save plan | toast.error |
| `tenant-payments/TenantPaymentVerification.tsx` | Action failed | toast.error |
| `platform-payments/PlatformSubscriptionVerification.tsx` | verified/rejected success | toast.success |
| `payment-proofs/PaymentProofDetailModal.tsx` | verified/rejected success | toast.success |
| `user-management/EditUserModal.tsx` | User updated | toast.success |
| `settings/PlatformPaymentSettings.tsx` | save/validation errors | toast.error/warning |
| `settings/TenantPaymentSettings.tsx` | save/validation errors | toast.error/warning |
| `invoices/bulk-generation/BulkInvoiceGeneration.tsx` | preview/generate alerts | toast.success/error |
| `subscription/PaymentSubmissionPage.tsx` | success | toast.success |
| `subscription/SubscriptionUpgradePage.tsx` | success/error | toast.success |

### ✅ Inline Success Panel
| File | Perubahan |
|---|---|
| `user-management/CreateUserModal.tsx` | Show credentials → inline green panel with copy button |

---

## ✅ Phase 4 — Halaman Customer Portal (SELESAI)

Halaman customer portal menggunakan dua sistem:
1. **Standalone pages** (`/customer/dashboard`, `/customer/invoices`, dll.) — layout mandiri dengan header sendiri
2. **CustomerLayout pages** (`/customer/profile/edit`, dll.) — pakai `CustomerLayout` + sidebar

### CustomerLayout System
| Komponen | Status | Keterangan |
|---|---|---|
| `CustomerSidebar.tsx` | ✅ | Mobile overlay drawer + XMarkIcon close button, close on nav click/Escape/backdrop |
| `CustomerHeader.tsx` | ✅ | Hamburger button (Bars3Icon) mobile only + `onMenuClick` prop |
| `CustomerLayout.tsx` | ✅ | Wire `sidebarOpen` state, `p-6` → `p-4 sm:p-6` |

### Standalone Customer Pages (audit mobile-friendliness)
| File | Status | Keterangan |
|---|---|---|
| `pages/customer/CustomerDashboard.tsx` | ✅ | Grid `grid-cols-1 md:grid-cols-3`, padding `px-4 sm:px-6 lg:px-8` — sudah responsif |
| `pages/customer/CustomerInvoices.tsx` | ✅ | Grid `grid-cols-1 md:grid-cols-2`, responsive — sudah OK |
| `pages/customer/CustomerPayments.tsx` | ✅ | Table `overflow-x-auto`, responsive — sudah OK |
| `pages/customer/CustomerUsage.tsx` | ✅ | Grid `grid-cols-1 md:grid-cols-3`, `overflow-x-auto` — sudah OK |
| `pages/customer/CustomerProfile.tsx` | ✅ | Grid `grid-cols-1 md:grid-cols-2` — sudah OK |
| `pages/customer/CustomerPayInvoice.tsx` | ✅ | `max-w-3xl` centered, padding responsif — sudah OK |

---

## ✅ Phase 5 — Halaman Yang Belum Ada PageHeader (SELESAI)

| File | Status | Keterangan |
|---|---|---|
| `pages/invoices/bulk-generation/BulkInvoiceGeneration.tsx` | ✅ | PageHeader title + subtitle |
| `pages/payment-proofs/PaymentProofManagement.tsx` | ✅ | PageHeader + actions (Submit button) |
| `pages/platform-payments/PlatformSubscriptionVerification.tsx` | ✅ | PageHeader title + subtitle |
| `pages/water-rates/RateHistory.tsx` | ✅ | Back button + PageHeader, wrap space-y-6 |
| `pages/customers/CustomerDetails.tsx` | ✅ | PageHeader title=customer.name, actions: back+toggle+edit |
| `pages/customers/CustomerForm.tsx` | ✅ | PageHeader dynamic title, actions: back button, simplified layout |
| `pages/invoices/InvoiceDetails.tsx` | ⬜ Skipped | Punya gradient banner card sendiri — PageHeader redundant |
| `pages/invoices/InvoiceForm.tsx` | ⬜ Skipped | h3 di dalam form card — struktur berbeda |

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
