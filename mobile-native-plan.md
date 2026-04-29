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

- [ ] Login dan session management
- [ ] Dashboard role-based
- [ ] Tenant management untuk `platform_owner`
- [ ] Tenant settings untuk `tenant_admin`
- [ ] Tenant user management
- [ ] Customer list/detail/create/activation
- [ ] Input dan update water usage
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
- [ ] Tambah forced logout jika tenant suspended/expired
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
- [ ] Session
- [ ] Tenant list/detail
- [ ] Tenant settings
- [ ] Tenant user CRUD
- [x] Customer list/detail (CustomerListScreen + CustomerRepository)

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
- [ ] Validasi build lokal menunggu environment yang punya JDK + Android SDK
- [x] Refactor backend auth untuk mobile-readiness dimulai
- [ ] Penyesuaian frontend akibat perubahan backend dimulai
- [x] Phase 2 auth API integration: `AuthApiService`, `AuthRepository`, `AuthInterceptor`, `TokenProvider` sudah terhubung ke backend
- [ ] Phase 2 lanjutan: tenant, customer, usage, invoice, payment
