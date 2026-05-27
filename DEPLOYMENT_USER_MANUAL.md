# Panduan Deploy Tirta SaaS

**Version:** 3.1  
**Last Updated:** May 27, 2026  
**Status:** Aktif  
**Repository:** `adipras/tirta-saas`

---

## 1. Tujuan

Dokumen ini khusus untuk **flow deploy Tirta SaaS yang aktif saat ini**.

Flow resminya:

1. push perubahan ke `main`
2. GitHub Actions build dan publish image ke GHCR
3. buat tag deploy
4. GitHub Actions otomatis deploy ke server via SSH

Server production **tidak menyimpan source code repository** lagi. Server hanya menyimpan runtime files.

---

## 2. Workflow yang Dipakai

File workflow:

- `.github/workflows/publish-images.yml`
- `.github/workflows/bootstrap-runtime.yml`
- `.github/workflows/deploy-by-tag.yml`

Runtime bundle:

- `deploy/runtime/docker-compose.yml`
- `deploy/runtime/.env.example`
- `deploy/runtime/render-env.sh`
- `deploy/runtime/nginx/default.conf.template`

---

## 3. Konfigurasi Production Tirta SaaS Saat Ini

Konfigurasi aktif saat ini:

- **Repository:** `adipras/tirta-saas`
- **Domain:** `tirtautama.net`
- **Runtime path aktif:** `/opt/tirta-saas/app`
- **Deploy mode:** GitHub Actions + GHCR + SSH
- **Compose project aktif:** `app`

Catatan:

- Path `/opt/tirta-saas/app` dipertahankan untuk migrasi aman dari deploy lama.
- Direktori itu sekarang sudah menjadi **runtime-only directory**, bukan repo checkout.

Isi runtime path production saat ini:

- `.env`
- `.env.example`
- `.migration-backup`
- `certs/`
- `docker-compose.yml`
- `nginx/`
- `render-env.sh`
- `www/`

---

## 4. Secrets dan Variables yang Dipakai Repo Ini

Di GitHub repo `adipras/tirta-saas`, Actions memakai:

### Secrets

- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_PATH`
- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`
- `RUNTIME_MYSQL_ROOT_PASSWORD`
- `RUNTIME_MYSQL_PASSWORD`
- `RUNTIME_JWT_SECRET`

### Optional secrets

- `GHCR_USERNAME`
- `GHCR_TOKEN`

### Variables

- `RUNTIME_DOMAIN_NAME`
- `RUNTIME_MYSQL_DATABASE`
- `RUNTIME_MYSQL_USER`
- `RUNTIME_AUTO_SEED_ADMIN`
- `RUNTIME_ENABLE_INVOICE_SCHEDULER`
- `RUNTIME_ENABLE_TRIAL_SCHEDULER`
- `RUNTIME_MYSQL_IMAGE`
- `RUNTIME_NGINX_IMAGE`
- `RUNTIME_NETDATA_IMAGE`
- `RUNTIME_NETDATA_HOSTNAME`

---

## 5. Bootstrap Sekali Jalan

Bootstrap hanya dilakukan sekali untuk setup awal server.

Syarat:

1. workflow deploy sudah ada di `main`
2. image pertama sudah ter-publish ke GHCR
3. secrets dan variables GitHub sudah terisi
4. server sudah punya Docker + Compose
5. sertifikat TLS sudah tersedia di runtime path

Langkah:

1. buka tab **Actions**
2. pilih **Bootstrap runtime server**
3. klik **Run workflow**
4. isi:
   - `ref = main`
   - `start_stack = true`
5. jalankan

Setelah sukses, server siap menerima deploy otomatis berikutnya.

---

## 6. Flow Release Harian

### 6.1 Release frontend saja

```bash
git checkout main
git pull --ff-only origin main
git push origin main
git tag deploy-fe-v1.0.0
git push origin deploy-fe-v1.0.0
```

### 6.2 Release backend saja

```bash
git checkout main
git pull --ff-only origin main
git push origin main
git tag deploy-be-v1.0.0
git push origin deploy-be-v1.0.0
```

### 6.3 Release semua service aplikasi

```bash
git checkout main
git pull --ff-only origin main
git push origin main
git tag deploy-all-v1.0.0
git push origin deploy-all-v1.0.0
```

Urutan yang aman:

1. pastikan perubahan sudah ada di `main`
2. tunggu workflow **Publish container images** sukses
3. baru buat tag deploy

---

## 7. Format Tag Deploy

- `deploy-fe-vX.Y.Z`
- `deploy-be-vX.Y.Z`
- `deploy-all-vX.Y.Z`

Contoh:

```bash
git tag deploy-all-v1.2.3
git push origin deploy-all-v1.2.3
```

---

## 8. Deploy Manual Tanpa Tag

Jika perlu retry deploy atau deploy commit tertentu:

