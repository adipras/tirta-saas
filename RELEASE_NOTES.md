# Release Notes

## v1.1.1 - 2026-06-02

**Tipe rilis:** Patch  
**Cakupan:** Backend + Frontend  
**Tag deploy yang disarankan:** `deploy-all-v1.1.1`

### Ringkasan
- Memperbaiki error startup backend akibat index yang invalid di `database_optimization.go`.
- Menghapus perintah MySQL yang tidak kompatibel dengan MySQL 8.0+.
- Memperbaiki TypeScript error di frontend akibat referensi `meter_number` yang tertinggal di beberapa komponen yang tidak ikut diubah pada refactor v1.1.0.

### Akar masalah
- `database_optimization.go` mendefinisikan index `idx_customers_tenant_customer(tenant_id, customer_id)` pada tabel `customers`, padahal kolom `customer_id` tidak pernah ada di tabel tersebut (copy-paste error lama). Error ini sebelumnya tidak terlihat karena fungsi `createIndexIfNotExists` hanya log warning tanpa menghentikan startup — namun kini ditangani lebih bersih.
- `SET SESSION query_cache_type = ON` menghasilkan `Unknown system variable` di MySQL 8.0+ karena variabel tersebut sudah dihapus dari MySQL versi tersebut.
- Beberapa komponen frontend (`CustomerSearchSelect`, `UsageList`, `UsageHistory`, `NotificationManagement`) dan halaman `BulkImportCustomers` masih mengakses `customer.meter_number` yang sudah tidak ada sejak tipe `Customer` diperbarui di v1.1.0.

### Perubahan teknis
- Hapus entry `{"customers", []string{"tenant_id", "customer_id"}, "idx_customers_tenant_customer"}` dari daftar index di `database_optimization.go`.
- Hapus `SET SESSION query_cache_type = ON` dari daftar query optimasi MySQL.
- Ganti semua referensi `customer.meter_number` di frontend dengan `customer.meters?.[0]?.meter_number`.
- Perbaiki typo `row.subscription_id` menjadi `row.subscription_type_id` di tabel preview bulk import.

### Dampak deploy
- Backend restart tidak lagi menghasilkan error index invalid atau warning `query_cache_type`.
- Frontend build (TypeScript) kembali bersih tanpa error.
- Tidak ada perubahan schema database.

### File yang berubah
- `tirta-saas-backend/config/database_optimization.go`
- `tirta-saas-frontend/src/components/CustomerSearchSelect.tsx`
- `tirta-saas-frontend/src/pages/usage/UsageList.tsx`
- `tirta-saas-frontend/src/pages/usage/UsageHistory.tsx`
- `tirta-saas-frontend/src/pages/notifications/NotificationManagement.tsx`
- `tirta-saas-frontend/src/pages/customers/BulkImportCustomers.tsx`

---

## v1.1.0 - 2026-06-02

**Tipe rilis:** Minor — breaking change pada contract API customer dan format CSV import  
**Cakupan:** Backend + Frontend + Android  
**Tag deploy yang disarankan:** `deploy-all-v1.1.0`

### Ringkasan

Refactor multi-meter: satu customer kini bisa memiliki lebih dari satu meter. `meter_number` dan `subscription_id` dipindahkan dari tabel `customers` ke tabel `meters` sebagai pemilik data yang tepat. Setiap meter punya invoice registrasi sendiri yang ter-link via `meter_id`. Ditambahkan audit trail sumber angka awal meter (`meter_start_source`) pada setiap catatan pemakaian air.

### Akar masalah

- `meter_number` dan `subscription_id` tersimpan di `customers`, padahal secara konsep keduanya milik meter — bukan pelanggan.
- Satu customer hanya bisa punya 1 meter karena `meter_number` ada di level customer.
- Invoice registrasi tidak memiliki `meter_id`, sehingga tidak bisa di-trace ke meter mana biaya itu berasal.
- Logika pengisian `meter_start` pada `water_usages` tidak konsisten dan tidak ada audit trail sumbernya.

### Perubahan schema database

- `customers.meter_number` — **di-DROP** (data sudah ada di `meters.meter_number`)
- `meters` — tambah kolom `subscription_type_id char(36)` + UNIQUE KEY `uni_tenant_meter_number (tenant_id, meter_number)`
- `water_usages` — tambah kolom `meter_start_source ENUM('previous_reading','initial_reading','default') NOT NULL DEFAULT 'default'`
- `invoices` — kolom `meter_id` kini digunakan dan wajib diisi untuk invoice tipe `registration` dan `monthly`

