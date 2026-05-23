# Tirta SaaS

Sistem manajemen PDAM/air bersih berbasis SaaS multi-tenant. Dibangun dengan Go (backend) dan React TypeScript (frontend).

---

## 🚀 Quick Start

### Backend
```bash
cd tirta-saas-backend
cp .env.example .env   # sesuaikan DB credentials
go run main.go
# Running di http://localhost:8081
```

### Frontend
```bash
cd tirta-saas-frontend
npm install
npm run dev
# Running di http://localhost:5174
```

Contoh konfigurasi frontend:
```env
VITE_API_BASE_URL=auto
VITE_API_LOCAL_ORIGIN=http://localhost:8081
VITE_API_PUBLIC_ORIGIN=
VITE_DEV_HOST=localhost
VITE_DEV_PORT=5174
VITE_PRINTER_BRIDGE_URL=http://127.0.0.1:3000
VITE_PRINTER_BRIDGE_MODE=auto
```

Catatan:
- `VITE_API_BASE_URL=auto` akan memakai `localhost` saat browser dibuka dari PC lokal, dan memakai hostname/IP browser saat dibuka dari LAN.
- Untuk akses HP/LAN atau saat frontend dijalankan dari WSL, ubah `VITE_DEV_HOST=0.0.0.0`.
- Jika backend diakses device lain melalui alamat yang berbeda dari hostname browser, isi `VITE_API_PUBLIC_ORIGIN` secara eksplisit, misalnya `http://192.168.1.10:8081`.
- `VITE_PRINTER_BRIDGE_MODE=auto` menjaga bridge printer hanya dipakai pada device mobile/webview; desktop browser tetap fallback ke browser print.

### Seeder (pertama kali)
```bash
cd tirta-saas-backend/scripts
./seed-subscription-plans.sh
```

### Deploy tanpa clone repository di server
Project ini sekarang mendukung alur deploy berbasis image registry:

1. Push ke branch `main`
2. GitHub Actions build image backend dan frontend
3. Image dipublish ke GHCR:
   - `ghcr.io/adipras/tirta-saas-backend`
   - `ghcr.io/adipras/tirta-saas-frontend`
4. GitHub Actions bisa meng-upload runtime bundle ke server, merender `.env`, login ke GHCR, lalu menjalankan Docker Compose lewat SSH

File runtime yang dipakai server:
- `deploy/runtime/docker-compose.yml`
- `deploy/runtime/.env.example`
- `deploy/runtime/render-env.sh`
- `deploy/runtime/nginx/default.conf.template`

Catatan:
- Letakkan sertifikat di `certs/live/<domain>/fullchain.pem` dan `certs/live/<domain>/privkey.pem`.
- Untuk menyalakan monitoring Netdata, jalankan `docker compose --profile monitoring up -d`.
- Workflow publikasi image ada di `.github/workflows/publish-images.yml`.
- Workflow bootstrap satu kali ada di `.github/workflows/bootstrap-runtime.yml`.

### Bootstrap server sekali jalan
Supaya setelah itu cukup `push` dan `tag`, lakukan bootstrap sekali melalui GitHub Actions:

1. Tambahkan secrets berikut di `Settings > Secrets and variables > Actions`:
   - `DEPLOY_HOST`
   - `DEPLOY_PORT`
   - `DEPLOY_USER`
   - `DEPLOY_PATH`
   - `DEPLOY_SSH_KEY`
   - `DEPLOY_KNOWN_HOSTS`
   - `RUNTIME_MYSQL_ROOT_PASSWORD`
   - `RUNTIME_MYSQL_PASSWORD`
   - `RUNTIME_JWT_SECRET`
   - `GHCR_USERNAME` dan `GHCR_TOKEN` jika package GHCR private
