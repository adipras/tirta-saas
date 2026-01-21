# Konsep Trial & Subscription - TirtaSaaS

## Konsep Trial Period

### 🎯 Trial adalah One-Time untuk Platform

**Trial Period: 14 Hari Gratis**
- Trial diberikan **saat pertama kali registrasi tenant** ke platform
- Trial berlaku untuk **mencoba platform**, bukan per paket subscription
- Selama trial, tenant dapat menggunakan **semua fitur** tanpa batasan
- **Tidak perlu kartu kredit** untuk memulai trial

### 📋 Flow Registrasi Tenant

```
1. Tenant Daftar (Register)
   └─> Status: TRIAL
   └─> Trial Ends At: +14 hari dari registrasi
   └─> Akses: Semua fitur aktif

2. Selama Trial (Hari 1-14)
   └─> Tenant explore fitur
   └─> Input data pelanggan
   └─> Generate invoice
   └─> Test payment flow
   └─> Lihat reports & analytics

3. Trial Berakhir (Hari 14)
   └─> Sistem notifikasi tenant
   └─> Tenant HARUS pilih paket:
       ├─> BASIC (Rp 500K/bulan)
       ├─> PREMIUM (Rp 1JT/bulan)
       └─> ENTERPRISE (Rp 2.5JT/bulan)

4. Setelah Pilih & Bayar Paket
   └─> Status: ACTIVE
   └─> Trial Ends At: NULL
   └─> Subscription Ends At: +30 hari (jika monthly)
   └─> Akses: Sesuai limit paket yang dipilih
```

## Subscription Plans

### Paket TIDAK Memiliki Trial

Semua paket subscription **TIDAK** memiliki trial sendiri karena:

1. **Trial sudah diberikan di awal** - Tenant sudah coba gratis 14 hari
2. **Tidak adil untuk platform** - Tenant bisa pindah-pindah paket untuk dapat trial terus
3. **Standar industri SaaS** - Trial platform, bukan per paket

### Paket yang Tersedia

| Paket | Harga/Bulan | Pelanggan | Users | Storage | Trial |
|-------|-------------|-----------|-------|---------|-------|
| BASIC | Rp 500K | 100 | 3 | 5 GB | ❌ |
| PREMIUM | Rp 1JT | 500 | 10 | 20 GB | ❌ |
| ENTERPRISE | Rp 2.5JT | 2000 | 25 | 100 GB | ❌ |

## Implementasi di Database

### Table: `subscription_plan_details`

```sql
-- SEMUA paket memiliki trial_days = 0
UPDATE subscription_plan_details 
SET trial_days = 0 
WHERE 1=1;
```

### Table: `tenants`

```sql
-- Trial tracking ada di tenant
CREATE TABLE tenants (
    ...
    status ENUM('TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED'),
    trial_ends_at DATETIME,  -- Untuk tracking trial
    subscription_plan ENUM('BASIC', 'PREMIUM', 'ENTERPRISE'),
    subscription_starts_at DATETIME,
    subscription_ends_at DATETIME,
    ...
);
```

## Landing Page

### Hero Section
```
"Mulai Trial 14 Hari Gratis"
✓ Tidak perlu kartu kredit
✓ Setup 5 menit
✓ Support 24/7
```

### Pricing Section
- Tidak menampilkan "Trial X hari" di kartu paket
- Fokus ke fitur dan limit masing-masing paket
- CTA: "Mulai Sekarang" → redirect ke register

### How It Works
```
1. Daftar & Trial Gratis
   → Dapat akses 14 hari gratis

2. Coba Semua Fitur
   → Explore tanpa batasan

3. Pilih Paket & Lanjutkan
   → Upgrade ke berbayar setelah trial
```

## User Journey

### New Tenant Journey
```
Day 0:  Register → Status: TRIAL
        ↓
Day 1-13: Menggunakan platform gratis
        ↓
Day 14: Trial berakhir
        ↓ (Notifikasi: "Trial Anda berakhir")
        ↓
Day 15: Pilih paket & bayar
        ↓
        ├─> Bayar: Status → ACTIVE
        └─> Tidak Bayar: Status → SUSPENDED
```

### Existing Tenant - Upgrade/Downgrade
```
Tenant dengan paket BASIC
    ↓
Ingin upgrade ke PREMIUM
    ↓
Bayar selisih harga (prorated)
    ↓
Langsung upgrade (TIDAK ada trial lagi)
```

## Business Logic

### Trial Management
```javascript
// Check if trial expired
if (tenant.status === 'TRIAL' && new Date() > tenant.trial_ends_at) {
    tenant.status = 'EXPIRED';
    // Send notification
    // Redirect to payment page
}
```

### Subscription Selection
```javascript
// After trial, tenant must select plan
if (tenant.status === 'EXPIRED' || tenant.status === 'TRIAL_ENDED') {
    // Show pricing page
    // Require payment
    // No trial for selected plan
}
```

### No Repeat Trial
```javascript
// Tenant cannot get trial again
if (tenant.had_trial_before) {
    // Cannot register new trial
    // Must pay from start
}
```

## FAQ

**Q: Kenapa paket tidak punya trial sendiri?**
A: Karena trial sudah diberikan saat registrasi awal. Ini mencegah abuse dan standar industri SaaS.

**Q: Bisa upgrade paket saat trial?**
A: Saat trial, semua fitur sudah bisa digunakan. Upgrade paket dilakukan setelah trial selesai.

**Q: Bisa downgrade paket?**
A: Ya, bisa downgrade kapan saja. Perubahan berlaku di periode billing berikutnya.

**Q: Trial expired, tapi belum bayar?**
A: Status menjadi SUSPENDED. Data tetap tersimpan 30 hari. Setelah itu akan dihapus jika tidak ada pembayaran.

## Kesimpulan

✅ **Trial = One-time untuk platform** (14 hari gratis)
✅ **Paket subscription = Berbayar** (tanpa trial tambahan)
✅ **User journey jelas**: Trial → Pilih Paket → Bayar → Aktif
✅ **Prevent abuse**: Tidak bisa dapat trial berulang kali