> Semua perubahan schema diterapkan **otomatis** saat backend restart via GORM AutoMigrate + fungsi `applyMultiMeterSchemaAdjustments()` yang baru. Tidak perlu menjalankan SQL manual.

### Perubahan API (breaking)

**`POST /api/customers`** — request body berubah:
- Sebelumnya: `meter_number` (string) + `subscription_id` (uuid) di root body
- Sekarang: `meters[]` array wajib minimal 1 elemen, masing-masing berisi `meter_number`, `subscription_type_id`, `install_date`, `initial_reading`, dll.
- Response: kini mengembalikan `{ customer, meters[], registration_invoices[] }`

**`GET /api/customers/:id`** — response berubah:
- Sekarang mengembalikan `{ customer, meters[] }` di mana setiap meter menyertakan `subscription_type` dan `latest_reading`

**Endpoint baru:**
- `POST /api/customers/:id/meters` — tambah meter ke customer existing; auto-buat invoice registrasi
- `GET /api/meters/:id/resolve-meter-start?month=YYYY-MM` — resolve angka awal meter beserta sumber dan deskripsinya

**`POST /api/customers/bulk-import`** — format CSV berubah:
- Sebelumnya: `name, meter_number, address, phone, subscription_id`
- Sekarang: `name, email, phone, address, meter_number, subscription_type_id, install_date, initial_reading` (opsional: `password, is_active`)
- Import **tidak** menghasilkan invoice registrasi otomatis

**`POST /api/water-usage`** — request diperluas:
- Tambah field `meter_id` (opsional tapi sangat direkomendasikan) untuk resolve `meter_start` yang akurat
- Response mencakup `meter_start_source`

### Perubahan teknis

**Backend:**
- Hapus field `MeterNumber` dari model `Customer`
- Tambah field `SubscriptionTypeID *uuid.UUID` dan relasi `SubscriptionType` ke model `Meter`
- Tambah field `MeterStartSource string` ke model `WaterUsage`
- Tambah field `MeterID *uuid.UUID` dan relasi `Meter` ke model `Invoice`
- Service baru `GenerateRegistrationInvoice(db, tenantID, customerID, meterID)` di `services/registration_invoice_service.go`
- Service baru `ResolveWaterUsageMeterStart(db, meterID, usageMonth)` di `services/meter_reading_service.go` — prioritas: bacaan bulan lalu → angka awal meter → 0 (default)
- Controller baru `AddMeterToCustomer` dan `ResolveMeterStart` + `GetCustomerMeters`
- Route baru di `routes/customer.go` dan `routes/meter.go`
- `CreateWaterUsage` diperbarui: gunakan `meter_id` untuk resolve `meter_start` via service, set `meter_start_source`, ambil tarif dari `meter.SubscriptionTypeID`
- `BulkImportCustomers` diperbarui: buat customer + meter dalam satu mini-transaction, tidak panggil `GenerateRegistrationInvoice`
- Fungsi `applyMultiMeterSchemaAdjustments()` di `config/database.go` untuk DROP kolom dan tambah unique index secara otomatis

**Frontend:**
- `CustomerForm.tsx` — hapus field `meter_number`/`subscription_id` top-level; tambah section "Data Meter" dengan dynamic rows (+ Tambah Meter, hapus per row, validasi inline)
- `CustomerDetails.tsx` — tambah section "Meter Terpasang" (tabel dengan bacaan terakhir per meter) + modal "Tambah Meter"
- `MeterReadingForm.tsx` — tambah step pilih meter setelah pilih customer; auto-resolve dan tampilkan `meter_start` beserta keterangan sumber; kirim `meter_id` saat submit
- `BulkImportCustomers.tsx` — update template CSV, update validasi header, tambah peringatan "Import tidak menghasilkan invoice registrasi otomatis"
- `InvoiceList.tsx` — pencarian invoice kini memakai `meters.meter_number` via JOIN (bukan `customers.meter_number`)
- `types/customer.ts` — tambah interface `Meter`, `MeterInput`, `AddMeterDto`, `MeterStartResolution`, `CreateCustomerResponse`
- `customerService.ts` — tambah method `addMeterToCustomer`, `getCustomerWithMeters`, `resolveMeterStart`, `getCustomerMeters`