2. Tambahkan variables berikut:
   - `RUNTIME_DOMAIN_NAME`
   - `RUNTIME_MYSQL_DATABASE`
   - `RUNTIME_MYSQL_USER`
   - `RUNTIME_AUTO_SEED_ADMIN`
   - `RUNTIME_ENABLE_INVOICE_SCHEDULER`
   - `RUNTIME_ENABLE_TRIAL_SCHEDULER`
   - `RUNTIME_MYSQL_IMAGE` (opsional)
   - `RUNTIME_NGINX_IMAGE` (opsional)
   - `RUNTIME_NETDATA_IMAGE` (opsional)
   - `RUNTIME_NETDATA_HOSTNAME` (opsional)
3. Pastikan server sudah memiliki Docker + Docker Compose Plugin, dan sertifikat TLS sudah tersedia di `${DEPLOY_PATH}/certs/live/<domain>/`.
4. Jalankan workflow **Bootstrap runtime server** dengan `ref=main`.

Workflow bootstrap akan:
- upload `deploy/runtime/` ke server
- merender `.env` dari secrets/variables GitHub
- login ke GHCR bila diperlukan
- menarik image `sha-<shortsha>` dari ref yang dipilih
- menjalankan `docker compose up -d`

### Redeploy otomatis via tag
Sekarang tersedia workflow `.github/workflows/deploy-by-tag.yml` untuk redeploy selektif lewat SSH ke server.

Format tag:
- `deploy-fe-v1.2.3` → redeploy frontend + nginx
- `deploy-be-v1.2.3` → redeploy backend
- `deploy-all-v1.2.3` → redeploy backend + frontend + nginx

Contoh:
```bash
git checkout main
git pull --ff-only origin main
git tag deploy-fe-v1.2.3
git push origin deploy-fe-v1.2.3
```

Aturan:
- Tag harus menunjuk ke commit yang ada di `origin/main`.
- Workflow akan memakai image immutable `sha-<shortsha>` dari GHCR, jadi deploy tetap mengarah ke commit yang tepat.
- Frontend deploy juga me-restart `nginx` agar proxy tetap sinkron.
- Workflow deploy juga akan meng-upload ulang runtime bundle dan merender `.env`, jadi perubahan file deploy ikut terbawa tanpa login manual ke server.

Workflow juga bisa dijalankan manual lewat `workflow_dispatch` jika ingin deploy `fe`, `be`, atau `all` dari ref tertentu di `main`.

---

## 🏗️ Arsitektur

```
tirta-saas/
├── tirta-saas-backend/    # Go + Gin + GORM + MySQL
└── tirta-saas-frontend/   # React + TypeScript + Vite + Tailwind
```

**Role:**
- `platform_owner` — pemilik platform, kelola tenant & subscription
- `tenant_admin` — admin PDAM, kelola pelanggan, invoice, pembayaran
- `meter_reader` — petugas baca meter
- `finance` — petugas keuangan
- `customer` — portal pelanggan

---

## 📋 Fitur Utama

### Platform Owner
- Dashboard & analytics tenant
- Approve/reject registrasi tenant
- Kelola subscription plans
- Verifikasi pembayaran subscription tenant

### Tenant Admin
- Manajemen pelanggan (CRUD, aktivasi, pencarian)
- Pencatatan meter reading & usage
- Generate invoice (bulk, per bulan)
- Manajemen pembayaran + verifikasi bukti bayar
- Laporan (revenue, usage, outstanding, payments)
- Pengaturan tarif air & subscription types

### Customer Portal
- Lihat tagihan & riwayat pembayaran
- Upload bukti bayar
- Profil & ganti password

---

## 📚 Dokumentasi

| File | Isi |
|------|-----|
| `USER_MANUAL.md` | Manual penggunaan aplikasi dan panduan operasional umum |
| `DEPLOYMENT_USER_MANUAL.md` | Panduan deploy khusus Tirta SaaS berdasarkan flow production terbaru |
| `FEATURE_STATUS.md` | Status fitur & roadmap enhancement |
| `tirta-saas-backend/scripts/README_SEEDER.md` | Panduan seeder |

---

## ⚙️ Tech Stack

**Backend:** Go 1.21+, Gin, GORM, MySQL 8+, JWT  
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Headless UI

---

**Last Updated:** February 22, 2026  
**Status:** 🟢 Production Ready (MVP)
