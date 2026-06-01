# Release Notes

## v1.0.9 - 2026-06-01

**Tipe rilis:** Feature  
**Cakupan:** Backend + Frontend  
**Tag deploy yang disarankan:** `deploy-all-v1.0.9`

### Ringkasan
- Menambahkan dukungan **multi-meter per pelanggan** untuk mendukung skenario pelanggan dengan multiple koneksi air terpisah (misal rumah + toko, atau meter reguler + meter non-rumah tangga).
- Setiap meter kini bisa memiliki tarif air berbeda dengan mengatur `subscription_type_id` pada meter tertentu; jika tidak diatur, fallback ke tarif pelanggan.
- Pengimporan dan pencatatan pemakaian air kini meter-aware: sistem otomatis mendeteksi meter aktif pelanggan jika tidak diberikan pilihan meter eksplisit, dan menggunakan historis pemakaian per meter untuk menghitung `meter_start`.
- Frontend menampilkan dropdown pilih meter hanya untuk pelanggan yang memiliki 2+ meter, memudahkan operator lapangan memilih meter yang tepat saat mencatat pembacaan.
- Backward compatible — pelanggan single-meter tidak terpengaruh; existing flow tetap berjalan.

### Akar masalah
- Sistem sebelumnya hanya mendukung 1 meter per pelanggan, sehingga pelanggan dengan multiple koneksi air tidak bisa dicatat tarifnya secara terpisah.
- Saat pelanggan memiliki meter dengan tipe langganan berbeda, sistem terpaksa menggunakan tarif pelanggan (mungkin tidak sesuai) ketika seharusnya menggunakan tarif khusus meter.
- Bulk import pemakaian tidak memiliki awareness terhadap meter spesifik, sehingga historis pemakaian tercampur untuk pelanggan multi-meter.

### Perubahan teknis

**Backend:**
- `CreateWaterUsageRequest` menambahkan field optional `MeterID *uuid.UUID` untuk mendukung pilihan meter eksplisit.
- `CreateWaterUsage` dan `BulkImportWaterUsage` kini meter-aware:
  - Jika `meter_id` diberikan, validasi meter tersebut dan gunakan untuk query historis pemakaian + fallback ke `Meter.InitialReading`.
  - Jika `meter_id` tidak diberikan (opsional), auto-detect meter aktif pertama pelanggan.
  - Tarif lookupnya prioritas: gunakan `Meter.SubscriptionTypeID` jika tersedia; fallback ke `Customer.SubscriptionID`.
  - Simpan `meter_id` di record `WaterUsage` untuk tracking per-meter.
- Kompatibilitas backward: field `meter_id` opsional di request dan response; existing query tanpa meter_id tetap bekerja dengan auto-detection.

**Frontend:**
- `CreateWaterPemakaianDto` menambahkan field optional `meterId?: string`.
- `WaterPemakaianFormData` menambahkan field optional `meterId?: string`.
- `MeterReadingForm`:
  - Fetch daftar meter pelanggan saat customer dipilih.
  - Tampilkan dropdown pilih meter hanya jika pelanggan memiliki 2+ meter (conditional rendering).
  - Dropdown berisi daftar nomor meter; tooltip menunjukkan jika meter punya tarif khusus.
  - Include `meterId` dalam payload saat submit.
  - Reset `meterId` ketika pelanggan berubah.
- `usageService`: `createWaterPemakaian()` kini pass `meter_id` ke backend.
- Type & service: `CreateWaterPemakaianDto` dan form data sudah support meter selection.

### Testing & Verification
- Unit test baru di backend mencakup:
  - Request serialization/deserialization dengan field MeterID
  - WaterUsage model multi-meter structure
  - Single vs multi-meter scenario validation
  - Semua test PASS tanpa regresi
- Build verification:
  - Backend compile: ✅ No errors
  - Frontend TypeScript check: ✅ Pass
  - Frontend production build: ✅ Success
- Dokumentasi API scenario mencakup 5 flow utama: single-meter create, multi-meter explicit, multi-meter auto-detect, bulk import meter-aware, tariff priority resolution.

### Dampak deploy
- Pelanggan single-meter: tidak ada perubahan UI/behavior; field meter hidden.
- Pelanggan multi-meter: dropdown meter muncul di form pencatatan pemakaian; operator bisa pilih meter sesuai kebutuhan, atau biarkan sistem auto-detect meter aktif.
- Tarif per-meter dimungkinkan: admin bisa set `subscription_type_id` unik per meter pelanggan untuk mendukung skenario mixed-type meters (rumah + komersial).
- Pemakaian historis tercatat per-meter, memudahkan analisis penggunaan per koneksi air.
- Tidak ada perubahan schema database untuk rilis ini (field `meter_id` pada tabel `water_usages` sudah ada sejak fase 2; field `subscription_type_id` pada tabel `meters` sudah ada sejak awal).

### File yang berubah
- `tirta-saas-backend/controllers/water_usage_controller.go`
- `tirta-saas-backend/controllers/bulk_operations_controller.go`
- `tirta-saas-backend/requests/water_usage_request.go`
- `tirta-saas-backend/controllers/water_usage_controller_test.go` *(baru)*
- `tirta-saas-frontend/src/types/usage.ts`
- `tirta-saas-frontend/src/services/usageService.ts`
- `tirta-saas-frontend/src/pages/usage/MeterReadingForm.tsx`
- `test-multi-meter.sh` *(dokumentasi scenario)*
- `FEATURE_STATUS.md` *(updated)*

