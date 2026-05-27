# Tirta SaaS - Feature Status & Production Readiness

_Dokumen ini menggambarkan kondisi aktual repo saat ini dan mengarah ke kesiapan produksi, bukan sekadar checklist MVP._

**Tanggal audit repo:** 23 Mei 2026 | **Terakhir diperbarui:** 26 Mei 2026

---

## 🎯 Arah dokumen

Tirta SaaS saat ini **sudah melewati tahap MVP fungsional** untuk core billing PDAM multi-tenant. Fokus berikutnya bukan lagi sekadar menambah fitur dasar, tetapi:

- menutup gap agar sistem aman dan stabil dipakai tenant nyata
- merapikan modul yang masih backend-only atau belum fully wired
- memperkuat operasi produksi: security, monitoring, backup, deploy, dan auditability

Dokumen ini juga menjadi **single source of truth** untuk status mobile native Android. Detail yang sebelumnya tersebar di `mobile-native-plan.md` sudah digabung ke sini agar tidak terjadi redundansi catatan dan konflik prioritas pengerjaan.

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
- ✅ Filter invoice per bulan tagihan (usage_month) dengan print per periode
- ✅ Manual payment recording
- ✅ Payment receipt / struk pembayaran
- ✅ Verifikasi bukti pembayaran customer
- ✅ Tenant payment settings (logo, rekening bank, QR code)
- ✅ User management page untuk user operasional tenant

### 4. Import, export, dan reporting
- ✅ Bulk import customer dari **CSV** dengan template, preview, validasi header, dan error result
- ✅ Bulk import customer dari **Excel (.xlsx)** — parse di frontend, dikirim ke backend sebagai CSV
- ✅ Bulk import water usage dari form tabel + paste data tab-separated ke endpoint bulk import
- ✅ Bulk import water usage dari **Excel (.xlsx)** — parse di frontend, populate rows untuk review sebelum submit
- ✅ Export **CSV** dan **Excel (.xlsx)** di semua halaman report utama
- ✅ Export customer CSV endpoint tersedia di backend
- ✅ Template Excel download tersedia untuk bulk import (customer dan water usage)
- ✅ Reports dashboard
- ✅ Revenue report
- ✅ Customer analytics
- ✅ Payment report
- ✅ Usage report
- ✅ Outstanding report

### 5. Customer portal
- ✅ Customer dashboard
- ✅ Lihat daftar tagihan
- ✅ Filter tagihan per bulan/periode penagihan
- ✅ Detail tagihan
- ✅ Flow bayar tagihan customer
- ✅ Upload bukti pembayaran customer
- ✅ Monitor pemakaian air customer
- ✅ Riwayat pembayaran customer (`/customer/payments`)
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
- ✅ Ada workflow GitHub Actions untuk publish image dan deploy runtime berbasis GHCR + SSH
- ✅ Dokumen deploy mengarah ke stack runtime Nginx + Frontend + Backend + MySQL tanpa clone repo di server
- ✅ Ada catatan operasi seperti TLS, Docker logging, monitoring, backup, dan restore test di dokumen VPS

---

## 🟡 Sudah ada sebagian, backend-only, atau masih perlu wiring

### 1. Notification system
- 🟡 Backend untuk notification template dan send notification **sudah ada**
- ✅ Icon lonceng pada navbar admin dan portal customer kini sudah terhubung ke inbox notifikasi in-app, lengkap dengan unread badge dan mark-as-read
- ✅ Frontend admin kini sudah punya halaman untuk mengelola template notifikasi tenant dan mengirim notifikasi manual ke pengguna/pelanggan
- ✅ Event utama bukti pembayaran kini membuat notifikasi in-app untuk staf tenant dan customer
- ✅ Customer portal kini juga punya halaman inbox notifikasi khusus dengan filter unread, mark-all-read, dan shortcut ke tagihan terkait
- ✅ Generate invoice bulanan/manual dan transisi invoice overdue kini juga membuat notifikasi in-app customer secara otomatis
- 🟡 Pengiriman aktual ke provider email / SMS / WhatsApp **belum diimplementasikan**
- 🟡 Saat ini controller hanya membuat log lalu menandai status sebagai `SENT`

### 2. Service area management
- 🟡 Model, controller, dan route backend untuk `service_areas` **sudah ada**
- ✅ Frontend admin untuk list, tambah, ubah, hapus, dan filter `service_areas` kini sudah terpasang
- ✅ Service area kini sudah bisa dipilih dari form create/edit customer agar segmentasi wilayah terpakai end-to-end
- ✅ Controller backend `service_areas` kini sudah konsisten membaca `tenant_id` dari context JWT

