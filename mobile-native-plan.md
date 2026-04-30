# Mobile Native Plan

Dokumen ini menjadi acuan implementasi `tirta-saas-android` sebagai aplikasi native Kotlin yang independen dari frontend web, terhubung langsung ke backend REST API, dan mendukung operasional lapangan serta Bluetooth thermal printer.

## Tujuan

- Membangun channel mobile native yang terpisah dari web
- Menjaga backend, frontend, dan mobile tetap sinkron pada level contract
- Menyediakan checklist progress implementasi yang bisa diperbarui selama pengerjaan

## Prinsip Kerja

- Mobile app tidak menggunakan WebView
- Mobile dan web adalah channel operasional terpisah
- Keduanya hanya terhubung melalui backend API
- Jika perapihan backend berdampak pada contract frontend, maka frontend wajib ikut disesuaikan

## Kondisi Existing System

### Backend

- Sudah memiliki domain utama: auth, tenant, tenant user, customer, water usage, invoice, payment, report, tenant settings, payment method
- Multi-tenant utama berjalan dari JWT/context
- Response masih belum seragam antar endpoint
- Endpoint auth/session penting untuk mobile masih belum lengkap

### Frontend

- Sudah berjalan sebagai web app existing
- Memiliki banyak adapter/normalizer untuk mengatasi response backend yang belum konsisten
- Menjadi referensi behavior bisnis yang saat ini aktif

### Android

- Belum menjadi aplikasi operasional native penuh
- Saat ini baru ada bootstrap Gradle dan modul `printer-bridge`
- Modul utama mobile app masih perlu dibangun dari nol

## Gap yang Harus Dibereskan

### Backend

- [x] Tambah `POST /api/auth/refresh`
- [x] Tambah `POST /api/auth/logout`
- [x] Tambah `GET /api/auth/me`
- [ ] Samakan response backend ke format standar
- [ ] Rapikan permission untuk `meter_reader` dan `finance`
- [ ] Standarkan pagination, filtering, dan sorting
- [ ] Tambah dukungan sync-friendly untuk operasional mobile
- [ ] Bekukan contract receipt untuk printer thermal

### Frontend

- [ ] Sesuaikan service jika contract backend berubah
- [ ] Sesuaikan constants endpoint jika route berubah
- [ ] Sesuaikan mapper/normalizer jika response backend dirapikan
- [ ] Pastikan auth flow web tetap jalan setelah perubahan backend
- [ ] Pastikan flow tenant, customer, usage, invoice, payment, dan receipt tetap kompatibel

### Android

- [ ] Inisialisasi app native utama
- [ ] Pasang base architecture Kotlin + Clean Architecture + MVVM
- [ ] Pasang networking, local DB, DI, dan session handling
- [ ] Implement fitur MVP operasional
- [ ] Implement modul printer Bluetooth thermal

## Scope MVP Mobile

### Core

- [x] Login dan session management
- [ ] Dashboard role-based
- [x] Tenant management untuk `platform_owner` (list + detail + actions)
- [ ] Tenant settings untuk `tenant_admin`
- [x] Tenant user management (CRUD)
- [x] Customer list/detail/create/activation
- [ ] Input dan update water usage
  - [x] Backend: idempotent create, draft support, pagination/listing, finalize conflict handling (DONE)
  - [ ] Frontend: adapt to paginated response & draft workflow (IN_PROGRESS)
  - [x] Android: DraftUsage Room/DAO/Repository/Worker skeleton created (IN_PROGRESS)
- [ ] Monitoring invoice
- [ ] Input payment
- [ ] Print receipt ke thermal printer
- [ ] Monitoring operasional dasar

### Enhancement

- [ ] Offline draft water usage
- [ ] Sync queue untuk input lapangan
- [ ] Filter customer by service area / route
- [ ] Upload foto meter
- [ ] Reprint receipt dari riwayat
- [ ] Push notification

## API Contract Target

