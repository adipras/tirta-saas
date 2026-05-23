# Tirta SaaS - Feature Status & Production Readiness

_Dokumen ini menggambarkan kondisi aktual repo saat ini dan mengarah ke kesiapan produksi, bukan sekadar checklist MVP._

**Tanggal audit repo:** 23 Mei 2026

---

## 🎯 Arah dokumen

Tirta SaaS saat ini **sudah melewati tahap MVP fungsional** untuk core billing PDAM multi-tenant. Fokus berikutnya bukan lagi sekadar menambah fitur dasar, tetapi:

- menutup gap agar sistem aman dan stabil dipakai tenant nyata
- merapikan modul yang masih backend-only atau belum fully wired
- memperkuat operasi produksi: security, monitoring, backup, deploy, dan auditability

---

## ✅ Sudah ada dan sudah terpasang di repo

### 1. Core product flow
- ✅ Landing page publik
- ✅ Registrasi akun owner/admin baru (`/register`)
- ✅ Setup tenant setelah login (`/setup-tenant`)
- ✅ Login admin berbasis JWT
- ✅ Login customer berbasis JWT terpisah
- ✅ Role-based access untuk `platform_owner`, `tenant_admin`, `meter_reader`, `finance`, dan `customer`
- ✅ Persist session frontend dengan Redux Persist

### 2. Platform owner / SaaS management
- ✅ Approval / reject registrasi tenant
- ✅ Tenant management: list, detail, statistik, suspend, activate, delete
- ✅ Subscription plan management
- ✅ Assign subscription ke tenant
- ✅ Verifikasi pembayaran subscription tenant
- ✅ Platform analytics page + endpoint backend
- ✅ Platform payment settings: rekening bank + QR code

### 3. Operasional tenant / billing engine
- ✅ Customer CRUD
- ✅ Aktivasi / deaktivasi customer
- ✅ Detail customer
- ✅ Subscription type CRUD
- ✅ Water rate CRUD
- ✅ Rate history
- ✅ Water usage CRUD
- ✅ Riwayat pemakaian per customer
- ✅ Bulk generate invoice
- ✅ Invoice CRUD + detail
- ✅ Manual payment recording
- ✅ Payment receipt / struk pembayaran
- ✅ Verifikasi bukti pembayaran customer
- ✅ Tenant payment settings (logo, rekening bank, QR code)
- ✅ User management page untuk user operasional tenant

### 4. Import, export, dan reporting
- ✅ Bulk import customer dari **CSV** dengan template, preview, validasi header, dan error result
- ✅ Bulk import water usage dari form tabel + paste data tab-separated ke endpoint bulk import
- ✅ Export **CSV** dan **Excel (.xlsx)** di semua halaman report utama
- ✅ Export customer CSV endpoint tersedia di backend
- ✅ Reports dashboard
- ✅ Revenue report
- ✅ Customer analytics
- ✅ Payment report
- ✅ Usage report
- ✅ Outstanding report

### 5. Customer portal
- ✅ Customer dashboard
- ✅ Lihat daftar tagihan
- ✅ Detail tagihan
- ✅ Flow bayar tagihan customer
- ✅ Upload bukti pembayaran customer
- ✅ Monitor pemakaian air customer
- ✅ Lihat profil
- ✅ Edit profil
- ✅ Ganti password

### 6. Android mobile app & thermal printing
- ✅ Repo Android native tersedia di `tirta-saas-android/`
- ✅ App mobile native utama (`app/`) sudah ada dengan Compose + Hilt + Navigation
- ✅ Modul Android untuk auth, customer, tenant, user, usage, invoice, payment, dan printer sudah ada
- ✅ App Android `printer-bridge/` untuk bridge printer thermal sudah ada
- ✅ Frontend receipt sudah mendukung browser print
- ✅ Integrasi thermal printer bridge di frontend
- ✅ Indikator status printer bridge di UI
- ✅ Fallback ke browser print jika bridge tidak aktif

