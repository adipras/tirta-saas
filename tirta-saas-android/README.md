# Tirta SaaS Android Wrapper

Wrapper Android ini disiapkan untuk use case **kasir keliling** dengan arsitektur:

1. Android app membuka frontend Tirta SaaS di dalam `WebView`
2. Android app meng-inject `window.AndroidPrinterBridge`
3. Bridge native menangani printer thermal Bluetooth generic **ESC/POS**

## Panduan lengkap setup MT200VL

Untuk panduan step-by-step dari install Android Studio di drive **D** sampai build APK, koneksi ke web SaaS lokal, WebView, dan printer **Kassen MT200VL**, lihat:

- [`PANDUAN_KASSEN_MT200VL_ANDROID.md`](./PANDUAN_KASSEN_MT200VL_ANDROID.md)

## Target awal

- Android only
- Printer thermal Bluetooth generic ESC/POS
- Fokus: cetak struk pembayaran kasir keliling

## Struktur penting

- `app/src/main/java/.../MainActivity.kt`  
  Host `WebView` dan inject `AndroidPrinterBridge`
- `app/src/main/java/.../bridge/AndroidPrinterBridge.kt`  
  API bridge yang dipanggil oleh frontend
- `app/src/main/java/.../printer/ThermalPrinterManager.kt`  
  Logic paired devices, connect, status, dan print ESC/POS

## Siap dibuka di Android Studio

Project ini sekarang sudah menyertakan:

- **Gradle wrapper** (`./gradlew`, `gradlew.bat`, `gradle/wrapper/*`)
- `.gitignore` Android standar untuk file lokal/generate
- konfigurasi build yang cukup untuk langsung **Open** folder `tirta-saas-android/` di Android Studio

Yang tetap dibutuhkan di mesin pembuka project hanyalah toolchain standar Android Studio:

1. Android Studio
2. Android SDK yang sesuai
3. JDK bawaan Android Studio atau JDK 17

`local.properties` tidak perlu dicommit; Android Studio akan membuatnya sendiri saat SDK path sudah dikenali.

## Konfigurasi URL web app

Default URL web app diatur lewat `gradle.properties`:

```properties
TIRTA_WEB_APP_URL=http://10.0.2.2:5174
```

Nilai default di atas cocok untuk emulator Android yang mengakses frontend dev server lokal.

Untuk staging/production, ubah ke URL frontend yang benar sebelum build.

Contoh:

```properties
TIRTA_WEB_APP_URL=http://192.168.1.10:5174
```

Gunakan IP LAN laptop/server bila APK akan dipakai dari HP fisik pada jaringan yang sama.

## Langkah buka dan build

1. Buka **Android Studio**
2. Pilih **Open** lalu arahkan ke folder `tirta-saas-android/`
3. Tunggu **Gradle Sync** selesai
4. Sesuaikan `TIRTA_WEB_APP_URL` bila perlu
5. Jalankan:
   - **Run app** ke device Android, atau
   - **Build > Build APK(s)** untuk debug APK

## Catatan konektivitas

- APK ini adalah **WebView wrapper**, jadi aplikasi web tetap harus bisa diakses dari Android.
- Bila memakai HP fisik, `10.0.2.2` **tidak bisa** dipakai; itu hanya untuk emulator.
- Pastikan frontend dan backend sama-sama bisa diakses dari HP.
- Jika memakai HTTP non-HTTPS untuk development, project ini sudah mengizinkan cleartext traffic.

## Bridge yang tersedia untuk frontend

Frontend memanggil object global berikut:

```js
window.AndroidPrinterBridge.isAvailable()
window.AndroidPrinterBridge.scanPrinters()
window.AndroidPrinterBridge.connectPrinter(deviceId)
window.AndroidPrinterBridge.getStatus()
window.AndroidPrinterBridge.printReceipt(payloadJson)
```

Semua method selain `isAvailable()` mengembalikan JSON string atau array JSON string agar mudah diparse di layer web.

## Catatan implementasi

- `scanPrinters()` saat ini mengembalikan **bonded devices** yang sudah pernah dipasangkan di Android
- `connectPrinter()` memakai Bluetooth RFCOMM dengan UUID SPP standar
- `printReceipt()` menerima payload struk terstruktur dari frontend, lalu merendernya ke command ESC/POS sederhana
- Browser print di frontend tetap bisa dipakai sebagai fallback saat bridge native tidak tersedia

## Catatan toolchain

Environment coding saat ini tidak memiliki `java` / `gradle`, jadi project ini disiapkan sebagai source yang dibuka melalui Android Studio untuk sync/build lebih lanjut.
