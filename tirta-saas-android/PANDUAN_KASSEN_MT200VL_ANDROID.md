# Panduan Step-by-Step: Android Studio di Drive D sampai APK Tirta SaaS WebView + Printer Kassen MT200VL

Panduan ini disusun untuk flow berikut:

1. Install **Android Studio** di drive **D**
2. Buka wrapper Android `tirta-saas-android`
3. Jalankan **frontend + backend lokal**
4. Hubungkan APK Android ke **web SaaS lokal**
5. Jalankan **WebView wrapper**
6. Hubungkan ke printer **Kassen MT200VL**
7. Cetak struk dari halaman pembayaran

Dokumen ini mengacu ke project Android yang **sudah ada** di repo:

- `tirta-saas-android/app/src/main/java/com/adipras/tirtasaas/kasirkeliling/MainActivity.kt`
- `tirta-saas-android/app/src/main/java/com/adipras/tirtasaas/kasirkeliling/bridge/AndroidPrinterBridge.kt`
- `tirta-saas-android/app/src/main/java/com/adipras/tirtasaas/kasirkeliling/printer/ThermalPrinterManager.kt`
- `tirta-saas-android/gradle.properties`

---

## 1. Hal penting sebelum mulai

### 1.1 Asumsi printer

Wrapper Android saat ini menggunakan:

- **Bluetooth Classic / SPP**
- UUID standar SPP: `00001101-0000-1000-8000-00805F9B34FB`
- output cetak **ESC/POS sederhana**

Artinya, panduan ini **mengasumsikan** Kassen **MT200VL**:

1. bisa dipairing lewat Bluetooth Android
2. bisa menerima command **ESC/POS**
3. tidak membutuhkan SDK vendor khusus hanya untuk cetak teks dasar

Kalau ternyata unit MT200VL yang Anda pegang:

- hanya mendukung **BLE**
- butuh **vendor SDK**
- atau memakai command set non-ESC/POS

maka project sekarang perlu penyesuaian di layer native printer, terutama di `ThermalPrinterManager.kt`.

### 1.2 Device test yang disarankan

Untuk uji printer, **gunakan HP Android fisik**, bukan emulator, karena:

- printer Bluetooth diuji di device nyata
- pairing Bluetooth lebih realistis
- WebView lokal + printer lebih mudah divalidasi end-to-end

---

## 2. Struktur folder yang disarankan di drive D

Supaya rapi, gunakan struktur seperti ini di Windows:

```text
D:\
 └─ Android\
    ├─ Android Studio\
    ├─ sdk\
    ├─ avd\
    └─ workspace\
       └─ tirta-saas\
```

Rekomendasi:

- Android Studio: `D:\Android\Android Studio`
- Android SDK: `D:\Android\sdk`
- Android AVD: `D:\Android\avd`
- Repo project: `D:\Android\workspace\tirta-saas`

---

## 3. Install Android Studio di drive D

### 3.1 Download installer

1. Buka situs resmi Android Studio:
   - <https://developer.android.com/studio>
2. Download installer Windows.

### 3.2 Install ke drive D

Saat installer berjalan:

1. pilih **Custom** install jika tersedia
2. set lokasi Android Studio ke:
   - `D:\Android\Android Studio`
3. lanjutkan install

### 3.3 Tentukan lokasi Android SDK ke drive D

Saat first setup Android Studio:

1. saat diminta lokasi Android SDK, set ke:
   - `D:\Android\sdk`
2. selesaikan setup wizard

### 3.4 Install komponen SDK minimum

Pastikan komponen ini terpasang:

1. **Android SDK Platform 34**
2. **Android SDK Build-Tools 34**
3. **Android SDK Platform-Tools**
4. **Android SDK Command-line Tools (latest)**
5. **Android Emulator** _(opsional, tidak wajib untuk test printer)_

Cara cek:

1. buka Android Studio
2. masuk ke **More Actions > SDK Manager**
3. verifikasi komponen di atas

### 3.5 Opsional tapi sangat disarankan: set environment variables

Di Windows, tambahkan environment variable berikut:

```text
ANDROID_HOME=D:\Android\sdk
ANDROID_SDK_ROOT=D:\Android\sdk
ANDROID_AVD_HOME=D:\Android\avd
```