### 3. Tariff categories / progressive tariff
- 🟡 Backend `tariff categories`, `progressive rates`, dan simulasi tagihan **sudah ada**
- ✅ Frontend admin kini sudah punya halaman untuk kategori tarif, tier progressive rate, dan simulasi tagihan
- ✅ Form/list tarif air kini juga sudah menampilkan serta menyimpan relasi kategori tarif progresif agar konfigurasi tarif lebih konsisten end-to-end

### 4. Monitoring & audit logs
- 🟡 Endpoint platform untuk audit logs, error logs, system health, dan metrics **sudah ada**
- ✅ Frontend platform kini sudah punya halaman monitoring untuk system health, system metrics, audit logs, dan error logs
- ✅ Audit middleware global backend kini aktif untuk request autentikasi sensitif (`POST` / `PUT` / `PATCH` / `DELETE`)
- ✅ Audit domain-level juga sudah diperluas ke auth flow sensitif: admin login, customer login, logout, ganti password customer, dan flow bukti pembayaran (`submit`, `verify`, `reject`)

### 5. Pembatasan akses khusus platform owner
- ✅ Route `/api/platform/*` kini memakai `PlatformOwnerOnly()`
- ✅ `JWTAuthMiddleware` kini mewajibkan `tenant_id` untuk role tenant-scoped
- ✅ Boundary platform owner kini konsisten memakai role canonical `platform_owner` di middleware, controller tenant-user, helper tenant context, analytics query, dan seeder/script platform admin tanpa compatibility layer tambahan
- ✅ Hanya `platform_owner` yang boleh lolos autentikasi tanpa `tenant_id`
- 🟡 Review authorization boundary lintas seluruh surface tenant masih tetap perlu dilanjutkan

### 6. Customer invoice PDF download
- ✅ Endpoint backend customer invoice detail kini tersedia di `/api/customer/invoices/:id`
- ✅ Endpoint backend PDF customer invoice kini tersedia di `/api/customer/invoices/:id/pdf`
- ✅ Frontend customer portal kini memakai endpoint customer-specific untuk detail tagihan, payment info, payment confirmation, dan unduh PDF

### 7. Android app maturity
- 🟡 App Android utama sekarang sudah punya flow operasional inti, dashboard role-aware, dan alignment contract utama ke backend canonical
- ✅ Arsitektur native utama sudah berjalan dengan Compose + Hilt + Clean Architecture + MVVM, terpisah dari web dan tanpa WebView
- ✅ Modul Android inti sudah aktif: auth, tenant, tenant settings, user, customer, usage, invoice, payment, monitoring, dan printer
- ✅ Flow operasional lapangan utama sudah tersedia: input/update water usage, offline draft, sync queue, upload foto meter, monitoring invoice, input payment, riwayat payment + reprint receipt
- ✅ Integrasi printer thermal native sudah matang untuk paired Bluetooth Classic, preferred printer, print queue, retry gagal cetak, dan ESC/POS receipt rendering
- ✅ Mobile security/session foundation sudah ada: JWT login, secure token storage, auto refresh, tenant status guard, dan redaksi header sensitif di network logging
- 🟡 Namun mobile app **masih belum setara penuh** dengan seluruh surface web, terutama parity customer portal/end-user surface, QA multi-role, hardening sync conflict, dan release pipeline mobile

### 8. Operasional produksi masih lebih banyak terdokumentasi daripada tervalidasi otomatis
- 🟡 Ada checklist VPS / hardening / monitoring / backup
- ✅ Workflow validasi repo kini sudah menjalankan `go test`, `go build`, `npm run lint`, `npm run test`, dan `npm run build` untuk PR / push `main`
- ✅ Workflow deploy/bootstrap kini menjalankan smoke check pasca-deploy untuk memastikan nginx/frontend root, deep-link publik SPA (`/admin/login`, `/customer/login`), backend `/health`, dan endpoint publik `/api/public/subscription-plans` benar-benar responsif
- 🟡 Regression test awal sudah mulai ada di backend dan frontend, termasuk auth guard, permission/tenant boundary middleware backend, snapshot billing invoice backend, login admin/customer, notification bell, invoice detail customer, payment confirmation customer, payment proof detail action, tenant payment verification, admin payment list, payment reporting, payment receipt admin, customer payment history, helper receipt edge-case, dan thermal printer interaction receipt (success + warning/error branch), tetapi coverage flow bisnis kritis masih perlu diperluas

---

## 🚧 Production gaps yang paling penting