**Android:**
- `CustomerModels.kt` — hapus `meterNumber` dari `CustomerDto`; tambah `MeterDto`, `CustomerDetailData`, `MeterStartResolution`, `MeterInputDto`; update `CreateCustomerRequest` pakai `meters[]`; update `UpdateCustomerRequest` hapus `subscriptionId`/`email`
- `UsageModels.kt` — tambah `meterId` ke `CreateWaterUsageRequest`
- `CustomerApiService.kt` — tambah endpoint `POST customers/:id/meters` dan `GET meters/:id/resolve-meter-start`
- `CustomerRepository.kt` — `getCustomer` kini return `CustomerDetailData`; tambah `getCustomerMeters`, `resolveMeterStart`; update `createCustomer` dan `updateCustomer` return type
- `CustomerDetailViewModel.kt` — state tambah `meters: List<MeterDto>`; `saveEdit` tidak lagi menerima `subscriptionId`
- `CustomerDetailScreen.kt` — tampilkan list meter terpasang; update `CustomerEditDialog` hapus field subscriptionId
- `CustomerListScreen.kt` — tampilkan meter utama dari `customer.meters.firstOrNull()` alih-alih `customer.meterNumber`; update `CreateCustomerRequest` pakai `meters[]`
- `UsageFormViewModel.kt` — tambah state `customerMeters`, `selectedMeterId`, `meterStartValue`; tambah fungsi `loadCustomerMeters`, `resolveMeterStart`, `onMeterSelected`
- `UsageFormScreen.kt` — tampilkan pilihan meter setelah customer dipilih; tampilkan angka awal yang ter-resolve sebagai read-only
- `UsageRepository.kt` — tambah `getCustomerMeters` dan `resolveMeterStart` via `CustomerRepository`
- `DraftUsageEntity.kt` — tambah kolom `meter_id TEXT` untuk menyimpan meter saat offline; `DraftUsageRepository` ikut menggunakan `meterId` saat sync

### Dampak deploy

1. **Backend** — cukup deploy ulang; AutoMigrate + `applyMultiMeterSchemaAdjustments()` berjalan otomatis saat startup. Verifikasi di log: `✅ customers.meter_number berhasil dihapus` dan `✅ Unique index uni_tenant_meter_number ... berhasil ditambahkan`
2. **Frontend** — deploy bersamaan dengan backend. Form create customer tidak lagi punya field `meter_number`/`subscription_id` top-level
3. **Android** — wajib tambah Room migration sebelum build APK: increment versi database dan `ALTER TABLE draft_usages ADD COLUMN meter_id TEXT`
4. **Data existing** — data dummy (dev); tidak ada migrasi data historis yang perlu dijalankan manual
5. **Klien API lama** — request `POST /api/customers` dengan format lama (`meter_number` + `subscription_id` di root) akan gagal validasi dengan 422. Semua consumer wajib diperbarui ke format `meters[]` sebelum deploy

### File yang berubah

**Backend:**
- `config/database.go` — tambah `applyMultiMeterSchemaAdjustments()`
- `config/schema.sql` + `schema_prod.sql` — update definisi tabel
- `models/customer.go` — hapus `MeterNumber`
- `models/meter.go` — tambah `SubscriptionTypeID`, `SubscriptionType`, composite unique index tag
- `models/water_usage.go` — tambah `MeterStartSource`
- `models/invoice.go` — tambah `MeterID`, `Meter`
- `requests/customer_requests.go` — baru: `MeterInput`, `CreateCustomerRequest` (format baru), `AddMeterRequest`, `UpdateCustomerRequest` (hapus `SubscriptionID`)
- `requests/water_usage_request.go` — tambah `MeterID`
- `services/registration_invoice_service.go` — **baru**
- `services/meter_reading_service.go` — **baru**
- `controllers/customer_controller.go` — refactor `CreateCustomer`, update `GetCustomer`, tambah `AddMeterToCustomer`
- `controllers/meter_controller.go` — **baru**: `ResolveMeterStart`, `GetCustomerMeters`
- `controllers/water_usage_controller.go` — update `CreateWaterUsage`
- `controllers/bulk_operations_controller.go` — update `BulkImportCustomers`, `BulkImportWaterUsage`
- `controllers/auth_controller.go` — update `CreateCustomerAccount` dan `findCustomerByLoginIdentifier`
- `controllers/invoice_controller.go` — fix referensi `MeterNumber` via `invoice.Meter`
- `controllers/report_controller.go` — fix query `meter_number` via JOIN ke `meters`
- `controllers/payment_controller.go` — hapus `MeterNumber` dari customer details
- `controllers/customer_self_service_controller.go` — hapus `meter_number` dari response
- `responses/customer_responses.go` — hapus `MeterNumber`
- `responses/reading_response.go` — fix referensi `MeterNumber`
- `routes/customer.go` — tambah `POST /:id/meters`
- `routes/meter.go` — **baru**
- `main.go` — registrasi `MeterRoutes`