Tambahkan juga ke `Path`:

```text
D:\Android\sdk\platform-tools
```

Ini mempermudah penggunaan `adb`.

---

## 4. Clone / siapkan project di drive D

Contoh:

```powershell
cd D:\Android\workspace
git clone <repo-anda> tirta-saas
```

Setelah itu struktur project menjadi:

```text
D:\Android\workspace\tirta-saas\
 ├─ tirta-saas-backend\
 ├─ tirta-saas-frontend\
 └─ tirta-saas-android\
```

---

## 5. Jalankan web SaaS lokal lebih dulu

Android wrapper ini hanyalah **WebView host**. Jadi frontend dan backend tetap harus hidup.

---

## 6. Siapkan backend lokal

### 6.1 Buat file `.env`

Di folder backend:

```text
tirta-saas-backend/.env
```

Isi minimal mengikuti `.env.example`, terutama:

```env
DB_USER=...
DB_PASS=...
DB_HOST=...
DB_PORT=3306
DB_NAME=tirta_saas
JWT_SECRET=...
PORT=8081
ENV=development
AUTO_SEED_ADMIN=true
```

### 6.2 Jalankan backend

```powershell
cd D:\Android\workspace\tirta-saas\tirta-saas-backend
go run main.go
```

Backend default berjalan di:

```text
http://localhost:8081
```

Untuk akses dari HP di jaringan LAN, server Go pada umumnya sudah listen ke `:8081`. Jadi yang penting nanti dipanggil memakai **IP LAN laptop**, bukan `localhost`.

---

## 7. Siapkan frontend lokal agar bisa diakses dari HP

### 7.1 Buat / ubah `.env`

Di folder frontend:

```text
tirta-saas-frontend/.env
```

Untuk test dari HP fisik, **jangan** pakai `localhost` untuk API backend.

Contoh:

```env
VITE_API_BASE_URL=http://192.168.1.10:8081/api
VITE_APP_NAME=Tirta SaaS
```

Ganti `192.168.1.10` dengan **IP LAN laptop** Anda.

### 7.2 Cari IP LAN laptop

Di Windows:

```powershell
ipconfig
```

Cari nilai **IPv4 Address**, misalnya:

```text
192.168.1.10
```

### 7.3 Jalankan frontend agar listen ke LAN

