# Checklist Progress Setup VPS Tirta SaaS (Docker)

> **Catatan historis:** Checklist ini dibuat saat deploy production masih memakai model **repo berada di VPS** dan service dibuild langsung di server.
>
> Model deploy resmi sekarang adalah **runtime bundle + GHCR images + GitHub Actions over SSH**.
>
> Gunakan checklist ini hanya untuk hardening/infrastruktur server. Untuk alur deploy aktif, lihat `DEPLOYMENT_USER_MANUAL.md`.

Dokumen ini dipakai untuk tracking progres deploy production Tirta SaaS di VPS.

## Informasi Target

- **Public IP:** `103.93.161.172`
- **SSH User:** `adipras`
- **Metode Deploy:** Docker Compose
- **Stack:** Nginx + Frontend + Backend + MySQL (+ Redis opsional)

## Status Saat Ini

- **Phase 1:** Selesai
- **Phase 2:** Selesai
- **Phase 3:** Selesai
- **Phase 4:** Selesai
- **Phase 5:** Selesai
- **Phase 6:** In Progress
- **Akses VPS:** Terganggu sementara — SSH timeout sejak uji rollback/build berat
- **Deploy Docker:** Berhasil jalan di `/opt/tirta-saas/app`
- **HTTP Publik:** timeout saat pengecekan terakhir
- **HTTPS Publik:** timeout saat pengecekan terakhir
- **Catatan:** Monitoring Netdata, rotasi log Docker, backup harian, dan restore test sebelumnya sudah aktif. Namun status operasional VPS per pengecekan terakhir masih terganggu setelah uji rollback/build berat, sehingga verifikasi final Phase 6 masih tertunda.

## Prasyarat dari Mesin Lokal (WSL)

- [x] WSL sudah terinstall (Ubuntu/Debian)
- [x] Private key SSH tersedia di WSL (contoh: `~/.ssh/adipras_id_ed25519`)
- [x] Permission key benar (`chmod 600 ~/.ssh/adipras_id_ed25519`)
- [x] Bisa login ke VPS dari WSL:

```bash
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
```

---

## Critical First Steps (Wajib sebelum trafik publik)

- [x] Login SSH pakai key pair (tanpa password)
- [x] Pastikan user non-root punya sudo
- [x] UFW aktif: hanya `22`, `80`, `443`
- [x] SSH hardening aktif (`PermitRootLogin no`, `PasswordAuthentication no`)
- [x] `fail2ban` aktif
- [x] `unattended-upgrades` aktif
- [x] MySQL tidak diexpose ke publik
- [x] Verifikasi bisa login SSH dari terminal kedua sebelum restart SSH service

**Cara dari terminal WSL:**

```bash
# Terminal WSL 1
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172

# Terminal WSL 2 (uji koneksi sebelum tutup session 1)
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
```

---

## Phase 1 — Pre-Setup

**Objective:** Baseline server aman dan siap install dependency.

- [ ] `apt update && apt upgrade` selesai
- [x] Paket dasar terinstall (`ufw`, `fail2ban`, `git`, dll)
- [x] Timezone server di-set `Asia/Jakarta`
- [x] UFW rule dibuat dan aktif
- [x] Verifikasi `ufw status verbose` sesuai ekspektasi

**Cara dari terminal WSL:**