Bagian ini adalah gap yang paling relevan jika targetnya adalah **production system untuk tenant nyata**, bukan sekadar demo atau pilot.

### 1. Security & access control
- ✅ ~~`PlatformOwnerOnly` middleware belum ada~~ — selesai pada sesi hardening 25 Mei 2026
- 🟡 Audit trail request sensitif backend sudah aktif secara global, auth flow utama dan flow bukti pembayaran kini sudah tercakup, tetapi audit domain-level belum merata di seluruh surface
- 🟡 Boundary role platform vs tenant sudah lebih konsisten, dan regression test backend kini sudah mulai mengukur middleware permission/tenant boundary (`PlatformOwnerOnly`, `RequirePermission`, `RequireTenantUser`, `EnsureSameTenant`), tetapi coverage authorization lintas seluruh surface masih belum lengkap

### 2. Reliability & verification
- 🟡 Suite test masih sangat awal — backend kini sudah punya regression test untuk boundary JWT auth, permission/tenant boundary middleware, serta kalkulasi snapshot billing / status pembayaran invoice, dan frontend kini sudah punya test awal untuk `PrivateRoute`, branching `AdminLogin`, `CustomerLogin`, interaction `NotificationBell`, customer invoice detail, customer payment confirmation, payment proof detail action, tenant payment verification, admin payment list, payment reporting, payment receipt admin, customer payment history, helper receipt edge-case, dan thermal printer interaction receipt (success + warning/error branch), tetapi coverage flow bisnis masih belum memadai
- ✅ CI gate dasar kini sudah ada untuk backend/frontend sebelum publish image
- ✅ Smoke check pasca-deploy kini sudah menjadi bagian workflow deploy dan bootstrap runtime, dan sudah mencakup deep-link publik frontend serta endpoint API publik yang dipakai landing page

### 3. Observability & incident response
- 🟡 Endpoint monitoring backend kini sudah terhubung ke UI monitoring aplikasi untuk platform owner, tetapi alerting operasional dan runbook insiden masih belum ada
- 🚧 Belum terlihat alerting operasional yang jelas di repo
- 🚧 Belum terlihat runbook insiden level aplikasi di repo

### 4. Product completeness untuk tenant nyata
- 🚧 Notification delivery nyata belum ada
- ✅ ~~Progressive tariff belum wired end-to-end sampai UI~~ — selesai pada sesi wiring 27 Mei 2026
- ✅ ~~Service area belum wired end-to-end sampai UI~~ — selesai pada sesi wiring 25 Mei 2026
- ✅ ~~Customer payment history~~ — sudah selesai (commit `dd2c8d0`)
- ✅ ~~Customer invoice PDF masih belum lengkap wiring-nya~~ — selesai pada sesi wiring 25 Mei 2026

### 5. Payment & business process automation
- 🚧 Payment gateway otomatis belum ada
- 🚧 Bukti bayar masih dominan verifikasi manual
- ✅ ~~Belum ada orkestrasi notifikasi invoice jatuh tempo / overdue secara end-to-end~~ — selesai pada sesi wiring 27 Mei 2026

---

## 📱 Status mobile native Android

Bagian ini merangkum status `tirta-saas-android/` yang sebelumnya dicatat terpisah.

### Prinsip kerja
- Mobile app adalah channel native **terpisah** dari web dan tidak memakai WebView
- Web dan mobile terhubung hanya lewat backend REST API
- Perubahan contract backend yang memengaruhi channel aktif harus diikuti penyesuaian web/mobile agar behavior tetap sinkron

### Kondisi implementasi saat ini
- ✅ App native utama sudah modular (`app`, `core/*`, `feature-*`) dan `printer-bridge` tetap tersedia sebagai app terpisah untuk kebutuhan bridge printer tertentu
- ✅ Core stack mobile sudah terpasang: Retrofit + OkHttp + Kotlinx Serialization, Room, Hilt, WorkManager, DataStore, EncryptedSharedPreferences, dan Timber
- ✅ Session mobile sudah menyimpan role, nama user, tenant name, token, dan refresh flow dengan guard tenant blocked/suspended
- ✅ Contract alignment penting untuk mobile sudah dikerjakan di backend: `auth/refresh`, `auth/logout`, `auth/me`, permission role operasional, idempotent usage create, dan receipt payload untuk printer
- 🟡 Response backend lintas controller masih belum seragam penuh dan pagination/filtering/sorting belum sepenuhnya standar di semua surface

