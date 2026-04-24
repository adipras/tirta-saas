# Tirta SaaS Android

Repo Android sekarang fokus pada satu modul:

1. `printer-bridge/` → **app bridge printer thermal** tanpa WebView dan tanpa Android PrintManager

## Modul yang direkomendasikan

Gunakan **`printer-bridge`** untuk migrasi kasir keliling terbaru:

- host HTTP lokal di `http://127.0.0.1:3000`
- endpoint:
  - `GET /status`
  - `GET /printers`
  - `POST /connect`
  - `POST /print`
- cetak ke printer Bluetooth Classic SPP/RFCOMM generic ESC/POS
- `POST /print` mendukung payload generik `type=receipt` maupun payload receipt frontend Tirta SaaS
- service berjalan sebagai **foreground service** agar bridge tetap hidup saat app di-background

Dokumen ringkas perubahan ada di:

- [`PRINTER_BRIDGE.md`](./PRINTER_BRIDGE.md)

## Status migrasi

Modul legacy WebView sudah dihapus. Integrasi Android kini sepenuhnya menggunakan bridge HTTP lokal dari modul `printer-bridge`.

## Build cepat

1. Buka folder `tirta-saas-android/` di Android Studio
2. Tunggu Gradle Sync
3. Build modul bridge:

```powershell
.\gradlew.bat :printer-bridge:assembleDebug
```

Untuk kompatibilitas dengan tooling lama, task legacy berikut juga tetap tersedia:

```powershell
.\gradlew.bat :app:assembleDebug
```

Alias `:app` memakai source yang sama dengan `:printer-bridge`, tetapi output build dipisah ke folder legacy agar tidak bentrok.

APK debug hasil build:

```text
printer-bridge\build\outputs\apk\debug\printer-bridge-debug.apk
```

## Catatan toolchain

Project Android tetap membutuhkan Android SDK + JDK 17 di mesin build lokal.