```bash
ssh -i ~/.ssh/adipras_id_ed25519 -o IdentitiesOnly=yes -v adipras@103.93.161.172
sudo apt update && sudo apt -y upgrade
sudo apt -y install ca-certificates curl gnupg lsb-release ufw fail2ban unattended-upgrades apt-transport-https git
sudo timedatectl set-timezone Asia/Jakarta
sudo ufw default deny incoming && sudo ufw default allow outgoing
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

**Catatan saat `apt upgrade`:** jika muncul prompt `cloud.cfg`, pilih **`N`** / **keep current version** agar konfigurasi cloud-init yang aktif tidak tertimpa.

**Kondisi saat ini:**

- `apt update && apt upgrade` sudah selesai
- Firewall UFW sudah aktif dengan rule `22`, `80`, `443`
- SSH login via key sudah berhasil dari WSL
- Menunggu lanjut ke Phase 2: install Docker

**Status:** 🟩 Done  
**Catatan:** Phase 1 selesai; lanjut ke Docker install pada Phase 2.

---

## Phase 2 — Core Setup (Docker)

**Objective:** Docker Engine + Compose siap untuk production deployment.

- [x] Docker repo official ditambahkan
- [x] `docker-ce`, `docker-compose-plugin` terinstall
- [x] User `adipras` masuk grup `docker`
- [x] Struktur folder `/opt/tirta-saas` dibuat
- [x] Repo aplikasi diclone ke `/opt/tirta-saas/app`
- [x] File `docker-compose.yml` tersedia dari repo aplikasi
- [ ] File env dibuat:
  - [x] `/opt/tirta-saas/app/.env`
  - [ ] `/opt/tirta-saas/env/backend.env` (opsional, tidak dipakai compose saat ini)
  - [ ] `/opt/tirta-saas/env/frontend.env` (opsional, tidak dipakai compose saat ini)
- [x] `docker compose config` valid

**Cara dari terminal WSL:**

```bash
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker adipras
sudo mkdir -p /opt/tirta-saas/{env,backup,scripts}
sudo chown -R adipras:adipras /opt/tirta-saas
cd /opt/tirta-saas
git clone <URL_REPO_GIT> app
cd /opt/tirta-saas/app && docker compose config
```

**Status:** 🟩 Done  
**Catatan:** Docker dan Compose aktif; source code dideploy dari repo Git di `/opt/tirta-saas/app`.

---

## Phase 3 — Hardening

**Objective:** Menurunkan attack surface server.

- [x] Backup config SSH dibuat
- [x] SSH config hardening diterapkan
- [x] `sshd -t` valid (tanpa error)
- [x] `fail2ban` jail `sshd` aktif
- [x] `unattended-upgrades` aktif otomatis
- [x] Root login dipastikan nonaktif
- [x] Password auth dipastikan nonaktif

**Cara dari terminal WSL:**

```bash
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudo nano /etc/ssh/sshd_config
# pastikan minimal:
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes

sudo sshd -t && sudo systemctl reload ssh
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[sshd]
enabled = true
port = 22
maxretry = 5
findtime = 10m
bantime = 1h
EOF
sudo systemctl enable --now fail2ban
sudo dpkg-reconfigure -plow unattended-upgrades
```

**Status:** 🟩 Done  
**Catatan:** Hardening diterapkan lewat drop-in `/etc/ssh/sshd_config.d/99-tirta-hardening.conf`; hasil efektif `PermitRootLogin no`, `PasswordAuthentication no`, `PubkeyAuthentication yes`. `fail2ban` dan `unattended-upgrades` juga sudah aktif.

---

## Phase 4 — Services & Reverse Proxy

**Objective:** Menjalankan service Tirta SaaS lewat Nginx reverse proxy.

- [x] Konfigurasi Nginx dibuat (`tirta.conf`)
- [x] Image backend dibuild/pull
- [x] Image frontend dibuild/pull
- [x] `docker compose up -d` sukses
- [x] Health check backend endpoint valid
- [x] Jalur tanpa domain (HTTP via IP) dites
- [x] Jalur dengan domain (HTTP) aktif
- [x] Jalur dengan domain + TLS (Let’s Encrypt) disiapkan
- [x] HTTPS aktif tanpa error sertifikat (jika domain sudah ada)

**Cara dari terminal WSL:**

```bash
# 1) Update source code di VPS
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
cd /opt/tirta-saas/app
git pull origin main

# 2) Jalankan stack di VPS
cp .env.example .env   # jika belum ada
docker compose up -d --build
docker compose ps

