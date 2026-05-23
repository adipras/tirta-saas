# Rencana Implementasi Konsistensi Frontend Tirta SaaS

## Ringkasan Masalah dan Pendekatan
Frontend `tirta-saas-frontend` saat ini memiliki inkonsistensi lintas arsitektur route, duplikasi halaman/service, pola state/loading/error yang tidak seragam, serta variasi UI/UX dan aksesibilitas antar menu/fitur.  
Target: standardisasi menyeluruh kode + tampilan untuk seluruh menu/fitur dengan output UI **Bahasa Indonesia penuh**.

Pendekatan implementasi:
1. Konsolidasi fondasi (routing, auth flow, service, notifikasi) agar sumber kebenaran tunggal.
2. Standardisasi komponen/pola UI lintas halaman.
3. Hardening kualitas (aksesibilitas, guardrails lint/review, regresi flow kritikal).

## Temuan Inti (Baseline Audit)
1. Duplikasi route customer dan flow pembayaran (`src/App.tsx`), memicu perilaku menu yang tidak konsisten.
2. Duplikasi implementasi login/customer domain (`src/pages/auth/CustomerLogin.tsx` vs `src/pages/customer/CustomerLogin.tsx`) dan service stack customer yang bercabang (`customerAuthService`/`customerPortalService` vs `apiClient`).
3. Dua sistem notifikasi berjalan paralel (Redux `uiSlice` vs `Toast` context) tanpa satu pola dominan.
4. Pola loading/error tidak seragam antar halaman; ada halaman yang hanya `console.error` tanpa UX feedback.
5. Komponen reusable belum dipakai konsisten (`LoadingSkeleton`, `PageHeader`), copy UI campuran Indonesia-Inggris.
6. Gap aksesibilitas: icon-only button tanpa `aria-label`, asosiasi `label`-`input` tidak konsisten, sortable table belum ramah keyboard/screen reader.

## Consistency Score (Awal)
- **Skor keseluruhan saat ini: 58/100**
- Breakdown:
  - Arsitektur & Routing: 45/100
  - Reusability Komponen: 60/100
  - UI/UX Konsistensi: 62/100
  - State/Error/Loading: 55/100
  - Aksesibilitas: 50/100

## Daftar TODO Implementasi (berurutan)
1. **T1 — Inventaris menu dan peta route final**
   - Definisikan satu route tree final untuk admin/tenant/customer/platform.
   - Tetapkan canonical path per menu agar tidak ada path ganda untuk fitur yang sama.
   - Output: matriks `menu -> route -> page component -> required role`.

2. **T2 — Konsolidasi route customer + hapus duplikasi flow**
   - Hilangkan route customer publik/legacy yang konflik di `App.tsx`.
   - Satukan satu flow pembayaran customer (pilih flow target tunggal) dan selaraskan link `CustomerSidebar`.
   - Pastikan redirect/back-navigation antar langkah pembayaran konsisten.

3. **T3 — Standardisasi auth & API layer customer**
   - Migrasikan service customer agar memakai pola API client yang konsisten.
   - Hapus penggunaan token handling langsung yang terpisah bila sudah tercover auth layer standar.
   - Definisikan kontrak error API seragam untuk semua service customer.

4. **T4 — Unifikasi sistem notifikasi**
   - Pilih satu sistem (direkomendasikan: Toast tunggal dengan helper global).
   - Migrasikan pemanggilan notifikasi dari halaman yang masih memakai pola lain.
   - Hapus state/action notifikasi yang tidak lagi dipakai.

5. **T5 — Standarisasi page shell & state UX**
   - Terapkan template halaman konsisten (`PageHeader`, layout spacing, aksi utama).
   - Standarkan pola loading/empty/error dengan komponen reusable.
   - Ganti `console.error` user-facing dengan pesan feedback UI yang konsisten.

6. **T6 — Harmonisasi komponen form, tabel, tombol, modal**
   - Definisikan varian standar untuk tombol, input, badge, modal, table action.
   - Migrasikan halaman prioritas tinggi (dashboard, customer, invoices, payments, reports, settings).
   - Kurangi implementasi ad-hoc yang duplikatif.

7. **T7 — Standardisasi copy UI Bahasa Indonesia**
   - Audit teks user-facing untuk hapus campuran bahasa.
   - Tetapkan glossary istilah domain (Tagihan, Pembayaran, Pelanggan, dll) agar konsisten lintas fitur.
   - Terapkan guideline microcopy error/success/helper text.

8. **T8 — Hardening aksesibilitas**
   - Tambah `aria-label` pada icon-only actions.
   - Pastikan `label` terkait `input` melalui `htmlFor`/`id`.
   - Tambahkan dukungan keyboard + atribut ARIA pada sortable table/interactive headers.

9. **T9 — Bersih-bersih legacy/debug**
   - Hapus route/halaman test/debug dari produksi.
   - Hapus file/style legacy yang tidak dipakai (setelah verifikasi dependensi).
   - Pastikan tidak ada dead code yang masih dirujuk.

