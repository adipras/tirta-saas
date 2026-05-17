# Checklist Progress Setup VPS Tirta SaaS (Docker)

Dokumen ini dipakai untuk tracking progres deploy production Tirta SaaS di VPS.

## Informasi Target

- **Public IP:** `103.93.161.172`
- **SSH User:** `adipras`
- **Metode Deploy:** Docker Compose
- **Stack:** Nginx + Frontend + Backend + MySQL (+ Redis opsional)

## Status Saat Ini

- **Phase 1:** Selesai
- **Phase 2:** Belum dimulai
- **Akses VPS:** Sudah berhasil via SSH key dari WSL

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
- [ ] SSH hardening aktif (`PermitRootLogin no`, `PasswordAuthentication no`)
- [ ] `fail2ban` aktif
- [ ] `unattended-upgrades` aktif
- [ ] MySQL tidak diexpose ke publik
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

- [ ] Docker repo official ditambahkan
- [ ] `docker-ce`, `docker-compose-plugin` terinstall
- [ ] User `adipras` masuk grup `docker`
- [ ] Struktur folder `/opt/tirta-saas` dibuat
- [ ] File `docker-compose.yml` dibuat
- [ ] File env dibuat:
  - [ ] `/opt/tirta-saas/.env`
  - [ ] `/opt/tirta-saas/env/backend.env`
  - [ ] `/opt/tirta-saas/env/frontend.env`
- [ ] `docker compose config` valid

**Cara dari terminal WSL:**

```bash
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker adipras
sudo mkdir -p /opt/tirta-saas/{nginx/conf.d,nginx/certs,nginx/www,env,backup,scripts}
sudo chown -R adipras:adipras /opt/tirta-saas
cd /opt/tirta-saas && docker compose config
```

**Status:** ⬜ Not Started / 🟨 In Progress / 🟩 Done  
**Catatan:** ...

---

## Phase 3 — Hardening

**Objective:** Menurunkan attack surface server.

- [ ] Backup config SSH dibuat
- [ ] SSH config hardening diterapkan
- [ ] `sshd -t` valid (tanpa error)
- [ ] `fail2ban` jail `sshd` aktif
- [ ] `unattended-upgrades` aktif otomatis
- [ ] Root login dipastikan nonaktif
- [ ] Password auth dipastikan nonaktif

**Cara dari terminal WSL:**

```bash
ssh -i ~/.ssh/adipras adipras@103.93.161.172
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

**Status:** ⬜ Not Started / 🟨 In Progress / 🟩 Done  
**Catatan:** ...

---

## Phase 4 — Services & Reverse Proxy

**Objective:** Menjalankan service Tirta SaaS lewat Nginx reverse proxy.

- [ ] Konfigurasi Nginx dibuat (`tirta.conf`)
- [ ] Image backend dibuild/pull
- [ ] Image frontend dibuild/pull
- [ ] `docker compose up -d` sukses
- [ ] Health check backend endpoint valid
- [ ] Jalur tanpa domain (HTTP via IP) dites
- [ ] Jalur dengan domain + TLS (Let’s Encrypt) disiapkan
- [ ] HTTPS aktif tanpa error sertifikat (jika domain sudah ada)

**Cara dari terminal WSL:**

```bash
# 1) Kirim file dari WSL ke VPS (jalankan dari folder project lokal)
scp -i ~/.ssh/adipras docker-compose.yml adipras@103.93.161.172:/opt/tirta-saas/
scp -i ~/.ssh/adipras -r nginx env adipras@103.93.161.172:/opt/tirta-saas/

# 2) Jalankan stack di VPS
ssh -i ~/.ssh/adipras adipras@103.93.161.172
cd /opt/tirta-saas
docker compose --env-file .env up -d
docker compose ps

# 3) Uji dari WSL lokal
curl -I http://103.93.161.172
```

**Status:** ⬜ Not Started / 🟨 In Progress / 🟩 Done  
**Catatan:** ...

---

## Phase 5 — Monitoring & Logging

**Objective:** Visibilitas kesehatan server dan kontrol pertumbuhan log.

- [ ] Monitoring terpasang (Netdata / alternatif)
- [ ] Akses monitoring dibatasi (IP allowlist/firewall)
- [ ] Logging Docker dibatasi (`max-size`, `max-file`)
- [ ] Logrotate backup aktif
- [ ] Alert dasar (disk/cpu/memory) ditetapkan

**Cara dari terminal WSL:**

```bash
ssh -i ~/.ssh/adipras adipras@103.93.161.172
docker run -d --name=netdata --restart unless-stopped -p 19999:19999 netdata/netdata
sudo ufw allow from <IP_KAMU> to any port 19999 proto tcp
sudo tee /etc/logrotate.d/tirta-backup > /dev/null << 'EOF'
/opt/tirta-saas/backup/*.sql.gz {
  daily
  rotate 14
  compress
  missingok
  notifempty
  copytruncate
}
EOF
```

**Status:** ⬜ Not Started / 🟨 In Progress / 🟩 Done  
**Catatan:** ...

---

## Phase 6 — Backup, Restore, Maintenance

**Objective:** Menjamin recovery dan operasional harian aman.

- [ ] Script backup database dibuat
- [ ] Cron backup harian aktif
- [ ] Retensi backup diterapkan
- [ ] Restore test berhasil (wajib)
- [ ] SOP update deploy dibuat
- [ ] SOP rollback dibuat dan dites
- [ ] Kredensial disimpan aman (bukan di repo publik)

**Cara dari terminal WSL:**

```bash
ssh -i ~/.ssh/adipras adipras@103.93.161.172
cat > /opt/tirta-saas/scripts/backup.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%F-%H%M)
BACKUP_DIR="/opt/tirta-saas/backup"
mkdir -p "$BACKUP_DIR"
source /opt/tirta-saas/.env
docker exec tirta-mysql sh -c "mysqldump -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE}" | gzip > "${BACKUP_DIR}/db-${TS}.sql.gz"
find "$BACKUP_DIR" -type f -mtime +14 -delete
EOF
chmod +x /opt/tirta-saas/scripts/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/tirta-saas/scripts/backup.sh >> /opt/tirta-saas/backup/backup.log 2>&1") | crontab -
```

**Status:** ⬜ Not Started / 🟨 In Progress / 🟩 Done  
**Catatan:** ...

---

## Ringkasan Progress

- [ ] Pre-Setup selesai
- [ ] Core Setup selesai
- [ ] Hardening selesai
- [ ] Services live
- [ ] Monitoring aktif
- [ ] Backup-restore tervalidasi
- [ ] Dokumen operasional final

**Overall Progress:** `0%`  
**PIC:** ...  
**Tanggal mulai:** ...  
**Target go-live:** ...
