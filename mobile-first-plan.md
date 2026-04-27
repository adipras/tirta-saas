# Rencana Implementasi: Refactor Frontend ke Arah Mobile-First

## Masalah

Frontend saat ini sudah memiliki beberapa fondasi responsif, tetapi pendekatannya masih campuran: beberapa layout utama sudah mobile-aware, sementara banyak halaman admin masih lebih nyaman di desktop daripada di layar ponsel. Akibatnya pengalaman mobile belum konsisten, terutama pada:

- halaman list/data table
- form panjang dan multi-kolom
- dashboard dengan banyak card/statistik
- modal/detail panel
- halaman operasional tenant admin

Target pekerjaan ini adalah menggeser frontend ke pendekatan **Mobile-First**, sehingga layout, hierarchy, spacing, CTA, dan pola interaksi dirancang dari layar kecil terlebih dahulu, lalu meningkat ke tablet/desktop.

## Kondisi Saat Ini

### Fondasi yang Sudah Baik

- `DashboardLayout` sudah memakai:
  - sidebar drawer mobile
  - header dengan hamburger
  - padding konten yang relatif aman untuk layar kecil
- `Header` dan `Sidebar` sudah punya pola mobile yang cukup sehat.
- Customer portal juga sudah punya peningkatan mobile pada sesi-sesi sebelumnya.

### Gap yang Terlihat

- Banyak halaman masih memakai pola:
  - `md:grid-cols-*`, `lg:grid-cols-*`
  - card grid yang padat di desktop tapi belum selalu jelas urutannya di mobile
  - tabel lebar yang bergantung pada horizontal scrolling
  - form dua kolom yang belum selalu nyaman pada viewport sempit
- Beberapa halaman penting kemungkinan akan menjadi hotspot Mobile-First:
  - `src/pages/customers/*`
  - `src/pages/invoices/*`
  - `src/pages/payments/*`
  - `src/pages/usage/*`
  - `src/pages/reports/*`
  - `src/pages/platform/*`
  - `src/pages/settings/*`
  - `src/pages/subscription/*`
  - dashboard per role

## Tujuan Refactor

1. Menjadikan **mobile layout** sebagai baseline utama untuk halaman frontend.
2. Mengurangi friction pada task utama di HP:
   - lihat data penting
   - cari/filter data
   - isi form
   - review status
   - akses aksi utama
3. Menjaga desktop tetap kuat, tetapi sebagai **enhancement layer**, bukan baseline.
4. Membuat pola UI yang konsisten agar refactor berikutnya bisa dilakukan bertahap tanpa regresi besar.

## Prinsip Implementasi

### 1. Mobile Baseline First
- Mulai dari 1 kolom dan alur vertikal.
- Gunakan breakpoint untuk menambah kompleksitas, bukan mengurangi.

### 2. Prioritaskan Tugas Utama
- Fokus pada aksi yang paling sering dilakukan user:
  - admin tenant
  - platform owner
  - petugas lapangan / finance

### 3. Hindari “desktop dikecilkan”
- Jangan sekadar menambahkan `overflow-x-auto` sebagai solusi utama.
- Untuk data padat, pertimbangkan:
  - stacked cards
  - summary rows
  - detail drawer/modal
  - progressive disclosure

### 4. Konsistensi Komponen
- Standarkan pola untuk:
  - page header
  - filter bar
  - action bar
  - card stats
  - empty state
  - table-to-card transformation
  - modal mobile behavior

### 5. Refactor Bertahap
- Jangan refactor semua halaman sekaligus.
- Kerjakan berdasarkan domain + shared pattern agar dampaknya terukur.

## Pendekatan Implementasi

### Fase 1 — Audit & Design Rules

Tujuan:
- mengidentifikasi hotspot mobile paling bermasalah
- menetapkan aturan/pola shared sebelum refactor besar

Output:
- daftar halaman prioritas
- daftar anti-pattern saat ini
- aturan shared layout Mobile-First

Fokus:
- audit halaman admin tenant inti
- audit platform owner pages
- audit modal/form/table pattern

### Fase 2 — Shared Layout & Component Foundation

Tujuan:
- memperkuat komponen/pattern dasar agar halaman tidak refactor satu-satu secara liar

Kandidat:
- `Header`
- `Sidebar`
- page section wrapper
- filter/action toolbar responsive
- table wrapper / mobile list alternative
- modal layout mobile-safe
- reusable stat cards

### Fase 3 — High-Traffic Tenant Admin Pages

Prioritas awal:
1. dashboard tenant admin
2. customer list + detail
3. invoice list + detail
4. payment list + payment form
5. usage list + meter reading form

Tujuan:
- task harian tenant admin nyaman di ponsel

### Fase 4 — Subscription, Settings, Verification, Forms

Prioritas:
- subscription pages
- settings pages
- payment verification
- user management
- bulk import / longer workflows

### Fase 5 — Platform Owner Pages

Prioritas:
- tenant management
- platform analytics
- subscription verification
- subscription plans
- platform settings

### Fase 6 — Reporting & Dense Data Views

Prioritas:
- revenue/payment/outstanding/usage/customer analytics

Catatan:
- reporting kemungkinan butuh pola berbeda untuk mobile:
  - summary first
  - filter collapse
  - chart/list stacking
  - export CTA terpisah

## Area Prioritas Tinggi

### 1. Navigation & Shell
- sidebar behavior
- page title / action hierarchy
- sticky action placement bila perlu

### 2. Data Listing Pattern
- tabel menjadi card/list pada mobile
- action per item tetap mudah dijangkau
- filter tidak memakan terlalu banyak viewport

