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

- Sudah menjadi aplikasi operasional native modular berbasis Jetpack Compose (`app` + `core/*` + `feature-*`)
- Modul domain utama sudah tersedia: auth, tenant, user, customer, usage, invoice, payment, printer
- `printer-bridge` tetap ada sebagai app bridge terpisah untuk skenario integrasi printer tertentu

## Gap yang Harus Dibereskan

### Backend

- [x] Tambah `POST /api/auth/refresh`
- [x] Tambah `POST /api/auth/logout`
- [x] Tambah `GET /api/auth/me`
- [ ] Samakan response backend ke format standar _(PARTIAL: `customer_controller`, `invoice_controller`, `payment_controller`, `water_usage_controller`, `water_rate_controller`, `subscription_payment_controller` sudah pakai `helpers.RespondSuccess/Paginated/Created`; 18 controller lainnya masih pakai raw `c.JSON`)_
- [x] Rapikan permission untuk `meter_reader` dan `finance` _(DONE: route operasional `water-usage`, `invoice`, dan `payment` dipindah dari guard `AdminOnly()` ke guard permission granular (`RequirePermission`) sehingga `meter_reader`/`finance` mendapat akses sesuai haknya; kompatibilitas role legacy `admin` tetap dipertahankan di middleware permission)_
- [ ] Standarkan pagination, filtering, dan sorting _(PARTIAL: invoice, payment, water-usage sudah; endpoint lain belum)_
- [x] Tambah dukungan sync-friendly untuk operasional mobile _(Backend water-usage sudah ada idempotent create: jika client kirim ID, backend cek duplikat dan kembalikan record existing)_
- [x] Bekukan contract receipt untuk printer thermal (ReceiptPayload sudah ditambah ke InvoiceResponse)

### Frontend

- [x] Sesuaikan service jika contract backend berubah _(DONE: invoice/usage/payment services disesuaikan dengan paginated response backend)_
- [ ] Sesuaikan constants endpoint jika route berubah _(DEFERRED: pengerjaan web di environment ini di-skip; lanjut di WSL)_
- [x] Sesuaikan mapper/normalizer jika response backend dirapikan _(DONE: fix query param `limit` → `page_size`, fix response unwrapping agar `meta` tidak hilang)_
- [ ] Pastikan auth flow web tetap jalan setelah perubahan backend _(DEFERRED: verifikasi dijadwalkan di environment WSL)_
- [ ] Pastikan flow tenant, customer, usage, invoice, payment, dan receipt tetap kompatibel _(DEFERRED: verifikasi dijadwalkan di environment WSL)_

### Android

- [x] Inisialisasi app native utama
- [x] Pasang base architecture Kotlin + Clean Architecture + MVVM
- [x] Pasang networking, local DB, DI, dan session handling
- [x] Implement fitur MVP operasional (usage, invoice, payment screens + navigation)
- [x] Implement modul printer Bluetooth thermal (feature-printer)
- [x] Samakan consumer Android aktif ke kontrak backend canonical utama _(DONE: helper `ApiResponse/PagedApiResponse`, tenant list pakai `page_size`, repository utama tidak lagi unwrap data secara sporadis)_
- [x] Rapikan session context untuk mobile _(DONE: role, nama user, dan tenant name ikut disimpan di session storage)_
- [x] Rapikan feedback UX inti mobile _(DONE: snackbar/error state lebih konsisten, status invoice dilokalkan, tenant blocked diberi dialog yang jelas)_

## Scope MVP Mobile

### Core

- [x] Login dan session management
- [x] Dashboard role-based _(DONE: dashboard sekarang memfilter modul berdasarkan role/session context)_
- [x] Tenant management untuk `platform_owner` (list + detail + actions)
- [x] Tenant settings untuk `tenant_admin` (Android: endpoint fix + TenantSettingsRepository fix)
- [x] Tenant user management (CRUD)
- [x] Customer list/detail/create/activation
- [x] Input dan update water usage
  - [x] Backend: idempotent create, draft support, pagination/listing, finalize conflict handling (DONE)
  - [x] Frontend: fix query param `limit` → `page_size`, fix response unwrapping (`response` bukan `response.data`), fix pagination dari `meta.total_items/current_page/page_size/total_pages` — DONE
  - [x] Android: UsageApiService, UsageRepository, UsageListViewModel, UsageFormViewModel, UsageListScreen, UsageFormScreen, DI (DONE)
