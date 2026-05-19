# Subscription Plans Seeder

Script untuk membuat data subscription plans awal di database.

## Data yang Dibuat

Script ini akan membuat 3 paket subscription:

### 1. **BASIC** 
- **Harga**: Rp 500.000/bulan atau Rp 5.000.000/tahun
- **Max Users**: 3
- **Max Customers**: 100
- **Storage**: 5 GB
- **API Calls**: 10.000/hari
- **Trial**: 14 hari
- **Fitur**:
  - Manajemen hingga 100 pelanggan
  - 3 user akses
  - Invoice otomatis
  - Laporan dasar
  - Email support
  - 5 GB storage

### 2. **PREMIUM** (POPULER)
- **Harga**: Rp 1.000.000/bulan atau Rp 10.000.000/tahun
- **Max Users**: 10
- **Max Customers**: 500
- **Storage**: 20 GB
- **API Calls**: 50.000/hari
- **Trial**: 14 hari
- **Fitur**:
  - Manajemen hingga 500 pelanggan
  - 10 user akses
  - Semua fitur Basic
  - WhatsApp notifications
  - Laporan lengkap & analytics
  - Export data (Excel, PDF)
  - Payment gateway integration
  - Support prioritas
  - 20 GB storage

### 3. **ENTERPRISE**
- **Harga**: Rp 2.500.000/bulan atau Rp 25.000.000/tahun
- **Max Users**: 25
- **Max Customers**: 2.000
- **Storage**: 100 GB
- **API Calls**: 200.000/hari
- **Trial**: 30 hari
- **Fitur**:
  - Manajemen hingga 2000 pelanggan
  - 25 user akses
  - Semua fitur Premium
  - Custom features development
  - Multi-branch support
  - API access untuk integrasi
  - WhatsApp & SMS notifications
  - Training & onboarding
  - Dedicated account manager
  - 100 GB storage
  - SLA 99.9% uptime

## Cara Menjalankan

### Metode 1: Menggunakan Script Shell
```bash
cd tirta-saas-backend
./scripts/seed-subscription-plans.sh
```

### Metode 2: Langsung dengan Go
```bash
cd tirta-saas-backend
go run ./scripts/seed_subscription_plans
```

### Metode 3: Production di VPS Docker
```bash
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
cd /opt/tirta-saas/app
/opt/tirta-saas/scripts/backup.sh

set -a
. /opt/tirta-saas/app/.env
set +a

NETWORK_NAME=$(docker network ls --format '{{.Name}}' | grep '_tirta-net$' | head -n 1)

docker run --rm \
  --network "$NETWORK_NAME" \
  -v /opt/tirta-saas/app/tirta-saas-backend:/app \
  -w /app \
  -e DB_HOST=tirta-mysql \
  -e DB_PORT=3306 \
  -e DB_NAME="$MYSQL_DATABASE" \
  -e DB_USER="$MYSQL_USER" \
  -e DB_PASS="$MYSQL_PASSWORD" \
  golang:1.24.2-alpine \
  sh -lc 'apk add --no-cache git >/dev/null && go run ./scripts/seed_subscription_plans'
```

## Catatan Penting

1. **Update Data**: Jika plans sudah ada, script akan menanyakan konfirmasi untuk update. Ketik `y` untuk melanjutkan atau `n` untuk membatalkan.

2. **ID Dipertahankan**: Saat update, ID plan yang sudah ada akan dipertahankan untuk menjaga referensi di data tenant.

3. **Customisasi**: Setelah seeding, Anda bisa edit plans melalui:
   - Admin panel: `http://localhost:5174/admin/platform/subscription-plans`
   - Atau edit langsung di database

4. **Landing Page**: Plans yang aktif (`is_active = true`) akan otomatis muncul di landing page public.

5. **Untuk Production Docker**: karena container backend production tidak membawa toolchain Go, jalankan seeder lewat container Go sementara seperti pada Metode 3.

## Struktur Data

Plans disimpan di tabel `subscription_plan_details` dengan kolom:
- `plan` (BASIC, PREMIUM, ENTERPRISE)
- `name` (nama display)
- `description` (deskripsi lengkap)
- `monthly_price` (harga per bulan)
- `yearly_price` (harga per tahun)
- `max_users` (limit jumlah user)
- `max_customers` (limit jumlah pelanggan)
- `max_storage_gb` (limit storage dalam GB)
- `max_api_calls_per_day` (limit API calls per hari)
- `features` (JSON array dari fitur-fitur)
- `trial_days` (jumlah hari trial gratis)
- `display_order` (urutan tampilan)
- `is_active` (status aktif/nonaktif)

## Troubleshooting

**Database connection error**:
```bash
# Pastikan .env sudah dikonfigurasi dengan benar
# Cek apakah MySQL/MariaDB sudah running
sudo systemctl status mysql
```

**Plans tidak muncul di landing page**:
- Pastikan `is_active = true`
- Clear browser cache
- Cek console browser untuk error

**Ingin reset ulang**:
```sql
-- Hapus semua plans
DELETE FROM subscription_plan_details;

-- Jalankan seeder lagi
go run ./scripts/seed_subscription_plans
```