**Frontend:**
- `src/types/customer.ts`
- `src/services/customerService.ts`
- `src/pages/customers/CustomerForm.tsx`
- `src/pages/customers/CustomerDetails.tsx`
- `src/pages/customers/BulkImportCustomers.tsx`
- `src/pages/usage/MeterReadingForm.tsx`

**Android:**
- `feature-customer/CustomerModels.kt`
- `feature-customer/CustomerApiService.kt`
- `feature-customer/CustomerRepository.kt`
- `feature-customer/CustomerDetailViewModel.kt`
- `feature-customer/CustomerDetailScreen.kt`
- `feature-customer/CustomerListScreen.kt`
- `feature-usage/UsageModels.kt`
- `feature-usage/UsageFormViewModel.kt`
- `feature-usage/UsageFormScreen.kt`
- `feature-usage/UsageRepository.kt`
- `feature-usage/DraftUsageRepository.kt`
- `core/database/entity/DraftUsageEntity.kt`

---

## v1.0.7 - 2026-05-30

**Tipe rilis:** Patch  
**Cakupan:** Backend + Frontend  
**Tag deploy yang disarankan:** `deploy-all-v1.0.7`

### Ringkasan
- Memperbaiki `403 Forbidden` pada endpoint daftar pelanggan untuk akun `meter_reader`.
- Menambahkan akses `meter_reader` ke endpoint tarif air aktif yang dibutuhkan saat mencatat pembacaan meter.
- Mencegah toast error yang sama muncul terus-menerus saat request gagal dan dicoba ulang berulang kali.
- Merapikan route backend lain yang masih memakai `AdminOnly()` agar role operasional tenant tidak lagi tertolak pada endpoint yang memang dibutuhkan fiturnya.

### Akar masalah
- Seluruh route `/api/customers` masih diproteksi `AdminOnly()`, sehingga role non-admin ditolak meskipun sudah punya permission `view_customers`.
- Route `/api/water-rates/current` juga masih diproteksi `AdminOnly()`, padahal form pembacaan meter memerlukannya untuk memeriksa tarif aktif pelanggan.
- Route detail pelanggan juga memakai path tanpa slash awal, sehingga definisinya tidak konsisten dengan pola route Gin yang lain.
- Provider toast selalu menambahkan notifikasi baru walaupun type dan pesan error-nya identik, sehingga retry otomatis terlihat seperti spam notifikasi.
- Beberapa route tenant lain seperti laporan, verifikasi pembayaran, golongan langganan, dan area layanan masih mengandalkan `AdminOnly()`, sehingga role seperti `finance` atau `service` bisa kena `403` walaupun permission-nya sebenarnya sesuai.

### Perubahan teknis
- Mengganti proteksi route pelanggan dari `AdminOnly()` menjadi `RequirePermission(...)` per aksi.
- Endpoint baca pelanggan kini memakai `PermViewCustomers`, sedangkan endpoint ubah data tetap memakai `PermManageCustomers`.
- Mengganti proteksi route tarif air menjadi RBAC per aksi; endpoint `GET /api/water-rates/current` kini bisa diakses role yang memiliki `PermManageWaterRates` atau `PermRecordWaterUsage`.
- Membetulkan path route customer detail menjadi `/:id` dan menambah test permission untuk role `meter_reader`.
- Menahan toast duplikat aktif dengan type dan pesan yang sama, serta menyembunyikan CTA ke halaman tarif air untuk role yang memang tidak punya akses kelola tarif.
- Mengganti `AdminOnly()` pada route laporan, verifikasi payment proof, golongan langganan, area layanan, pembuatan akun pelanggan, pengaturan tenant, manajemen user tenant, dan tarif progresif dengan kombinasi `RequirePermission(...)`, `RequireTenantAdmin()`, dan `CheckTenantStatus()` yang lebih sesuai konteks.
- Membetulkan path route subscription detail/update/delete menjadi `/:id` agar resolusi route konsisten.