### 7. Automation & backend runtime
- ✅ Scheduler generate invoice bulanan
- ✅ Scheduler update status invoice overdue harian
- ✅ Scheduler trial expiry harian
- ✅ Tenant status middleware
- ✅ Health endpoint
- ✅ Performance monitoring middleware
- ✅ Request tracing middleware
- ✅ Swagger UI endpoint

### 8. Foundation untuk deployment produksi
- ✅ Repo sudah punya `docker-compose.yml`
- ✅ Ada panduan setup VPS, sync repo ke VPS, dan checklist hardening/deploy
- ✅ Dokumen deploy mengarah ke stack Nginx + Frontend + Backend + MySQL
- ✅ Ada catatan operasi seperti TLS, Docker logging, monitoring, backup, dan restore test di dokumen VPS

---

## 🟡 Sudah ada sebagian, backend-only, atau masih perlu wiring

### 1. Notification system
- 🟡 Backend untuk notification template dan send notification **sudah ada**
- 🟡 Belum ada halaman frontend untuk mengelola / mengirim notification
- 🟡 Pengiriman aktual ke provider email / SMS / WhatsApp **belum diimplementasikan**
- 🟡 Saat ini controller hanya membuat log lalu menandai status sebagai `SENT`

### 2. Service area management
- 🟡 Model, controller, dan route backend untuk `service_areas` **sudah ada**
- 🟡 Belum terlihat page / service frontend untuk fitur ini

### 3. Tariff categories / progressive tariff
- 🟡 Backend `tariff categories`, `progressive rates`, dan simulasi tagihan **sudah ada**
- 🟡 Belum terlihat page / service frontend untuk fitur ini

### 4. Monitoring & audit logs
- 🟡 Endpoint platform untuk audit logs, error logs, system health, dan metrics **sudah ada**
- 🟡 Belum terlihat UI frontend untuk monitoring ini
- 🟡 Audit package tersedia, tetapi audit middleware tidak terpasang global di `main.go`

### 5. Pembatasan akses khusus platform owner
- 🟡 Route `/api/platform/*` masih memakai `AdminOnly()`
- 🟡 Di kode masih ada TODO untuk `PlatformOwnerOnly` middleware
- 🟡 Artinya hardening akses platform owner belum final

### 6. Customer payment history
- 🟡 Endpoint backend `GET /api/customer/payments` dan service frontend sudah ada
- 🟡 Namun belum ada route / halaman customer khusus riwayat pembayaran di `App.tsx`

### 7. Customer invoice PDF download
- 🟡 Frontend sudah menyiapkan tombol / service download PDF invoice customer
- 🟡 Endpoint backend `/api/customer/invoices/:id/pdf` tidak terlihat terdaftar di route saat ini

### 8. Android app maturity
- 🟡 App Android utama sekarang sudah punya flow operasional inti, dashboard role-aware, dan alignment contract utama ke backend canonical
- 🟡 Namun mobile app **masih belum setara penuh** dengan seluruh surface web, terutama monitoring, parity fitur customer portal, dan hardening release pipeline

### 9. Operasional produksi masih lebih banyak terdokumentasi daripada tervalidasi otomatis
- 🟡 Ada checklist VPS / hardening / monitoring / backup
- 🟡 Tetapi bukti otomatis di repo untuk health regression, smoke test deploy, atau CI gate belum terlihat kuat

---

## 🚧 Production gaps yang paling penting

Bagian ini adalah gap yang paling relevan jika targetnya adalah **production system untuk tenant nyata**, bukan sekadar demo atau pilot.

### 1. Security & access control
- 🚧 `PlatformOwnerOnly` middleware belum ada
- 🚧 Audit trail belum dipasang konsisten secara global
- 🚧 Belum terlihat hardening permission model yang terukur lewat automated checks

