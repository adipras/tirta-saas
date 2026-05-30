# Release Notes

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