1. buka **Actions**
2. pilih workflow **Deploy by tag**
3. klik **Run workflow**
4. isi:
   - `target = fe`, `be`, atau `all`
   - `ref = main` atau SHA commit tertentu

Ini berguna untuk:

- retry deploy
- rollback ke commit lama
- deploy commit tertentu tanpa membuat tag baru

---

## 9. Verifikasi Setelah Deploy

### Dari GitHub

Pastikan workflow:

- **Publish container images** sukses
- **Deploy by tag** sukses

### Dari server

```bash
ssh adipras@103.93.161.172
cd /opt/tirta-saas/app
docker compose ps
```

### Health check

```bash
curl -fsS http://127.0.0.1/health
curl -kfsS --resolve tirtautama.net:443:127.0.0.1 https://tirtautama.net/health
```

---

## 10. Rollback

Rollback direkomendasikan lewat workflow manual.

Langkah:

1. cari SHA commit release sebelumnya yang masih ada di `main`
2. buka **Actions**
3. pilih **Deploy by tag**
4. isi:
   - `target = fe`, `be`, atau `all`
   - `ref = <sha_commit_lama>`

Alternatif:

```bash
git tag deploy-all-v1.2.2 <old_commit_sha>
git push origin deploy-all-v1.2.2
```

---

## 11. Runbook Insiden Aplikasi

Runbook ini dipakai saat alert dari monitoring platform atau Netdata menunjukkan gangguan aplikasi yang perlu respons operasional cepat.

### 11.1 Sumber sinyal utama

1. Halaman **Monitoring Platform** untuk `platform_owner`
2. Endpoint health:

```bash
curl -fsS http://127.0.0.1/health
curl -kfsS --resolve tirtautama.net:443:127.0.0.1 https://tirtautama.net/health
```

3. Netdata lokal:

```bash
docker compose --profile monitoring ps
curl -fsS http://127.0.0.1:19999/api/v1/info | head
```

4. Status container:

```bash
cd /opt/tirta-saas/app
docker compose ps
docker stats --no-stream
```

### 11.2 Langkah triage umum (5-15 menit pertama)

1. Catat waktu mulai insiden dan gejala utama: login gagal, API timeout, invoice gagal dibuat, email notifikasi gagal terkirim, atau UI blank.
2. Buka monitoring platform dan identifikasi alert paling tinggi (`critical` lebih dulu, lalu `warning`).
3. Jalankan health check dan `docker compose ps` untuk memastikan service yang terdampak.
4. Cek log backend dan nginx untuk 15 menit terakhir:

```bash
cd /opt/tirta-saas/app
docker compose logs --since 15m backend | tail -n 200
docker compose logs --since 15m nginx | tail -n 200
```

5. Jika indikasi gangguan database, cek juga:

```bash
docker compose logs --since 15m mysql | tail -n 200
```

6. Jika dampak meluas atau belum jelas dalam 15 menit, hentikan release/deploy baru dan masuk ke mode mitigasi.

### 11.3 Klasifikasi dan tindakan cepat

| Sinyal | Dampak umum | Langkah awal | Exit criteria |
|---|---|---|---|
| Health `degraded` / `unhealthy` | API tidak stabil atau gagal total | Cek `docker compose ps`, log backend/nginx, lalu restart service yang benar-benar gagal | `health` kembali sukses dan error baru berhenti muncul |
| Alert pool DB / wait count tinggi | Login lambat, invoice/report timeout | Cek log mysql, `docker stats`, dan query berat yang baru dijalankan; hentikan job manual besar bila perlu | Wait turun, API latensi membaik, timeout berhenti |
| Error rate / critical error melonjak | Banyak request 5xx | Identifikasi endpoint dominan dari log backend, rollback release terakhir jika baru terjadi setelah deploy | Error rate turun stabil dan endpoint kritis pulih |
| Memori / goroutine tinggi | Container restart, OOM, API stuck | Cek `docker stats`, log backend, lalu restart backend bila proses sudah stuck; siapkan rollback jika berulang | Memori/runtime turun dan tidak ada restart ulang |
| Email notifikasi gagal | Invoice/payment proof tetap jalan, tetapi email tidak terkirim | Verifikasi `SMTP_*` di `.env`, cek log backend, dan pastikan provider SMTP bisa dijangkau | Log delivery kembali `SENT` dan insiden komunikasi ditutup |

### 11.4 Playbook per jenis insiden

#### A. API / backend error tinggi

```bash
cd /opt/tirta-saas/app
docker compose logs --since 30m backend | tail -n 300
curl -fsS http://127.0.0.1/health
```

Tindakan:

1. Identifikasi endpoint atau flow yang gagal dari log.
2. Jika baru terjadi setelah release terakhir, lakukan rollback ke commit stabil sebelumnya lewat workflow **Deploy by tag** atau prosedur rollback manual pada Bagian 10.
3. Jika backend hanya hang sementara tanpa perubahan release, restart backend:

