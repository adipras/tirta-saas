# Platform Admin Seeding Guide

## Overview
Panduan untuk membuat Platform Admin user pada sistem Tirta SaaS.

## 📌 Metode Seeding

### 1️⃣ Auto-Seed saat Startup (Recommended for Development)

Platform Admin akan otomatis dibuat saat aplikasi startup jika belum ada.

**Setup:**
```bash
# Edit .env file
AUTO_SEED_ADMIN=true
```

**Jalankan aplikasi:**
```bash
go run main.go
```

**Default Credentials:**
- **Email:** `admin@tirtasaas.com`
- **Password:** `Admin123!@#`
- **Role:** Platform Admin

⚠️ **PENTING:** Ubah password segera setelah login pertama kali!

---

### 2️⃣ Manual Seeding via Script

Untuk membuat Platform Admin secara manual.

#### A. Menggunakan Default Credentials

```bash
cd scripts
go run seed_admin.go --default
```

#### B. Menggunakan Custom Credentials

```bash
cd scripts
go run seed_admin.go \
  --email="your.email@example.com" \
  --password="YourSecurePassword123!" \
  --firstname="John" \
  --lastname="Doe"
```

**Parameter:**
- `--email` : Email admin (default: admin@tirtasaas.com)
- `--password` : Password admin (default: Admin123!@#)
- `--firstname` : Nama depan (default: Platform)
- `--lastname` : Nama belakang (default: Administrator)
- `--default` : Gunakan kredensial default

---

## 🔐 Security Best Practices

### Production Environment

**JANGAN gunakan auto-seed di production!**

```bash
# .env production
AUTO_SEED_ADMIN=false
```

**Langkah Setup Production:**

1. **Disable auto-seed:**
   ```bash
   AUTO_SEED_ADMIN=false
   ```

2. **Seed manual dengan password kuat:**
   ```bash
   cd scripts
   go run seed_admin.go \
     --email="admin@yourcompany.com" \
     --password="$(openssl rand -base64 32)" \
     --firstname="Admin" \
     --lastname="User"
   ```

3. **Simpan kredensial di password manager**

4. **Login dan ubah password:**
   - Login menggunakan kredensial yang dibuat
   - Segera ubah password via profile settings
   - Enable 2FA jika tersedia

5. **Revoke temporary credentials:**
   - Hapus script seeding dari server production
   - Jangan commit kredensial ke git

---

## 🧪 Testing Seeding

### Test Seeder Function

```go
// test_seeder.go
package main

import (
    "log"
    "github.com/adipras/tirta-saas-backend/config"
    "github.com/adipras/tirta-saas-backend/pkg/seeder"
    "github.com/joho/godotenv"
)

func main() {
    godotenv.Load()
    config.ConnectDB()
    
    err := seeder.SeedDefaultPlatformAdmin()
    if err != nil {
        log.Fatal(err)
    }
    
    log.Println("✅ Seeding successful!")
}
```

---

## 📊 Verify Admin Creation

### Method 1: Check Database

```sql
-- MySQL
SELECT id, email, first_name, last_name, role, is_active, email_verified, created_at
FROM platform_users
WHERE role = 'platform_admin';
```

### Method 2: Check via API

```bash
# Login with seeded credentials
curl -X POST http://localhost:8081/api/v1/auth/platform/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tirtasaas.com",
    "password": "Admin123!@#"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@tirtasaas.com",
      "role": "platform_admin",
      "firstName": "Platform",
      "lastName": "Administrator"
    }
  }
}
```

---

## 🛠️ Troubleshooting

### Error: "Admin already exists"

**Cause:** Platform admin sudah ada di database.

**Solution:**
1. Cek database untuk melihat admin yang ada
2. Gunakan credentials yang sudah ada, atau
3. Hapus admin lama jika diperlukan (HATI-HATI!)

```sql
-- List existing admins
SELECT * FROM platform_users WHERE role = 'platform_admin';

-- Delete specific admin (USE WITH CAUTION!)
DELETE FROM platform_users WHERE email = 'admin@tirtasaas.com';
```

### Error: "Failed to hash password"

**Cause:** bcrypt error saat hashing password.

**Solution:**
1. Pastikan password memenuhi persyaratan minimum
2. Check memory availability
3. Verify bcrypt library installed

### Error: "Database connection failed"

**Cause:** Tidak bisa connect ke database.

**Solution:**
1. Verify .env configuration
2. Check database is running
3. Verify credentials

```bash
# Test database connection
mysql -u root -p -h 127.0.0.1 -P 3306 tirta_saas
```

---

## 📝 Multiple Admins

Untuk membuat beberapa admin sekaligus:

```go
// scripts/seed_multiple_admins.go
package main

import (
    "log"
    "github.com/adipras/tirta-saas-backend/config"
    "github.com/adipras/tirta-saas-backend/pkg/seeder"
    "github.com/joho/godotenv"
)

func main() {
    godotenv.Load()
    config.ConnectDB()
    
    admins := []seeder.PlatformAdminSeeder{
        {
            Email:     "admin1@example.com",
            Password:  "SecurePass1!",
            FirstName: "Admin",
            LastName:  "One",
        },
        {
            Email:     "admin2@example.com",
            Password:  "SecurePass2!",
            FirstName: "Admin",
            LastName:  "Two",
        },
    }
    
    err := seeder.SeedMultiplePlatformAdmins(admins)
    if err != nil {
        log.Fatal(err)
    }
    
    log.Println("✅ All admins seeded!")
}
```

---

## 🔄 Reset Admin Password

Jika lupa password admin:

```go
// scripts/reset_admin_password.go
package main

import (
    "log"
    "github.com/adipras/tirta-saas-backend/config"
    "github.com/adipras/tirta-saas-backend/models"
    "github.com/adipras/tirta-saas-backend/utils"
    "github.com/joho/godotenv"
)

func main() {
    godotenv.Load()
    config.ConnectDB()
    
    email := "admin@tirtasaas.com"
    newPassword := "NewPassword123!"
    
    hashedPassword, _ := utils.HashPassword(newPassword)
    
    result := config.DB.Model(&models.PlatformUser{}).
        Where("email = ?", email).
        Update("password", hashedPassword)
    
    if result.Error != nil {
        log.Fatal(result.Error)
    }
    
    log.Printf("✅ Password reset for %s", email)
    log.Printf("New password: %s", newPassword)
}
```

---

## 📚 Related Documentation

- [API Testing Guide](../API_TESTING_GUIDE.md)
- [Production Deployment Guide](../PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Quick Start Guide](../QUICK_START.md)

---

## ✅ Checklist

### Development Setup
- [ ] Set `AUTO_SEED_ADMIN=true` in .env
- [ ] Run application
- [ ] Verify admin created
- [ ] Test login with default credentials

### Production Setup
- [ ] Set `AUTO_SEED_ADMIN=false` in .env
- [ ] Run manual seeding script with strong password
- [ ] Store credentials in password manager
- [ ] Login and change password immediately
- [ ] Enable 2FA
- [ ] Remove seeding scripts from production server
- [ ] Document admin email for team

---

**Last Updated:** December 2024  
**Version:** 1.0.0