10. **T10 — Guardrails pencegahan regresi konsistensi**
    - Tambahkan aturan lint yang relevan (a11y, no-console produksi, import/order konsisten).
    - Tambahkan checklist code review untuk konsistensi UI/UX.
    - Dokumentasikan "Frontend Consistency Playbook" singkat (konvensi komponen, state UX, copy, aksesibilitas).

## Dependency Antar TODO
- T2 bergantung pada T1
- T3 bergantung pada T1
- T4 bergantung pada T3
- T5 bergantung pada T2 dan T4
- T6 bergantung pada T5
- T7 bergantung pada T5
- T8 bergantung pada T6
- T9 bergantung pada T2 dan T3
- T10 bergantung pada T6, T7, T8, T9

## Roadmap Fase Eksekusi
1. **Fase 1 — Fondasi Arsitektur (Prioritas Tertinggi)**
   - Cakupan: T1, T2, T3, T4
   - Dampak: menghilangkan konflik route/auth/service dan menyatukan behavior inti.
   - Risiko: medium (karena menyentuh flow login/customer payment).
   - Kriteria sukses: hanya satu route tree aktif per domain; satu pola auth+service; satu sistem notifikasi.

2. **Fase 2 — Konsistensi UI/UX Lintas Fitur**
   - Cakupan: T5, T6, T7
   - Dampak: tampilan dan interaksi menu/fitur menjadi seragam.
   - Risiko: medium-low.
   - Kriteria sukses: page shell, loading/error/empty, form/table/modal/button konsisten; copy user-facing full Indonesia.

3. **Fase 3 — Aksesibilitas, Cleanup, dan Guardrails**
   - Cakupan: T8, T9, T10
   - Dampak: kualitas jangka panjang dan pencegahan inkonsistensi berulang.
   - Risiko: low.
   - Kriteria sukses: gap a11y kritikal tertutup; legacy/debug terhapus; lint/checklist/dokumen guardrail aktif.

## Catatan Implementasi Penting
- Ada potensi breaking change pada route customer dan flow pembayaran; perlu strategi migrasi URL/redirect yang jelas.
- Migrasi dilakukan incremental per domain fitur agar review PR tetap kecil dan terukur.
- Seluruh perubahan UI harus menjaga behavior bisnis existing (tenant scoping, role access, payment proof flow).

## Progress Final
Status umum: implementasi sudah **menuntaskan Fase 1, Fase 2, dan Fase 3** untuk scope konsistensi frontend yang didefinisikan pada dokumen ini. Fondasi route/auth/notifikasi sudah tunggal, halaman prioritas tinggi sudah diseragamkan, a11y kritikal ditutup, guardrail lint/build aktif, dan checklist/playbook konsistensi kini terdokumentasi di dokumen ini.

1. **Sudah tercapai / progres besar**
   - **T2 — Konsolidasi route customer**: route customer publik/legacy di `src/App.tsx` sudah dipangkas, entry publik difokuskan ke `/customer/login`, dan flow pembayaran customer diarahkan ke tree customer yang lebih konsisten.
   - **T3 — Standardisasi auth & API layer customer**: duplikasi halaman/customer flow lama dibersihkan, service customer lama (`src/services/customerAuthService.ts`, `src/services/customerPortalService.ts`) dihapus, dan kontrak error API mulai dipusatkan lewat helper bersama.
   - **T4 — Unifikasi sistem notifikasi (done)**: fondasi toast tunggal dipakai sebagai pola notifikasi aktif, referensi state notifikasi Redux lama sudah dibersihkan, dan toast kini punya live-region agar feedback status/error tetap terbaca screen reader.
   - **T5 — Standarisasi page shell & state UX (done)**: pola `PageHeader`, skeleton/loading state, retryable error state, dan empty state sudah diterapkan di banyak halaman prioritas tinggi, terutama pada flow customer, `customer-invoices`, `invoices`, `reports`, dan `user-management`.
   - **T6 — Harmonisasi komponen form/tabel/tombol/modal (done)**: varian reusable dipertegas lewat `ActionIconButton`, `FormInput`/`FormSelect`/`FormTextarea` yang lebih stabil, serta modal yang konsisten untuk close/confirm flow dan heading terhubung.
   - **T7 — Standardisasi copy UI Bahasa Indonesia (done)**: copy user-facing pada auth, customer flow, invoices, payment proofs, receipt/payment submission, dashboard, customer details, water rates, user management, analitik/reporting, dan pengaturan platform/tenant sudah dinormalkan ke Bahasa Indonesia.
   - **T8 — Hardening aksesibilitas (done)**: gap a11y kritikal sudah ditutup pada sidebar mobile, dialog/modal, form labels, helper/error association, toast live-region, icon-only actions, toggle interaktif, tabel, serta aksi baris di halaman prioritas.
   - **T9 — Bersih-bersih legacy/debug** sudah dikerjakan pada area inti: route debug/test dibersihkan dari `src/App.tsx`, import test page dihapus, dan debug logging utama dikurangi.
   - **T10 — Guardrails (done)**: rule lint `no-console` dan `no-alert` aktif, pola `confirm()` legacy sudah diganti ke `ConfirmModal`, lint global frontend bersih, build produksi sudah dipecah per vendor/domain, dan checklist/playbook konsistensi kini terdokumentasi.