- [x] Monitoring invoice (Android: InvoiceApiService, InvoiceRepository, InvoiceListViewModel, InvoiceDetailViewModel, InvoiceListScreen, InvoiceDetailScreen, DI)
- [x] Input payment (Android: PaymentApiService, PaymentRepository, PaymentViewModel, PaymentInputScreen, DI)
- [x] Print receipt ke thermal printer (feature-printer: BluetoothPrinterManager, EscPosRenderer, PrintQueueManager, PrinterScreen)
- [x] Monitoring operasional dasar _(DONE: modul `feature-monitoring` sudah dibuat dengan dashboard ringkasan revenue, pembayaran, tunggakan, pelanggan, dan pemakaian)_

### Enhancement

- [x] Offline draft water usage (DraftUsageEntity, DraftUsageDao, DraftUsageRepository)
- [x] Sync queue untuk input lapangan (SyncQueueEntity, SyncQueueDao, DraftUsageSyncWorker + HiltWorkerFactory)
- [x] Filter customer by service area / route _(DONE: backend `GET /api/customers` support query `service_area_id` + `reading_route_id`, Android customer list tambah dropdown area layanan + filter route ID)_
- [x] Upload foto meter _(DONE: backend menambah endpoint `POST /api/water-usage/:id/photo` + static serve `/uploads/water-usage`, Android `UsageFormScreen` mendukung pilih & upload foto meter lalu simpan `photo_url` ke data pemakaian)_
- [ ] OCR foto meter -> meter usage text _(Rencana: ekstrak angka meter dari foto via OCR, parse ke `meter_end`, simpan confidence + raw text, dan wajib konfirmasi manual user saat confidence rendah)_
- [x] Reprint receipt dari riwayat _(DONE: Android tambah `PaymentHistoryScreen` + `PaymentHistoryViewModel`, tombol reprint navigasi ke `PrinterScreen` menggunakan `invoice_id`)_
- [x] Push notification _(DONE: Android menambahkan notifikasi sistem untuk hasil sinkronisasi draft pemakaian; permission `POST_NOTIFICATIONS` diminta saat app dibuka pada Android 13+, worker sinkronisasi mengirim notifikasi sukses/gagal)_

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
│   └── testing/          ← belum dibuat
├── feature-auth/
├── feature-tenant/
├── feature-user/
├── feature-customer/
├── feature-usage/
├── feature-invoice/
├── feature-payment/
├── feature-monitoring/
├── feature-printer/
├── printer-core/         ← belum dibuat (printer-bridge berdiri sendiri)
└── printer-bridge/
```

Flow utama:

```text
UI -> ViewModel -> Repository -> API / Local DB
```

## Data Layer dan Offline Strategy

Keputusan awal:

- Gunakan **hybrid offline**
- Online-only untuk auth, approval, payment final, invoice generation, report agregat
- Offline-capable untuk customer cache, water usage draft, sync queue, printer preference, receipt cache terbatas

Checklist:

- [x] Tambah Room database (TirtaDatabase v3: SyncQueueEntity, TenantSettingsEntity, DraftUsageEntity)
- [ ] Tambah entity cache customer
- [x] Tambah entity draft water usage (DraftUsageEntity + DraftUsageDao)
- [x] Tambah sync queue (SyncQueueEntity + SyncQueueDao)
- [x] Tambah worker untuk retry sync (DraftUsageSyncWorker + @HiltWorker + HiltWorkerFactory)
- [ ] Definisikan conflict resolution untuk data usage _(PARTIAL: validasi format bulan ditambahkan di form, retry manual sinkronisasi draft tersedia dari Usage List, namun aturan conflict final antar-device masih perlu diformalisasi di backend + mobile)_

## Modul Bluetooth Printer

Flow:

```text
UI -> Print Manager -> Print Queue -> Bluetooth Service -> Device
```

Checklist:

- [x] Scan paired printer Bluetooth Classic (BluetoothPrinterManager.getPairedPrinters)
- [x] Permission handling Android 12+ (BLUETOOTH_CONNECT, BLUETOOTH_SCAN di AndroidManifest + runtime request di PrinterScreen)
- [x] Connect / reconnect printer (BluetoothPrinterManager.connect via SPP UUID)
- [x] Render receipt ke ESC/POS bytes (EscPosRenderer, 58mm / 32 chars wide)
- [x] Queue print job (PrintQueueManager.enqueue + processNext)
- [x] Retry gagal cetak (PrintQueueManager: max 3 retries)
- [x] Simpan preferred printer (PrinterPreferenceRepository via DataStore)

## Authentication dan Security

Checklist:

- [x] Login dengan JWT
- [x] Simpan token di EncryptedSharedPreferences
- [x] Simpan preference non-sensitif di DataStore
- [x] Tambah token interceptor (Bearer header otomatis via AuthInterceptor)
- [x] Tambah token refresh interceptor (auto-refresh saat 401, TokenAuthenticator)
- [x] Tambah forced logout jika tenant suspended/expired (session tenant guard + auto-redirect to login)
- [x] Tampilkan alasan tenant blocked di UX _(dialog penjelasan sebelum user kembali ke login)_
- [x] Hindari logging data sensitif _(DONE: OkHttp logging interceptor sekarang redact header `Authorization`, `Cookie`, dan `Set-Cookie`)_

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
- [x] Tenant settings
  - [x] Backend: GET /api/tenant/settings dan PUT /api/tenant/settings — menggunakan tenant dari JWT (bukan path param), response ApiResponse terstandar
  - [ ] Frontend: implement tenant settings UI and mapper to backend contract (pending)
  - [x] Android: TenantSettingsRepository (Room cache, fetch on login), TenantSettingsScreen, TenantSettingsViewModel — DONE
- [x] Tenant user CRUD (GET/POST/PUT/DELETE /api/tenant-users)
- [x] Customer list/detail/create (CustomerListScreen, CustomerDetailScreen, CustomerRepository)
- [x] Usage (Water Usage)
  - [x] Backend: GET /api/water-usage (paged, filter usage_month/customer_id), POST create dengan is_draft, PUT update, response is_draft field — DONE
  - [ ] Frontend: adapt services/normalizers if response is standardized
  - [x] Android: UsageApiService, UsageRepository, UsageListViewModel, UsageFormViewModel, UsageListScreen, UsageFormScreen, DraftUsageRepository, DraftUsageSyncWorker (@HiltWorker), DI — DONE
- [x] Invoice
  - [x] Backend: GET /api/invoices (paged, filter usage_month/status/customer_id), GET /api/invoices/{id} dengan receipt payload, response ApiResponse terstandar — DONE
  - [x] Android: InvoiceApiService, InvoiceRepository, InvoiceListViewModel (pagination fix: currentPage), InvoiceDetailViewModel, InvoiceListScreen, InvoiceDetailScreen (FAB cetak struk), DI — DONE
  - [ ] Frontend: ensure invoice preview/print compatibility with frozen receipt contract
- [x] Payment
  - [x] Backend: POST /api/payments multipart (invoice_id, amount, method, notes, proof file opsional), GET /api/payments paged + invoice_id filter, GET /api/payments/{id} wrapped — DONE
  - [x] Android: PaymentApiService (@Multipart), PaymentRepository, PaymentViewModel, PaymentInputScreen, DI — DONE
  - [ ] Frontend: update payment service and UI flows if contract changes


### Phase 3 - Operasional User

- [x] Water usage list (UsageListScreen + UsageListViewModel)
- [x] Water usage create/update (UsageFormScreen + UsageFormViewModel)
- [x] Offline draft (DraftUsageEntity + DraftUsageRepository)
- [x] Sync queue (SyncQueueEntity + DraftUsageSyncWorker + HiltWorkerFactory)
- [x] Invoice monitoring (InvoiceListScreen + InvoiceDetailScreen)
- [x] Payment input (PaymentInputScreen)
- [x] Fix pagination bug: InvoiceListViewModel meta?.page → meta?.currentPage

### Phase 4 - Printer Integration

- [x] Permission Bluetooth (BLUETOOTH_CONNECT, BLUETOOTH_SCAN — manifest + runtime request)
- [x] Device discovery / paired list (BluetoothPrinterManager.getPairedPrinters)
- [x] Connect / disconnect (BluetoothPrinterManager.connect via SPP UUID + PrinterScreen UI)
- [x] Receipt rendering (EscPosRenderer: ReceiptPayloadDto → ESC/POS bytes, 58mm/32 char)
- [x] Print queue (PrintQueueManager: enqueue + processNext)
- [x] Retry gagal cetak (PrintQueueManager max 3 retries)
- [x] Simpan preferred printer (PrinterPreferenceRepository via DataStore)
- [x] PrinterScreen dengan FAB cetak + daftar paired devices + status koneksi
- [x] InvoiceDetailScreen: FAB "Cetak Struk" → navigate ke PrinterScreen
- [x] Reprint flow dari riwayat pembayaran _(DONE: route `payment_history` aktif, list pembayaran paginated, aksi "Reprint Struk" terhubung ke flow printer)_

### Phase 5 - Stabilization

- [ ] Hardening error handling _(PARTIAL: `UsageFormViewModel` menambahkan validasi format bulan `YYYY-MM` dan handling error baca file foto meter agar tidak silent failure)_
- [ ] Hardening sync _(PARTIAL: `UsageListScreen` menambahkan kontrol "Sinkronkan Draft" manual + indikator jumlah draft pending; scheduling worker diekstrak ke `DraftSyncScheduler`)_
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
- [ ] Penyesuaian frontend akibat perubahan backend masih berjalan (tbd) _(PARTIAL: usage/invoice/payment service sudah fix; auth flow, tenant, customer, receipt belum diverifikasi)_
- [x] Phase 2 auth API integration: login, refresh, logout, TokenAuthenticator, ApiResponse wrapper
- [x] Phase 2 lanjutan: tenant list/detail, tenant actions, customer list/detail/create, user CRUD, session tenant guard
- [x] Android: Tenant settings caching implemented (Room entity/DAO, repository, login hook)
- [x] Work resumed: 2026-04-30T12:55:23+07:00 — Melanjutkan Phase 2 (tenant settings -> usage -> invoice -> payment)
- [x] Work resumed: 2026-05-07 — Phase 2 backend gaps diselesaikan: invoice pagination, payment pagination+multipart, water usage response wrapping, is_draft field
- [x] Android: TenantSettingsScreen + TenantSettingsViewModel + navigasi dashboard selesai
- [x] Phase 3 selesai: InvoiceListViewModel pagination bug fix (meta?.currentPage), DraftUsageSyncWorker @HiltWorker, TirtaSaasMobileApp Configuration.Provider, WorkManager auto-init disabled
- [x] Phase 4 selesai (2026-05-08): feature-printer module — BluetoothPrinterManager, EscPosRenderer (58mm ESC/POS), PrintQueueManager (retry max 3), PrinterPreferenceRepository (DataStore), PrinterViewModel, PrinterScreen, Bluetooth permission handling Android 12+
- [x] feature-printer code refined (2026-05-08): cleanup build.gradle.kts, slim down BluetoothPrinterManager/EscPosRenderer/PrinterScreen
- [x] Frontend service fix (2026-05-08): invoiceService/usageService/paymentService — query param limit→page_size, response unwrapping fix, pagination dari meta field
- [x] Android monitoring baseline (2026-05-25): modul `feature-monitoring` ditambahkan, terintegrasi ke dashboard + navigasi, memuat ringkasan laporan revenue/customer/usage/payment/outstanding dari endpoint `/api/reports/*`
- [x] Customer area/route filter (2026-05-25): backend request/response customer diperluas dengan service area + reading route; Android `feature-customer` menambah filter area layanan dan route ID serta menampilkan label area/route di kartu pelanggan
- [x] Security hardening logging (2026-05-25): `NetworkModule` menambahkan redaksi header sensitif (`Authorization`, `Cookie`, `Set-Cookie`) pada HTTP logging interceptor
- [x] Reprint receipt from payment history (2026-05-25): `feature-payment` menambah `PaymentHistoryScreen` + `PaymentHistoryViewModel`, dashboard menambah menu "Riwayat Pembayaran", dan aksi reprint langsung navigasi ke `PrinterScreen` per `invoiceId`
- [x] Upload foto meter (2026-05-25): backend `water_usage_controller` menambah upload multipart `photo` dan expose `photo_url`; Android `feature-usage` menambah alur image picker + upload foto meter pada form input/update pemakaian
- [x] Push notification baseline (2026-05-25): notifikasi lokal ditambahkan untuk status sinkronisasi draft pemakaian (sukses/gagal), termasuk request runtime permission notifikasi Android 13+ dan fallback simpan draft lokal + enqueue WorkManager saat kirim draft ke server gagal
- [x] Stabilization partial (2026-05-25): hardening usage flow ditingkatkan dengan validasi bulan pemakaian, error handling pemrosesan foto meter, tombol sinkronisasi draft manual di Usage List, serta scheduler sinkronisasi draft terpusat (`DraftSyncScheduler`)
- [x] Backlog documented (2026-05-25): rencana fitur OCR foto meter ditambahkan ke enhancement dengan pendekatan semi-otomatis (confidence threshold + manual confirmation)
- [x] Backend role permission stabilization (2026-05-26): route `water-usage`, `invoice`, dan `payment` kini memakai permission-based middleware per endpoint (`PermRecord/View/Edit/Manage*`), menggantikan `AdminOnly()` agar akses `meter_reader` dan `finance` sesuai matriks role
- [x] Frontend guard alignment (2026-05-26): `PrivateRoute` diperbarui agar role `finance` dapat mengakses route admin (`requiredRole="admin"`) sehingga sejalan dengan perubahan permission backend operasional
- [x] Frontend guard refinement (2026-05-26): `PrivateRoute` dirapikan menggunakan daftar role admin-operasional terpusat (`platform_owner`, `tenant_admin`, `meter_reader`, `finance`, `service`) untuk mencegah ketertinggalan role saat policy backend berubah
- [ ] Web verification deferred (2026-05-26): sesuai keputusan sesi ini, pengerjaan/verifikasi web di-skip pada environment sekarang dan akan dilanjutkan di environment WSL
