# Bridge Printer Thermal HTTP

## Ringkasan

Modul baru: `tirta-saas-android/printer-bridge`

Fungsi utama:

- menjalankan bridge HTTP lokal di `127.0.0.1:3000`
- menerima job cetak dari frontend Tirta SaaS
- mengirim byte ESC/POS ke printer Bluetooth Classic SPP/RFCOMM
- menyimpan printer favorit untuk reconnect otomatis sederhana

## Endpoint

### `GET /status`

Status bridge, koneksi printer aktif, dan printer favorit.

### `GET /printers`

Daftar printer Bluetooth yang sudah dipairing di Android.

### `POST /connect`

Body:

```json
{ "deviceId": "00:11:22:33:44:55" }
```

### `POST /print`

Bridge menerima dua bentuk payload:

#### Payload generik

```json
{
  "type": "receipt",
  "content": {
    "text": "Tirta SaaS\nPembayaran Berhasil",
    "align": "center",
    "bold": true,
    "doubleSize": true,
    "items": [
      { "label": "Pelanggan", "value": "Budi" },
      { "label": "Tagihan", "value": "Rp 125000" }
    ],
    "total": "Rp 125000",
    "qrData": "INV-2026-0001",
    "cutPaper": true
  }
}
```

#### Payload receipt frontend Tirta SaaS

Body juga tetap menerima payload thermal receipt terstruktur dari frontend utama.

### Fitur ESC/POS yang sudah dipakai

- text printing
- align `left | center | right`
- bold
- double size
- line feed
- QR code
- cut paper

## Cara pakai lapangan

1. Pair printer dulu di pengaturan Bluetooth Android
2. Buka app **Bridge Printer Thermal**
3. Pastikan status bridge aktif
4. Dari frontend, buka halaman struk pembayaran
5. Gunakan tombol **Cari Printer** lalu **Hubungkan**
6. Cetak via **Cetak ke Printer Thermal**

## Catatan migrasi

- frontend sekarang mencoba bridge HTTP lokal terlebih dahulu
- jika bridge tidak aktif, UI menampilkan notifikasi fallback ke cetak browser
- modul WebView lama sudah dihapus dari project Android