2. **Snapshot area yang sudah tersentuh**
   - **Fondasi bersama**: `src/components/Toast.tsx`, `src/components/toast-context.ts`, `src/hooks/useToast.ts`, `src/types/toast.ts`, `src/utils/apiError.ts`, `src/components/CustomerSidebar.tsx`, `src/components/index.ts`, `src/components/ActionIconButton.tsx`, `src/components/FormInput.tsx`, `src/components/Modal.tsx`, `vite.config.ts`.
   - **Flow customer**: `src/pages/customer/CustomerDashboard.tsx`, `src/pages/customer/CustomerPayInvoice.tsx`, `src/pages/customer-invoices/*`, `src/pages/customer-payments/*`, `src/pages/customer-profile/*`, `src/pages/customer-usage/CustomerUsageMonitor.tsx`, `src/pages/payments/PaymentReceipt.tsx`.
   - **Invoices & laporan**: `src/pages/invoices/*`, `src/pages/invoices/bulk-generation/BulkInvoiceGeneration.tsx`, `src/pages/reports/*`.
   - **Admin prioritas tinggi**: `src/pages/user-management/*`, `src/pages/water-rates/*`, `src/pages/usage/UsageList.tsx`, `src/pages/payment-proofs/*`, `src/pages/customers/CustomerDetails.tsx`, `src/pages/Dashboard.tsx`.
   - **Pengaturan & platform**: `src/pages/settings/TenantPaymentSettings.tsx`, `src/pages/settings/PlatformPaymentSettings.tsx`, `src/pages/platform/TenantManagement.tsx`, `src/pages/platform-payments/PlatformSubscriptionVerification.tsx`, `src/pages/platform/SubscriptionPlans.tsx`, `src/pages/platform/PlatformAnalytics.tsx`, `src/pages/dashboards/PlatformOwnerDashboard.tsx`.
   - **Profil & dashboard tambahan**: `src/pages/customer-profile/*`, `src/pages/reports/ReportsDashboard.tsx`, `src/pages/reports/CustomerAnalytics.tsx`.
   - **Pembersihan legacy**: file customer legacy dan service customer lama yang tidak lagi menjadi flow utama sudah dipangkas dari code path aktif.

3. **Kondisi validasi terakhir**
   - **Build frontend** lolos setelah batch refactor terakhir.
   - **Lint global frontend** kini **lolos tanpa warning/error** pada state worktree saat ini.
   - **Build produksi** kini lolos tanpa warning chunk-size setelah pemecahan `manualChunks` per vendor/domain di Vite.

4. **Checklist review konsistensi frontend**
   - Gunakan endpoint dari `src/constants/api.ts` dan akses HTTP lewat service, bukan langsung dari komponen.
   - Untuk feedback sementara/error/sukses, pakai `useToast`; jangan tambahkan sistem notifikasi kedua.
   - Untuk aksi ikon tanpa teks, pakai `ActionIconButton` atau minimal pastikan ada `aria-label` yang jelas.
   - Untuk field form baru, utamakan `FormInput`, `FormTextarea`, `FormSelect`, atau primitive setara yang menjaga relasi `label`/`id`/`aria-describedby`.
   - Untuk dialog konfirmasi, gunakan `ConfirmModal`; hindari `alert()` atau `confirm()` browser.
   - Pastikan copy user-facing memakai Bahasa Indonesia dan istilah domain baku: **Tagihan, Pembayaran, Pelanggan, Tarif Air, Tenant**.
   - Jalankan `npm run lint` dan `npm run build` sebelum merge agar guardrail konsistensi tetap terjaga.

5. **Frontend Consistency Playbook**
   - **Route & flow**: pertahankan satu path canonical per fitur; redirect/entry customer publik tetap menuju tree customer aktif.
   - **State UX**: setiap halaman data minimal memiliki state loading, empty, success, dan error yang terlihat pengguna.
   - **Notifikasi**: gunakan toast untuk hasil aksi async; inline helper/error tetap boleh untuk validasi form per field.
   - **Komponen reusable**: untuk aksi tabel/list, gunakan pola tombol ikon yang seragam; untuk filter/form, prioritaskan primitive form bersama.
   - **Aksesibilitas**: semua kontrol interaktif harus bisa difokuskan keyboard, icon-only button wajib punya label, dan helper/error text harus terhubung ke field.
   - **Copy**: hindari campuran EN/ID pada label, CTA, empty state, dan pesan error; konsistenkan istilah lintas domain.
   - **Build hygiene**: pertahankan pemecahan chunk di `vite.config.ts` saat menambah dependensi/halaman berat baru.