### Dampak deploy
- Akun `meter_reader` dan role lain yang memiliki permission lihat pelanggan sekarang bisa membuka daftar pelanggan tanpa eskalasi akses admin.
- Proses pencatatan meter tidak lagi terblokir oleh `403` saat aplikasi memeriksa tarif air aktif pelanggan.
- Saat terjadi error berulang, pengguna tetap melihat notifikasi kegagalan tetapi tidak dibanjiri toast yang sama berkali-kali.
- Role `finance` kini bisa membuka endpoint laporan, verifikasi bukti pembayaran, dan daftar golongan langganan yang dipakai layar operasionalnya; role `service` juga bisa mengambil daftar area layanan saat mengelola pelanggan.
- Tidak ada perubahan schema database untuk rilis ini.

### File yang berubah
- `tirta-saas-backend/routes/customer.go`
- `tirta-saas-backend/routes/water_rate.go`
- `tirta-saas-backend/routes/payment_proof.go`
- `tirta-saas-backend/routes/auth.go`
- `tirta-saas-backend/routes/platform.go`
- `tirta-saas-backend/routes/report.go`
- `tirta-saas-backend/routes/subscription.go`
- `tirta-saas-backend/routes/tariff.go`
- `tirta-saas-backend/routes/service_area.go`
- `tirta-saas-backend/routes/user_management.go`
- `tirta-saas-backend/routes/user.go`
- `tirta-saas-backend/middleware/permission_test.go`
- `tirta-saas-backend/routes/authorization_routes_test.go`
- `tirta-saas-frontend/src/components/Toast.tsx`
- `tirta-saas-frontend/src/pages/usage/MeterReadingForm.tsx`

## v1.0.6 - 2026-05-30

**Tipe rilis:** Patch  
**Cakupan:** Frontend  
**Tag deploy yang disarankan:** `deploy-all-v1.0.6`

### Ringkasan
- Memperbaiki download template import pelanggan agar kolom `subscription_id` benar-benar ikut muncul di file CSV.

### Akar masalah
- Halaman bulk import pelanggan sudah memakai daftar header baru, tetapi generator CSV masih mengambil header dari `Object.keys()` sample row.
- Akibatnya hasil download template tidak selalu memaksa urutan dan daftar kolom resmi yang dibutuhkan untuk import.

### Perubahan teknis
- Menambahkan dukungan header eksplisit pada helper `exportToCSV`.
- Mengubah download template pelanggan agar selalu memakai `CSV_HEADERS`, termasuk `subscription_id`.

### Dampak deploy
- Template CSV pelanggan yang diunduh dari UI sekarang konsisten dengan validasi import terbaru.
- Tidak ada perubahan pada API backend.

### File yang berubah
- `tirta-saas-frontend/src/pages/customers/BulkImportCustomers.tsx`
- `tirta-saas-frontend/src/utils/exportUtils.ts`

## v1.0.5 - 2026-05-30

**Tipe rilis:** Patch  
**Cakupan:** Frontend  
**Tag deploy yang disarankan:** `deploy-all-v1.0.5`

### Ringkasan
- Menyesuaikan test frontend portal pelanggan setelah label field login diubah menjadi **Nomor Meter atau Email**.

### Akar masalah
- Perubahan UI login pelanggan pada rilis sebelumnya sudah benar, tetapi test Vitest masih mencari label lama **Alamat Email**.
- Akibatnya workflow validate frontend gagal meskipun implementasi aplikasi sudah sesuai.

### Perubahan teknis
- Mengupdate `CustomerLogin.test.tsx` agar memakai label login pelanggan yang baru.

### Dampak deploy
- Workflow validate frontend kembali hijau.
- Tidak ada perubahan perilaku runtime aplikasi.

### File yang berubah
- `tirta-saas-frontend/src/pages/customer/CustomerLogin.test.tsx`

## v1.0.4 - 2026-05-30