---

## v1.0.8 - 2026-06-01

**Tipe rilis:** Feature  
**Cakupan:** Backend + Frontend  
**Tag deploy yang disarankan:** `deploy-all-v1.0.8`

### Ringkasan
- Menambahkan alur **import data pembacaan meter awal** untuk mendukung migrasi data historis ke sistem.
- Pembacaan meter bulan pertama kini otomatis menggunakan *initial reading* meter sebagai titik awal, bukan `0`.
- Filter daftar pelanggan (status, golongan, pencarian, tunggakan) kini berfungsi penuh — sebelumnya tidak diteruskan ke backend.
- Tombol *Set Initial Reading* dipindah dari header halaman ke kolom aksi setiap baris pelanggan, kini menggunakan modal pop-up per pelanggan.
- Template download pada halaman import pemakaian air dan import initial reading kini sudah berisi semua nomor meter dan nama pelanggan yang terdaftar.

### Akar masalah
- Backend `GET /api/customers` tidak menangani parameter filter `isActive`, `subscriptionTypeId`, `search`, dan `hasOutstandingBalance` sama sekali — query diabaikan.
- Saat tidak ada riwayat pemakaian sebelumnya, backend dan frontend sama-sama menggunakan `0` sebagai `meter_start`, bukan membaca field `initial_reading` pada data meter pelanggan.
- Tidak ada mekanisme untuk menetapkan nilai awal meter per pelanggan sebelum sistem mulai mencatat pemakaian bulanan.

### Perubahan teknis

**Backend:**
- `GET /api/customers` kini mendukung filter: `isActive` (boolean), `subscriptionTypeId` (UUID), `search` (LIKE pada nama/email/telepon/nomor meter), `hasOutstandingBalance` (subquery ke tabel `invoices`).
- `CustomerResponse` kini menyertakan field `initial_reading` yang diambil dari meter aktif pelanggan; `GetCustomers` dan `GetCustomer` melakukan `Preload("Meters")`.
- `CreateWaterUsage` dan `BulkImportWaterUsage` menambahkan fallback: jika tidak ada catatan bulan sebelumnya, `meter_start` diambil dari `Meter.InitialReading` (jika > 0); default tetap `0`.
- Endpoint baru `POST /api/customers/bulk-set-initial-reading` untuk mengatur `initial_reading` pada meter berdasarkan nomor meter (batch, tenant-scoped).
- `UpdateMeterRequest` kini menyertakan field `InitialReading *float64`.

**Frontend:**
- Halaman baru `BulkSetInitialReading` untuk import massal initial reading via Excel atau entri manual.
- `CustomerList`: filter status/golongan/pencarian/tunggakan sekarang dikirim ke API dan bekerja; tombol *Set Initial Reading* per baris membuka modal pop-up untuk mengatur initial reading satu pelanggan langsung dari daftar.
- `MeterReadingForm`: field *Meter Sebelumnya* kini menampilkan `initial_reading` meter ketika belum ada riwayat pemakaian (bukan `0` hardcode); teks helper menyesuaikan sumber data.
- `BulkImportWaterUsage`: menambahkan banner informasi tentang initial reading; template Excel kini di-generate dari data pelanggan aktif (nomor meter + nama, diurutkan per nomor meter).
- `customerService`: menambahkan method `getAllCustomers()` dan `bulkSetInitialReading()`.
- `Customer` type kini menyertakan field `initial_reading: number`.

### Dampak deploy
- Admin dapat mengatur nilai awal meter per pelanggan via modal di daftar pelanggan atau upload Excel massal — diperlukan sebelum import data pemakaian bulan pertama.
- Import pemakaian bulan pertama (misal Januari 2026 untuk data historis) menghasilkan `meter_start` yang benar sesuai kondisi meter aktual, bukan `0`.
- Filter daftar pelanggan kini berfungsi penuh untuk pencarian, filter status, golongan, dan tunggakan.
- Tidak ada perubahan schema database untuk rilis ini (field `initial_reading` pada tabel `meters` sudah ada sejak awal dengan default `0`).

### File yang berubah
- `tirta-saas-backend/controllers/customer_controller.go`
- `tirta-saas-backend/controllers/bulk_operations_controller.go`
- `tirta-saas-backend/controllers/water_usage_controller.go`
- `tirta-saas-backend/controllers/meter_controller.go` *(baru)*
- `tirta-saas-backend/requests/meter_request.go`
- `tirta-saas-backend/responses/customer_responses.go`
- `tirta-saas-backend/routes/customer.go`
- `tirta-saas-frontend/src/App.tsx`
- `tirta-saas-frontend/src/constants/api.ts`
- `tirta-saas-frontend/src/types/customer.ts`
- `tirta-saas-frontend/src/services/customerService.ts`
- `tirta-saas-frontend/src/pages/customers/CustomerList.tsx`
- `tirta-saas-frontend/src/pages/customers/BulkSetInitialReading.tsx` *(baru)*
- `tirta-saas-frontend/src/pages/usage/BulkImportWaterUsage.tsx`
- `tirta-saas-frontend/src/pages/usage/MeterReadingForm.tsx`

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
