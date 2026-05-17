# Step by Step Sync Repo ke VPS

Dokumen ini menjelaskan alur kerja dari direktori `D:` sampai repo bisa dipakai di VPS.

## Target Workflow

1. Kerja di repo lokal pada `D:\Android\workspace\tirta-saas`
2. Commit perubahan ke Git
3. Push ke remote Git
4. Pull repo di WSL
5. Sinkronkan repo ke VPS
6. Jalankan ulang stack Docker di VPS

---

## A. Commit dari direktori D:

Jalankan dari PowerShell:

```bash
cd D:\Android\workspace\tirta-saas
git status
git add .
git commit -m "Prepare VPS docker deployment"
```

Jika ada file yang tidak ingin ikut commit, ganti `git add .` dengan file yang spesifik.

---

## B. Push ke Git remote

```bash
git push origin main
```

Jika branch aktif bukan `main`, gunakan branch yang sedang dipakai.

---

## C. Pull di repo WSL

Di WSL:

```bash
cd ~/workspace/tirta-saas
git pull origin main
```

Kalau repo belum ada di WSL:

```bash
mkdir -p ~/workspace
cd ~/workspace
git clone <URL_REPO_GIT> tirta-saas
cd tirta-saas
```

---

## D. Sinkron ke VPS

### Opsi yang direkomendasikan: Git pull di VPS

Masuk ke VPS:

```bash
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
```

Jika repo belum ada di VPS:

```bash
sudo mkdir -p /opt/tirta-saas
sudo chown -R adipras:adipras /opt/tirta-saas
cd /opt
git clone <URL_REPO_GIT> tirta-saas
```

Kalau repo sudah ada:

```bash
cd /opt/tirta-saas
git pull origin main
```

### Opsi fallback: rsync dari WSL ke VPS

```bash
rsync -av --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  ~/workspace/tirta-saas/ \
  adipras@103.93.161.172:/opt/tirta-saas/
```

---

## E. Siapkan environment di VPS

```bash
cd /opt/tirta-saas
cp .env.example .env
nano .env
```

Isi minimal:

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `JWT_SECRET`

---

## F. Jalankan Docker di VPS

```bash
cd /opt/tirta-saas
docker compose config
docker compose up -d --build
docker compose ps
```

Verifikasi:

```bash
curl http://127.0.0.1/health
```

---

## G. Alur update berikutnya

Kalau ada perubahan baru:

1. Edit file di `D:`
2. `git add`, `git commit`, `git push`
3. Di WSL: `git pull`
4. Di VPS: `git pull`
5. Jalankan:

```bash
docker compose up -d --build
```

---

## Catatan penting

- Jangan commit file `.env`
- Gunakan key SSH yang benar: `~/.ssh/adipras_id_ed25519`
- Jika repo di VPS memakai GitHub private repo, pastikan VPS punya akses SSH key atau token

