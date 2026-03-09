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

### Seeder (pertama kali)
```bash
cd tirta-saas-backend/scripts
./seed-subscription-plans.sh
```

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
| `USER_MANUAL.md` | Manual lengkap penggunaan sistem |
| `FEATURE_STATUS.md` | Status fitur & roadmap enhancement |
| `PROGRESS.md` | Log progress development per sesi |
| `tirta-saas-backend/scripts/README_SEEDER.md` | Panduan seeder |

---

## ⚙️ Tech Stack

**Backend:** Go 1.21+, Gin, GORM, MySQL 8+, JWT  
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Headless UI

---

**Last Updated:** February 22, 2026  
**Status:** 🟢 Production Ready (MVP)

