# Tirta SaaS - User Manual & Testing Guide

**Version:** 1.0  
**Date:** January 6, 2026  
**Purpose:** Complete manual for testing all features in correct order

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Pre-requisites](#pre-requisites)
3. [Testing Flow](#testing-flow)
4. [Platform Owner Guide](#platform-owner-guide)
5. [Tenant Admin Guide](#tenant-admin-guide)
6. [Customer Guide](#customer-guide)
7. [Troubleshooting](#troubleshooting)

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

### Backend Setup

```bash
cd tirta-saas-backend
go run main.go
# Server should run on http://localhost:8081
```

### Frontend Setup

```bash
cd tirta-saas-frontend
npm run dev
# Frontend should run on http://localhost:5173
```

### Default Platform Owner Account

**Email:** admin@tirtasaas.com  
**Password:** admin123  
**Role:** platform_owner

> ⚠️ **Important:** Change this password in production!

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

### PART 1: Initial Login

**URL:** http://localhost:5173/admin/login

**Steps:**
1. Open browser and navigate to login page
2. Enter credentials:
   - Email: `admin@tirtasaas.com`
   - Password: `admin123`
3. Click "Masuk"
4. Should redirect to Platform Owner Dashboard

**Expected Result:**
- ✅ Login successful
- ✅ Dashboard shows statistics
- ✅ Navigation menu visible (Tenants, Payments, Settings)

---

### PART 2: Configure Platform Payment Settings

**Why:** Tenants need to see where to send subscription payments

**Navigation:** Dashboard → Settings → Platform Payment Settings

**Steps:**

1. **Add Bank Account:**
   - Click "Add Bank Account"
   - Bank Name: `Bank BCA`
   - Account Number: `1234567890`
   - Account Holder: `PT Tirta Saas Indonesia`
   - Click "Add"

2. **Add Another Bank (Optional):**
   - Bank Name: `Bank Mandiri`
   - Account Number: `9876543210`
   - Account Holder: `PT Tirta Saas Indonesia`
   - Click "Add"

3. **Verify:**
   - Both bank accounts should appear in the list
   - Edit and delete buttons should work

**Expected Result:**
- ✅ Bank accounts saved successfully
- ✅ Will be visible to tenants during upgrade

---

### PART 3: Review Platform Dashboard

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

**URL:** http://localhost:5173/register

**Scenario:** RT 01 RW 05 wants to register

**Steps:**

1. **Navigate to Registration:**
   - Go to: http://localhost:5173/register
   - Or: Home → "Daftar Sekarang"

2. **Fill Organization Info:**
   - Organization Name: `RT 01 RW 05 Kelurahan Maju Jaya`
   - Village Code: `RT01RW05MAJU` (must be unique)
   - Address: `Jl. Merdeka No. 123, Jakarta`
   - Phone: `081234567890`
   - Email: `rt01rw05@example.com`

3. **Fill Admin Info:**
   - Admin Name: `Budi Santoso`
   - Admin Email: `budi@rt01rw05.com`
   - Admin Phone: `081234567890`
   - Password: `password123`
   - Confirm Password: `password123`

4. Click "Daftar"

**Expected Result:**
- ✅ Success message appears
- ✅ "Registration successful! You will be redirected to login..."
- ✅ Auto-redirect to /admin/login after 3 seconds
- ✅ Trial period: 14 days
- ✅ Status: TRIAL

**Data Created:**
- Tenant record (status: TRIAL)
- Admin user (role: tenant_admin)
- Default tenant_settings
- trial_ends_at = today + 14 days

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
- Email: `budi@rt01rw05.com`
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

## Troubleshooting

### Common Issues

**1. Cannot login**
- Check credentials spelling
- Verify user exists in database
- Check user role matches login page (admin vs customer)
- Clear browser cache/cookies

**2. Trial banner not showing**
- Check tenant status is TRIAL
- Check trial_ends_at is in future
- Refresh page
- Check localStorage (should not be dismissed today)

**3. Invoice generation fails**
- Verify customers have usage data
- Check water rates are configured
- Ensure subscription types assigned
- Check date/period not already generated

**4. Payment proof upload fails**
- Check file size < 5MB
- Verify file format (JPG, PNG, PDF only)
- Check backend upload directory exists
- Check file permissions

**5. Statistics not updating**
- Refresh page
- Check data actually changed in database
- Clear cache
- Check API response in browser console

**6. "Tenant not found" error**
- User may not be associated with tenant
- Check JWT token contains tenant_id
- Re-login to refresh token

**7. Reports show incorrect data**
- Check date filters
- Verify database records
- Check calculation logic
- Test with known data

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

**Version:** 1.0  
**Last Updated:** January 6, 2026  
**Status:** Ready for Testing