Semua endpoint mobile-target diupayakan mengikuti struktur:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Pesan error"
  }
}
```

## Struktur Project Android

```text
tirta-saas-android/
├── app/
├── core/
│   ├── common/
│   ├── designsystem/
│   ├── network/
│   ├── database/
│   ├── security/
│   └── testing/
├── feature-auth/
├── feature-tenant/
├── feature-user/
├── feature-customer/
├── feature-usage/
├── feature-invoice/
├── feature-payment/
├── feature-monitoring/
├── feature-printer/
├── printer-core/
└── printer-bridge/
```

Flow utama:

```text
UI -> ViewModel -> UseCase -> Repository -> API / Local DB
```

## Data Layer dan Offline Strategy

Keputusan awal:

- Gunakan **hybrid offline**
- Online-only untuk auth, approval, payment final, invoice generation, report agregat
- Offline-capable untuk customer cache, water usage draft, sync queue, printer preference, receipt cache terbatas

Checklist:

- [ ] Tambah Room database
- [ ] Tambah entity cache customer
- [ ] Tambah entity draft water usage
- [ ] Tambah sync queue
- [ ] Tambah worker untuk retry sync
- [ ] Definisikan conflict resolution untuk data usage

## Modul Bluetooth Printer

Flow:

```text
UI -> Print Manager -> Print Queue -> Bluetooth Service -> Device
```

Checklist:

- [ ] Scan paired printer Bluetooth Classic
- [ ] Permission handling Android 12+
- [ ] Connect / reconnect printer
- [ ] Render receipt ke ESC/POS bytes
- [ ] Queue print job
- [ ] Retry gagal cetak
- [ ] Simpan preferred printer

## Authentication dan Security

Checklist:

- [x] Login dengan JWT
- [x] Simpan token di EncryptedSharedPreferences
- [x] Simpan preference non-sensitif di DataStore
- [x] Tambah token interceptor (Bearer header otomatis via AuthInterceptor)
- [x] Tambah token refresh interceptor (auto-refresh saat 401, TokenAuthenticator)
- [x] Tambah forced logout jika tenant suspended/expired (session tenant guard + auto-redirect to login)
- [ ] Hindari logging data sensitif

## Stack Final

- **UI:** Jetpack Compose
- **Architecture:** Clean Architecture + MVVM
- **Networking:** Retrofit + OkHttp + Kotlinx Serialization
- **Async:** Coroutines + Flow
- **DB:** Room
- **DI:** Hilt
- **Background sync:** WorkManager
- **Image:** Coil
- **Secure storage:** EncryptedSharedPreferences + DataStore
- **Logging:** Timber

## Roadmap Pengerjaan

### Phase 1 - Setup Android Project

- [x] Buat modul app utama
- [x] Setup Compose
- [x] Setup Hilt
- [x] Setup Retrofit
- [x] Setup Room
- [x] Setup navigation
- [x] Setup base design system

### Phase 2 - Core API Integration

- [x] Auth (login, logout, refresh, JWT Bearer interceptor)
- [x] Token refresh interceptor (auto-refresh saat 401 via TokenAuthenticator)
- [x] Session (ApiResponse/PagedApiResponse wrapper + tenant status guard)
- [x] Tenant list/detail (GET /api/platform/tenants, approve/reject/suspend/activate)
- [ ] Tenant settings
  - [ ] Backend: implement GET /api/tenants/{tenantId}/settings and PUT /api/tenants/{tenantId}/settings returning standardized ApiResponse (pending)
  - [ ] Frontend: implement tenant settings UI and mapper to backend contract (pending)
  - [x] Android: TenantSettings cache implemented (fetched on login, cached in Room) — DONE
  - Notes: Android cached fields (receipt_template/printer_preference) may need backend mapping; coordinate with backend team.
    - Contract (example):

      GET /api/tenants/{tenantId}/settings
      Response 200
      {
        "success": true,
        "data": {
          "tenant_id": "uuid",
          "billing_cycle_day": 25,
          "time_zone": "Asia/Jakarta",
          "receipt_template_version": "v1",
          "printer_preference": {
            "default_printer_name": "MyPrinter",
            "paper_width_mm": 58
          },
          "features": {
            "allow_offline_usage": true,
            "require_photo_meter": false
          }
        },
        "error": null
      }

      PUT /api/tenants/{tenantId}/settings
      Request body (partial update allowed):
      {
        "billing_cycle_day": 1,
        "receipt_template_version": "v1",
        "features": { "allow_offline_usage": true }
      }

      Response 200: standardized ApiResponse with updated data

    - Validation: server must reject invalid values (e.g., billing_cycle_day not in 1..28) with error.code and HTTP 422
    - Idempotency: PUT must be idempotent; return current resource after successful update
  - [ ] Backend: validate permission scope for tenant_admin and tenant_owner (platform_owner may read any tenant)
  - [ ] Backend: include tenant settings schema in API docs (swag) and add examples for mobile clients
  - [ ] Frontend: update constants endpoint, service, and mapper for new contract (handle missing optional fields)
  - [ ] Android: implement TenantSettingsScreen, TenantSettingsRepository, and offline cache (Room). Sync notes:
    - Read settings on login and cache locally
    - Settings change should invalidate cached receipt template/version used for printing
    - Provide UI fallback when optional fields missing (e.g., printer_preference)
- [x] Tenant user CRUD (GET/POST/PUT/DELETE /api/tenant-users)
- [x] Customer list/detail (CustomerListScreen + CustomerRepository)
- [ ] Usage (Water Usage)
  - [ ] Backend: provide GET /api/water-usage (paged, filter by usage_month/customer_id/tenant), POST /api/water-usage for create, PUT /api/water-usage/{id} for update
    - Contract highlights for mobile sync:

      POST /api/water-usage
      Request body:
      {
        "id": "optional-client-uuid",
        "customer_id": "uuid",
        "usage_month": "YYYY-MM",
        "meter_end": 123.45,
        "notes": "...",
        "is_draft": true
      }

      Responses:
      - 201 Created: when a new record was created
      - 200 OK: when a record with provided id already exists (idempotent)
      - 400 Bad Request: validation errors (meter_end < previous, unreasonable meters)
      - 409 Conflict: when server detects sync conflict and requires manual merge (future enhancement)

    - Server behavior:
      - Accept optional client-generated id and use it as primary key if provided (idempotent create)
      - Store drafts (is_draft=true) and exclude them from billing/invoice generation until finalized
      - Return existing record on duplicate id to support retries
      - Validate meter_end against previous month's meter to prevent regressions
  - [ ] Backend: document conflict resolution rules (prefer server merge policy; return 409 when manual resolution needed)
  - [ ] Frontend: adapt services/normalizers if response is standardized
  - [ ] Android: implement UsageListScreen, UsageFormScreen, DraftUsage entity, Room DAO, and enqueue sync jobs (WorkManager)
- [ ] Invoice
  - [ ] Backend: provide GET /api/tenants/{tenantId}/invoices (paged) and GET /api/invoices/{id} with standardized ApiResponse
  - [ ] Backend: add "receipt" payload in invoice detail (frozen contract for printer rendering)
  - [ ] Backend: ensure invoice endpoints include customer summary and last meter reading
  - [ ] Android: implement InvoiceListScreen, InvoiceDetailScreen, and reprint-from-history flow using receipt payload
  - [ ] Frontend: ensure invoice preview/print compatibility with frozen receipt contract
- [ ] Payment
  - [ ] Backend: implement POST /api/tenants/{tenantId}/payments supporting multipart file upload for payment proof and returning standardized ApiResponse
  - [ ] Backend: expose payment status endpoints and optional webhook for external payment verification
  - [ ] Backend: validate permissions for finance and tenant_admin roles on payment verification
  - [ ] Android: implement PaymentInputScreen, camera/photo upload, local pending payments queue, and retry policy
  - [ ] Frontend: update payment service and UI flows if contract changes


### Phase 3 - Operasional User

- [ ] Water usage list
- [ ] Water usage create/update
- [ ] Offline draft
- [ ] Sync queue
- [ ] Invoice monitoring
- [ ] Payment input

### Phase 4 - Printer Integration

- [ ] Permission Bluetooth
- [ ] Device discovery / paired list
- [ ] Connect / disconnect
- [ ] Receipt rendering
- [ ] Print queue
- [ ] Reprint flow

### Phase 5 - Stabilization

- [ ] Hardening error handling
- [ ] Hardening sync
- [ ] QA multi-role
- [ ] Bug fixing
- [ ] Release configuration

## Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Bluetooth printer tidak stabil | Queue tunggal, reconnect otomatis, retry terbatas |
| Backend contract berubah | Frontend dan mobile ikut disesuaikan pada perubahan yang terdampak |
| Response backend tidak seragam | Refactor bertahap ke standard response |
| Sync conflict data lapangan | Gunakan status draft, retry policy, dan conflict handling |
| Multi-tenant complexity | Tenant context wajib konsisten dari JWT |
| Role operasional belum tepat | Rapikan middleware dan permission backend |

## Progress Notes

Gunakan bagian ini untuk update progres singkat selama implementasi.

- [x] Planning awal mobile native selesai
- [x] Aturan parity backend-frontend disepakati
- [x] Setup project Android dimulai
- [x] Struktur modular awal Android (`app`, `core/*`, `feature-auth`) sudah dibuat
- [x] Fondasi Compose + Hilt + Retrofit + Room + secure session shell sudah dipasang
- [x] Validasi build lokal: BUILD SUCCESSFUL di environment lokal
- [x] Refactor backend auth untuk mobile-readiness selesai
- [ ] Penyesuaian frontend akibat perubahan backend masih berjalan (tbd)
- [x] Phase 2 auth API integration: login, refresh, logout, TokenAuthenticator, ApiResponse wrapper
- [x] Phase 2 lanjutan: tenant list/detail, tenant actions, customer list/detail/create, user CRUD, session tenant guard
- [ ] Remaining Phase 2: tenant settings, usage, invoice, payment
- [x] Android: Tenant settings caching implemented (Room entity/DAO, repository, login hook)
- [x] Work resumed: 2026-04-30T12:55:23+07:00 — Melanjutkan Phase 2 (tenant settings -> usage -> invoice -> payment)