```bash
cd /opt/tirta-saas/app
docker compose restart backend
```

4. Validasi ulang login admin, `/health`, dan endpoint publik `/api/public/subscription-plans`.

#### B. Tekanan database / query backlog

```bash
cd /opt/tirta-saas/app
docker compose logs --since 30m mysql | tail -n 300
docker stats --no-stream
```

Tindakan:

1. Pastikan tidak ada import/generate besar yang sedang dijalankan berulang.
2. Jika host kehabisan resource, hentikan aktivitas manual non-kritis dan ulangi pengecekan setelah beban turun.
3. Jika mysql tidak sehat, restart service database hanya setelah backup terbaru tersedia dan tidak ada operasi maintenance lain yang berjalan:

```bash
cd /opt/tirta-saas/app
/opt/tirta-saas/scripts/backup.sh
docker compose restart mysql
```

4. Setelah pulih, cek kembali login, generate invoice, dan halaman report utama.

#### C. Email notifikasi gagal

Periksa konfigurasi:

```bash
cd /opt/tirta-saas/app
grep '^SMTP_' .env
docker compose logs --since 30m backend | grep -i smtp | tail -n 50
```

Tindakan:

1. Pastikan `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, dan `SMTP_FROM_NAME` terisi benar.
2. Jika kredensial berubah, update `.env` runtime lalu restart backend:

```bash
cd /opt/tirta-saas/app
docker compose restart backend
```

3. Catat bahwa notifikasi in-app tetap berjalan; insiden ini fokus pada channel email.

#### D. Frontend blank / deep-link publik gagal

```bash
cd /opt/tirta-saas/app
docker compose logs --since 30m frontend | tail -n 200
docker compose logs --since 30m nginx | tail -n 200
curl -I http://127.0.0.1/
curl -kI --resolve tirtautama.net:443:127.0.0.1 https://tirtautama.net/admin/login
curl -kI --resolve tirtautama.net:443:127.0.0.1 https://tirtautama.net/customer/login
```

Tindakan:

1. Pastikan container frontend dan nginx `Up`.
2. Jika hanya release frontend yang rusak, deploy ulang target frontend atau rollback ke release frontend stabil terakhir.
3. Jika nginx gagal start, periksa sertifikat dan konfigurasi domain sesuai Bagian 12.

### 11.5 Kapan rollback atau restore

- **Rollback release** jika gangguan mulai tepat setelah deploy dan penyebab mengarah ke perubahan aplikasi/frontend/backend.
- **Restart service** jika gangguan jelas bersifat transient dan tidak terkait perubahan release.
- **Restore database** hanya untuk insiden data korup/hilang yang tidak bisa dipulihkan lewat rollback aplikasi. Sebelum restore, wajib:
  1. hentikan write traffic / maintenance window,
  2. ambil backup terakhir,
  3. verifikasi file backup dengan `/opt/tirta-saas/scripts/restore-test.sh`,
  4. dokumentasikan titik waktu data yang dipulihkan.

### 11.6 Penutupan insiden

Sebelum insiden dinyatakan selesai:

1. Health check kembali hijau.
2. Alert `critical` terkait sudah hilang atau turun ke level aman.
3. Login admin/customer, endpoint publik, dan flow bisnis utama yang terdampak sudah dicoba ulang.
4. Catat akar masalah, tindakan, rollback/restart yang dilakukan, dan tindak lanjut pencegahan.

---

## 12. Troubleshooting Cepat

### Deploy gagal karena SSH

Periksa:

1. `DEPLOY_HOST`
2. `DEPLOY_PORT`
3. `DEPLOY_USER`
4. `DEPLOY_SSH_KEY`
5. `DEPLOY_KNOWN_HOSTS`

### Deploy gagal karena image belum ada

Periksa:

1. workflow publish image sudah sukses
2. commit target sudah ada di `main`
3. tag deploy dibuat setelah publish selesai

### Nginx gagal start

Periksa:

1. `RUNTIME_DOMAIN_NAME`
2. cert ada di `certs/live/<domain>/`
3. `fullchain.pem` dan `privkey.pem` valid

### Server tidak bisa pull GHCR

Jika package private:

1. isi `GHCR_USERNAME`
2. isi `GHCR_TOKEN`
3. pastikan token punya `read:packages`

---

## 13. Ringkasan Paling Singkat

### Setup sekali

1. pastikan server siap
2. isi GitHub secrets/variables
3. push repo ke `main`
4. tunggu publish image
5. jalankan bootstrap

### Release berikutnya

1. push perubahan ke `main`
2. tunggu image publish sukses
3. buat tag `deploy-fe-*`, `deploy-be-*`, atau `deploy-all-*`
4. push tag
5. selesai
