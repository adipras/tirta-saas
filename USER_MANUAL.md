# Tirta SaaS - User Manual & Testing Guide

**Version:** 1.0.3  
**Last Updated:** May 19, 2026  
**Status:** Production Ready  
**Purpose:** Complete manual for testing all features in correct order

> 📘 **For Developers:** This manual serves as both a testing guide and user documentation.  
> 📋 **For Testers:** Follow the order exactly for best results.  
> 👤 **For End Users:** Skip to your role section (Platform Owner/Tenant Admin/Customer).

---

## 🚀 Quick Start (5 Minutes)

**New to the system? Start here:**

1. **Start Services** (see [Pre-requisites](#pre-requisites))
   - Backend: `cd tirta-saas-backend && go run main.go`
   - Frontend: `cd tirta-saas-frontend && npm run dev`

2. **Access System**
   - Open: http://localhost:5173
   - Login: admin@tirtasaas.com / admin123

3. **First Steps**
   - Platform Owner: Configure payment settings → Approve tenants
   - Tenant Admin: Setup subscription plans → Add customers
   - Customer: Login → View invoices → Submit payment

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Pre-requisites](#pre-requisites)
3. [Production Operations Guide](#production-operations-guide)
4. [Testing Flow](#testing-flow)
5. [Platform Owner Guide](#platform-owner-guide)
6. [Tenant Admin Guide](#tenant-admin-guide)
7. [Customer Guide](#customer-guide)
8. [Export Data (CSV & Excel)](#export-data-csv--excel)
9. [Bulk Import](#bulk-import)
10. [Print Support](#print-support)
11. [Advanced Filtering & Search](#advanced-filtering--search)
12. [Troubleshooting](#troubleshooting)
13. [Testing Checklist](#testing-checklist)
14. [API Reference](#api-endpoints-reference)
15. [Known Issues](#known-issues)

---

## System Overview

### User Roles

1. **Platform Owner** - Manages the entire platform and tenants
2. **Tenant Admin** - Manages their organization (RT/RW)
3. **Operational Users** - meter_reader, finance, service
4. **Customers** - End users (water consumers)

### System Architecture

```
Platform Owner
    └── Manages Tenants (RT/RW Organizations)
            └── Tenant Admin
                    ├── Manages Customers
                    ├── Manages Water Rates
                    ├── Records Usage
                    ├── Generates Invoices
                    └── Processes Payments

Customers
    └── View Invoices, Submit Payments, Track Usage
```

---

## Pre-requisites

### System Requirements

**Software:**
- Go 1.21+ (backend)
- Node.js 18+ (frontend)
- MySQL 8.0+ (database)
- Git (version control)

**Ports Required:**
- 8081 (backend)
- 5173 (frontend)
- 3306 (MySQL)

### Backend Setup

```bash
# Navigate to backend directory
cd tirta-saas-backend

# Install dependencies (first time only)
go mod download

# Run backend server
go run main.go

# Expected output:
# [GIN-debug] Listening and serving HTTP on :8081
# ✓ Invoice scheduler started
# ✓ Overdue invoice scheduler started
# ✓ Trial expiry scheduler started
```

**Verify Backend:**
```bash
curl http://localhost:8081/api/health
# Expected: {"status":"ok"}
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd tirta-saas-frontend

# Install dependencies (first time only)
npm install

# Run development server
npm run dev

# Expected output:
# VITE v5.x.x ready in xxx ms
# ➜ Local: http://localhost:5173
```

**Verify Frontend:**
- Open browser: http://localhost:5173
- Should see landing page with "Tirta SaaS" logo

### Database Setup

**Option 1: Using Existing Database**
```sql
-- The backend will auto-create tables on first run
-- Just ensure database exists:
CREATE DATABASE IF NOT EXISTS tirta_saas;
```

**Option 2: Fresh Start**
```sql
-- Drop and recreate (WARNING: deletes all data)
DROP DATABASE IF EXISTS tirta_saas;
CREATE DATABASE tirta_saas;
```

**Environment Variables (.env):**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tirta_saas
JWT_SECRET=your-secret-key-change-in-production
ENABLE_SCHEDULERS=true
```

### Default Accounts

**Platform Owner (Pre-seeded):**
- **Email:** admin@tirtasaas.com  
- **Password:** admin123  
- **Role:** platform_owner
- **Access:** Full platform management

> ⚠️ **IMPORTANT:** Change this password immediately in production!

**Test Tenant (Created during testing):**
- **Email:** budi@rt01rw05.com  
- **Password:** password123  
- **Role:** tenant_admin

### Verification Checklist

Before starting tests, verify:
- [x] Backend running on port 8081
- [x] Frontend running on port 5173
- [x] Database connection successful
- [x] Can access http://localhost:5173
- [x] Can login with platform owner credentials
- [x] No console errors in browser

---

## Production Operations Guide

Bagian deployment production berbasis **repo di server + build langsung di VPS** sudah tidak menjadi alur utama.

**Alur resmi saat ini:**
1. push perubahan ke `main`
2. GitHub Actions publish image ke GHCR
3. buat tag deploy (`deploy-fe-*`, `deploy-be-*`, atau `deploy-all-*`)
4. GitHub Actions otomatis upload runtime bundle, render `.env`, lalu menjalankan deploy via SSH

**Dokumen yang dipakai untuk setup dan operasional deploy baru:**
- `DEPLOYMENT_USER_MANUAL.md`

### 1. Menjalankan Seeding Jika Diperlukan

Untuk kebutuhan seeding, tetap gunakan source code repository pada mesin kerja/development, bukan runtime bundle di server.

Jalankan dari root project:

```bash
cd tirta-saas-backend
./scripts/seed-subscription-plans.sh
```

Jika perlu verifikasi hasil seed di production, cek langsung database/container MySQL yang sedang berjalan.

### 2. Redeploy Backend / Frontend Jika Ada Update

Gunakan workflow deploy berbasis tag:

```bash
git checkout main
git pull --ff-only origin main
git push origin main
```

Deploy frontend:

```bash
git tag deploy-fe-v1.0.0
git push origin deploy-fe-v1.0.0
```

Deploy backend:

```bash
git tag deploy-be-v1.0.0
git push origin deploy-be-v1.0.0
```

Deploy semua service aplikasi:

```bash
git tag deploy-all-v1.0.0
git push origin deploy-all-v1.0.0
```

### 3. Akses Database Production via DBeaver

**Tujuan:** membuka MySQL production dengan aman tanpa expose port database ke internet publik.

**Metode yang direkomendasikan:** SSH tunnel dari laptop lokal ke IP container MySQL di VPS.

#### A. Ambil informasi koneksi dari VPS

```bash
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172

cd /opt/tirta-runtime
set -a
. ./.env
set +a

MYSQL_CONTAINER_ID=$(docker compose ps -q mysql)
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$MYSQL_CONTAINER_ID"

echo "$MYSQL_DATABASE"
echo "$MYSQL_USER"
```

**Catat nilai berikut:**
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- IP container service `mysql`

> Jangan simpan kredensial production di repo atau screenshot yang tidak aman.

#### B. Buat tunnel dari laptop lokal

Misal IP container MySQL adalah `172.20.0.2`:

```bash
ssh -L 13306:172.20.0.2:3306 -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172
```

Biarkan terminal SSH ini tetap terbuka selama sesi DBeaver dipakai.

#### C. Konfigurasi DBeaver

1. Buka **DBeaver** → **New Database Connection**.
2. Pilih **MySQL**.
3. Isi parameter berikut:
   - **Host:** `127.0.0.1`
   - **Port:** `13306`
   - **Database:** isi dari `MYSQL_DATABASE`
   - **Username:** isi dari `MYSQL_USER`
   - **Password:** isi dari `MYSQL_PASSWORD`
4. Klik **Test Connection**.
5. Jika sukses, klik **Finish**.

#### D. Jika koneksi gagal

Lakukan cek berikut:

```bash
# cek apakah tunnel masih aktif
ssh -L 13306:172.20.0.2:3306 -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172

# cek IP container mungkin berubah setelah recreate
ssh -i ~/.ssh/adipras_id_ed25519 adipras@103.93.161.172 \
  "cd /opt/tirta-runtime && MYSQL_CONTAINER_ID=\$(docker compose ps -q mysql) && docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \"\$MYSQL_CONTAINER_ID\""
```

**Catatan penting:**
- Karena MySQL tidak dipublish ke host publik, tunnel wajib dipakai.
- IP container service `mysql` bisa berubah setelah recreate, jadi cek ulang jika DBeaver mendadak tidak bisa connect.
- Untuk aktivitas baca data biasa, gunakan user aplikasi. Gunakan `root` hanya jika benar-benar diperlukan.

---

## Testing Flow

### Order of Operations (Critical Path)

```
1. Platform Owner Setup
   ├── Login as Platform Owner
   ├── Configure Platform Payment Settings
   └── Review Dashboard

2. Tenant Registration & Approval
   ├── Register New Tenant (Public)
   ├── Platform Owner Approves Tenant
   └── Tenant Trial Activated (14 days)

3. Tenant Admin Setup
   ├── Login as Tenant Admin
   ├── Configure Subscription Plans
   ├── Configure Water Rates
   ├── Configure Payment Settings
   └── Create Operational Users

4. Customer Management
   ├── Add Customers
   ├── Assign Subscription Plans
   └── Activate Customers

5. Water Usage & Billing
   ├── Record Meter Readings
   ├── Generate Monthly Invoices
   ├── Review Invoices
   └── Process Payments

6. Customer Portal
   ├── Customer Login
   ├── View Invoices
   ├── Submit Payment Proof
   └── Admin Verifies Payment

7. Subscription Upgrade
   ├── Tenant Submits Subscription Payment
   ├── Platform Owner Verifies
   └── Tenant Status: ACTIVE
```

---

## Platform Owner Guide

### PART 1: Initial Login [Done ✔️]

**Duration:** 2 minutes

**URL:** http://localhost:5173/admin/login

**Steps:**

1. **Access Login Page:**
   - Open browser (Chrome/Firefox recommended)
   - Navigate to: http://localhost:5173/admin/login
   - Page should load within 2 seconds

2. **Enter Credentials:**
   - Email field: Type `admin@tirtasaas.com`
   - Password field: Type `admin123`
   - ✅ Verify no typos (common error!)

3. **Submit Login:**
   - Click blue "Masuk" button
   - Loading spinner appears briefly
   - Wait for redirect (automatic)

**Expected Result:**
- ✅ Login successful message
- ✅ Redirect to: http://localhost:5173/admin/platform/dashboard
- ✅ Dashboard shows statistics cards:
  - Total Tenants
  - Active Tenants
  - Pending Approvals
  - Monthly Revenue (Rp 0 initially)
- ✅ Navigation sidebar visible with menu items:
  - Dashboard
  - Tenants
  - Subscription Payments
  - Settings
- ✅ User profile shown at top-right: "admin@tirtasaas.com"
- ✅ Logout button available

**Troubleshooting:**

❌ **"Invalid credentials" error:**
- Check email spelling (no spaces)
- Check password (case-sensitive)
- Ensure backend is running (check port 8081)

❌ **Page won't load:**
- Check frontend is running: http://localhost:5173
- Check browser console for errors (F12)
- Clear browser cache and retry

❌ **Infinite loading:**
- Check backend API: curl http://localhost:8081/api/health
- Check network tab in browser DevTools
- Restart backend if no response

---

### PART 2: Configure Platform Payment Settings [Done ✔️]

**Duration:** 3 minutes

**Purpose:** Tenants need to see where to send subscription payments

**Navigation Path:**
1. From Dashboard sidebar → Click "Settings" (gear icon)
2. Page title should show "Platform Payment Settings"

**Steps:**

1. **Add Primary Bank Account:**
   - Locate "Bank Accounts" section
   - Click green "+ Add Bank Account" button
   - **Form fields:**
     - Bank Name: Type `Bank BCA`
     - Account Number: Type `1234567890`
     - Account Holder: Type `PT Tirta Saas Indonesia`
   - Click blue "Add" button
   - ✅ Success message: "Bank account added successfully"

2. **Add Secondary Bank Account (Recommended):**
   - Click "+ Add Bank Account" again
   - **Form fields:**
     - Bank Name: Type `Bank Mandiri`
     - Account Number: Type `9876543210`
     - Account Holder: Type `PT Tirta Saas Indonesia`
   - Click "Add"
   - ✅ Second bank appears in list

3. **Test Edit Function:**
   - Click "Edit" button on first bank
   - Change Account Holder to: `PT Tirta Saas Indo`
   - Click "Save"
   - ✅ Updated successfully

4. **Verify Display:**
   - Both bank accounts visible in table
   - Each row shows: Bank Name, Account Number, Account Holder
   - Actions: Edit (pencil icon), Delete (trash icon)

**Expected Result:**
- ✅ Minimum 1 bank account configured
- ✅ Bank info will appear in tenant upgrade page
- ✅ Edit/Delete functions working
- ✅ Data persists after page refresh

**Optional: Add QR Code Payment**
- Scroll to "QR Code Payment" section
- Upload QR image (JPG/PNG, max 2MB)
- Provider name: `GoPay` or `OVO`
- Account number: `081234567890`
- Click "Save"

**Troubleshooting:**

❌ **"Failed to save" error:**
- Check all fields are filled
- Account number should be digits only
- Refresh page and retry

❌ **Changes not persisting:**

- Check backend logs for errors
- Verify database connection
- Try browser incognito mode

---

### PART 3: Review Platform Dashboard [Done ✔️]

**Navigation:** Dashboard → Platform

**Check:**
- Total tenants count
- Active tenants
- Pending approvals
- Monthly recurring revenue (will be 0 initially)

**Expected Result:**
- ✅ Dashboard loads
- ✅ Statistics display correctly
- ✅ No errors in console

---

## Tenant Registration & Approval

### PART 4: Register New Tenant (Public - No Login)

**Duration:** 5 minutes

**URL:** http://localhost:5173/register

**Scenario:** RT 01 RW 05 Kelurahan Maju Jaya wants to register

**Steps:**

1. **Navigate to Registration Page:**
   
   **Option A - Direct URL:**
   - Open new browser tab
   - Type: http://localhost:5173/register
   - Press Enter
   
   **Option B - From Landing Page:**
   - Go to: http://localhost:5173
   - Click green "Daftar Sekarang" button
   - Should redirect to registration form

2. **Fill Organization Information:**
   
   Page shows: "Daftarkan Organisasi Anda"
   
   - **Organization Name:** `RT 01 RW 05 Kelurahan Maju Jaya`
     - ✅ Use full, official name
     - ❌ Don't abbreviate unnecessarily
   
   - **Village Code:** `RT01RW05MAJU`
     - ⚠️ MUST be UNIQUE (no spaces, uppercase)
     - ⚠️ Cannot be changed later!
     - Format: RT[nn]RW[nn][NAMA]
     - Example valid codes:
       - RT01RW05MAJU ✅
       - RT02RW03TEST ✅
       - RT10RW15SEJAHTERA ✅
   
   - **Address:** `Jl. Merdeka No. 123, Jakarta`
     - Include street name and number
     - Add city/district
   
   - **Phone:** `081234567890`
     - Format: 08xxxxxxxxxx (no spaces/dashes)
     - Will be used for notifications
   
   - **Email:** `rt01rw05@example.com`
     - Organization email (not personal)
     - Must be valid format

3. **Fill Admin User Information:**
   
   Section: "Informasi Admin"
   
   - **Admin Name:** `Budi Santoso`
     - Full name of person responsible
   
   - **Admin Email:** `budi@rt01rw05.com`
     - ⚠️ MUST be UNIQUE (used for login)
     - Different from organization email
   
   - **Admin Phone:** `081234567890`
     - Admin's personal number
   
   - **Password:** `password123`
     - Minimum 6 characters
     - Will be used for login
     - 👁️ Click eye icon to show/hide
   
   - **Confirm Password:** `password123`
     - Must match password exactly
     - ✅ Green checkmark appears if match

4. **Submit Registration:**
   - Review all fields (scroll up if needed)
   - Click blue "Daftar" button at bottom
   - Wait for processing (2-3 seconds)

**Expected Result:**

✅ **Success Screen:**
- Green success message appears
- Message: "Registrasi berhasil! Akun Anda akan diverifikasi dalam 1-2 hari kerja."
- Trial information shown:
  - Trial Period: 14 hari
  - Trial Start: [Today's date]
  - Trial End: [Today + 14 days]
- Button: "Login Sekarang"
- Auto-redirect to login in 3 seconds

✅ **Database Changes:**
- Tenant record created (status: TRIAL)
- Admin user created (role: tenant_admin, password hashed)
- Default tenant_settings created
- trial_ends_at = today + 14 days

✅ **Email Sent (if configured):**
- Welcome email to admin
- Trial details included
- Login instructions

**Validation Errors:**

❌ **"Village code already exists":**
- Someone already used this code
- Try: RT01RW05MAJU2, RT01RW05MAJUJAYA, etc.

❌ **"Email already registered":**
- Admin email must be unique
- Use different email
- Check for typos

❌ **"Password must be at least 6 characters":**
- Password too short
- Use minimum 6 characters
- Recommended: 8+ characters with mix of letters/numbers

❌ **"Passwords do not match":**
- Confirm password field doesn't match
- Re-type both fields carefully

**Troubleshooting:**

❌ **Form won't submit:**
- Check all fields are filled (red borders indicate errors)
- Scroll to top to see validation messages
- Try clearing form and re-entering

❌ **"Network error":**
- Check backend is running
- Check browser console (F12)
- Retry after 10 seconds

**Next Steps:**
- Credentials saved (write down somewhere safe)
- Wait for platform owner approval (Part 5)
- Check email for confirmation (if configured)
- Can login immediately but features limited until approval

---

### PART 5: Platform Owner Approves Tenant

**Login as:** Platform Owner (admin@tirtasaas.com)

**Navigation:** Dashboard → Tenants → Pending Review tab

**Steps:**

1. **View Pending Tenants:**
   - Click "Tenants" in sidebar
   - Click "Pending Review" tab
   - Should see "RT 01 RW 05 Kelurahan Maju Jaya"

2. **Review Tenant Details:**
   - Click "View Details" button
   - Review organization information:
     - Name, village code, address
     - Admin name, email, phone
     - Registration date
     - Trial end date

3. **Approve Tenant:**
   - Click "Approve" button
   - Enter approval notes (optional): `Verified and approved`
   - Click "Confirm Approval"

**Expected Result:**
- ✅ Success message: "Tenant approved successfully"
- ✅ Tenant moves to "All Tenants" tab
- ✅ Status changes to: ACTIVE
- ✅ Tenant admin can now login and use full features

**Alternative: Reject Tenant**
- Click "Reject" button
- Enter reason: `Incomplete documentation`
- Status becomes: REJECTED
- Tenant admin cannot access system

---

## Tenant Admin Guide

### PART 6: Tenant Admin First Login

**URL:** http://localhost:5173/admin/login

**Credentials:**
- Email: `admin@tirtautama.com`
- Password: `password123`

**Steps:**
1. Navigate to admin login
2. Enter tenant admin credentials
3. Click "Masuk"

**Expected Result:**
- ✅ Login successful
- ✅ Dashboard shows tenant statistics
- ✅ Trial banner visible at top: "TRIAL MODE - 14 days remaining"
- ✅ Navigation menu shows tenant features
- ✅ Welcome message: "Selamat datang, Budi Santoso"

**Trial Banner Features:**
- Shows days remaining
- Yellow background (14-4 days left)
- Red background (3 days or less)
- "Upgrade Now" button
- Dismissible (returns next day)

---

### PART 7: Configure Subscription Types

**Why:** Customers will be assigned to subscription plans

**Navigation:** Dashboard → Subscriptions

**Steps:**

1. **Create Basic Plan:**
   - Click "Add Subscription Type"
   - Name: `Rumah Tangga`
   - Description: `Paket untuk rumah tangga biasa`
   - Monthly Fee: `25000`
   - Max Customers: Leave empty (unlimited)
   - Is Active: Yes (checked)
   - Click "Save"

2. **Create Premium Plan:**
   - Click "Add Subscription Type"
   - Name: `Usaha Kecil`
   - Description: `Paket untuk warung/usaha kecil`
   - Monthly Fee: `50000`
   - Max Customers: Leave empty
   - Is Active: Yes
   - Click "Save"

3. **Verify List:**
   - Should see 2 subscription types
   - Status should show "Active"
   - Edit button works
   - Can deactivate/activate

**Expected Result:**
- ✅ Subscriptions created successfully
- ✅ Will be used for customer assignment
- ✅ Affects monthly invoice calculation

**Note:** Subscription fee is charged monthly to each customer

---

### PART 8: Configure Water Rates

**Why:** Determines water price per m³ based on usage tiers

**Navigation:** Dashboard → Water Rates

**Concept:**
- Different subscription types can have different rates
- Tiered pricing: more usage = higher price per m³
- Example: 0-10m³ = Rp 5,000/m³, 11-20m³ = Rp 7,000/m³

**Steps:**

1. **Create Rate for "Rumah Tangga":**
   
   **Tier 1:**
   - Click "Add Water Rate"
   - Subscription Type: Select "Rumah Tangga"
   - Min Usage: `0`
   - Max Usage: `10`
   - Price per m³: `5000`
   - Effective Date: Today's date
   - Is Active: Yes
   - Click "Save"

   **Tier 2:**
   - Click "Add Water Rate"
   - Subscription Type: "Rumah Tangga"
   - Min Usage: `11`
   - Max Usage: `20`
   - Price per m³: `7000`
   - Effective Date: Today's date
   - Is Active: Yes
   - Click "Save"

   **Tier 3:**
   - Click "Add Water Rate"
   - Subscription Type: "Rumah Tangga"
   - Min Usage: `21`
   - Max Usage: `999` (represents unlimited)
   - Price per m³: `9000`
   - Effective Date: Today's date
   - Is Active: Yes
   - Click "Save"

2. **Create Rate for "Usaha Kecil":**
   
   **Tier 1:**
   - Subscription Type: "Usaha Kecil"
   - Min: `0`, Max: `20`
   - Price: `6000`
   
   **Tier 2:**
   - Subscription Type: "Usaha Kecil"
   - Min: `21`, Max: `50`
   - Price: `8000`
   
   **Tier 3:**
   - Subscription Type: "Usaha Kecil"
   - Min: `51`, Max: `999`
   - Price: `10000`

**Expected Result:**
- ✅ 6 water rates created (3 per subscription type)
- ✅ Rates displayed in table
- ✅ Can filter by subscription type
- ✅ Can view rate history
- ✅ Will be used for invoice calculation

**Pricing Example:**
Customer uses 15 m³:
- First 10 m³ × Rp 5,000 = Rp 50,000
- Next 5 m³ × Rp 7,000 = Rp 35,000
- **Total water charge:** Rp 85,000
- **Plus subscription fee:** Rp 25,000
- **Grand total:** Rp 110,000

---

### PART 9: Configure Tenant Payment Settings

**Why:** Customers need to know where to send payments

**Navigation:** Dashboard → Settings → Payment Settings

**Steps:**

1. **Add Bank Account:**
   - Click "Add Bank Account"
   - Bank Name: `Bank BCA`
   - Account Number: `9876543210`
   - Account Holder: `Kas RT 01 RW 05`
   - Click "Add"

2. **Add E-Wallet (Optional):**
   - Bank Name: `GoPay`
   - Account Number: `081234567890`
   - Account Holder: `Budi Santoso`
   - Click "Add"

3. **Add QR Code (Optional):**
   - Provider Name: `QRIS`
   - Account Number: `081234567890`
   - Upload QR image (any QR code image)
   - Click "Upload"

**Expected Result:**
- ✅ Payment methods saved
- ✅ Visible to customers during payment
- ✅ QR code displays in payment page

---

### PART 10: Create Operational Users

**Why:** Delegate tasks to staff (meter reader, finance, service)

**Navigation:** Dashboard → User Management

**Steps:**

1. **Create Meter Reader:**
   - Click "Add User"
   - Name: `Ahmad Pencatat`
   - Email: `ahmad@rt01rw05.com`
   - Role: Select "Meter Reader (Pencatat Meteran)"
   - Click "Generate Password" (or enter manually)
   - Note the generated password: `AbCd1234EfGh`
   - Click "Create User"

2. **Create Finance Officer:**
   - Click "Add User"
   - Name: `Siti Keuangan`
   - Email: `siti@rt01rw05.com`
   - Role: "Finance Officer (Bagian Keuangan)"
   - Generate password
   - Click "Create User"

3. **Create Service Officer:**
   - Click "Add User"
   - Name: `Joko Pelayanan`
   - Email: `joko@rt01rw05.com`
   - Role: "Service Officer (Bagian Pelayanan)"
   - Generate password
   - Click "Create User"

**Expected Result:**
- ✅ 3 operational users created
- ✅ Each can login with their email
- ✅ Passwords were auto-generated or manually set
- ✅ Can edit user details
- ✅ Can delete users (with confirmation)

**Important:** Save the passwords! Users will need them to login.

**User Permissions:**
- **Meter Reader:** Can record water usage
- **Finance Officer:** Can generate invoices, record payments
- **Service Officer:** Can manage customers

---

## Customer Management

### PART 11: Add First Customer

**Navigation:** Dashboard → Customers → Add Customer

**Scenario:** Add a household customer

**Steps:**

1. Click "Add Customer" button

2. **Fill Customer Info:**
   - Name: `Ibu Aminah`
   - Email: `aminah@example.com`
   - Phone: `081234567891`
   - Address: `Jl. Kenangan No. 1`
   - Meter Number: `MTR-001` (unique)
   - Subscription Type: Select "Rumah Tangga"
   - Is Active: Yes (checked)
   - Password: `customer123`
   - Confirm Password: `customer123`

3. Click "Save"

**Expected Result:**
- ✅ Customer created successfully
- ✅ Appears in customer list
- ✅ Status: Active (green badge)
- ✅ Can login to customer portal
- ✅ Meter number: MTR-001

---

### PART 12: Add More Customers

**Add at least 5 customers for testing:**

**Customer 2:**
- Name: `Pak Budi`
- Email: `budi.customer@example.com`
- Meter: `MTR-002`
- Subscription: "Rumah Tangga"
- Password: `customer123`

**Customer 3:**
- Name: `Warung Makan Sedap`
- Email: `warung@example.com`
- Meter: `MTR-003`
- Subscription: "Usaha Kecil"
- Password: `customer123`

**Customer 4:**
- Name: `Ibu Siti`
- Email: `siti.customer@example.com`
- Meter: `MTR-004`
- Subscription: "Rumah Tangga"
- Password: `customer123`

**Customer 5:**
- Name: `Pak Joko`
- Email: `joko.customer@example.com`
- Meter: `MTR-005`
- Subscription: "Rumah Tangga"
- Password: `customer123`

**Verify:**
- ✅ All 5 customers in list
- ✅ Can search by name
- ✅ Can filter by subscription
- ✅ Can view details
- ✅ Can edit customer
- ✅ Toggle active/inactive works

---

## Water Usage & Billing

### PART 13: Record Meter Readings

**Why:** Before generating invoices, we need usage data

**Navigation:** Dashboard → Water Usage → Record Reading

**Important:** Record readings for the same month (e.g., January 2026)

**Steps:**

**Reading 1 - Ibu Aminah (MTR-001):**
1. Click "Record Reading"
2. Select Customer: `Ibu Aminah (MTR-001)`
3. Current Reading: `100` m³
4. Previous Reading: `85` m³ (auto-filled or manual)
5. Usage Amount: `15` m³ (auto-calculated)
6. Reading Date: `2026-01-05`
7. Usage Month: `January`
8. Usage Year: `2026`
9. Click "Save"

**Reading 2 - Pak Budi (MTR-002):**
- Customer: Pak Budi
- Current: `50`
- Previous: `42`
- Usage: `8` m³
- Date: `2026-01-05`
- Month/Year: January 2026

**Reading 3 - Warung Makan (MTR-003):**
- Customer: Warung Makan Sedap
- Current: `85`
- Previous: `60`
- Usage: `25` m³
- Date: `2026-01-05`
- Month/Year: January 2026

**Reading 4 - Ibu Siti (MTR-004):**
- Customer: Ibu Siti
- Current: `120`
- Previous: `110`
- Usage: `10` m³
- Date: `2026-01-05`
- Month/Year: January 2026

**Reading 5 - Pak Joko (MTR-005):**
- Customer: Pak Joko
- Current: `75`
- Previous: `60`
- Usage: `15` m³
- Date: `2026-01-05`
- Month/Year: January 2026

**Expected Result:**
- ✅ All 5 readings recorded
- ✅ Usage amounts calculated correctly
- ✅ Can view usage history
- ✅ Can edit/delete readings
- ✅ Filter by customer works

**Calculation Check (Ibu Aminah - 15 m³):**
- First 10 m³ × Rp 5,000 = Rp 50,000
- Next 5 m³ × Rp 7,000 = Rp 35,000
- **Expected water charge:** Rp 85,000

---

### PART 14: Generate Monthly Invoices

**Why:** Convert usage data into invoices

**Navigation:** Dashboard → Invoices → Bulk Generate

**Steps:**

1. Click "Bulk Generate Invoices"

2. **Select Period:**
   - Month: `January`
   - Year: `2026`

3. Click "Preview Generation"

4. **Review Preview:**
   - Should see all 5 customers
   - Check invoice details:
     - Customer name
     - Usage amount
     - Water charge (calculated)
     - Subscription fee
     - Sub-total
     - Penalty (should be 0 for new invoices)
     - Total amount
   - Verify calculations manually

5. Click "Generate Invoices"

6. Confirm generation

**Expected Result:**
- ✅ Success message: "5 invoices generated successfully"
- ✅ Redirects to invoice list
- ✅ 5 new invoices with status "UNPAID"
- ✅ Invoice numbers: INV-202601-0001, INV-202601-0002, etc.
- ✅ Due date: 10 days from generation

**Sample Invoice (Ibu Aminah):**
```
Invoice: INV-202601-0001
Customer: Ibu Aminah (MTR-001)
Period: January 2026
Usage: 15 m³ (85 → 100)

Water Charge: Rp 85,000
  (10 m³ × Rp 5,000 = Rp 50,000)
  (5 m³ × Rp 7,000 = Rp 35,000)
Subscription Fee: Rp 25,000
Sub-total: Rp 110,000
Penalty: Rp 0
Total Amount: Rp 110,000

Status: UNPAID
Due Date: 2026-01-15
```

---

### PART 15: View & Manage Invoices

**Navigation:** Dashboard → Invoices

**Check Features:**

1. **Invoice List:**
   - All 5 invoices displayed
   - Filter by status (All/Unpaid/Partial/Paid/Overdue)
   - Search by customer name
   - Search by invoice number

2. **View Invoice Details:**
   - Click on an invoice
   - Should show:
     - Customer info
     - Usage details (previous → current reading)
     - Calculation breakdown
     - Payment history (empty for now)
     - Status badge

3. **Edit Invoice (if needed):**
   - Click "Edit"
   - Can adjust amounts
   - Can change due date
   - Save changes

**Expected Result:**
- ✅ All invoices visible
- ✅ Filters work correctly
- ✅ Search functions work
- ✅ Invoice details complete
- ✅ Print/export buttons visible (if implemented)

---

### PART 16: Process Payment (Admin Side)

**Scenario:** Customer pays Rp 110,000 for their invoice

**Navigation:** Dashboard → Invoices → View Invoice → Record Payment

**Steps:**

1. **Find Invoice:**
   - Go to Invoices
   - Click on "INV-202601-0001" (Ibu Aminah)

2. **Record Payment:**
   - Click "Record Payment" button
   - Amount: `110000`
   - Payment Date: Today's date
   - Payment Method: Select "Cash" or "Bank Transfer"
   - Reference Number (optional): `TRX-20260106-001`
   - Notes (optional): `Paid in full`
   - Click "Save Payment"

3. **Verify Update:**
   - Invoice status should change to "PAID"
   - Badge color changes to green
   - Total paid: Rp 110,000
   - Payment history shows the transaction

**Expected Result:**
- ✅ Payment recorded successfully
- ✅ Invoice status: PAID
- ✅ Payment appears in payment history
- ✅ Receipt can be printed
- ✅ Customer can see this payment in portal

**Try Partial Payment:**
1. Open another unpaid invoice (e.g., Pak Budi)
2. Record payment of Rp 50,000 (less than total)
3. Status should be "PARTIAL"
4. Remaining amount displayed

---

## Customer Portal

### PART 17: Customer Login

**URL:** http://localhost:5173/customer/login

**Credentials:**
- Email: `aminah@example.com`
- Password: `customer123`

**Steps:**
1. Navigate to customer login
2. Enter credentials
3. Click "Masuk"

**Expected Result:**
- ✅ Login successful
- ✅ Redirects to customer dashboard
- ✅ Shows welcome message: "Selamat datang, Ibu Aminah"

---

### PART 18: Customer Dashboard

**Check Dashboard Elements:**

1. **Profile Card:**
   - Name: Ibu Aminah
   - Meter Number: MTR-001
   - Address displayed
   - Phone displayed
   - Subscription: Rumah Tangga
   - Status: Active (green badge)

2. **Statistics Cards:**
   - Total Unpaid Invoices: 0 (if paid) or 1 (if unpaid)
   - Total Amount
   - Overdue Invoices: 0
   - Paid Invoices: 1

3. **Quick Action Buttons:**
   - "Tagihan Saya" (My Invoices)
   - "Riwayat Pembayaran" (Payment History)
   - "Pemakaian Air" (Water Usage)
   - "Profil Saya" (My Profile)

4. **Recent Invoices Table:**
   - Shows recent invoices
   - Invoice number, period, due date
   - Amount and status

**Expected Result:**
- ✅ All data displays correctly
- ✅ Statistics accurate
- ✅ All buttons clickable
- ✅ Responsive design

---

### PART 19: View Invoices (Customer)

**Navigation:** Customer Dashboard → Tagihan Saya

**Features to Test:**

1. **Filter Invoices:**
   - Click "Semua" (All) - shows all invoices
   - Click "Belum Dibayar" (Unpaid) - shows only unpaid
   - Click "Lunas" (Paid) - shows paid invoices

2. **Invoice Details:**
   - Each invoice shows:
     - Invoice number
     - Period (month/year)
     - Usage amount (m³)
     - Meter readings (previous → current)
     - Calculation breakdown
     - Total amount
     - Status badge

3. **Pay Button:**
   - For unpaid invoices, "Bayar Sekarang" button visible
   - Click should go to payment page

**Expected Result:**
- ✅ All invoices visible
- ✅ Filters work correctly
- ✅ Details complete and accurate
- ✅ Pay button only on unpaid invoices

---

### PART 20: Submit Payment Proof

**Scenario:** Customer pays and uploads proof

**Navigation:** Tagihan Saya → Click "Bayar Sekarang" on unpaid invoice

**Prepare:**
- Have a sample image ready (receipt, transfer screenshot, etc.)
- Or use any JPG/PNG file < 5MB

**Steps:**

1. **Review Invoice:**
   - Invoice details displayed at top
   - Total amount to pay shown clearly

2. **Fill Payment Form:**
   - Payment Date: Today
   - Payment Method: Select "Bank Transfer"
   - Sender Name: `Ibu Aminah`
   - Account Number: `1234567890`
   - Reference Number: `REF123456`
   - Notes: `Transfer via mobile banking`

3. **Upload Proof:**
   - Click upload area or drag file
   - Select image file (JPG/PNG) or PDF
   - Preview should appear (for images)
   - File name shown (for PDF)

4. Click "Kirim Bukti Pembayaran"

**Expected Result:**
- ✅ Success screen appears
- ✅ Message: "Bukti pembayaran Anda telah dikirim..."
- ✅ Auto-redirect to invoices page
- ✅ Invoice status remains "Belum Dibayar" (pending verification)

**File Validation:**
- Maximum size: 5MB
- Allowed formats: JPG, PNG, PDF
- Error message if invalid

---

### PART 21: View Payment History (Customer)

**Navigation:** Dashboard → Riwayat Pembayaran

**Check:**
- List of all payments made
- Payment date
- Invoice number
- Amount
- Status: "Berhasil" (Success)

**Expected Result:**
- ✅ Paid invoices show in history
- ✅ Pending proofs NOT in history (not verified yet)
- ✅ Can see payment details
- ✅ Shows invoice reference

---

### PART 22: View Water Usage (Customer)

**Navigation:** Dashboard → Pemakaian Air

**Statistics Cards:**
1. Current month usage
2. Average monthly usage
3. Total usage (all time)

**Usage History Table:**
- Period (month/year)
- Reading date
- Previous reading
- Current reading
- Usage amount

**Expected Result:**
- ✅ All usage data visible
- ✅ Statistics calculated correctly
- ✅ Table shows complete history
- ✅ Sorted by date (newest first)

---

### PART 23: Manage Profile (Customer)

**Navigation:** Dashboard → Profil Saya

**Features:**

1. **Profile Information:**
   - Name, meter number (read-only)
   - Email (read-only)
   - Active status
   - Subscription plan

2. **Update Profile Form:**
   - Name: Change to `Ibu Aminah Binti Ahmad`
   - Address: Update if needed
   - Phone: Update if needed
   - Click "Simpan Perubahan"

3. **Change Password Form:**
   - Current Password: `customer123`
   - New Password: `newpass123`
   - Confirm Password: `newpass123`
   - Click "Ubah Password"

**Expected Result:**
- ✅ Profile updated successfully
- ✅ Password changed successfully
- ✅ Success messages displayed
- ✅ Can login with new password
- ✅ Form validation works (min 6 chars, password match)

**Test Validation:**
- Try password < 6 characters (should fail)
- Try mismatched passwords (should fail)
- Try wrong current password (should fail)

---

## Payment Proof Verification (Admin)

### PART 24: View Payment Proofs

**Login as:** Tenant Admin (budi@rt01rw05.com)

**Navigation:** Dashboard → Payment Proofs

**Dashboard Shows:**
- Statistics:
  - Pending proofs count
  - Verified proofs count
  - Rejected proofs count
- List of all payment proofs
- Filter by status

**Steps:**

1. **Filter by Pending:**
   - Click "Pending" tab
   - Should see the proof submitted by Ibu Aminah

2. **View Details:**
   - Click "View Details" button
   - Modal opens showing:
     - Customer name and invoice number
     - Payment amount and date
     - Payment method and account info
     - Reference number and notes
     - Proof image (click to view full size)
     - Submit date/time

**Expected Result:**
- ✅ Payment proof visible
- ✅ All details complete
- ✅ Image loads correctly
- ✅ Verify and Reject buttons visible

---

### PART 25: Verify Payment Proof

**Scenario:** Admin confirms payment is legitimate

**Steps:**

1. **In Payment Proof Detail Modal:**
   - Review payment details
   - Check proof image
   - Verify amount matches invoice

2. **Verify Payment:**
   - Click "Verify" button
   - Enter verification notes (optional): `Payment verified, thank you`
   - Click "Confirm Verification"

3. **Check Results:**
   - Success message appears
   - Modal closes
   - Proof disappears from Pending list
   - Appears in Verified list

4. **Check Invoice:**
   - Go to Invoices
   - Find the related invoice
   - Status should now be "PAID"
   - Payment recorded automatically

5. **Check Customer View:**
   - Login as customer
   - Go to Payment History
   - Verified payment should now appear

**Expected Result:**
- ✅ Payment proof verified
- ✅ Payment record created automatically
- ✅ Invoice status updated to PAID
- ✅ Customer can see verified payment
- ✅ Transaction is complete

**Database Changes (Behind the scenes):**
```
payment_proofs table:
  status: PENDING → VERIFIED
  verified_by: [admin user ID]
  verified_at: [timestamp]

payments table:
  New record created

invoices table:
  total_paid: updated
  payment_status: UNPAID → PAID
  is_paid: true
```

---

### PART 26: Reject Payment Proof

**Scenario:** Payment proof is unclear or incorrect

**Steps:**

1. **Submit another payment proof** (as different customer)
   - Login as customer: `budi.customer@example.com`
   - Submit payment proof with incorrect amount or unclear image

2. **Login as admin** and go to Payment Proofs

3. **View the proof details**

4. **Reject Payment:**
   - Click "Reject" button
   - Enter rejection reason (required): `Image unclear, please upload clearer photo`
   - Click "Confirm Rejection"

5. **Verify:**
   - Proof moves to Rejected list
   - Invoice remains UNPAID
   - No payment record created

6. **Customer Can Resubmit:**
   - Login as that customer
   - Go to Invoices
   - "Bayar Sekarang" button still available
   - Can submit new proof

**Expected Result:**
- ✅ Payment proof rejected
- ✅ Rejection reason saved
- ✅ Invoice unchanged
- ✅ Customer can see rejection status (if checking)
- ✅ Can resubmit new proof

---

## Subscription Upgrade Flow

### PART 27: View Trial Status

**Login as:** Tenant Admin (trial tenant)

**Check:**
- Trial banner visible at top
- Shows days remaining
- "Upgrade Now" button visible

**Navigation:** Dashboard → Subscription Status

**Displays:**
- Current status: TRIAL
- Days remaining
- Trial end date
- Subscription plan: None (trial)
- Message: Upgrade to continue service

**Expected Result:**
- ✅ Status accurate
- ✅ Days count correct
- ✅ Upgrade button visible

---

### PART 28: Submit Subscription Payment

**Navigation:** Dashboard → Trial Banner → "Upgrade Now"  
Or: Dashboard → Subscription → Upgrade

**Steps:**

1. **Choose Plan:**
   - Basic (Rp 150,000/month)
   - Pro (Rp 250,000/month) - Most Popular
   - Enterprise (Rp 500,000/month)
   - Select "Pro"

2. **Choose Billing Period:**
   - 1 month (no discount)
   - 6 months (5% discount)
   - 12 months (10% discount)
   - Select "1 month"

3. **Review Amount:**
   - Plan: Pro
   - Period: 1 month
   - Price: Rp 250,000
   - Discount: Rp 0
   - **Total: Rp 250,000**

4. **Payment Information Displays:**
   - Bank accounts (configured by platform owner)
   - Payment instructions
   - "Continue to Payment" button

5. **Fill Payment Form:**
   - Payment Date: Today
   - Payment Method: Bank Transfer
   - Account Name: `Budi Santoso`
   - Account Number: `1234567890`
   - Reference Number: `TRX-SUB-001`
   - Notes: `Upgrade to Pro plan`

6. **Upload Proof:**
   - Upload payment proof image

7. Click "Submit Payment"

**Expected Result:**
- ✅ Success message with Confirmation ID (e.g., SUB-20260106-00001)
- ✅ Redirects to Status page
- ✅ Status changes to: PENDING_VERIFICATION
- ✅ Banner updates: "PAYMENT PENDING - being verified"
- ✅ Tenant still has access to system during verification

---

### PART 29: Platform Owner Verifies Subscription

**Login as:** Platform Owner (admin@tirtasaas.com)

**Navigation:** Dashboard → Subscription Payments

**Steps:**

1. **View Pending Payments:**
   - Should see pending subscription payment
   - Shows tenant name, plan, amount, date

2. **View Details:**
   - Click "View Details"
   - Review:
     - Tenant info
     - Subscription plan: Pro
     - Billing period: 1 month
     - Amount: Rp 250,000
     - Payment proof image
     - Submit date

3. **Verify Payment:**
   - Click "Verify Payment"
   - Confirmation dialog
   - Notes (optional): `Payment confirmed`
   - Click "Confirm"

4. **Check Results:**
   - Success message
   - Payment moves to Verified list
   - Tenant status updated

5. **Verify Tenant Status:**
   - Go to Tenants
   - Find the tenant
   - Status should be: ACTIVE
   - Subscription plan: Pro
   - Subscription start date: Today
   - Subscription end date: Today + 30 days

**Expected Result:**
- ✅ Subscription verified
- ✅ Tenant status: TRIAL → ACTIVE
- ✅ Subscription dates set
- ✅ Tenant can continue using system
- ✅ Trial banner removed
- ✅ Full access granted

**Database Changes:**
```
tenants table:
  status: TRIAL → ACTIVE
  subscription_plan: Pro
  subscription_starts_at: today
  subscription_ends_at: today + 30 days

subscription_payments table:
  status: PENDING → VERIFIED
  verified_by: [platform owner ID]
  verified_at: [timestamp]
```

---

## Automation Testing

### PART 30: Invoice Auto-Generation (Scheduler)

**Scenario:** Test automatic monthly invoice generation

**Configuration:**
- Scheduler runs on 1st of each month at 00:00
- Automatically generates invoices for all active customers with usage data

**Manual Trigger (for testing):**

**Option 1: Wait for Scheduler**
- Set system date to 1st of next month
- Wait for 00:00
- Check invoice list

**Option 2: Trigger Manually (if endpoint exists)**
- Use Postman or curl
- POST to scheduler endpoint
- Check results

**Expected Behavior:**
- ✅ Invoices generated for all customers with usage
- ✅ Invoice numbers sequential
- ✅ Calculations correct
- ✅ Due dates set (invoice date + 10 days)
- ✅ Status: UNPAID
- ✅ Log file created with generation summary

---

### PART 31: Invoice Overdue Update (Scheduler)

**Scenario:** Test automatic overdue status update

**Configuration:**
- Runs daily at 01:00
- Updates invoices where: due_date < today AND is_paid = false

**Test:**

1. **Create an overdue invoice:**
   - Generate invoice with due date in the past
   - Or edit existing invoice's due date to yesterday

2. **Wait for scheduler or trigger manually**

3. **Check invoice:**
   - Status should change to: OVERDUE
   - Badge color: Red

**Expected Result:**
- ✅ Overdue invoices identified
- ✅ Status updated automatically
- ✅ Can be queried with filter

---

### PART 32: Trial Expiry Check (Scheduler)

**Scenario:** Test automatic trial expiry

**Configuration:**
- Runs daily at 02:00
- Finds tenants where: status = TRIAL AND trial_ends_at < today
- Updates status to: EXPIRED

**Test:**

1. **Create test tenant or modify existing:**
   - Set trial_ends_at to yesterday

2. **Run scheduler or wait**

3. **Check tenant:**
   - Status should be: EXPIRED
   - Cannot access system (blocked by middleware)

4. **Try to login as that tenant:**
   - Should see error: "Tenant trial expired. Please upgrade."

**Expected Result:**
- ✅ Expired tenants identified
- ✅ Status updated automatically
- ✅ Access blocked by middleware
- ✅ Clear error message displayed

---

## Reports Testing

### PART 33: Revenue Report

**Navigation:** Dashboard → Reports → Revenue Report

**Filters:**
- Start Date: Beginning of month
- End Date: Today
- Click "Generate Report"

**Check:**
- Total revenue (sum of all paid invoices)
- Revenue by subscription type
- Revenue trends (if chart available)
- Can export (if implemented)

**Expected Result:**
- ✅ Report generates
- ✅ Calculations accurate
- ✅ Data matches invoice records
- ✅ Filters work

---

### PART 34: Customer Analytics

**Navigation:** Dashboard → Reports → Customer Analytics

**Check:**
- Total customers
- Active vs inactive
- Customers by subscription type
- New customers this month
- Customer growth trend

**Expected Result:**
- ✅ Statistics accurate
- ✅ Charts display (if implemented)
- ✅ Breakdown correct

---

### PART 35: Outstanding Report

**Navigation:** Dashboard → Reports → Outstanding Report

**Shows:**
- List of unpaid invoices
- Total outstanding amount
- Grouped by:
  - Overdue
  - Due soon
  - Not due yet
- Customer details

**Expected Result:**
- ✅ All unpaid invoices listed
- ✅ Amounts sum correctly
- ✅ Can filter by date range
- ✅ Export works (if implemented)

---

## Export Data (CSV & Excel)

### PART 36: Export Reports

**Feature:** Export data from reports to CSV or Excel files (client-side, no backend required).

**Location:** Available on all report pages (Revenue, Payment, Customer Analytics, Usage, Outstanding)

**Steps:**
1. Go to any report page: **Reports → Revenue Report** (or any other)
2. Set date range (Start Date & End Date)
3. Click **"Load Report"** button
4. Once data loads, click:
   - **"Export CSV"** → downloads `.csv` file
   - **"Export Excel"** → downloads `.xlsx` file (multiple sheets)

**Excel file contents per report:**
- **Revenue Report:** "Monthly Revenue" sheet + "By Subscription Type" sheet
- **Payment Report:** "Daily Collection" + "By Payment Method" + "Outstanding" sheets
- **Outstanding Report:** "Outstanding Invoices" + "Aging Analysis" sheets
- **Usage Report:** "Usage Trends" + "High Consumers" sheets
- **Customer Analytics:** "Top Customers" + "Growth" + "Status" sheets

### PART 37: Export Invoice List

**Location:** Admin → Invoices

**Steps:**
1. Go to **Admin → Invoices**
2. Apply any filters (status, type, search) as needed
3. Click **"Export CSV"** or **"Export Excel"** button in the header
4. File downloads with current filtered data

### PART 38: Export Customer List

**Location:** Admin → Customers

**Steps:**
1. Go to **Admin → Customers**
2. Click **"Export"** button in the header
3. CSV file downloads with all customer data (meter number, name, address, phone, email, status)

---

## Bulk Import

### PART 39: Bulk Import Customers from CSV

**Location:** Admin → Customers → Bulk Import

**Steps:**
1. Go to **Admin → Customers**
2. Click **"Bulk Import"** button in the header
3. Download the template: click **"Download Template CSV"**
4. Fill the template with customer data:
   - Required columns: `meter_number`, `name`, `email`, `password`, `subscription_id`
   - Optional: `phone`, `address`
5. Drag & drop the filled CSV file onto the upload area (or click to browse)
6. Preview first 10 rows — verify data is correct
7. Click **"Import"** button
8. View result: success/failed/skipped counts + error details per row

**Common validation errors:**
- Missing required columns → error shown before import
- Duplicate `meter_number` or `email` → row skipped with reason
- Invalid `subscription_id` → row fails with error

### PART 40: Bulk Import Water Usage

**Location:** Admin → Water Usage → Bulk Import

**Steps:**
1. Go to **Admin → Water Usage**
2. Click **"Bulk Import"** button
3. Download CSV template
4. Fill template: `customer_id`, `previous_reading`, `current_reading`, `usage_month`
5. Upload, preview, and import

---

## Print Support

### PART 41: Print Invoice

**Location:** Admin → Invoices → Invoice Detail

**Steps:**
1. Go to **Admin → Invoices**
2. Click on any invoice to open detail
3. Click **"Print"** button (printer icon) in the top-right
4. Browser print dialog opens with print-optimized layout
5. Select printer or "Save as PDF"

**Notes:**
- Print layout hides navigation, buttons, and sidebar automatically
- Invoice shows full details: customer info, billing period, items, total, payment status

### PART 42: Print Invoice List

**Location:** Admin → Invoices (list page)

**Steps:**
1. Go to **Admin → Invoices**
2. Apply filters as needed (status, type, date range)
3. Click **"Print"** button in the header
4. Browser print dialog opens with list view

---

## Advanced Filtering & Search

### PART 43: Filter Invoices

**Location:** Admin → Invoices

The invoice list has a filter panel with:
- **Search:** type customer name or invoice number
- **Status filter:** All / Unpaid / Partial / Paid / Overdue
- **Type filter:** All / Monthly / Registration
- Click **"Clear"** to reset all filters

### PART 44: Filter Users (User Management)

**Location:** Admin → User Management

**Steps:**
1. Use search box to filter by name or email
2. Use **Role** dropdown to filter by: All / Meter Reader / Finance / Service
3. Click **"Clear"** to reset filters

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Cannot Login

**Symptoms:**
- "Invalid credentials" error
- Login button doesn't respond
- Infinite loading after clicking login

**Solutions:**

**A. For Admin Login:**
```
✅ Check credentials:
   - Email: admin@tirtasaas.com (no typos)
   - Password: admin123 (case-sensitive)
   - No extra spaces before/after

✅ Verify backend running:
   - Open: http://localhost:8081/api/health
   - Should return: {"status":"ok"}

✅ Check user exists:
   - Query database: SELECT * FROM users WHERE email='admin@tirtasaas.com'
   - Verify role = 'platform_owner'

✅ Browser issues:
   - Clear cache: Ctrl+Shift+Delete
   - Try incognito mode
   - Try different browser
   - Check console for errors (F12)
```

**B. For Customer Login:**
```
✅ Common mistakes:
   - Using admin email on customer login page
   - Customer must login at: /customer/login (not /admin/login)
   - Check customer is_active = true

✅ Password issues:
   - Default test password: customer123
   - Case-sensitive (customer123 ≠ Customer123)
```

---

#### 2. Trial Banner Not Showing

**Expected:** Banner at top showing "TRIAL MODE - X days remaining"

**Troubleshooting:**

```sql
-- Check tenant status and dates
SELECT 
  name, 
  status, 
  trial_ends_at,
  DATEDIFF(trial_ends_at, NOW()) as days_remaining
FROM tenants 
WHERE village_code = 'RT01RW05MAJU';

Expected results:
- status = 'TRIAL' or 'ACTIVE'
- trial_ends_at > NOW()
- days_remaining > 0
```

**Solutions:**
- ✅ Refresh page (Ctrl+R)
- ✅ Check localStorage for banner dismissal
- ✅ Verify tenant_id in JWT token
- ✅ Check DashboardLayout.tsx is loaded

---

#### 3. Invoice Generation Fails

**Error:** "Failed to generate invoices" or "No invoices generated"

**Common Causes:**

**A. No Water Usage Data:**
```sql
-- Check if customers have usage for the period
SELECT 
  c.name,
  c.meter_number,
  wu.reading_date,
  wu.previous_reading,
  wu.current_reading
FROM customers c
LEFT JOIN water_usage wu ON c.id = wu.customer_id
WHERE c.tenant_id = '[tenant-id]'
  AND MONTH(wu.reading_date) = [target-month]
  AND YEAR(wu.reading_date) = [target-year];

Expected: At least 1 row per customer
```

**B. No Water Rates Configured:**
```sql
-- Check water rates exist
SELECT 
  subscription_id,
  min_usage,
  max_usage,
  price_per_unit
FROM water_rates
WHERE tenant_id = '[tenant-id]';

Expected: Rates for all subscription types used by customers
```

**C. Period Already Generated:**
```sql
-- Check if invoices already exist for this period
SELECT 
  invoice_number,
  customer_id,
  invoice_date,
  period_month,
  period_year
FROM invoices
WHERE tenant_id = '[tenant-id]'
  AND period_month = [target-month]
  AND period_year = [target-year];

If rows exist: Invoices already generated (system prevents duplicates)
```

**Solutions:**
1. Record water usage for all customers first
2. Configure water rates for all subscription types
3. Choose a period that hasn't been generated yet
4. Check backend logs for specific error

---

#### 4. Payment Proof Upload Fails

**Error:** "Failed to upload file" or upload button disabled

**Validation Requirements:**
```
✅ File size: Max 5 MB
✅ File types: JPG, JPEG, PNG, PDF only
✅ File name: No special characters preferred
```

**Check:**

**A. File Size:**
```bash
# On Linux/Mac:
ls -lh payment-proof.jpg
# Should show < 5M

# On Windows:
# Right-click file → Properties → Size
```

**B. Backend Directory:**
```bash
# Check upload directory exists
ls -la tirta-saas-backend/uploads/payment-proofs/

# If doesn't exist, create:
mkdir -p tirta-saas-backend/uploads/payment-proofs/
chmod 755 tirta-saas-backend/uploads/payment-proofs/
```

**C. Network Issues:**
```
✅ Check browser console (F12) → Network tab
✅ Look for POST /api/payment-proofs
✅ Check response status (should be 200 or 201)
✅ Check response body for error details
```

**Solutions:**
- Compress image if > 5MB (use TinyPNG or similar)
- Convert to JPG if different format
- Check backend has write permissions
- Ensure invoice is in UNPAID status

---

#### 5. Statistics Not Updating

**Symptoms:**
- Dashboard shows old numbers
- Reports not reflecting recent changes
- Customer count wrong

**Quick Fixes:**
```
1. Hard refresh: Ctrl+Shift+R (clears cache)
2. Close and reopen browser tab
3. Logout and login again (refreshes JWT)
4. Check last API call time in Network tab
```

**Verify Data Changed:**
```sql
-- Example: Check customer count
SELECT COUNT(*) FROM customers WHERE tenant_id = '[tenant-id]';

-- Compare with dashboard display
-- If different, it's a frontend cache issue
```

**Backend Cache (if implemented):**
```bash
# Restart backend to clear any caches
# Kill process and restart:
cd tirta-saas-backend
go run main.go
```

---

#### 6. "Tenant Not Found" Error

**Symptoms:**
- Error appears after login
- Can't access any tenant features
- API returns 404 or 403

**Root Causes:**

**A. JWT Token Missing tenant_id:**
```javascript
// Check token in browser console:
localStorage.getItem('token')

// Decode at jwt.io
// Should contain:
{
  "user_id": "...",
  "tenant_id": "...",  // ← Must exist for tenant users
  "role": "tenant_admin"
}
```

**B. User Not Associated with Tenant:**
```sql
-- Check user-tenant relationship
SELECT 
  u.id,
  u.email,
  u.role,
  u.tenant_id
FROM users u
WHERE u.email = 'budi@rt01rw05.com';

Expected: tenant_id should NOT be NULL for tenant users
```

**Solutions:**
1. **Re-login** (generates fresh token)
2. **Check user creation** (tenant_id must be set during registration)
3. **Database fix** (if tenant_id is NULL):
   ```sql
   UPDATE users 
   SET tenant_id = '[correct-tenant-id]' 
   WHERE email = 'budi@rt01rw05.com';
   ```

---

#### 7. Reports Show Incorrect Data

**Symptoms:**
- Revenue report doesn't match invoice totals
- Customer analytics shows wrong counts
- Date filters not working

**Debugging Steps:**

**A. Verify Date Filters:**
```
✅ Check date format: YYYY-MM-DD
✅ Start date < End date
✅ Dates not in future (for historical data)
✅ Try removing filters (show all data)
```

**B. Manual Calculation:**
```sql
-- Example: Revenue Report
-- Backend query:
SELECT 
  SUM(total_amount) as total_revenue,
  SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN payment_status = 'UNPAID' THEN total_amount ELSE 0 END) as unpaid_revenue
FROM invoices
WHERE tenant_id = '[tenant-id]'
  AND invoice_date BETWEEN '[start]' AND '[end]';

-- Run this query in database
-- Compare with report display
```

**C. Check Timezone Issues:**
```
- Backend uses server timezone
- Frontend uses browser timezone
- Mismatch can cause date range issues
- Solution: Use UTC consistently or account for offset
```

---

#### 8. Scheduler Not Running

**Symptoms:**
- Invoices not auto-generated on 1st of month
- Overdue status not updated
- Trial expiry not detected

**Check Scheduler Status:**
```bash
# Backend logs should show:
[SCHEDULER] Invoice Generation Scheduler started (cron: 0 0 1 * *)
[SCHEDULER] Overdue Invoice Scheduler started (cron: 0 1 * * *)
[SCHEDULER] Trial Expiry Scheduler started (cron: 0 2 * * *)
```

**Verify Environment Variable:**
```env
# Check .env file:
ENABLE_SCHEDULERS=true

# If false or missing, schedulers won't start
```

**Manual Trigger (for testing):**
```bash
# Call scheduler endpoints directly:
curl -X POST http://localhost:8081/api/invoices/generate-monthly
curl -X POST http://localhost:8081/api/admin/check-overdue-invoices
curl -X POST http://localhost:8081/api/admin/check-trial-expiry
```

---

### Error Messages Reference

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Invalid credentials" | Email/password wrong | Check spelling, case-sensitivity |
| "Tenant not found" | User not linked to tenant | Re-login, check database |
| "Unauthorized access" | Permission denied | Check role, check tenant status |
| "Invoice already exists" | Duplicate prevention | Choose different period |
| "Customer not active" | Customer disabled | Activate customer first |
| "File too large" | Upload exceeds 5MB | Compress or resize file |
| "Invalid file type" | Wrong format | Use JPG/PNG/PDF only |
| "Trial expired" | 14 days passed | Upgrade subscription |
| "Network error" | Backend unreachable | Check backend running, check port |

---

### Getting Help

**Check Logs:**

**Backend Logs:**
```bash
# Terminal where backend is running
# Look for [ERROR] or [WARNING] tags
# Copy full error message
```

**Frontend Logs:**
```javascript
// Browser console (F12)
// Look for red error messages
// Check Network tab for failed API calls
```

**Database Issues:**
```sql
-- Check connection:
SHOW TABLES;

-- Check record counts:
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants
UNION ALL
SELECT 'customers', COUNT(*) FROM customers;
```

**Report Issue:**
When reporting bugs, include:
1. Steps to reproduce
2. Expected vs actual result
3. Error messages (exact text)
4. Screenshots (if UI issue)
5. Backend logs (if available)
6. Browser console output
7. Database state (if relevant)

---

## Test Data Summary

### Platform Owner
- Email: admin@tirtasaas.com
- Password: admin123

### Tenant (RT 01 RW 05)
- Admin Email: budi@rt01rw05.com
- Password: password123
- Village Code: RT01RW05MAJU

### Operational Users
- Meter Reader: ahmad@rt01rw05.com
- Finance: siti@rt01rw05.com
- Service: joko@rt01rw05.com

### Customers
1. Ibu Aminah - aminah@example.com (MTR-001)
2. Pak Budi - budi.customer@example.com (MTR-002)
3. Warung Makan - warung@example.com (MTR-003)
4. Ibu Siti - siti.customer@example.com (MTR-004)
5. Pak Joko - joko.customer@example.com (MTR-005)

All customer passwords: customer123

### Subscription Types
- Rumah Tangga (Rp 25,000/month)
- Usaha Kecil (Rp 50,000/month)

### Water Rates
- Rumah Tangga: Rp 5,000 (0-10m³), Rp 7,000 (11-20m³), Rp 9,000 (21+m³)
- Usaha Kecil: Rp 6,000 (0-20m³), Rp 8,000 (21-50m³), Rp 10,000 (51+m³)

---

## Testing Checklist

### Pre-Testing
- [ ] Backend running on port 8081
- [ ] Frontend running on port 5173
- [ ] Database is fresh/reset
- [ ] Test data prepared

### Platform Owner
- [ ] Login successful
- [ ] Configure payment settings
- [ ] View dashboard statistics
- [ ] Approve tenant registration
- [ ] Verify subscription payment
- [ ] View all tenants

### Tenant Admin
- [ ] Login successful
- [ ] Trial banner visible
- [ ] Create subscription types
- [ ] Configure water rates
- [ ] Configure payment settings
- [ ] Create operational users
- [ ] Add customers
- [ ] Record water usage
- [ ] Generate invoices
- [ ] Record payments
- [ ] View reports
- [ ] Submit subscription payment

### Customer
- [ ] Login successful
- [ ] View dashboard
- [ ] View invoices
- [ ] Submit payment proof
- [ ] View payment history
- [ ] View water usage
- [ ] Update profile
- [ ] Change password

### Admin Payment Verification
- [ ] View payment proofs
- [ ] Verify payment proof
- [ ] Reject payment proof
- [ ] Invoice status updated after verification

### Automation
- [ ] Invoice auto-generation
- [ ] Overdue status update
- [ ] Trial expiry check
- [ ] Schedulers running on time

### Reports
- [ ] Revenue report
- [ ] Customer analytics
- [ ] Payment report
- [ ] Usage report
- [ ] Outstanding report
- [ ] Export revenue to CSV
- [ ] Export revenue to Excel (multi-sheet)
- [ ] Export invoice list to CSV/Excel

### Export & Import
- [ ] Export customer list (CSV)
- [ ] Bulk import customers from CSV (with template download)
- [ ] Bulk import water usage from CSV
- [ ] Preview rows before import
- [ ] Import error reporting

### Print
- [ ] Print invoice detail
- [ ] Print invoice list

### Edge Cases
- [ ] Login with wrong password
- [ ] Upload oversized file
- [ ] Submit duplicate invoice
- [ ] Partial payment handling
- [ ] Expired tenant access blocked
- [ ] Generate invoices for same period twice

---

## Appendix

### API Endpoints Reference

**Authentication:**
- POST /api/auth/admin/login
- POST /api/auth/customer/login

**Tenants:**
- POST /api/public/register
- GET /api/platform/tenants
- POST /api/platform/tenants/:id/approve
- POST /api/platform/tenants/:id/reject

**Subscriptions:**
- GET /api/subscriptions
- POST /api/subscriptions
- PUT /api/subscriptions/:id

**Water Rates:**
- GET /api/water-rates
- POST /api/water-rates
- PUT /api/water-rates/:id

**Customers:**
- GET /api/customers
- POST /api/customers
- PUT /api/customers/:id
- POST /api/customers/:id/activate
- POST /api/customers/:id/deactivate

**Water Usage:**
- GET /api/water-usage
- POST /api/water-usage
- PUT /api/water-usage/:id

**Invoices:**
- GET /api/invoices
- POST /api/invoices/bulk-generate
- POST /api/invoices/preview-generation
- GET /api/invoices/:id

**Payments:**
- GET /api/payments
- POST /api/payments

**Payment Proofs:**
- GET /api/payment-proofs
- POST /api/payment-proofs
- POST /api/payment-proofs/:id/verify
- POST /api/payment-proofs/:id/reject

**Customer Portal:**
- GET /api/customer/profile
- PUT /api/customer/profile
- GET /api/customer/invoices
- GET /api/customer/payments
- GET /api/customer/water-usage

**Subscription Payments:**
- GET /api/tenant/subscription/status
- POST /api/tenant/subscription/payment
- GET /api/platform/subscription-payments
- PUT /api/platform/subscription-payments/:id/verify

**Reports:**
- GET /api/reports/revenue
- GET /api/reports/customers
- GET /api/reports/payments
- GET /api/reports/usage
- GET /api/reports/outstanding

---

**End of User Manual**

For technical issues or questions, please refer to:
- PROGRESS.md - Development progress
- FEATURE_STATUS.md - Feature completion status
- README.md - Project setup

**Version:** 1.0.2  
**Last Updated:** March 8, 2026  
**Status:** Production Ready

**Document Change Log:**

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 6, 2026 | Initial version |
| 1.0.1 | Jan 20, 2026 | Added Quick Start, improved troubleshooting, added known issues section, expanded error handling |
| 1.0.2 | Mar 8, 2026 | Added sections: Export CSV/Excel (PART 36-38), Bulk Import (PART 39-40), Print Support (PART 41-42), Advanced Filtering (PART 43-44). Updated TOC, checklist, API reference. Fixed customer_code export bug. E2E test script added (test-e2e-comprehensive.sh). |

---

**End of User Manual**

For additional documentation, refer to:
- **PROGRESS.md** - Development progress and session history
- **FEATURE_STATUS.md** - Feature completion status and roadmap
- **README.md** - Project setup and installation guide

For technical support:
- Check troubleshooting section above
- Review backend logs for errors
- Check browser console for frontend issues
- Verify database state with SQL queries

**Status:** Ready for Manual Testing ✅