### 2. Reliability & verification
- 🚧 Belum ada automated test suite yang jelas di backend maupun frontend
- 🚧 Belum ada regression gate yang kuat sebelum deploy
- 🚧 Belum terlihat smoke test production-ready yang menjadi bagian standar deploy

### 3. Observability & incident response
- 🚧 Endpoint monitoring backend ada, tetapi UI monitoring aplikasi belum ada
- 🚧 Belum terlihat alerting operasional yang jelas di repo
- 🚧 Belum terlihat runbook insiden level aplikasi di repo

### 4. Product completeness untuk tenant nyata
- 🚧 Notification delivery nyata belum ada
- 🚧 Service area & progressive tariff belum wired end-to-end sampai UI
- 🚧 Customer payment history dan customer invoice PDF masih belum lengkap wiring-nya

### 5. Payment & business process automation
- 🚧 Payment gateway otomatis belum ada
- 🚧 Bukti bayar masih dominan verifikasi manual
- 🚧 Belum ada orkestrasi notifikasi invoice jatuh tempo / overdue secara end-to-end

---

## ⏳ NOT STARTED / FUTURE ENHANCEMENTS

### Prioritas produksi tertinggi
1. **Automated testing & release gate**
   - backend regression tests
   - frontend critical flow tests
   - smoke test setelah deploy
   - CI gate sebelum merge / release

2. **Security hardening aplikasi**
   - `PlatformOwnerOnly` middleware
   - audit logging yang benar-benar aktif di seluruh surface penting
   - review ulang authorization boundary antar role dan tenant

3. **Operational observability**
   - dashboard monitoring aplikasi
   - alerting untuk health/error-rate/resource exhaustion
   - log aggregation yang siap troubleshooting

4. **Backup / restore yang tervalidasi rutin**
   - jadwal backup yang jelas
   - restore drill berkala
   - dokumentasi recovery yang operasional

### Prioritas produk tinggi
5. **Notification delivery nyata**
   - email provider integration
   - WhatsApp / SMS provider integration
   - template management dari UI
   - reminder invoice / overdue / payment confirmation

6. **Payment automation**
   - payment gateway otomatis (mis. Midtrans)
   - webhook handling
   - auto reconciliation pembayaran

7. **End-to-end tariff & area management**
   - frontend service area management
   - frontend tariff category / progressive rate
   - validasi dampak ke invoice calculation

8. **Customer portal completeness**
   - halaman riwayat pembayaran customer
   - download PDF invoice customer
   - notifikasi status pembayaran

### Prioritas medium
9. **Android app productionization**
   - parity fitur dengan web untuk flow operasional utama
   - hardening sync/offline flow
   - release pipeline mobile

10. **Multi-language support**
    - sistem i18n nyata
    - resource translation management

11. **Customer end-user mobile app yang fully productized**
    - pengalaman setara portal web
    - payment dan invoice flow yang matang

---

## 📌 Catatan kesiapan produksi saat ini

- Secara fitur bisnis inti, repo ini **sudah lebih dari MVP**: onboarding tenant, billing bulanan, pembayaran, verifikasi bukti, report, dan customer portal dasar sudah ada.
- Secara produksi, status yang lebih akurat adalah **“functional core is ready, production hardening is still ongoing.”**
- Pondasi deploy produksi sudah mulai terlihat jelas di repo dan dokumen operasional, tetapi belum cukup kuat untuk disebut fully production-ready tanpa penguatan testing, observability, dan security boundary.
- Beberapa modul penting masih berada di zona **backend-ready but not fully productized**, terutama notification, monitoring, service area, tariff category progresif, dan sebagian surface customer.

---

## Ringkasan singkat

**Status umum:** Core product sudah usable dan fondasi deploy produksi sudah ada.  
**Yang paling matang:** billing flow tenant, payment proof flow, reporting, payment settings, scheduler, dan fondasi Android/printer bridge/mobile operasional inti.
**Yang paling menentukan untuk production:** automated tests, release gate, observability, audit logging aktif, hardening akses platform owner, dan automation notification/payment.