### 3. Form Pattern
- seluruh form panjang menjadi vertikal dulu
- CTA utama selalu terlihat jelas
- error message tetap terbaca tanpa layout pecah

### 4. Dashboard Pattern
- kartu statistik ditumpuk mobile-first
- ringkasan penting muncul lebih awal
- chart/list dibagi bertahap

### 5. Modal & Detail Surface
- modal desktop besar perlu fallback ke:
  - full-screen mobile modal
  - bottom sheet
  - scroll-safe panel

## Definition of Done

Sebuah halaman dianggap selesai direfactor Mobile-First bila:

1. Nyaman dipakai di lebar mobile tanpa zoom horizontal.
2. CTA utama terlihat jelas dan tidak tersembunyi.
3. Informasi penting muncul lebih dulu daripada detail sekunder.
4. Form/table/modal tidak memaksa interaksi desktop-only.
5. Desktop tetap rapi dan tidak mengalami regresi besar.

## Risiko / Perhatian

- Refactor mobile dapat memicu regression visual pada desktop.
- Halaman tabel padat berisiko “sekadar dipasangi scroll”, padahal butuh redesign interaksi.
- Konsistensi pattern penting; tanpa foundation shared component, perubahan akan terpecah-pecah.
- Build frontend saat ini punya beberapa error lama di luar scope, jadi validasi perlu fokus pada file yang disentuh dan build parsial/diagnostics.

## File / Area Relevan

### Layout & Shared
- `tirta-saas-frontend/src/layouts/DashboardLayout.tsx`
- `tirta-saas-frontend/src/components/Header.tsx`
- `tirta-saas-frontend/src/components/Sidebar.tsx`
- `tirta-saas-frontend/src/components/*`

### Halaman Tenant Admin
- `tirta-saas-frontend/src/pages/customers/*`
- `tirta-saas-frontend/src/pages/invoices/*`
- `tirta-saas-frontend/src/pages/payments/*`
- `tirta-saas-frontend/src/pages/usage/*`
- `tirta-saas-frontend/src/pages/settings/*`
- `tirta-saas-frontend/src/pages/subscription/*`
- `tirta-saas-frontend/src/pages/dashboards/TenantAdminDashboard.tsx`

### Halaman Platform
- `tirta-saas-frontend/src/pages/platform/*`
- `tirta-saas-frontend/src/pages/platform-payments/*`

### Reports
- `tirta-saas-frontend/src/pages/reports/*`

## Checklist Eksekusi

- [x] **Audit halaman prioritas Mobile-First**
  - inventarisasi halaman yang paling sering dipakai di mobile
  - tandai anti-pattern layout utama

- [~] **Tetapkan pattern shared**
  - [x] stacked stat cards
  - [x] quick action card
  - [x] table-to-card pattern yang lebih kaya
  - [x] toolbar responsive lintas halaman
  - [x] modal full-screen mobile

- [x] **Refactor shell & navigation**
  - [x] header lebih kontekstual per halaman
  - [x] sidebar mobile lebih rapi dan konsisten
  - [x] drawer sidebar kembali type-safe
  - [x] pastikan layout dasar konsisten di seluruh admin pages

- [x] **Refactor halaman tenant admin prioritas**
  - [x] dashboard
  - [x] customers
  - [x] invoices
  - [x] payments
  - [x] usage

- [x] **Refactor halaman form & settings**
  - [x] subscription status
  - [x] plan selection
  - [x] tenant payment settings
  - [x] platform payment settings
  - [x] setup tenant
  - [x] verification, payment submission (flow aktif di subscription upgrade)

- [x] **Refactor halaman platform**
  - [x] tenant management
  - [x] verification
  - [x] analytics
  - [x] subscription plans

- [x] **Refactor halaman reports**
  - [x] dashboard laporan / entry point
  - [x] redesign khusus tampilan data padat untuk mobile pada halaman detail

- [x] **Validasi visual & interaksi**
  - [x] cek CTA utama pada dashboard batch
  - [x] cek file yang disentuh dengan lint terarah
  - [x] build frontend penuh kembali lolos
  - [x] cek viewport sempit untuk batch list
  - [x] cek empty/loading/error state seluruh halaman prioritas

## Progress Tracking Awal

- Status inisiatif: **Done**
- Strategi: **bertahap per domain + shared pattern**
- Starting point yang bagus:
  - shell sudah lumayan siap
  - batch 1 selesai pada tenant dashboard + shared cards
  - batch 2 selesai pada halaman list tenant admin
  - batch 3 sudah membuka perbaikan shell/header/sidebar dan toolbar shared
  - shared pattern inti sekarang sudah kuat untuk lanjut ke form/settings dan platform pages
  - batch platform saat ini sudah selesai untuk tenant management, verifikasi pembayaran langganan, analytics, dan subscription plans
  - batch settings/subscription saat ini sudah mulai masuk ke status langganan dan pemilihan paket dengan flow mobile-first
  - payment settings tenant dan platform sekarang juga sudah mengikuti pattern mobile-first yang sama
  - setup tenant sekarang juga sudah mengikuti struktur mobile-first yang konsisten dengan flow langganan terbaru
  - subscription upgrade sebagai flow aktif pembayaran/verifikasi tenant sekarang sudah memakai shared header/stat/form yang konsisten di mobile
  - seluruh dashboard + detail halaman reports sekarang sudah mengikuti pola mobile-first yang sama
  - dashboard role, rate history, usage history, tenant payment verification, dan water rate form juga sudah dirapikan agar konsisten dengan shell admin terbaru