### Scope mobile yang sudah matang
- ✅ Login dan session management
- ✅ Dashboard role-based
- ✅ Tenant management untuk `platform_owner`
- ✅ Tenant settings untuk `tenant_admin`
- ✅ Tenant user CRUD
- ✅ Customer list/detail/create/activation
- ✅ Water usage list/create/update
- ✅ Offline draft water usage + sync queue + retry worker
- ✅ Filter customer by service area / route
- ✅ Upload foto meter
- ✅ Monitoring invoice + detail invoice
- ✅ Input payment
- ✅ Riwayat pembayaran + reprint receipt
- ✅ Monitoring operasional dasar dari endpoint reports
- ✅ Print receipt ke Bluetooth thermal printer
- ✅ Push notification lokal untuk status sinkronisasi draft pemakaian

### Gap mobile yang masih tersisa
- 🚧 Standardisasi response backend dan standardisasi pagination/filter/sorting lintas seluruh endpoint yang masih belum konsisten
- 🚧 Verifikasi kompatibilitas web setelah perubahan contract backend pada surface tenant, customer, auth, payment, dan receipt masih belum selesai penuh
- 🚧 Customer cache offline belum ada
- 🚧 Conflict resolution final untuk sinkronisasi data usage antar-device belum diformalisasi penuh
- 🚧 OCR foto meter masih backlog
- 🚧 Hardening error handling dan sync masih perlu dilanjutkan
- 🚧 QA multi-role, bug fixing, dan release configuration mobile masih tersisa
- 🚧 Release pipeline Android masih belum siap produksi

### Risiko utama mobile
| Risiko | Mitigasi saat ini |
|---|---|
| Bluetooth printer tidak stabil | Queue tunggal, reconnect, retry terbatas |
| Backend contract berubah | Web/mobile ikut diselaraskan saat contract berubah |
| Response backend belum seragam | Refactor bertahap ke response standar |
| Sync conflict data lapangan | Draft, retry policy, dan backlog conflict handling |
| Multi-tenant complexity | Tenant context wajib konsisten dari JWT |
| Role operasional berubah | Middleware permission backend dirapikan agar contract akses lebih stabil |

### Prioritas mobile berikutnya
1. Finalisasi standardisasi contract backend yang masih parsial
2. Selesaikan verifikasi parity web setelah perubahan contract mobile-driven
3. Hardening sync/offline conflict handling
4. QA multi-role dan stabilisasi bug
5. Siapkan release pipeline Android

---

## ⏳ NOT STARTED / FUTURE ENHANCEMENTS

### Prioritas produksi tertinggi
1. **Automated testing & release gate**
   - ✅ regression test backend awal untuk boundary JWT auth
   - ✅ regression test backend awal untuk permission/tenant boundary middleware
   - 🟡 frontend critical flow tests awal sudah ada untuk auth guard, admin/customer login branching, notification bell, customer invoice detail, customer payment confirmation, payment proof detail action, tenant payment verification, admin payment list, payment reporting, payment receipt admin, customer payment history, helper receipt edge-case, dan thermal printer interaction receipt (success + warning/error branch)
   - ✅ smoke test setelah deploy (dasar)
   - ✅ CI gate dasar sebelum merge / release

2. **Security hardening aplikasi**
   - ✅ ~~`PlatformOwnerOnly` middleware~~
   - 🟡 audit logging global untuk request sensitif backend sudah aktif; auth flow utama dan flow bukti pembayaran sudah tercakup, tetapi coverage audit domain-level masih perlu diperluas
   - 🟡 review authorization boundary antar role dan tenant sudah berjalan; konsistensi role platform-level sudah diperbaiki dan hanya `platform_owner` yang boleh tanpa `tenant_id`

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
   - ✅ ~~template management dari UI~~
   - 🟡 reminder invoice / overdue / payment confirmation kini sudah berjalan untuk channel in-app, tetapi belum terkirim ke provider eksternal

6. **Payment automation**
   - payment gateway otomatis (mis. Midtrans)
   - webhook handling
   - auto reconciliation pembayaran

7. **End-to-end tariff & area management**
   - ✅ ~~frontend service area management~~
   - ✅ ~~frontend tariff category / progressive rate~~
   - validasi dampak ke invoice calculation

8. **Customer portal completeness**
   - ✅ ~~halaman riwayat pembayaran customer~~ — selesai
   - ✅ ~~filter tagihan per bulan/periode~~ — selesai
   - ✅ ~~download PDF invoice customer~~
   - ✅ notifikasi status pembayaran in-app kini punya halaman inbox customer khusus selain bell/dropdown
   - catatan: `PaymentSuccess` masih ada sebagai komponen legacy, tetapi belum dipakai oleh route aktif customer