# 3) Uji dari WSL lokal
curl -I http://103.93.161.172
curl -I http://tirtautama.net
```

**Status:** 🟩 Done  
**Catatan:** HTTPS aktif dengan sertifikat Let's Encrypt untuk `tirtautama.net`. Redirect HTTP -> HTTPS aktif. Renewal otomatis dipasang via cron `17 3 * * * /opt/tirta-saas/scripts/renew-letsencrypt.sh`.

---

## Phase 5 — Monitoring & Logging

**Objective:** Visibilitas kesehatan server dan kontrol pertumbuhan log.

- [x] Monitoring terpasang (Netdata / alternatif)
- [x] Akses monitoring dibatasi (IP allowlist/firewall)
- [x] Logging Docker dibatasi (`max-size`, `max-file`)
- [x] Logrotate backup aktif
- [x] Alert dasar (disk/cpu/memory) ditetapkan

**Cara dari terminal WSL:**

```bash
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
cd /opt/tirta-saas/app
docker compose up -d netdata
curl http://127.0.0.1:19999/api/v1/info

# akses dashboard dari laptop via SSH tunnel
ssh -L 19999:127.0.0.1:19999 -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
# lalu buka http://127.0.0.1:19999 di browser lokal

sudo tee /etc/logrotate.d/tirta-backup > /dev/null << 'EOF'
/opt/tirta-saas/backup/*.log /opt/tirta-saas/backup/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
  copytruncate
  su adipras adipras
}
EOF
```

**Status:** 🟩 Done  
**Catatan:** Netdata aktif sebagai container `tirta-netdata` dan dibind ke `127.0.0.1:19999`, jadi tidak terbuka ke internet publik. Semua container production (`tirta-mysql`, `tirta-backend`, `tirta-frontend`, `tirta-nginx`, `tirta-netdata`) sudah memakai rotasi log Docker `max-size=10m`, `max-file=5`. Logrotate backup dipasang di `/etc/logrotate.d/tirta-backup`. Alert dasar tersedia dari Netdata default alarms, terverifikasi untuk `system.cpu`, `system.load`, dan `system.ram`.

---

## Phase 6 — Backup, Restore, Maintenance

**Objective:** Menjamin recovery dan operasional harian aman.

- [x] Script backup database dibuat
- [x] Cron backup harian aktif
- [x] Retensi backup diterapkan
- [x] Restore test berhasil (wajib)
- [x] SOP update deploy dibuat
- [ ] SOP rollback manual dibuat dan dites
- [x] Kredensial disimpan aman (bukan di repo publik)

**Cara dari terminal WSL:**

```bash
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
cd /opt/tirta-saas/app
install -m 750 deploy/scripts/backup.sh /opt/tirta-saas/scripts/backup.sh
install -m 750 deploy/scripts/restore-test.sh /opt/tirta-saas/scripts/restore-test.sh
install -m 750 deploy/scripts/capture-release.sh /opt/tirta-saas/scripts/capture-release.sh
install -m 750 deploy/scripts/deploy-update.sh /opt/tirta-saas/scripts/deploy-update.sh
install -m 750 deploy/scripts/rollback.sh /opt/tirta-saas/scripts/rollback.sh
sudo install -m 644 deploy/logrotate/tirta-backup.conf /etc/logrotate.d/tirta-backup
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/tirta-saas/scripts/backup.sh >> /opt/tirta-saas/backup/backup.log 2>&1") | crontab -
/opt/tirta-saas/scripts/backup.sh
/opt/tirta-saas/scripts/restore-test.sh
crontab -l
```

**Status:** 🟨 In Progress  
**Catatan:** Backup script aktif di `/opt/tirta-saas/scripts/backup.sh` dengan retensi `14` hari dan cron harian `0 2 * * *`. Restore test sebelumnya berhasil menggunakan database sementara dengan hasil `39` tabel ter-restore, lalu database uji dibersihkan kembali. SOP update deploy tersedia di `/opt/tirta-saas/scripts/deploy-update.sh`. Untuk VPS kecil 2 GB RAM, rollback automation tidak dijadikan jalur utama karena build frontend/backend di server yang sama berisiko membuat host overload; jalur resmi yang dipakai adalah rollback manual saat maintenance window. Kredensial tetap hanya dibaca dari `/opt/tirta-saas/app/.env`, tidak dipindahkan ke repo.

### User Manual — Rollback Manual (VPS 2 GB RAM)

**Tujuan:** Mengembalikan aplikasi ke commit stabil sebelumnya tanpa mengandalkan rollback automation penuh di VPS kecil.

**Kapan dipakai:**
- Deploy terbaru membuat aplikasi error / login gagal / halaman blank
- Service masih bisa diakses via SSH
- Tidak ada runner/CI lain yang siap build image pengganti

**Prinsip operasional:**
1. Lakukan rollback saat maintenance window.
2. Backup database sebelum ubah source code atau restart service.
3. Bangun image **bertahap**, jangan `docker compose up -d --build` sekaligus di VPS 2 GB.
4. Jika memory ketat, aktifkan swap sementara sebelum build.

**Langkah rollback manual:**

```bash
# 0) Login ke VPS
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
cd /opt/tirta-saas/app

# 1) Backup database dulu
/opt/tirta-saas/scripts/backup.sh

# 2) Catat versi aktif saat ini
git rev-parse --short HEAD
git --no-pager log --oneline -5

# 3) (Opsional tapi direkomendasikan) aktifkan swap sementara 4 GB
sudo fallocate -l 4G /swapfile.rollback
sudo chmod 600 /swapfile.rollback
sudo mkswap /swapfile.rollback
sudo swapon /swapfile.rollback
free -h

# 4) Ambil update git dan pilih commit stabil tujuan rollback
git fetch --all --tags
git --no-pager log --oneline --decorate -10
git checkout <COMMIT_STABIL>

# 5) Build dan restart backend lebih dulu
docker compose build backend
docker compose up -d backend
curl -fsS http://127.0.0.1:8081/health

# 6) Build dan restart frontend
docker compose build frontend
docker compose up -d frontend

# 7) Reload Nginx / pastikan reverse proxy ikut jalan
docker compose up -d nginx
docker compose ps

# 8) Verifikasi dari VPS
wget --no-check-certificate --header="Host: tirtautama.net" -qO- https://127.0.0.1/health >/dev/null && echo health-ok

# 9) Jika aplikasi normal, matikan swap sementara
sudo swapoff /swapfile.rollback
sudo rm -f /swapfile.rollback
free -h
```

**Kalau rollback gagal:**
1. Jangan lanjut build berulang-ulang.
2. Kembalikan ke commit yang tadi dicatat di langkah 2:

```bash
git checkout <COMMIT_SEBELUM_ROLLBACK>
docker compose build backend
docker compose up -d backend
docker compose build frontend
docker compose up -d frontend nginx
```

3. Cek log service yang gagal:

```bash
docker logs --tail 100 tirta-backend
docker logs --tail 100 tirta-frontend
docker logs --tail 100 tirta-nginx
```

**Catatan penting:**
- Hindari `docker compose up -d --build` untuk semua service sekaligus di VPS 2 GB.
- Jika rollback butuh cepat dan host sangat sempit, prioritaskan `backend` dulu untuk memulihkan API/health check, lalu lanjut `frontend`.
- Setelah insiden selesai, kembalikan branch ke `main` atau commit target operasional yang benar agar deploy berikutnya tidak salah basis.

---

## Ringkasan Progress

- [x] Pre-Setup selesai
- [x] Core Setup selesai
- [x] Hardening selesai
- [ ] Services live
- [x] Monitoring aktif
- [x] Backup-restore tervalidasi
- [ ] Dokumen operasional final

**Overall Progress:** `90%`  
**PIC:** `adipras`  
**Tanggal mulai:** `2026-05-17`  
**Target go-live:** ...
