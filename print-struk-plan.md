# Implementasi parity struk browser vs thermal printer

## Masalah
Hasil cetak thermal saat ini belum bisa "sama persis" dengan preview browser karena kedua sisi memakai sumber layout yang berbeda:
- Frontend merender preview struk langsung di `tirta-saas-frontend\src\pages\payments\PaymentReceipt.tsx`.
- Frontend lalu membangun payload data terstruktur di `tirta-saas-frontend\src\types\thermalPrinter.ts`.
- Android bridge merakit ulang layout ESC/POS secara native di `tirta-saas-android\printer-bridge\src\main\java\com\adipras\tirtasaas\printerbridge\printer\ThermalPrinterManager.kt`.

## Kondisi saat ini
- `PaymentReceipt.tsx` adalah sumber layout visual yang lengkap: header logo/nama tenant, status pembayaran, identitas pelanggan, item tagihan air, ringkasan biaya, info bank/QRIS, footer, catatan, dan timestamp cetak.
- `buildThermalReceiptPayload()` hanya menyamakan data dan sebagian aturan tampil, tetapi tidak membawa struktur visual penuh (mis. warna, bobot tipografi, spasi vertikal, grouping, dan urutan visual sebagai satu artefak final).
- `ThermalPrinterManager.kt` masih mencetak mode teks 32 kolom (`LINE_WIDTH = 32`) dengan `appendKeyValue`, `appendDivider`, wrapping manual, dan gambar remote opsional untuk logo/QRIS.
- Pada mode ESC/POS native saat ini, logo tenant dan QRIS tetap bisa dicetak karena bridge sudah memiliki path bitmap remote untuk gambar; batasannya ada pada layout teks di luar blok gambar.
- Dengan arsitektur sekarang, parity "sama persis" tidak realistis jika tetap mempertahankan renderer ESC/POS teks sebagai renderer utama, karena browser preview dan printer thermal memiliki model layout berbeda.

## Arah implementasi yang disepakati
- Pertahankan renderer ESC/POS teks native di Android sebagai jalur utama untuk `payment_receipt`.
- Jadikan `PaymentReceipt.tsx` sebagai referensi struktur dan aturan tampil, lalu samakan representasinya ke payload thermal dan layout Android sedekat mungkin.
- Pertahankan pencetakan bitmap untuk aset gambar tenant seperti logo dan QRIS, sambil merapikan layout teks di luar blok gambar.

## Rencana implementasi
1. Tetapkan kontrak parity cetak
   - Gunakan definisi target: hasil thermal harus sangat mirip dengan preview browser, tetapi tidak wajib pixel-identical.
   - Batasi scope parity pada `payment_receipt`, tanpa mengubah perilaku payload generik lain.

2. Satukan sumber render di frontend
   - Ekstrak aturan presentasi receipt dari `PaymentReceipt.tsx` ke helper/view-model bersama agar preview browser dan payload thermal memakai sumber data tampil yang sama.
   - Samakan aturan conditional rendering untuk logo, usage block, subtotal/denda, status parsial, info bank, QRIS, footer, notes, dan timestamp.
   - Sentralisasikan label, formatting tanggal/currency, serta urutan section agar drift antara browser dan thermal berkurang.

3. Perluas kontrak payload bridge
   - Tambahkan field layout yang masih kurang pada payload `payment_receipt` bila diperlukan, tetapi tetap dalam bentuk data semantik, bukan raster penuh.
   - Jaga kompatibilitas dengan payload teks existing agar flow lama tidak rusak.
   - Update service frontend (`thermalPrinterService` / `printerBridgeHttpService`) agar mengirim struktur receipt yang lebih lengkap dan eksplisit.

4. Rapikan layout ESC/POS di Android bridge
   - Evaluasi cepat apakah `ThermalPrinterManager.kt` masih layak direfactor untuk jalur `payment_receipt`; jika tidak, buat ulang renderer receipt-nya secara terarah agar struktur output mengikuti preview browser: header, info struk, item tagihan, ringkasan biaya, blok bank/QRIS, dan footer.
   - Jika rewrite dipilih, batasi rewrite pada jalur `payment_receipt` atau ekstrak renderer baru yang dipanggil dari `ThermalPrinterManager.kt`, supaya flow generic receipt yang sudah ada tetap aman.
   - Tinjau ulang bold, alignment, divider, spacing, wrapping, dan pasangan label-value supaya hasil visual lebih dekat ke preview.
   - Gunakan helper layout yang lebih eksplisit untuk blok receipt daripada merangkai semua baris secara ad-hoc.

5. Samakan detail presentasi yang terlihat
   - Cocokkan ukuran logo/QRIS, margin atas-bawah, divider, grouping section, alignment, dan urutan blok dengan preview browser.
   - Pastikan formatting tanggal dan currency berasal dari helper/aturan yang sama agar tidak drift.
   - Definisikan translasi warna browser ke penekanan thermal, mis. bold untuk total, warning text untuk denda/sisa parsial, dan success emphasis untuk pembayaran.

6. Validasi parity manual end-to-end
   - Bandingkan preview browser dengan hasil thermal pada beberapa variasi data: pembayaran penuh, parsial, dengan/tanpa alamat panjang, dengan/tanpa meter number, dengan/tanpa denda, dengan/tanpa bank info, dengan/tanpa QRIS, dan notes panjang.
   - Pastikan fallback browser print dan flow bridge yang ada tetap berjalan.

## File yang kemungkinan berubah
- `tirta-saas-frontend\src\pages\payments\PaymentReceipt.tsx`
- `tirta-saas-frontend\src\types\thermalPrinter.ts`
- `tirta-saas-frontend\src\services\thermalPrinterService.ts`
- `tirta-saas-frontend\src\services\printerBridgeHttpService.ts`
- `tirta-saas-android\printer-bridge\src\main\java\com\adipras\tirtasaas\printerbridge\printer\ThermalPrinterManager.kt`
- Kemungkinan renderer Android baru / helper layout utilities bila rewrite parsial lebih aman daripada refactor file existing

## Risiko dan catatan
- Jika tetap memilih renderer ESC/POS teks native, logo dan QRIS masih bisa dipertahankan, tetapi hasil akhir tetap hanya bisa "mendekati" preview browser, bukan identik.
- Fokus implementasi harus pada pengurangan drift layout dan formatting, bukan pada pixel parity.
- Perubahan di `PaymentReceipt.tsx` dan `buildThermalReceiptPayload()` perlu dijaga tetap sinkron karena keduanya akan menjadi dua renderer dari receipt spec yang sama.
- Jika struktur `ThermalPrinterManager.kt` menghambat perubahan yang rapi, rewrite terarah untuk renderer `payment_receipt` lebih disukai daripada menumpuk patch kecil yang sulit dirawat.

## Pertanyaan terbuka
- Tidak ada pertanyaan terbuka yang memblokir tahap perencanaan. Strategi yang dipilih adalah mempertahankan ESC/POS native dengan target hasil sangat mirip, termasuk logo dan QRIS tenant.
