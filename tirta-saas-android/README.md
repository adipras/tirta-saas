# Tirta SaaS Android

Repo Android sekarang punya dua jalur utama:

1. `app/` → **app mobile native utama** berbasis Jetpack Compose untuk roadmap operasional
2. `printer-bridge/` → **app bridge printer thermal** tanpa WebView dan tanpa Android PrintManager

## Modul yang direkomendasikan

Gunakan **`app`** untuk pengembangan mobile native utama, dan **`printer-bridge`** untuk flow thermal printer existing:

- `app/`
  - Compose + Hilt + Navigation
  - `core/common`, `core/designsystem`, `core/network`, `core/database`, `core/security`
  - `feature-auth` sebagai feature awal
  - default API dev: `http://10.0.2.2:8081/api/`

- `printer-bridge/`

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

- modul legacy WebView sudah dihapus
- integrasi printer tetap memakai bridge HTTP lokal dari modul `printer-bridge`
- shell aplikasi native utama sudah dibuat untuk Phase 1 roadmap mobile

## Build cepat

1. Buka folder `tirta-saas-android/` di Android Studio
2. Tunggu Gradle Sync
3. Build app mobile utama:

```powershell
.\gradlew.bat :app:assembleDebug
```

4. Build modul bridge printer:

```powershell
.\gradlew.bat :printer-bridge:assembleDebug
```

APK debug hasil build:

```text
app\build\outputs\apk\debug\app-debug.apk
printer-bridge\build\outputs\apk\debug\printer-bridge-debug.apk
```

## Catatan toolchain

Project Android tetap membutuhkan Android SDK + JDK 17 di mesin build lokal.