**Tipe rilis:** Patch  
**Cakupan:** Backend + Frontend  
**Tag deploy yang disarankan:** `deploy-all-v1.0.4`  
**Alternatif minimum:** `deploy-be-v1.0.4`

### Ringkasan
- Menyamakan flow tambah pelanggan, bulk import pelanggan, dan login pelanggan agar identitas akun tidak lagi bergantung pada email saja.
- Menjadikan email pelanggan opsional pada pembuatan akun manual.
- Menambahkan dukungan login pelanggan menggunakan nomor meter atau email.
- Menambahkan kolom wajib `subscription_id` pada bulk import agar golongan pelanggan ditentukan eksplisit per baris.

### Akar masalah
- Form tambah pelanggan masih mewajibkan email, padahal identitas yang paling stabil di domain pelanggan adalah `meter_number`.
- Bulk import sebelumnya tidak membawa password maupun golongan pelanggan per baris, sehingga akun hasil import sulit dipakai login dan golongan bisa tidak sesuai.
- Login pelanggan sebelumnya hanya mencari berdasarkan email dan frontend belum mengarah ke endpoint auth customer yang tepat.

### Perubahan teknis
- Backend create customer dan create customer account kini menerima email opsional, tetapi tetap memvalidasi unik jika email diisi.
- Backend login pelanggan kini menerima `identifier` dan bisa mencari customer dengan `meter_number` atau `email`.
- Backend bulk import kini mewajibkan `subscription_id`, memvalidasi UUID-nya, dan memastikan golongan tersebut milik tenant.
- Frontend form pelanggan, login pelanggan, dan template bulk import diselaraskan dengan aturan baru.

### Dampak deploy
- Admin bisa membuat pelanggan tanpa email selama password diisi.
- Pelanggan bisa login dengan nomor meter + password, atau email + password jika email tersedia.
- File bulk import lama tanpa kolom `subscription_id` perlu diperbarui sebelum dipakai lagi.
- Untuk hasil konsisten di production, rilis backend dan frontend bersamaan dengan tag `deploy-all-v1.0.4`.

### File yang berubah
- `tirta-saas-backend/controllers/auth_controller.go`
- `tirta-saas-backend/controllers/bulk_operations_controller.go`
- `tirta-saas-backend/controllers/customer_controller.go`
- `tirta-saas-backend/requests/customer_requests.go`
- `tirta-saas-frontend/src/constants/api.ts`
- `tirta-saas-frontend/src/pages/customer/CustomerLogin.tsx`
- `tirta-saas-frontend/src/pages/customers/BulkImportCustomers.tsx`
- `tirta-saas-frontend/src/pages/customers/CustomerForm.tsx`
- `tirta-saas-frontend/src/services/authService.ts`
- `tirta-saas-frontend/src/types/customer.ts`

## v1.0.3 - 2026-05-30

**Tipe rilis:** Patch  
**Cakupan:** Backend + Frontend  
**Tag deploy yang disarankan:** `deploy-all-v1.0.3`  
**Alternatif minimum:** `deploy-be-v1.0.3`

### Ringkasan
- Memperbaiki endpoint `GET /api/subscription-types` yang mengembalikan `null` saat tenant belum punya golongan langganan.
- Mencegah halaman pelanggan, tarif air, dan daftar golongan gagal memproses respons kosong dari server.
- Menambahkan hardening refresh token di frontend untuk kasus token lama belum membawa `tenant_id` setelah setup tenant.

### Akar masalah
- Controller list subscription types mengirim slice `nil`, sehingga response JSON menjadi `null` alih-alih array kosong `[]`.
- Beberapa flow frontend mengharapkan daftar golongan dalam bentuk array, sehingga respons `null` membuat tampilan atau pemrosesan data gagal.
- Pada sebagian sesi browser, access token lama tanpa `tenant_id` masih bisa dipakai sesaat setelah setup tenant selesai.

### Perubahan teknis
- Menginisialisasi hasil query dan response list subscription types sebagai slice kosong agar response JSON selalu stabil.
- Memperkeras `subscriptionService` agar aman menangani respons `null`, array langsung, maupun format paginasi.
- Memperluas deteksi 401 di `apiClient` agar kasus `Tenant ID wajib untuk role ini` otomatis memicu refresh token.

