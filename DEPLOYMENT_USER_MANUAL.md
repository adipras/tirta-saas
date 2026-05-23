# Panduan Deploy Otomatis Tirta SaaS

**Version:** 1.0  
**Last Updated:** May 23, 2026  
**Status:** Aktif  
**Target:** GitHub Actions + GHCR + SSH runtime deploy

---

## 1. Tujuan Panduan

Panduan ini dipakai agar alur deploy production menjadi:

1. Push perubahan ke `main`
2. GitHub Actions build image backend dan frontend
3. Image dipublish ke GHCR
4. Buat tag deploy
5. GitHub Actions otomatis update server

Server **tidak perlu menyimpan source code repository**. Server hanya menyimpan runtime bundle, file `.env`, volume Docker, dan sertifikat TLS.

---

## 2. Gambaran Arsitektur Deploy

```text
GitHub Repository
  ├─ push ke main
  │   └─ publish-images.yml
  │      └─ push image ke GHCR
  │
  └─ push tag deploy-*
      └─ deploy-by-tag.yml
         ├─ upload runtime bundle ke server
         ├─ render .env dari GitHub Secrets/Variables
         ├─ docker compose pull
         └─ docker compose up -d
```

Runtime di server ada di folder seperti:

```bash
/opt/tirta-runtime
```

Jika Anda sedang migrasi dari server lama yang sebelumnya memakai repo langsung di VPS, Anda bisa sementara memakai path runtime lama agar perpindahan lebih aman, misalnya:

```bash
/opt/tirta-saas/app
```

Isi utamanya:

- `docker-compose.yml`
- `.env`
- `render-env.sh`
- `nginx/default.conf.template`
- `certs/`
- `www/`

---

## 3. Yang Perlu Disiapkan Sekali Saja

### 3.1 Di server

Pastikan server sudah punya:

1. Linux server/VPS
2. Docker Engine
3. Docker Compose Plugin
4. User SSH non-root
5. Domain yang mengarah ke server
6. Sertifikat TLS di folder runtime

Contoh install Docker di Ubuntu:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Lalu logout/login ulang, lalu cek:

```bash
docker --version
docker compose version
```

### 3.2 Struktur folder runtime di server

Jalankan:

```bash
sudo mkdir -p /opt/tirta-runtime
sudo chown -R $USER:$USER /opt/tirta-runtime
mkdir -p /opt/tirta-runtime/certs /opt/tirta-runtime/www
```

**Catatan migrasi:** untuk server production yang sudah berjalan, `DEPLOY_PATH` awal bisa tetap memakai path lama seperti `/opt/tirta-saas/app` agar volume, network, dan data yang sudah ada tetap dipakai saat transisi.

### 3.3 Sertifikat TLS

Letakkan sertifikat di:

```bash
/opt/tirta-runtime/certs/live/<domain>/fullchain.pem
/opt/tirta-runtime/certs/live/<domain>/privkey.pem
```

Contoh:

```bash
/opt/tirta-runtime/certs/live/tirtautama.net/fullchain.pem
/opt/tirta-runtime/certs/live/tirtautama.net/privkey.pem
```

---

## 4. Setup SSH untuk GitHub Actions

### 4.1 Buat key khusus deploy