### Prioritas medium
9. **Android app productionization**
   - parity fitur dengan web untuk flow operasional utama
   - hardening sync/offline flow
   - QA multi-role + release configuration
   - release pipeline mobile

10. **Multi-language support**
    - sistem i18n nyata
    - resource translation management

11. **Customer end-user mobile app yang fully productized**
    - pengalaman setara portal web
    - payment dan invoice flow yang matang

---

## 📌 Catatan kesiapan produksi saat ini

- Secara fitur bisnis inti, repo ini **sudah lebih dari MVP**: onboarding tenant, billing bulanan, pembayaran, verifikasi bukti, report, import Excel, customer portal lengkap (riwayat pembayaran, filter periode tagihan), dan Android/printer bridge sudah ada.
- Secara produksi, status yang lebih akurat adalah **“functional core is ready, production hardening is still ongoing.”**
- Pondasi deploy produksi sudah mulai terlihat jelas di repo dan dokumen operasional, tetapi belum cukup kuat untuk disebut fully production-ready tanpa penguatan testing, observability, dan security boundary.
- Beberapa modul penting masih berada di zona **backend-ready but not fully productized**, terutama notification, monitoring, dan tariff category progresif.
- Progress produk terbaru: tarif progresif kini sudah wired end-to-end di frontend admin, lengkap dengan kategori tarif, progressive rate tiers, simulasi tagihan, serta relasi kategori pada surface tarif air.
- Progress produk terbaru: notification template tenant dan manual notification send kini juga sudah tersedia di frontend admin, walau delivery provider email/SMS/WhatsApp masih belum diaktifkan.
- Progress produk terbaru: customer portal kini juga punya halaman notifikasi khusus untuk melihat update pembayaran/tagihan, filter unread, mark-all-read, dan buka invoice terkait langsung dari inbox.
- Progress produk terbaru: invoice baru dari generate bulanan/manual dan perubahan status overdue kini ikut membuat notifikasi in-app customer otomatis, sehingga reminder invoice sudah ter-wire dari backend scheduler sampai inbox portal customer.
- Progress hardening terbaru: UI monitoring platform kini sudah tersedia untuk health, metrics, audit log, dan error log; backend monitoring juga dirapikan agar uptime runtime dan request success/error rate yang tampil lebih akurat.
- Progress hardening terbaru: route platform owner sudah dipisahkan dari `AdminOnly`, validasi JWT tenant-scoped diperketat, dan audit middleware backend sudah aktif untuk request sensitif terautentikasi.
- Progress lanjutan sesi ini: pengecekan role platform-level juga sudah dinormalisasi di controller tenant-user, helper tenant context, query analytics, dan utilitas seeder/platform admin agar akses tanpa `tenant_id` tetap konsisten untuk surface platform.
- Progress lanjutan terbaru: audit auth flow utama kini sudah tercatat di backend dan boundary JWT tanpa `tenant_id` diketatkan kembali agar hanya berlaku untuk `platform_owner`.
- Progress lanjutan terbaru: frontend service area management kini sudah tersedia, assignment area layanan sudah masuk ke form customer, dan backend service area sudah diselaraskan dengan context `tenant_id` berbasis UUID dari JWT middleware.
- Progress produk terbaru: wiring customer invoice detail + PDF download kini sudah lengkap di backend dan frontend customer portal memakai endpoint customer-specific yang sesuai.
- Progress hardening terbaru: repo kini punya workflow validasi otomatis untuk backend/frontend, publish image diblokir oleh gate validasi, dan regression test backend awal untuk boundary JWT auth sudah masuk.
- Progress hardening terbaru: workflow deploy/bootstrap kini juga menjalankan smoke check pasca-deploy untuk memverifikasi root frontend dan health backend setelah runtime dinaikkan.
- Progress hardening terbaru: frontend kini juga punya baseline test otomatis untuk auth guard (`PrivateRoute`), branching login admin/customer, interaction notification bell, customer invoice detail, dan customer payment confirmation, dan workflow validasi repo sudah ikut menjalankan `npm run test`.
- Progress dokumentasi terbaru: status Android native kini digabung ke dokumen ini agar tracking mobile/web/backend berada pada satu sumber kebenaran.

---

## Ringkasan singkat

**Status umum:** Core product sudah usable dan fondasi deploy produksi sudah ada.  
**Yang paling matang:** billing flow tenant, payment proof flow, reporting, import Excel, customer portal lengkap, payment settings, scheduler, dan fondasi Android/printer bridge/mobile operasional inti.
**Yang paling menentukan untuk production:** automated tests, release gate, observability, audit logging aktif, hardening akses platform owner, dan automation notification/payment.