```powershell
cd D:\Android\workspace\tirta-saas\tirta-saas-frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

Setelah itu frontend bisa diakses dari device lain pada:

```text
http://192.168.1.10:5174
```

### 7.4 Uji dari browser HP

Di HP Android fisik, buka:

```text
http://192.168.1.10:5174
```

Kalau halaman login / landing page muncul, berarti jaringan LAN sudah benar.

### 7.5 Jika HP tidak bisa akses

Cek hal berikut:

1. laptop dan HP berada di Wi-Fi yang sama
2. Windows Firewall tidak memblokir port `5174` dan `8081`
3. backend masih hidup di port `8081`
4. frontend masih hidup di port `5174`
5. `VITE_API_BASE_URL` sudah memakai IP LAN, bukan `localhost`

---

## 8. Buka project Android di Android Studio

1. buka **Android Studio**
2. pilih **Open**
3. arahkan ke folder:

```text
D:\Android\workspace\tirta-saas\tirta-saas-android
```

4. tunggu **Gradle Sync** selesai

Kalau berhasil, Android Studio akan membuat `local.properties` sendiri dan mengenali SDK path.

---

## 9. Ubah URL WebView ke URL frontend lokal

Project Android mengambil URL web dari:

```properties
tirta-saas-android/gradle.properties
```

Default repo saat ini:

```properties
TIRTA_WEB_APP_URL=http://10.0.2.2:5174
```

Nilai tersebut cocok untuk **emulator**, bukan HP fisik.

### 9.1 Untuk HP fisik

Ubah menjadi IP LAN laptop:

```properties
TIRTA_WEB_APP_URL=http://192.168.1.10:5174
```

### 9.2 Kenapa harus diubah?

Karena `MainActivity.kt` melakukan:

```kotlin
webView.loadUrl(BuildConfig.WEB_APP_URL)
```

dan `BuildConfig.WEB_APP_URL` dibentuk dari:

```kotlin
val webAppUrl = project.findProperty("TIRTA_WEB_APP_URL") as String? ?: "http://10.0.2.2:5174"
buildConfigField("String", "WEB_APP_URL", "\"$webAppUrl\"")
```

Jadi URL WebView **dibekukan saat build APK**.

### 9.3 Setelah mengubah `gradle.properties`

Lakukan:

1. **Sync Now** di Android Studio
2. atau **File > Sync Project with Gradle Files**

---

## 10. Verifikasi fitur WebView + bridge printer di project Android

Wrapper Android yang ada saat ini sudah melakukan hal berikut:

### 10.1 WebView

Di `MainActivity.kt`:

- JavaScript aktif
- DOM storage aktif
- `WebViewClient` dipasang
- ada fallback halaman error jika URL web gagal dimuat

### 10.2 Native bridge ke frontend

Object berikut di-inject ke JavaScript:

```javascript
window.AndroidPrinterBridge
```

Method yang tersedia:

```javascript
window.AndroidPrinterBridge.isAvailable()
window.AndroidPrinterBridge.scanPrinters()
window.AndroidPrinterBridge.connectPrinter(deviceId)
window.AndroidPrinterBridge.getStatus()
window.AndroidPrinterBridge.printReceipt(payloadJson)
```

### 10.3 Permission & cleartext traffic

Project Android sudah mengizinkan:

- `INTERNET`
- `BLUETOOTH`
- `BLUETOOTH_CONNECT`
- `BLUETOOTH_SCAN`
- HTTP non-HTTPS (`usesCleartextTraffic="true"`)

Jadi untuk local development **tidak perlu** tambahan konfigurasi network lagi.

---

## 11. Compile APK debug

### 11.1 Via Android Studio

1. menu **Build**
2. pilih **Build Bundle(s) / APK(s)**
3. pilih **Build APK(s)**

Tunggu build selesai.

Lokasi output debug APK biasanya:

```text
tirta-saas-android\app\build\outputs\apk\debug\app-debug.apk
```

### 11.2 Via terminal Windows

Di folder `tirta-saas-android`:

```powershell
cd D:\Android\workspace\tirta-saas\tirta-saas-android
.\gradlew.bat assembleDebug
```

Jika sukses, file APK akan ada di:

```text
app\build\outputs\apk\debug\app-debug.apk
```

---

## 12. Install APK ke HP Android

Ada dua cara yang paling praktis.

### 12.1 Via ADB (disarankan)

Aktifkan di HP:

1. **Developer Options**
2. **USB Debugging**

Lalu sambungkan HP ke laptop via USB dan jalankan:

```powershell
adb devices
adb install -r D:\Android\workspace\tirta-saas\tirta-saas-android\app\build\outputs\apk\debug\app-debug.apk
```

### 12.2 Via file manager

1. copy `app-debug.apk` ke HP
2. buka file APK di HP
3. izinkan install dari sumber tersebut jika diminta
4. install aplikasi

---

## 13. Jalankan aplikasi Android dan uji WebView

Saat app dibuka:

1. app akan membuka URL dari `TIRTA_WEB_APP_URL`
2. halaman frontend Tirta SaaS akan tampil di WebView
3. kalau gagal, `MainActivity.kt` akan menampilkan halaman error sederhana:
   - “Gagal memuat aplikasi web”
   - instruksi cek `TIRTA_WEB_APP_URL`

### 13.1 Jika halaman web tidak muncul

Cek ulang:

1. frontend dev server masih berjalan
2. backend masih berjalan
3. `TIRTA_WEB_APP_URL` benar
4. HP bisa membuka URL itu dari browser biasa
5. firewall Windows tidak memblokir

---

## 14. Pair printer Kassen MT200VL di Android

`scanPrinters()` di project saat ini **hanya membaca bonded devices** / perangkat Bluetooth yang sudah dipairing.

Jadi **pair printer dulu di Settings Android**, bukan dari aplikasi.

### 14.1 Langkah pairing

1. nyalakan printer **Kassen MT200VL**
2. aktifkan mode Bluetooth printer
3. di HP Android buka:
   - **Settings > Bluetooth**
4. cari device printer
5. pilih printer
6. masukkan PIN jika diminta

PIN yang sering dipakai printer thermal:

- `0000`
- `1234`

Tetapi tetap ikuti manual printer MT200VL Anda jika berbeda.

### 14.2 Verifikasi pairing

Setelah paired, printer harus muncul di daftar perangkat tersimpan / paired.

Kalau belum paired, aplikasi tidak akan menemukannya saat menekan **Cari Printer**.

---

## 15. Hubungkan printer dari dalam aplikasi

### 15.1 Login ke aplikasi web di dalam WebView

Masuk sebagai user yang bisa membuka struk pembayaran, misalnya tenant admin.

### 15.2 Buka halaman struk pembayaran

Flow UI saat ini menguji printer di halaman:

```text
/admin/payments/:id/receipt
```

Contoh flow:

1. login ke admin tenant
2. buka menu **Pembayaran**
3. pilih salah satu pembayaran
4. buka **Struk Pembayaran**

### 15.3 Panel printer thermal yang akan muncul

Jika bridge Android aktif, halaman struk akan menampilkan panel:

**Printer Thermal Kasir Keliling**

dengan tombol:

1. **Refresh Status**
2. **Cari Printer**
3. **Hubungkan**
4. **Hubungkan Printer Favorit** _(jika ada)_
5. **Cetak ke Printer Thermal**

### 15.4 Langkah koneksi

1. tekan **Cari Printer**
2. pastikan printer MT200VL muncul di hasil pencarian
3. tekan **Hubungkan**
4. tunggu status berubah menjadi:
   - **Terhubung**

Kalau berhasil, nama printer akan tampil di bagian status.

---

## 16. Cetak struk ke MT200VL

Setelah printer terhubung:

1. tetap di halaman **Struk Pembayaran**
2. tekan tombol **Cetak ke Printer Thermal**
3. aplikasi web akan memanggil:

```javascript
window.AndroidPrinterBridge.printReceipt(payloadJson)
```

4. layer native Android akan:
   - membangun byte ESC/POS
   - mengirimkannya ke socket Bluetooth printer

Jika berhasil, UI akan menampilkan toast sukses:

- **Perintah cetak ke printer thermal berhasil dikirim**

---

## 17. Cara memastikan web SaaS lokal benar-benar terhubung

Supaya flow end-to-end benar, pastikan ketiga lapisan ini cocok:

### 17.1 Frontend URL

`tirta-saas-android/gradle.properties`

```properties
TIRTA_WEB_APP_URL=http://192.168.1.10:5174
```

### 17.2 Frontend API URL

`tirta-saas-frontend/.env`

```env
VITE_API_BASE_URL=http://192.168.1.10:8081/api
```

### 17.3 Server yang berjalan

- frontend Vite di `5174`
- backend Go di `8081`

Kalau frontend terbuka tetapi login / API gagal, hampir pasti masalahnya ada di `VITE_API_BASE_URL`.

---

## 18. Opsi alternatif: pakai USB + adb reverse

Jika Anda tidak ingin memakai IP LAN, bisa pakai USB debugging dan `adb reverse`.

### 18.1 Jalankan command

```powershell
adb reverse tcp:5174 tcp:5174
adb reverse tcp:8081 tcp:8081
```

### 18.2 Ubah konfigurasi

`tirta-saas-android/gradle.properties`

```properties
TIRTA_WEB_APP_URL=http://127.0.0.1:5174
```

`tirta-saas-frontend/.env`

```env
VITE_API_BASE_URL=http://127.0.0.1:8081/api
```

### 18.3 Kapan mode ini cocok?

- HP tersambung ke laptop via USB
- ingin test tanpa repot LAN/firewall
- ingin memastikan traffic masuk lewat tunnel ADB

Tetapi untuk test lapangan, **LAN IP tetap lebih realistis**.

---

## 19. Troubleshooting cepat

### 19.1 App Android terbuka tapi blank / error load

Cek:

1. `TIRTA_WEB_APP_URL` salah
2. frontend belum jalan
3. HP tidak bisa akses laptop
4. firewall Windows memblokir

### 19.2 Halaman web muncul tapi login/API gagal

Biasanya:

1. `VITE_API_BASE_URL` masih `localhost`
2. backend tidak jalan
3. backend tidak bisa dijangkau dari HP

### 19.3 Tombol printer muncul tapi tidak menemukan printer

Cek:

1. printer **sudah paired** di Settings Android
2. Bluetooth HP aktif
3. izin Bluetooth diberikan ke app
4. MT200VL benar-benar mode Bluetooth

### 19.4 Printer ditemukan tapi gagal connect

Kemungkinan:

1. printer sedang tersambung ke device lain
2. printer tidak expose SPP
3. printer butuh vendor SDK khusus
4. jarak terlalu jauh / sinyal lemah

### 19.5 Connect sukses tapi tidak mencetak

Kemungkinan:

1. printer tidak kompatibel penuh dengan ESC/POS
2. lebar kertas / command set printer berbeda
3. printer menerima data tetapi format perlu penyesuaian

Jika kasus ini terjadi, mulai audit dari:

- `ThermalPrinterManager.kt`
- method `buildReceiptBytes()`

---

## 20. File penting yang paling sering akan Anda ubah

### 20.1 Ganti URL web app Android

File:

```text
tirta-saas-android/gradle.properties
```

### 20.2 Ganti URL API frontend

File:

```text
tirta-saas-frontend/.env
```

### 20.3 Ubah logika WebView / permission / inject bridge

File:

```text
tirta-saas-android/app/src/main/java/com/adipras/tirtasaas/kasirkeliling/MainActivity.kt
```

### 20.4 Ubah method bridge yang dipanggil dari JavaScript

File:

```text
tirta-saas-android/app/src/main/java/com/adipras/tirtasaas/kasirkeliling/bridge/AndroidPrinterBridge.kt
```

### 20.5 Ubah pairing / koneksi / ESC-POS print

File:

```text
tirta-saas-android/app/src/main/java/com/adipras/tirtasaas/kasirkeliling/printer/ThermalPrinterManager.kt
```

---

## 21. Jalur paling aman untuk sukses pertama kali

Kalau ingin jalur paling minim risiko, lakukan urutan berikut:

1. install Android Studio ke `D:\Android\Android Studio`
2. set SDK ke `D:\Android\sdk`
3. jalankan backend lokal
4. jalankan frontend lokal pakai `--host 0.0.0.0`
5. pastikan browser HP bisa buka `http://IP-LAPTOP:5174`
6. ubah `TIRTA_WEB_APP_URL` ke `http://IP-LAPTOP:5174`
7. build `app-debug.apk`
8. install ke HP
9. buka app, pastikan WebView load sukses
10. pair printer MT200VL di Settings Android
11. buka halaman struk pembayaran
12. tekan **Cari Printer**
13. tekan **Hubungkan**
14. tekan **Cetak ke Printer Thermal**

