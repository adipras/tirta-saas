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

## Progress Sementara
Status umum: implementasi sudah bergerak di **Fase 1** dan mulai menyentuh sebagian **Fase 2**, tetapi belum final.

1. **Selesai**
   - **T9 — Bersih-bersih legacy/debug** sudah dikerjakan pada area inti: route debug/test dibersihkan dari `src/App.tsx`, import test page dihapus, dan `console.log` debug utama dibersihkan dari `App.tsx` serta `src/components/PrivateRoute.tsx`.

2. **Sedang berjalan**
   - **T2 — Konsolidasi route customer**: route customer publik ganda di `src/App.tsx` sudah mulai dipangkas; entry publik customer difokuskan ke `/customer/login`, sedangkan route pembayaran customer dipindahkan ke tree customer yang terproteksi.
   - **T3 — Standardisasi auth & API layer customer**: duplikasi halaman `src/pages/auth/CustomerLogin.tsx` sudah dihapus; flow customer aktif sedang dipusatkan ke implementasi di `src/pages/customer/*`.
   - **T5 — Standarisasi state loading/error**: beberapa halaman sudah mulai digeser ke pola loading/error yang lebih konsisten; contoh jelas terlihat di `src/pages/customer/CustomerDashboard.tsx` yang sudah memakai skeleton/loading state dan pesan error UI.
   - **T7 — Standardisasi copy Bahasa Indonesia**: sebagian pesan user-facing mulai dilokalkan, termasuk fallback pesan login di `src/services/authService.ts`.

3. **Snapshot perubahan yang sudah terlihat**
   - `src/App.tsx`: konsolidasi import halaman customer, penghapusan route debug/test, dan perapihan route customer.
   - `src/pages/customer/CustomerDashboard.tsx`: migrasi dari service customer lama ke Redux auth + service domain standar (`invoiceService`, `customerProfilService`), plus perbaikan UX loading/error.
   - `src/pages/customer/CustomerLogin.tsx` dan `src/pages/customer/CustomerPayInvoice.tsx`: refactor flow customer sedang berlangsung.
   - `src/services/authService.ts`: logging debug dikurangi dan copy error login diubah ke Bahasa Indonesia.

4. **Belum final / belum dikerjakan penuh**
   - **T4 — Unifikasi notifikasi**
   - **T6 — Harmonisasi komponen form/tabel/tombol/modal**
   - **T8 — Hardening aksesibilitas**
   - **T10 — Guardrails lint/build/dokumentasi konsistensi**