Di komputer lokal:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/tirta_github_actions
```

Hasilnya:

- private key: `~/.ssh/tirta_github_actions`
- public key: `~/.ssh/tirta_github_actions.pub`

### 4.2 Pasang public key ke server

Tambahkan isi file `.pub` ke:

```bash
~/.ssh/authorized_keys
```

Contoh:

```bash
cat ~/.ssh/tirta_github_actions.pub
```

Lalu copy ke server.

### 4.3 Ambil known_hosts

Di lokal:

```bash
ssh-keyscan -p 22 your-server-domain-or-ip
```

Simpan output ini untuk secret `DEPLOY_KNOWN_HOSTS`.

---

## 5. Setup GitHub Repository

Buka:

```text
Settings > Secrets and variables > Actions
```

### 5.1 Secrets yang wajib

Tambahkan:

| Secret | Isi |
|---|---|
| `DEPLOY_HOST` | IP atau domain server |
| `DEPLOY_PORT` | Port SSH, misalnya `22` |
| `DEPLOY_USER` | User SSH di server |
| `DEPLOY_PATH` | Path runtime, misalnya `/opt/tirta-runtime` atau `/opt/tirta-saas/app` saat migrasi |
| `DEPLOY_SSH_KEY` | Isi private key `~/.ssh/tirta_github_actions` |
| `DEPLOY_KNOWN_HOSTS` | Output `ssh-keyscan` |
| `RUNTIME_MYSQL_ROOT_PASSWORD` | Password root MySQL |
| `RUNTIME_MYSQL_PASSWORD` | Password user aplikasi MySQL |
| `RUNTIME_JWT_SECRET` | JWT secret production |

### 5.2 Secrets tambahan jika GHCR private

Tambahkan:

| Secret | Isi |
|---|---|
| `GHCR_USERNAME` | Username GitHub |
| `GHCR_TOKEN` | Personal Access Token dengan `read:packages` |

Jika package GHCR dibuat **public**, dua secret ini tidak wajib.

### 5.3 Variables yang wajib

Tambahkan:

| Variable | Contoh |
|---|---|
| `RUNTIME_DOMAIN_NAME` | `tirtautama.net` |
| `RUNTIME_MYSQL_DATABASE` | `tirta_saas` |
| `RUNTIME_MYSQL_USER` | `tirta` |
| `RUNTIME_AUTO_SEED_ADMIN` | `false` |
| `RUNTIME_ENABLE_INVOICE_SCHEDULER` | `true` |
| `RUNTIME_ENABLE_TRIAL_SCHEDULER` | `true` |

### 5.4 Variables opsional

| Variable | Default |
|---|---|
| `RUNTIME_MYSQL_IMAGE` | `mysql:8.0` |
| `RUNTIME_NGINX_IMAGE` | `nginx:1.27-alpine` |
| `RUNTIME_NETDATA_IMAGE` | `netdata/netdata:stable` |
| `RUNTIME_NETDATA_HOSTNAME` | `tirta-vps` |

---

## 6. Publish Image Pertama

Sebelum bootstrap server, pastikan image sudah ter-publish.

Jalankan:

```bash
git checkout main
git pull --ff-only origin main
git push origin main
```

Lalu cek tab **Actions**:

- workflow `Publish container images` harus sukses

Image yang akan ter-publish:

- `ghcr.io/adipras/tirta-saas-backend`
- `ghcr.io/adipras/tirta-saas-frontend`

---

## 7. Bootstrap Server Sekali Jalan

Setelah secrets dan variables siap:

1. Buka tab **Actions**
2. Pilih workflow **Bootstrap runtime server**
3. Klik **Run workflow**
4. Isi:
   - `ref = main`
   - `start_stack = true`
5. Jalankan workflow

Workflow ini akan:

1. ambil commit dari `main`
2. cari image `sha-<shortsha>` di GHCR
3. upload runtime bundle ke server
4. render file `.env` di server
5. login ke GHCR bila dibutuhkan
6. jalankan `docker compose pull`
7. jalankan `docker compose up -d`

Jika sukses, server sudah siap untuk deploy otomatis berikutnya.

---

## 8. Deploy Harian

### 8.1 Deploy frontend saja

```bash
git checkout main
git pull --ff-only origin main
git tag deploy-fe-v1.0.0
git push origin deploy-fe-v1.0.0
```

### 8.2 Deploy backend saja

```bash
git checkout main
git pull --ff-only origin main
git tag deploy-be-v1.0.0
git push origin deploy-be-v1.0.0
```

### 8.3 Deploy semua service aplikasi

```bash
git checkout main
git pull --ff-only origin main
git tag deploy-all-v1.0.0
git push origin deploy-all-v1.0.0
```

Workflow akan:

1. pastikan commit tag ada di `origin/main`
2. tunggu image immutable `sha-<shortsha>` tersedia
3. upload runtime bundle terbaru
4. render ulang `.env`
5. update service yang dipilih

---

## 9. Deploy Manual Tanpa Tag

Kalau perlu deploy manual:

1. Buka **Actions**
2. Pilih workflow **Deploy by tag**
3. Klik **Run workflow**
4. Isi:
   - `target = fe`, `be`, atau `all`
   - `ref = main` atau SHA commit tertentu

Ini berguna untuk:

- retry deploy
- deploy commit tertentu di `main`
- deploy tanpa membuat tag baru

---

## 10. Checklist Verifikasi Setelah Bootstrap

Masuk ke server:

```bash
ssh user@server
cd /opt/tirta-runtime
docker compose ps
```

Cek:

1. container `mysql` running
2. container `backend` running
3. container `frontend` running
4. container `nginx` running

Tes endpoint:

```bash
curl http://127.0.0.1
curl http://127.0.0.1/health
```

Jika TLS sudah aktif:

```bash
curl -I https://your-domain
curl -I https://your-domain/health
```

---

## 11. Troubleshooting

### 11.1 Workflow deploy gagal karena SSH

Periksa:

1. `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`
2. `DEPLOY_SSH_KEY` benar
3. public key sudah masuk `authorized_keys`
4. `DEPLOY_KNOWN_HOSTS` benar

### 11.2 Workflow gagal karena image tidak ditemukan

Periksa:

1. workflow `Publish container images` sukses
2. commit target memang sudah ada di `main`
3. tag deploy dibuat setelah image berhasil dipublish

### 11.3 Server gagal pull image GHCR

Jika package private:

1. pastikan `GHCR_USERNAME` dan `GHCR_TOKEN` sudah benar
2. token punya scope `read:packages`

### 11.4 Nginx gagal start

Periksa:

1. `RUNTIME_DOMAIN_NAME` benar
2. file sertifikat ada di `${DEPLOY_PATH}/certs/live/<domain>/`
3. `fullchain.pem` dan `privkey.pem` readable oleh container

### 11.5 Aplikasi hidup tapi frontend tidak bisa akses API

Periksa:

1. `RUNTIME_DOMAIN_NAME` benar
2. `nginx` ikut restart saat deploy frontend
3. backend sehat di `/health`

---

## 12. Ringkasan Rutinitas

### Setup sekali

1. siapkan server
2. siapkan SSH key
3. isi GitHub secrets dan variables
4. push ke `main`
5. jalankan **Bootstrap runtime server**

### Deploy berikutnya

1. push perubahan ke `main`
2. tunggu workflow publish image sukses
3. buat tag deploy
4. push tag
5. GitHub Actions deploy otomatis