### Dampak deploy
- Deploy backend menghilangkan respons `null` dari API `subscription-types`.
- Deploy frontend memastikan klien lama tetap aman walau backend belum terbarui penuh.
- Untuk hasil paling aman di production, rilis backend dan frontend bersamaan dengan tag `deploy-all-v1.0.3`.

### File yang berubah
- `tirta-saas-backend/controllers/subscription_controller.go`
- `tirta-saas-frontend/src/services/apiClient.ts`
- `tirta-saas-frontend/src/services/subscriptionService.ts`

## v1.0.2 - 2026-05-30

**Tipe rilis:** Patch  
**Cakupan:** Backend + CI/CD  
**Tag deploy yang disarankan:** `deploy-be-v1.0.2`  
**Alternatif bila tetap merilis semua service:** `deploy-all-v1.0.2`

### Ringkasan
- Memperbaiki `401 Unauthorized` pada `POST /api/setup/tenant` untuk akun yang baru daftar dan belum punya `tenant_id`.
- Menghapus warning deprecation Node.js 20 pada workflow GitHub Actions.

### Akar masalah
- Flow setup tenant memang memakai user yang sudah login tetapi belum terhubung ke tenant.
- Middleware JWT sebelumnya tetap mewajibkan `tenant_id` untuk role tenant-scoped, sehingga request setup tenant ditolak sebelum masuk ke controller.
- Workflow CI/CD masih memakai major version action lama yang berjalan di runtime Node.js 20.

### Perubahan teknis
- Menambahkan middleware JWT khusus yang mengizinkan token tanpa `tenant_id` hanya untuk endpoint setup tenant.
- Route `/api/setup/tenant` diubah memakai middleware tersebut, tanpa melonggarkan proteksi endpoint tenant lain.
- Menambahkan test middleware untuk memastikan flow setup tenant tetap aman.
- Meng-upgrade GitHub Actions ke major version yang kompatibel dengan transisi Node.js 24:
  - `actions/checkout@v5`
  - `actions/setup-go@v6`
  - `actions/setup-node@v5`

### Dampak deploy
- Backend perlu di-deploy ulang atau di-restart agar perbaikan `401` pada flow setup tenant berlaku di production.
- Tidak ada perubahan schema database tambahan untuk rilis ini.
- Workflow validate/publish/deploy akan berhenti menampilkan warning deprecation Node.js 20 pada run berikutnya.

### File yang berubah
- `tirta-saas-backend/middleware/jwt_auth.go`
- `tirta-saas-backend/middleware/jwt_auth_test.go`
- `tirta-saas-backend/routes/auth.go`
- `.github/workflows/validate.yml`
- `.github/workflows/publish-images.yml`
- `.github/workflows/deploy-by-tag.yml`
- `.github/workflows/bootstrap-runtime.yml`

## v1.0.1 - 2026-05-30

**Tipe rilis:** Patch  
**Cakupan:** Backend  
**Tag deploy yang disarankan:** `deploy-be-v1.0.1`  
**Alternatif bila tetap merilis semua service:** `deploy-all-v1.0.1`

### Ringkasan
- Memperbaiki kegagalan startup backend saat migrasi schema `users`.
- Memulihkan login admin menggunakan payload `email` + `password`.

### Akar masalah
- Perubahan sebelumnya menambahkan kolom dan unique index `username` pada tabel `users`.
- Pada database lama masih ada data user dengan `username` kosong, sehingga pembuatan unique index gagal dan backend berhenti saat startup.
- Karena backend gagal naik, login admin ikut gagal meskipun kredensial benar.

### Perubahan teknis
- Backfill `username` untuk data user lama yang masih kosong sebelum constraint unik dipasang.
- Pembuatan unique index `users.username` dan `users.email` dijalankan sebagai migrasi manual setelah data lama dibersihkan.
- Login tetap menerima payload berbasis `email` agar kompatibel dengan klien lama selama masa transisi schema.

### Dampak deploy
- Tidak perlu migrasi SQL manual tambahan.
- Backend cukup di-deploy ulang atau di-restart agar migrasi baru berjalan.
- Kredensial admin default tetap dapat dipakai:
  - `admin@tirtasaas.com`
  - `admin123`

### File yang berubah
- `tirta-saas-backend/config/database.go`
- `tirta-saas-backend/controllers/auth_controller.go`
- `tirta-saas-backend/models/user.go`
