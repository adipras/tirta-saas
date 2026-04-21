# Panduan Kassen MT200VL Android

Panduan ini sekarang mengikuti arsitektur **printer-bridge** dan tidak lagi menggunakan WebView maupun `window.AndroidPrinterBridge`.

## Alur koneksi

1. Pair printer **Kassen MT200VL** dari pengaturan Bluetooth Android.
2. Install dan buka APK **printer-bridge**.
3. Izinkan permission Bluetooth dan notifikasi bila diminta.
4. Pastikan status bridge aktif di `http://127.0.0.1:3000`.
5. Di halaman struk Tirta SaaS, pilih **Cari Printer** lalu **Hubungkan**.
6. Cetak struk melalui tombol **Cetak ke Printer Thermal**.

## Catatan kompatibilitas

- MT200VL umumnya memakai Bluetooth Classic **SPP/RFCOMM**.
- Driver cetak di bridge ini mengirim byte **ESC/POS** langsung.
- Jika printer tidak muncul, pastikan printer sudah benar-benar paired di Android sebelum membuka app bridge.

## Tes minimum

1. Cetak teks sederhana
2. Cetak struk panjang
3. Cetak QR code
4. Matikan printer, nyalakan lagi, lalu ulangi cetak untuk menguji reconnect

## Jika gagal connect

- pastikan Bluetooth Android aktif
- hapus pairing lama lalu pair ulang printer
- tutup aplikasi lain yang mungkin masih memegang koneksi printer
- buka kembali app bridge lalu ulangi proses hubungkan printer

Dokumentasi endpoint dan payload ada di [`PRINTER_BRIDGE.md`](./PRINTER_BRIDGE.md).
