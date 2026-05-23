# Step by Step Sync Repo ke VPS

> **Deprecated / tidak dipakai lagi sebagai alur resmi.**
>
> Dokumen ini dulunya dipakai saat source code repository disimpan langsung di VPS dan di-update dengan `git pull`.
>
> Alur deploy resmi sekarang adalah:
> 1. push ke `main`
> 2. GitHub Actions publish image ke GHCR
> 3. buat tag deploy
> 4. GitHub Actions deploy runtime bundle ke server via SSH
>
> Gunakan dokumen berikut:
> - `DEPLOYMENT_USER_MANUAL.md`
> - `README.md` bagian deploy

Tidak ada lagi langkah sinkronisasi repo ke VPS dalam flow standar.
