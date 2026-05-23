# Panduan Deploy Tirta SaaS

**Version:** 3.0  
**Last Updated:** May 23, 2026  
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

## 11. Troubleshooting Cepat

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

## 12. Ringkasan Paling Singkat

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