---

## 22. Rekomendasi lanjutan setelah tahap ini berhasil

Setelah berhasil cetak pertama kali, tahap berikutnya yang masuk akal:

1. buat **signed release APK**
2. simpan **printer favorit** per device/operator
3. tambah **auto reconnect** saat printer favorit tersedia
4. tambah **diagnostic screen** khusus printer
5. uji kompatibilitas MT200VL pada:
   - panjang struk
   - karakter khusus
   - koneksi ulang setelah printer sleep
   - performa cetak berulang

---

## 23. Checklist singkat

### Tooling

- [ ] Android Studio terinstall di drive D
- [ ] Android SDK terinstall di drive D
- [ ] project `tirta-saas-android` bisa sync

### Web lokal

- [ ] backend jalan di `8081`
- [ ] frontend jalan di `5174`
- [ ] browser HP bisa buka frontend
- [ ] login dari HP berhasil

### Android wrapper

- [ ] `TIRTA_WEB_APP_URL` sudah benar
- [ ] APK debug berhasil dibuat
- [ ] APK berhasil diinstall ke HP
- [ ] WebView berhasil load

### Printer

- [ ] Kassen MT200VL sudah paired di Android
- [ ] tombol **Cari Printer** menemukan printer
- [ ] tombol **Hubungkan** berhasil
- [ ] tombol **Cetak ke Printer Thermal** berhasil mengirim struk

---

Kalau setelah mengikuti panduan ini printer **terhubung tetapi hasil cetak kosong / kacau / tidak keluar**, fokus investigasi berikutnya adalah **kompatibilitas command ESC/POS MT200VL** terhadap implementasi saat ini di `ThermalPrinterManager.kt`.
