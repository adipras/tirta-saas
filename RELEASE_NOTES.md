# Release Notes

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
