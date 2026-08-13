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

---

## Mengganti ikon / logo app

### Langkah 1 — Siapkan file PNG

Generate set ikon dari tools online seperti [romannurik.github.io/AndroidAssetStudio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html) atau [easyappicon.com](https://easyappicon.com):

1. Upload logo/gambar Anda
2. Download ZIP → berisi folder `mipmap-*` yang siap pakai

Ukuran yang diperlukan:

| Folder | Ukuran |
|---|---|
| `mipmap-mdpi` | 48×48 px |
| `mipmap-hdpi` | 72×72 px |
| `mipmap-xhdpi` | 96×96 px |
| `mipmap-xxhdpi` | 144×144 px |
| `mipmap-xxxhdpi` | 192×192 px |

### Langkah 2 — Letakkan file di repo

Salin hasil generate ke:

```
app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png        ← 48×48
│   └── ic_launcher_round.png  ← 48×48
├── mipmap-hdpi/
│   ├── ic_launcher.png        ← 72×72
│   └── ic_launcher_round.png
├── mipmap-xhdpi/
│   ├── ic_launcher.png        ← 96×96
│   └── ic_launcher_round.png
├── mipmap-xxhdpi/
│   ├── ic_launcher.png        ← 144×144
│   └── ic_launcher_round.png
└── mipmap-xxxhdpi/
    ├── ic_launcher.png        ← 192×192
    └── ic_launcher_round.png
```

> `ic_launcher_round.png` adalah versi ikon bulat untuk Android 7.1+. Boleh menggunakan file yang sama dengan `ic_launcher.png` jika belum punya versi round terpisah.

`AndroidManifest.xml` sudah dikonfigurasi untuk membaca dari `@mipmap/ic_launcher` dan `@mipmap/ic_launcher_round`, jadi tidak perlu mengubah manifest lagi.

### Langkah 3 — Build APK

```bash
# Linux / Mac / WSL
./gradlew :app:assembleDebug

# Windows (Command Prompt / PowerShell)
.\gradlew.bat :app:assembleDebug
```

APK ada di: `app/build/outputs/apk/debug/app-debug.apk`

### Mengganti nama aplikasi

Edit `app/src/main/res/values/strings.xml`:

```xml
<string name="app_name">Nama Aplikasi Anda</string>
```

### (Opsional) Adaptive Icon untuk Android 8.0+

Jika ingin ikon yang menyesuaikan bentuk launcher perangkat (lingkaran, kotak, dll), tambahkan:

```
app/src/main/res/
├── mipmap-anydpi-v26/
│   ├── ic_launcher.xml
│   └── ic_launcher_round.xml
├── drawable/
│   └── ic_launcher_foreground.xml  ← atau .png layer foreground
└── values/
    └── colors.xml  ← tambahkan ic_launcher_background
```

Isi `mipmap-anydpi-v26/ic_launcher.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

Tambahkan warna background di `values/colors.xml`:

```xml
<color name="ic_launcher_background">#FFFFFF</color>
```

> Adaptive icon bersifat opsional — PNG biasa di folder `mipmap-*` sudah cukup untuk semua versi Android yang didukung.

---

## Room Database Migration

Setiap kali ada perubahan skema Room DB (tambah kolom, tabel baru, dll), **wajib** menambahkan migration sebelum build APK baru agar data di perangkat existing tidak terhapus.

### Cara menambahkan migration

1. Buka `core/database/src/main/java/com/adipras/tirtasaas/core/database/TirtaDatabase.kt`
2. Increment nilai `version` di anotasi `@Database`:

```kotlin
@Database(
    entities = [...],
    version = 2,  // ← naikkan dari versi sebelumnya
    exportSchema = false
)
```

3. Tambahkan objek migration di file yang sama atau file terpisah:

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE draft_usages ADD COLUMN meter_id TEXT")
    }
}
```

4. Daftarkan migration di builder database (`DatabaseModule.kt`):

```kotlin
Room.databaseBuilder(...)
    .addMigrations(MIGRATION_1_2)
    .build()
```

> ⚠️ Jika migration tidak ditambahkan, Room akan crash saat app dijalankan di perangkat yang sudah punya database versi lama. Gunakan `.fallbackToDestructiveMigration()` hanya untuk development, **tidak untuk produksi**.

