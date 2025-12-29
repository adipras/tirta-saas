# Manual Testing Roadmap - Tirta SaaS
**Created:** December 26, 2024  
**Updated:** December 29, 2024  
**Purpose:** Panduan sistematis untuk melakukan pengujian manual melalui UI secara runtun

---

## 📋 Testing Prerequisites

### 1. Setup Awal
- [ ] Backend server berjalan di `http://localhost:8081`
- [ ] Frontend server berjalan di `http://localhost:5174`
- [ ] Database MySQL tersedia dan termigrasi
- [ ] File `.env` dikonfigurasi dengan benar di backend dan frontend
- [ ] Upload directory exists: `uploads/subscription-proofs/`

### 2. Data Awal yang Dibutuhkan
- [ ] Platform Owner account sudah ada di database:
  ```sql
  -- Email: admin@tirtasaas.com
  -- Password: admin123
  -- Role: platform_owner
  ```
- [ ] Koneksi database bersih atau gunakan data seed

---

## 🎯 Testing Flow Sequence (Berurutan & Runtun)

Testing dilakukan mengikuti **user journey** dari awal hingga akhir:

### **FASE 1: REGISTRASI & APPROVAL (20 menit)**
1. Tenant Registration - Pendaftaran tenant baru
2. Platform Owner Approval - Approve tenant & verify payment

### **FASE 2: SETUP OPERASIONAL (30 menit)**
3. Tenant Admin Setup - Konfigurasi master data & operasional
4. Customer Management - Create customer & data pemakaian

### **FASE 3: BILLING & PAYMENT (25 menit)**
5. Invoice Generation - Generate tagihan bulanan
6. Customer Payment - Customer bayar tagihan
7. Payment Verification - Admin verify pembayaran customer

### **FASE 4: MONITORING & REPORTS (15 menit)**
8. Customer Portal - Customer lihat tagihan & history
9. Reports & Analytics - Admin lihat laporan

**Total Estimated Time:** ~90 menit untuk full testing

---

## ═══════════════════════════════════════════════════════
## FASE 1: REGISTRASI & APPROVAL
## ═══════════════════════════════════════════════════════

## 1️⃣ TENANT REGISTRATION - Daftar sebagai Admin Tenant Baru

### 1.1 Akses Landing Page (2 menit)
**URL:** `http://localhost:5174/`

- [ ] **View Landing Page**
  - Verify: Hero section dengan value proposition
  - Check: Features showcase
  - Check: Pricing information
  - Check: "Daftar Sekarang" / "Register" button terlihat

- [ ] **Click Register Button**
  - Click "Daftar Sekarang" atau "Register"
  - Verify: Redirect ke `/register`

### 1.2 Tenant Registration Form (8 menit)
**URL:** `http://localhost:5174/register`

- [ ] **Fill Organization Information**
  - Organization Name: "PDAM Desa Sukamaju"
  - Village Code: "RT01RW05SUKAMAJU" (unique)
  - Address: "Jl. Merdeka No. 123, Sukamaju"
  - Phone: "081234567890"
  - Email: "admin@pdamsukamaju.com" (unique)

- [ ] **Fill Admin User Information**
  - Admin Name: "Budi Santoso"
  - Admin Email: "budi@pdamsukamaju.com" (unique)
  - Admin Phone: "081234567891"
  - Password: "admin123456"
  - Confirm Password: "admin123456"

- [ ] **Submit Registration**
  - Click "Daftar" button
  - Verify: Success message appears
  - Check: Shows trial period information (14 days)
  - Verify: Auto-redirect ke `/admin/login` setelah 3 detik

### 1.3 Tenant Admin Login - First Time (3 menit)
**URL:** `http://localhost:5174/admin/login`

- [ ] **Login dengan Credential Baru**
  - Email: `budi@pdamsukamaju.com`
  - Password: `admin123456`
  - Click "Login"
  - Verify: Redirect ke dashboard

- [ ] **Check Trial Status**
  - Verify: **Trial Banner** muncul di atas (yellow/orange)
  - Check: Menampilkan "TRIAL MODE - 14 days remaining"
  - Check: Tombol "Upgrade Now" terlihat
  - Verify: Dashboard menampilkan data kosong (belum ada customer)

### 1.4 Subscription Upgrade - Submit Payment (7 menit)
**URL:** Di dalam dashboard tenant admin

- [ ] **Click "Upgrade Now" dari Trial Banner**
  - Verify: Redirect ke `/admin/subscription/upgrade`

- [ ] **Choose Subscription Plan**
  - View 3 plan cards: BASIC (Rp 500K), PRO (Rp 1.5M), ENTERPRISE (Rp 3M)
  - Select plan: **PRO**
  - Choose billing period: **1 Month**
  - Verify: Order summary shows:
    - Plan: PRO
    - Period: 1 Month
    - Total: Rp 1,500,000
  - Click "Continue to Payment"
  - Verify: Redirect ke `/admin/subscription/payment`

- [ ] **View Payment Instructions**
  - Check: Bank transfer information displayed
  - Check: QR Code displayed (if configured)
  - Note down: Bank account details

- [ ] **Fill Payment Confirmation Form**
  - Payment Date: (Today's date)
  - Payment Method: "Bank Transfer"
  - Account Number: "9876543210"
  - Account Name: "Budi Santoso"
  - Reference Number: "TRF20241229001"
  - Notes: "Transfer via mobile banking BCA"

- [ ] **Upload Payment Proof**
  - Click upload area
  - Select file: Image (JPG/PNG) atau PDF (max 5MB)
  - Verify: Preview muncul (untuk gambar)
  - Check: File name displayed

- [ ] **Submit Payment**
  - Check checkbox: "I confirm that I have completed the payment"
  - Click "Submit Payment"
  - Verify: Success alert dengan Confirmation ID (SUB-YYYYMMDD-XXXXX)
  - Verify: Redirect ke `/admin/subscription/status`

- [ ] **View Subscription Status**
  - Check: Status shows "PENDING VERIFICATION"
  - Check: Pending payment info displayed:
    - Payment ID
    - Status: PENDING
    - Submitted date
  - Verify: Trial Banner berubah menampilkan "PAYMENT PENDING"

---

## 2️⃣ PLATFORM OWNER - Approve Tenant & Verify Payment

### 2.1 Platform Owner Login (2 menit)
**URL:** `http://localhost:5174/admin/login`

- [ ] **Logout dari Tenant Admin** (jika masih login)
  - Click profile menu → Logout

- [ ] **Login sebagai Platform Owner**
  - Email: `admin@tirtasaas.com`
  - Password: `admin123`
  - Verify: Redirect ke platform dashboard
  - Check: Role badge menampilkan "Platform Owner"

### 2.2 Approve Tenant Registration (5 menit)
**URL:** `http://localhost:5174/admin/platform/tenants`

- [ ] **View Pending Tenants**
  - Click tab "Pending Review"
  - Verify: Tenant "PDAM Desa Sukamaju" muncul
  - Check: Status badge shows "TRIAL" atau "PENDING_VERIFICATION"
  - Check: Trial expiry date displayed

- [ ] **View Tenant Details**
  - Click "View" button pada tenant
  - Verify: Modal shows complete information:
    - Organization details
    - Village code
    - Admin contact
    - Registration date
    - Trial period

- [ ] **Approve Tenant** (Optional - jika masih TRIAL)
  - Click "Approve" button
  - Enter notes (optional): "Approved - Welcome to Tirta SaaS"
  - Click "Confirm Approve"
  - Verify: Success message
  - Check: Tenant status berubah ke "ACTIVE" atau tetap "PENDING_VERIFICATION"

### 2.3 Verify Subscription Payment (8 menit)
**URL:** `http://localhost:5174/admin/platform/subscription-payments`

- [ ] **View Subscription Payments List**
  - Navigate to "Subscription Payments" menu
  - Verify: Statistics dashboard shows:
    - Pending Verification: 1
    - Verified: 0
    - Rejected: 0

- [ ] **Search & Filter**
  - Search by tenant name: "Sukamaju"
  - Verify: Payment dari PDAM Sukamaju muncul
  - Filter by status: "Pending"
  - Check: Only pending payments shown

- [ ] **View Payment Details**
  - Click "View" button
  - Verify: Modal opens dengan detail lengkap:
    - Tenant: PDAM Desa Sukamaju
    - Plan: PRO
    - Amount: Rp 1,500,000
    - Billing Period: 1 month
    - Payment Date: (sesuai input)
    - Payment Method: Bank Transfer
    - Account details
    - Reference number

- [ ] **Review Payment Proof**
  - Check: Payment proof image/PDF displayed
  - For image: Verify gambar terlihat jelas
  - For PDF: Click "View PDF" link
  - Assess: Bukti valid atau tidak

- [ ] **Verify Payment - APPROVE**
  - Click "Verify" button (jika bukti valid)
  - Enter verification notes (optional): "Payment verified - matching reference number"
  - Click "Verify & Activate"
  - Verify: Success alert
  - Check: Payment status → "VERIFIED"
  - Check: Tenant status → "ACTIVE"

  **ATAU**

- [ ] **Reject Payment - REJECT** (Alternative test)
  - Click "Reject" button (jika bukti tidak valid)
  - Enter rejection reason (required): "Bukti transfer tidak jelas, mohon upload ulang"
  - Click "Reject"
  - Verify: Success alert
  - Check: Payment status → "REJECTED"
  - Check: Tenant status tetap "TRIAL" atau "PENDING_VERIFICATION"

### 2.4 Verify Tenant Activation (2 menit)

- [ ] **Check Tenant List**
  - Go back to `/admin/platform/tenants`
  - Click tab "All Tenants"
  - Verify: PDAM Sukamaju status = "ACTIVE"
  - Check: Subscription start & end dates terisi
  - Check: Subscription plan = "PRO"

---

## ═══════════════════════════════════════════════════════
## FASE 2: SETUP OPERASIONAL
## ═══════════════════════════════════════════════════════

## 3️⃣ TENANT ADMIN SETUP - Konfigurasi Master Data

### 3.1 Login Kembali sebagai Tenant Admin (2 menit)
**URL:** `http://localhost:5174/admin/login`

- [ ] **Logout dari Platform Owner**
  - Click profile menu → Logout

- [ ] **Login sebagai Tenant Admin (PDAM Sukamaju)**
  - Email: `budi@pdamsukamaju.com`
  - Password: `admin123456`
  - Verify: Redirect ke dashboard
  - Check: Trial Banner **HILANG** (karena sudah ACTIVE)
  - Verify: Dashboard role = "Tenant Admin"

### 3.2 Tenant Payment Settings (5 menit)
**URL:** `http://localhost:5174/admin/settings/payment`

- [ ] **Add Bank Account untuk Tenant**
  - Navigate to "Settings" → "Payment Settings"
  - Click "Add Bank Account"
  - Fill form:
    - Bank Name: "Bank Mandiri"
    - Account Number: "1234567890123"
    - Account Name: "PDAM Desa Sukamaju"
    - Branch: "Cabang Sukamaju"
  - Mark as Primary
  - Click "Save"
  - Verify: Bank account muncul di list

- [ ] **Add QR Code Payment untuk Tenant**
  - Click "Add QR Code"
  - Provider: "GoPay"
  - Account Number: "081234567890"
  - Upload QR image (PNG/JPG max 2MB)
  - Mark as Active
  - Click "Save"
  - Verify: QR code preview muncul

### 3.3 Subscription Types / Paket Berlangganan (5 menit)
**URL:** `http://localhost:5174/admin/subscriptions`

- [ ] **Create Subscription Type - RUMAH TANGGA**
  - Click "Create Subscription Type"
  - Fill form:
    - Name: "Paket Rumah Tangga"
    - Code: "RT"
    - Description: "Paket untuk rumah tangga biasa"
    - Base Price: 15000
    - Additional Features: "Meter air dasar"
    - Is Active: Yes
  - Click "Save"
  - Verify: Muncul di list

- [ ] **Create Subscription Type - USAHA KECIL**
  - Click "Create Subscription Type"
  - Fill form:
    - Name: "Paket Usaha Kecil"
    - Code: "UK"
    - Description: "Paket untuk usaha kecil/warung"
    - Base Price: 25000
    - Is Active: Yes
  - Click "Save"

- [ ] **View Subscription List**
  - Verify: 2 paket muncul
  - Check: Sorting & pagination works
  - Check: Edit & delete buttons available

### 3.4 Water Rates / Tarif Air (5 menit)
**URL:** `http://localhost:5174/admin/water-rates`

- [ ] **Create Water Rate - Tarif Dasar**
  - Click "Create Water Rate"
  - Fill form:
    - Rate Name: "Tarif Rumah Tangga 2024"
    - Min Usage: 0
    - Max Usage: 10 (m³)
    - Price per Unit: 5000
    - Effective Date: (Today)
    - Is Active: Yes
    - Linked to Subscription: "Paket Rumah Tangga"
  - Click "Save"
  - Verify: Muncul di list

- [ ] **Create Water Rate - Tarif Tinggi**
  - Click "Create Water Rate"
  - Fill form:
    - Rate Name: "Tarif Rumah Tangga Tinggi 2024"
    - Min Usage: 11
    - Max Usage: 999
    - Price per Unit: 7500
    - Effective Date: (Today)
    - Is Active: Yes
    - Linked to Subscription: "Paket Rumah Tangga"
  - Click "Save"

- [ ] **View Rate History**
  - Click "Rate History" button
  - Verify: Historical rates displayed
  - Check: Effective dates shown

---

## 4️⃣ CUSTOMER MANAGEMENT - Create Customer & Operasional

### 4.1 Create Customers (10 menit)
**URL:** `http://localhost:5174/admin/customers`

- [ ] **Create Customer 1 - Bapak Ahmad**
  - Click "Add Customer" button
  - Fill form:
    - Customer Number: "CUST-001" (auto-generated atau manual)
    - Name: "Ahmad Wijaya"
    - Address: "Jl. Mawar No. 10, RT 01/RW 05"
    - Phone: "081234567892"
    - Email: "ahmad@example.com"
    - Subscription Type: "Paket Rumah Tangga"
    - Meter Number: "MTR-001"
    - Initial Meter Reading: 100
    - Connection Date: (Today)
    - Status: Active
  - Click "Save"
  - Verify: Customer muncul di list

- [ ] **Create Customer 2 - Ibu Siti**
  - Click "Add Customer" button
  - Fill form:
    - Customer Number: "CUST-002"
    - Name: "Siti Aminah"
    - Address: "Jl. Melati No. 15, RT 01/RW 05"
    - Phone: "081234567893"
    - Email: "siti@example.com"
    - Subscription Type: "Paket Rumah Tangga"
    - Meter Number: "MTR-002"
    - Initial Meter Reading: 50
    - Status: Active
  - Click "Save"

- [ ] **Create Customer 3 - Pak Budi (Warung)**
  - Click "Add Customer"
  - Fill form:
    - Customer Number: "CUST-003"
    - Name: "Budi Hartono"
    - Address: "Jl. Kenanga No. 20, RT 01/RW 05"
    - Phone: "081234567894"
    - Email: "budi.warung@example.com"
    - Subscription Type: "Paket Usaha Kecil"
    - Meter Number: "MTR-003"
    - Initial Meter Reading: 200
    - Status: Active
  - Click "Save"

- [ ] **View Customer List**
  - Verify: 3 customers muncul
  - Check: Search by name works
  - Check: Filter by status works
  - Check: Pagination works

### 4.2 Water Usage / Pencatatan Meter (8 menit)
**URL:** `http://localhost:5174/admin/usage`

- [ ] **Record Meter Reading - Customer 1**
  - Click "Add Meter Reading" atau navigate to usage page
  - Select Customer: "Ahmad Wijaya (CUST-001)"
  - Fill form:
    - Reading Date: (Today atau end of month)
    - Previous Reading: 100 (auto-filled from initial)
    - Current Reading: 115
    - Usage: 15 m³ (auto-calculated)
    - Reading Period: "December 2024"
    - Notes: "Normal usage"
    - Photo: (Optional) upload meter photo
  - Click "Save"
  - Verify: Usage recorded

- [ ] **Record Meter Reading - Customer 2**
  - Click "Add Meter Reading"
  - Select Customer: "Siti Aminah (CUST-002)"
  - Fill form:
    - Previous Reading: 50
    - Current Reading: 58
    - Usage: 8 m³
    - Reading Period: "December 2024"
  - Click "Save"

- [ ] **Record Meter Reading - Customer 3**
  - Click "Add Meter Reading"
  - Select Customer: "Budi Hartono (CUST-003)"
  - Fill form:
    - Previous Reading: 200
    - Current Reading: 225
    - Usage: 25 m³
    - Reading Period: "December 2024"
  - Click "Save"

- [ ] **View Usage List**
  - Verify: 3 usage records muncul
  - Check: Usage calculation correct
  - Check: Filter by period works
  - Click "View History" pada customer
  - Verify: Historical usage displayed

---

## ═══════════════════════════════════════════════════════
## FASE 3: BILLING & PAYMENT
## ═══════════════════════════════════════════════════════

## 5️⃣ INVOICE GENERATION - Generate Tagihan Bulanan

### 5.1 Bulk Invoice Generation (10 menit)
**URL:** `http://localhost:5174/admin/invoices/bulk-generate`

- [ ] **Preview Invoice Generation**
  - Navigate to "Invoices" → "Bulk Generate"
  - Select Period: "December 2024"
  - Select Year: 2024
  - Click "Preview Generation"
  - Verify: Preview table shows:
    - Customer 1 (Ahmad): 15 m³ × tariff
    - Customer 2 (Siti): 8 m³ × tariff
    - Customer 3 (Budi): 25 m³ × tariff
  - Check: Total amount calculated correctly
  - Check: Penalty calculation (if any overdue)

- [ ] **Generate Invoices**
  - Review preview
  - Click "Generate Invoices"
  - Verify: Success message
  - Check: Summary shows:
    - Total Invoices: 3
    - Total Amount: Rp XXX,XXX
    - Generation time
  - Click "View Invoices"

### 5.2 View & Manage Invoices (5 menit)
**URL:** `http://localhost:5174/admin/invoices`

- [ ] **View Invoice List**
  - Verify: 3 invoices generated
  - Check: Invoice numbers sequential (INV-202412-0001, 0002, 0003)
  - Check: Status: UNPAID
  - Check: Due dates calculated (e.g., 10 days from now)
  - Check: Amounts match preview

- [ ] **View Invoice Detail**
  - Click "View" pada invoice pertama (Ahmad)
  - Verify: Invoice detail shows:
    - Customer info
    - Usage details (15 m³)
    - Rate breakdown:
      - 0-10 m³: 10 × Rp 5,000 = Rp 50,000
      - 11-15 m³: 5 × Rp 7,500 = Rp 37,500
    - Subtotal: Rp 87,500
    - Admin fee (if any)
    - Total: Rp 87,500 + fees
    - Due date
    - Status: UNPAID

- [ ] **Print Invoice** (Optional)
  - Click "Print" button
  - Verify: PDF generated
  - Check: Format professional

---

## 6️⃣ CUSTOMER PORTAL - Customer Lihat & Bayar Tagihan

### 6.1 Customer Login (3 menit)
**URL:** `http://localhost:5174/customer/login`

- [ ] **Logout dari Tenant Admin**
  - Logout dari dashboard admin

- [ ] **Login sebagai Customer (Ahmad Wijaya)**
  - Email: `ahmad@example.com`
  - Password: (Set password dulu jika belum ada - via forgot password atau admin reset)
  - Alternatively: Use customer number untuk login
  - Verify: Redirect ke customer dashboard

### 6.2 View Invoices (Customer View) (5 menit)
**URL:** `http://localhost:5174/customer/invoices`

- [ ] **View Invoice List**
  - Navigate to "Invoices" menu
  - Verify: Invoice December 2024 muncul
  - Check: Status badge: UNPAID (red/yellow)
  - Check: Amount: Rp 87,500
  - Check: Due date displayed

- [ ] **View Invoice Detail**
  - Click "View Detail" pada invoice
  - Verify: Shows complete invoice information:
    - Usage: 15 m³
    - Rate breakdown
    - Total amount
    - Due date
    - Payment instructions
  - Check: "Pay Now" button visible

### 6.3 View Usage History (5 menit)
**URL:** `http://localhost:5174/customer/usage`

- [ ] **View Water Usage History**
  - Navigate to "Usage" menu
  - Verify: Usage history displayed:
    - December 2024: 15 m³
    - Previous month (if any)
  - Check: Chart/graph shows usage trend
  - Check: Can filter by period (last 3 months, 6 months, 1 year)

- [ ] **View Usage Details**
  - Click detail pada usage record
  - Verify: Shows:
    - Reading date
    - Previous meter reading: 100
    - Current meter reading: 115
    - Usage: 15 m³
    - Meter photo (if uploaded)

### 6.4 Submit Payment Confirmation (7 menit)
**URL:** `http://localhost:5174/customer/payments/new`

- [ ] **Access Payment Page**
  - From invoice detail, click "Pay Now"
  - OR navigate to "Payments" → "New Payment"
  - Select invoice: December 2024
  - Verify: Redirect to payment info page

- [ ] **View Payment Instructions**
  - Check: Bank transfer details displayed (from tenant settings)
  - Check: QR Code displayed (GoPay)
  - Note: Account number to transfer

- [ ] **Fill Payment Confirmation Form**
  - Invoice: (pre-selected) December 2024 - Rp 87,500
  - Payment Date: (Today)
  - Payment Method: "Bank Transfer"
  - Bank Name: "Bank Mandiri"
  - Account Name: "Ahmad Wijaya"
  - Reference/Transaction Number: "TRF20241229002"
  - Amount: Rp 87,500 (read-only from invoice)
  - Notes: "Transfer via mobile banking"

- [ ] **Upload Payment Proof**
  - Click upload area
  - Select image/PDF (max 5MB)
  - Verify: Preview displayed
  - Check: File name shown

- [ ] **Submit Payment**
  - Check checkbox: "I confirm the payment is correct"
  - Click "Submit Payment"
  - Verify: Success message
  - Check: Payment confirmation ID generated
  - Verify: Redirect to payment success page or list

### 6.5 View Payment Status (2 menit)
**URL:** `http://localhost:5174/customer/payments` atau `/customer/invoices`

- [ ] **Check Payment Status**
  - Navigate to "Payments" or "Invoices"
  - Verify: Invoice status changed to "PENDING VERIFICATION"
  - Check: Payment submission date displayed
  - Check: Can view payment details (proof, reference number)

---

## 7️⃣ ADMIN VERIFY PAYMENT - Verifikasi Pembayaran Customer

### 7.1 Login sebagai Tenant Admin (2 menit)
**URL:** `http://localhost:5174/admin/login`

- [ ] **Logout dari Customer Portal**
  - Logout

- [ ] **Login sebagai Tenant Admin**
  - Email: `budi@pdamsukamaju.com`
  - Password: `admin123456`
  - Verify: Redirect ke admin dashboard

### 7.2 Payment Verification (8 menit)
**URL:** `http://localhost:5174/admin/payment-verification` atau `/admin/payments`

- [ ] **View Pending Payments**
  - Navigate to "Payment Verification" atau "Payments"
  - Filter: Status = "Pending Verification"
  - Verify: Payment dari Ahmad Wijaya muncul
  - Check: Invoice info, amount, submission date

- [ ] **View Payment Detail**
  - Click "View" pada payment
  - Verify: Modal/page shows:
    - Customer: Ahmad Wijaya
    - Invoice: December 2024
    - Amount: Rp 87,500
    - Payment date
    - Payment method: Bank Transfer
    - Reference number: TRF20241229002
    - Account name
    - Payment proof image/PDF

- [ ] **Review Payment Proof**
  - View uploaded proof
  - For image: Check if transfer receipt clear
  - For PDF: Open and verify
  - Match: Reference number with proof
  - Match: Amount with invoice

- [ ] **Verify Payment - APPROVE**
  - If proof valid:
    - Click "Verify" or "Approve" button
    - Enter verification notes (optional): "Payment verified via bank statement"
    - Click "Confirm Verification"
    - Verify: Success message
    - Check: Payment status → "VERIFIED" or "PAID"
    - Check: Invoice status → "PAID"

  **ATAU**

- [ ] **Reject Payment** (Alternative test)
  - If proof invalid:
    - Click "Reject" button
    - Enter rejection reason (required): "Jumlah transfer tidak sesuai"
    - Click "Confirm Rejection"
    - Verify: Success message
    - Check: Payment status → "REJECTED"
    - Check: Invoice status tetap "UNPAID"

### 7.3 Verify Invoice Status Update (2 menit)
**URL:** `http://localhost:5174/admin/invoices`

- [ ] **Check Invoice List**
  - Navigate to invoices
  - Find invoice Ahmad Wijaya - December 2024
  - Verify: Status badge = "PAID" (green)
  - Check: Paid date filled
  - Check: Payment amount matches invoice

- [ ] **View Invoice Detail**
  - Click detail pada invoice
  - Verify: Payment history section shows:
    - Payment date
    - Amount paid
    - Payment method
    - Reference number
    - Verified by: (Admin name)
    - Verified at: (Timestamp)

---

## ═══════════════════════════════════════════════════════
## FASE 4: MONITORING & REPORTS
## ═══════════════════════════════════════════════════════

## 8️⃣ CUSTOMER PORTAL - Lihat Status Setelah Verifikasi

### 8.1 Customer Check Payment Status (3 menit)
**URL:** `http://localhost:5174/customer/login`

- [ ] **Login kembali sebagai Customer**
  - Email: `ahmad@example.com`
  - Password: (customer password)
  - Verify: Login successful

- [ ] **View Invoice Status**
  - Navigate to "Invoices"
  - Verify: December 2024 invoice status = "PAID" (green badge)
  - Check: "Paid" label displayed
  - Check: Payment date shown
  - Check: Receipt download available (if implemented)

- [ ] **View Payment History**
  - Navigate to "Payment History" or "Payments"
  - Verify: Payment record muncul dengan status "VERIFIED"
  - Check: Details:
    - Payment date
    - Amount paid: Rp 87,500
    - Method: Bank Transfer
    - Reference: TRF20241229002
    - Verification status: Verified
    - Verified date

---

## 9️⃣ REPORTS & ANALYTICS - Admin Lihat Laporan

### 9.1 Revenue Report (5 menit)
**URL:** `http://localhost:5174/admin/reports/revenue`

- [ ] **View Revenue Dashboard**
  - Navigate to "Reports" → "Revenue Report"
  - Select period: December 2024
  - Verify: Summary cards show:
    - Total Revenue: (sum of paid invoices)
    - Total Invoices: 3
    - Paid Invoices: 1
    - Outstanding: 2
  - Check: Chart displays revenue trend

- [ ] **Export Report**
  - Click "Export to Excel" or "Export to PDF"
  - Verify: File downloads
  - Open file: Check data accuracy

### 9.2 Outstanding Payments Report (3 menit)
**URL:** `http://localhost:5174/admin/reports/outstanding`

- [ ] **View Outstanding Report**
  - Navigate to "Reports" → "Outstanding Payments"
  - Verify: List shows unpaid invoices:
    - Customer 2 (Siti): Rp XXX
    - Customer 3 (Budi): Rp XXX
  - Check: Aging analysis (overdue days)
  - Check: Total outstanding amount

### 9.3 Usage Report (3 menit)
**URL:** `http://localhost:5174/admin/reports/usage`

- [ ] **View Water Usage Report**
  - Navigate to "Reports" → "Usage Report"
  - Select period: December 2024
  - Verify: Summary shows:
    - Total usage: 48 m³ (15 + 8 + 25)
    - Average usage per customer
    - Highest usage customer (Budi: 25 m³)
  - Check: Usage by subscription type breakdown
  - Check: Chart displays distribution

### 9.4 Customer Analytics (2 menit)
**URL:** `http://localhost:5174/admin/reports/customers`

- [ ] **View Customer Analytics**
  - Navigate to "Reports" → "Customer Analytics"
  - Verify: Stats show:
    - Total active customers: 3
    - New customers this month: 3
    - Payment compliance rate: 33% (1 out of 3 paid)
  - Check: Customer growth trend chart

---

## ═══════════════════════════════════════════════════════
## ADDITIONAL TESTING (OPTIONAL)
## ═══════════════════════════════════════════════════════

## 🔟 ADDITIONAL FEATURES (Optional - jika ada waktu)

### 10.1 Test Remaining Customer Payments (10 menit)

Ulangi proses Customer Payment & Verification untuk customer lain:

- [ ] **Customer 2 (Siti) - Submit Payment**
  - Login sebagai Siti Aminah
  - Submit payment untuk invoice December
  - Upload bukti bayar
  - Logout

- [ ] **Customer 3 (Budi) - Submit Payment**
  - Login sebagai Budi Hartono (Warung)
  - Submit payment untuk invoice December
  - Upload bukti bayar
  - Logout

- [ ] **Admin Verify All Payments**
  - Login sebagai tenant admin
  - Verify payment Customer 2
  - Verify payment Customer 3
  - Check: All invoices status = PAID

### 10.2 Test Overdue & Penalty (5 menit)

- [ ] **Simulate Overdue Invoice**
  - As admin, create invoice with past due date
  - Wait or manually update due date
  - Verify: Status changes to OVERDUE
  - Check: Penalty amount calculated automatically
  - View invoice: Penalty amount displayed

### 10.3 Test Edit & Delete Operations (5 menit)

- [ ] **Edit Customer**
  - Select a customer
  - Click "Edit"
  - Update phone number
  - Save
  - Verify: Changes reflected

- [ ] **Edit Water Rate**
  - Go to water rates
  - Edit tariff
  - Update price per unit
  - Save with new effective date
  - Verify: Rate history updated

- [ ] **Delete Subscription Type** (if allowed)
  - Create test subscription type
  - Try to delete
  - Check: Validation if linked to customers
  - Delete if not linked
  - Verify: Removed from list

---

## ═══════════════════════════════════════════════════════
## TESTING CHECKLIST SUMMARY
## ═══════════════════════════════════════════════════════

## ✅ Testing Checklist Summary

### FASE 1: Registrasi & Approval (20 menit)
- [ ] Tenant Registration (landing page → form → submit)
- [ ] Tenant Login pertama kali
- [ ] Subscription Upgrade (pilih plan → submit payment)
- [ ] Platform Owner Login
- [ ] Approve Tenant (if needed)
- [ ] Verify Subscription Payment

### FASE 2: Setup Operasional (30 menit)
- [ ] Tenant Admin Login kembali (sudah ACTIVE)
- [ ] Setup Payment Settings (bank & QR)
- [ ] Create Subscription Types (2 paket)
- [ ] Create Water Rates (2 tarif)
- [ ] Create Customers (3 customer)
- [ ] Record Meter Readings (3 usage)

### FASE 3: Billing & Payment (25 menit)
- [ ] Bulk Invoice Generation (preview → generate)
- [ ] View Invoices (admin side)
- [ ] Customer Login
- [ ] View Invoices (customer side)
- [ ] View Usage History (customer)
- [ ] Submit Payment Confirmation (upload bukti)
- [ ] Admin Verify Payment (approve/reject)
- [ ] Check Invoice Status Updated

### FASE 4: Monitoring & Reports (15 menit)
- [ ] Customer check payment status after verification
- [ ] Revenue Report
- [ ] Outstanding Payments Report
- [ ] Usage Report
- [ ] Customer Analytics

### OPTIONAL: Additional Testing (20 menit)
- [ ] Test remaining 2 customer payments
- [ ] Test overdue & penalty calculation
- [ ] Test edit & delete operations

---

## 📊 Testing Metrics

**Total Test Steps:** ~150+  
**Estimated Time:** 90-110 minutes  
**Roles Tested:** 3 (Platform Owner, Tenant Admin, Customer)  
**Main Flows:** 4 major flows  
**Critical Paths:** 2 (Registration → Activation, Billing → Payment)

---

## 🐛 Common Issues to Watch For

### Registration & Approval
- ❗ Trial banner tidak muncul setelah registration
- ❗ Subscription payment upload gagal (file size/type)
- ❗ Payment status tidak update setelah verification

### Setup & Configuration
- ❗ Tarif tidak ter-apply ke customer yang benar
- ❗ Subscription type tidak bisa di-link ke customer
- ❗ Payment settings tidak muncul di customer payment page

### Billing & Payment
- ❗ Invoice amount calculation salah (tarif bertingkat)
- ❗ Penalty tidak ter-calculate otomatis
- ❗ Customer tidak bisa upload bukti bayar (file size limit)
- ❗ Payment verification tidak update invoice status

### Reports
- ❗ Data tidak muncul di report
- ❗ Export report gagal
- ❗ Chart tidak render

---

## 🔧 Troubleshooting Tips

### If Registration Fails:
1. Check: Email & village code uniqueness
2. Check: Password requirements met
3. Check: Backend server running
4. Check: Database connection

### If Payment Upload Fails:
1. Check: File size < 5MB
2. Check: File type (JPG, PNG, PDF only)
3. Check: Upload directory writable
4. Check: Server has disk space

### If Invoice Calculation Wrong:
1. Verify: Water rates configured correctly
2. Check: Usage recorded properly
3. Check: Tarif tier boundaries (0-10, 11+)
4. Review: Base price vs per-unit price

### If Report Shows No Data:
1. Ensure: Invoices generated
2. Ensure: Payments recorded
3. Check: Date filter matches data period
4. Refresh: Browser cache

---

## 📋 Bug Report Template

```markdown
**Bug ID:** TIRTA-XXX
**Title:** [Short description]
**Severity:** Critical / High / Medium / Low
**Priority:** P0 / P1 / P2 / P3

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach if applicable]

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Backend: v1.0.0
- Frontend: v1.0.0

**Additional Info:**
[Any other relevant information]
```

---

## 📝 Testing Session Results Template

```markdown
## Testing Session Results
**Date:** YYYY-MM-DD
**Tester:** [Your Name]
**Duration:** [Time taken]
**Environment:** Development / Staging / Production

### Summary
- Total Test Cases: XX
- ✅ Passed: XX
- ❌ Failed: XX
- ⏸️ Blocked: XX
- ⏭️ Skipped: XX

### Test Coverage
- FASE 1 (Registration): XX% complete
- FASE 2 (Setup): XX% complete
- FASE 3 (Billing): XX% complete
- FASE 4 (Reports): XX% complete

### Critical Issues Found
1. **[CRITICAL]** [Issue title] - [Brief description]
2. **[HIGH]** [Issue title] - [Brief description]

### Passed Flows
1. ✅ Tenant Registration → Approval → Active
2. ✅ Customer Creation → Usage Recording → Invoice Generation
3. ✅ Customer Payment → Admin Verification → Invoice Paid

### Failed/Blocked Flows
1. ❌ [Flow name] - [Reason]
2. ⏸️ [Flow name] - [Blocking issue]

### Recommendations
1. Fix critical bugs before next release
2. Improve error messages in payment upload
3. Add loading indicators during invoice generation
4. Enhance mobile responsiveness for customer portal

### Next Steps
- [ ] Fix critical bugs (TIRTA-XXX, TIRTA-YYY)
- [ ] Re-test failed cases
- [ ] Deploy to staging for UAT
- [ ] Prepare production deployment checklist
```

---

## 🎯 Tips for Effective Testing

### Before Testing
1. ✅ **Clear browser cache** and cookies
2. ✅ **Backup database** before destructive tests
3. ✅ **Prepare test data** (images, PDFs for upload)
4. ✅ **Have multiple browser tabs** ready for different roles
5. ✅ **Use incognito mode** for testing multiple users simultaneously

### During Testing
1. 📝 **Follow the sequence** - Test in order (FASE 1 → 2 → 3 → 4)
2. 📸 **Take screenshots** of any unexpected behavior
3. 🐛 **Document bugs immediately** - Don't rely on memory
4. ⏱️ **Note timestamps** when bugs occur
5. 💾 **Save test data** (customer numbers, invoice IDs) for reference

### After Testing
1. 📊 **Fill out session results** template
2. 🐛 **File bug reports** for all issues found
3. 📧 **Communicate with dev team** about critical issues
4. 🔄 **Plan re-test schedule** after fixes
5. 📚 **Update test cases** if flows changed

### Testing Best Practices
- ✅ Test **happy path** first (everything works perfectly)
- ✅ Test **edge cases** (empty data, max limits, special characters)
- ✅ Test **error scenarios** (invalid input, network errors)
- ✅ Test **different roles** (ensure proper access control)
- ✅ Test **data consistency** (verify data matches across pages)

---

## 📞 Support & Resources

### Development Team Contacts
- **Backend Lead:** [Name/Email]
- **Frontend Lead:** [Name/Email]
- **DevOps:** [Name/Email]
- **QA Lead:** [Name/Email]

### Documentation Links
- API Documentation: `http://localhost:8081/swagger/index.html`
- Backend README: `tirta-saas-backend/README.md`
- Frontend README: `tirta-saas-frontend/README.md`
- Progress Tracking: `PROGRESS.md`
- Session Summaries: `SESSION_SUMMARY_*.md`

### Useful Commands
```bash
# Start backend
cd tirta-saas-backend
./tirta-backend

# Start frontend
cd tirta-saas-frontend
npm run dev

# Check backend logs
tail -f tirta-saas-backend/logs/app.log

# Reset database (CAUTION!)
cd tirta-saas-backend
go run cmd/seed/main.go
```

---

## 🚀 Deployment Checklist (After Successful Testing)

### Pre-Deployment
- [ ] All critical bugs fixed and verified
- [ ] All test cases passed (95%+ pass rate)
- [ ] Performance testing completed
- [ ] Security review completed
- [ ] Database migration scripts ready
- [ ] Backup strategy in place

### Deployment Steps
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Get UAT approval from stakeholders
- [ ] Schedule production deployment window
- [ ] Deploy to production
- [ ] Run production smoke tests
- [ ] Monitor for 24 hours

### Post-Deployment
- [ ] Verify all critical flows working
- [ ] Check error logs for issues
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Document known issues
- [ ] Plan next iteration

---

**Manual Testing Roadmap Complete! Ready for Testing! 🎉**

---

**Document Info:**
- Created: December 26, 2024
- Updated: December 29, 2024
- Version: 2.0
- Status: Ready for Use
- Testing Sequence: Optimized for Logical Flow

**Change Log:**
- v2.0 (Dec 29): Reorganized into 4 logical phases (Registration → Setup → Billing → Reports)
- v1.0 (Dec 26): Initial testing roadmap created
  - Submit
  - Verify: New subscription appears in list

- [ ] **Create More Subscription Types**
  - Add "Usaha Kecil" (Code: UK, Price: 100000)
  - Add "Industri" (Code: IND, Price: 250000)

- [ ] **Edit Subscription Type**
  - Edit "Rumah Tangga"
  - Update base price to 55000
  - Verify: Price updated

- [ ] **Delete Subscription Type**
  - Delete "Industri" type
  - Confirm deletion
  - Verify: Removed from list

### 3.4 Water Rate Management (5 menit)
**URL:** `/water-rates`

- [ ] **Create Water Rate**
  - Click "Add Water Rate"
  - Fill form:
    - Subscription Type: "Rumah Tangga"
    - Min Usage: 0
    - Max Usage: 10
    - Rate: 3000
    - Active: Yes
  - Submit
  - Verify: Rate appears with subscription type

- [ ] **Create Progressive Rates**
  - Add rate: 11-20 m³ = 3500/m³
  - Add rate: 21-50 m³ = 4000/m³
  - Add rate: >50 m³ = 5000/m³

- [ ] **Test Rate Validation**
  - Try to create overlapping range
  - Verify: Validation error appears

### 3.5 Customer Management (8 menit)
**URL:** `/customers`

- [ ] **View Customer List**
  - Check: Empty state if no customers
  - Check: Pagination controls
  - Check: Search bar
  - Check: Filter by status

- [ ] **Add New Customer**
  - Click "Add Customer"
  - Fill form:
    - Name: "Budi Santoso"
    - Customer Number: Auto-generated or manual
    - Email: "budi@example.com"
    - Phone: "081234567890"
    - Address: Complete address
    - Subscription Type: "Rumah Tangga"
    - Meter Number: "MTR-001"
    - Initial Meter Reading: 0
  - Submit
  - Verify: Customer appears in list with "active" status

- [ ] **Add Multiple Customers**
  - Add "Siti Aminah" (Rumah Tangga)
  - Add "Toko Jaya" (Usaha Kecil)
  - Add "Warung Makan" (Usaha Kecil)

- [ ] **View Customer Details**
  - Click on "Budi Santoso"
  - Verify: Full customer information
  - Check: Subscription details
  - Check: Usage history tab
  - Check: Invoice history tab
  - Check: Payment history tab

- [ ] **Edit Customer**
  - Edit "Budi Santoso"
  - Update phone number
  - Update address
  - Verify: Changes saved

- [ ] **Change Customer Status**
  - Suspend "Warung Makan"
  - Verify: Status changes to "inactive"
  - Reactivate customer
  - Verify: Status back to "active"

### 3.6 Water Usage Recording (7 menit)
**URL:** `/usage`

- [ ] **View Usage List**
  - Check: List of all usage records
  - Check: Filter by period/customer
  - Check: Search functionality

- [ ] **Record Single Usage**
  - Click "Record Usage"
  - Select customer: "Budi Santoso"
  - Enter meter reading: 15 m³
  - Select period: Current month
  - Add notes (optional)
  - Submit
  - Verify: Usage recorded
  - Check: Usage calculation (15 m³ from initial 0)

- [ ] **Record More Usage**
  - Record for "Siti Aminah": 25 m³
  - Record for "Toko Jaya": 45 m³
  - Verify: All appear in usage list

- [ ] **View Usage Details**
  - Click on usage record
  - Verify: Shows calculation breakdown based on water rates
  - Check: Progressive rate calculation is correct

- [ ] **Edit Usage**
  - Edit "Budi Santoso" usage
  - Update meter reading to 18 m³
  - Verify: Calculation updates automatically

- [ ] **Delete Usage**
  - Delete a test usage record
  - Confirm deletion
  - Verify: Removed from list

### 3.7 Invoice Management (10 menit)
**URL:** `/invoices`

- [ ] **View Invoice List**
  - Check: Empty or existing invoices
  - Check: Filter by status (pending/paid/overdue)
  - Check: Search by invoice number or customer

- [ ] **Manual Invoice Generation**
  - Click "Generate Invoice"
  - Select customer: "Budi Santoso"
  - Select period: Current month
  - Verify: Usage auto-populated
  - Review calculation:
    - Base price + Usage charges
    - Admin fee (if any)
    - Total amount
  - Submit
  - Verify: Invoice created with status "pending"

- [ ] **Bulk Invoice Generation**
  - URL: `/invoices/bulk-generation`
  - Select period: Current month
  - Click "Preview"
  - Verify: List of customers to be invoiced
  - Check: Amount calculation for each
  - Click "Generate All Invoices"
  - Verify: Success notification
  - Check: All invoices created with correct amounts

- [ ] **View Invoice Details**
  - Click on invoice
  - Verify: Complete invoice information
  - Check: Customer details
  - Check: Usage breakdown
  - Check: Payment status
  - Check: Due date

- [ ] **Download Invoice PDF**
  - Click "Download PDF"
  - Verify: PDF generated and downloaded
  - Open PDF: Check formatting and data

- [ ] **Edit Invoice (if unpaid)**
  - Edit pending invoice
  - Adjust amount or notes
  - Verify: Changes saved

- [ ] **Cancel Invoice**
  - Cancel a test invoice
  - Enter cancellation reason
  - Verify: Status changes to "cancelled"

### 3.8 Payment Verification (7 menit)
**URL:** `/payments/verification`

- [ ] **Setup: Customer Submit Payment**
  - (Switch to customer view or simulate)
  - Customer submits payment confirmation
  - Upload proof of payment
  - Enter payment details

- [ ] **View Pending Payments**
  - URL: `/payments/verification`
  - Check: List of pending payment confirmations
  - Verify: Shows customer name, invoice, amount
  - Check: Payment method and reference number

- [ ] **View Payment Details**
  - Click "View" on payment
  - Verify: Shows complete payment information
  - Check: Payment proof image loads
  - Check: Customer and invoice details

- [ ] **Verify Payment**
  - Click "Verify" button
  - Review payment details
  - Add verification notes (optional)
  - Confirm verification
  - Verify: Payment status changes to "verified"
  - Check: Invoice status changes to "paid"

- [ ] **Reject Payment**
  - For a test payment, click "Reject"
  - Enter rejection reason (required)
  - Submit
  - Verify: Status changes to "rejected"
  - Check: Customer notified (if notification exists)

- [ ] **Payment History**
  - URL: `/payments`
  - Check: All payments (verified, rejected, pending)
  - Filter by status
  - Search by customer or invoice

### 3.9 Tenant Payment Settings (3 menit)
**URL:** `/settings/payment`

- [ ] **Configure Bank Accounts**
  - Add bank account for customer payments:
    - Bank Name: "Bank Mandiri"
    - Account Number: "9876543210"
    - Account Name: "PDAM Desa Sukamaju"
    - Bank Code: "MANDIRI"
    - Mark as Primary
  - Verify: Bank account saved

- [ ] **Add QR Payment Methods**
  - Add QRIS QR code
  - Upload QR image
  - Mark as Active
  - Verify: QR code visible

- [ ] **Test: View from Customer Side**
  - Check that these payment methods appear when customer tries to pay

### 3.10 Reports (5 menit)
**URL:** `/reports`

- [ ] **Revenue Report**
  - Select date range
  - Generate report
  - Verify: Shows total revenue
  - Check: Revenue breakdown by month
  - Check: Revenue by subscription type
  - Export to Excel/PDF

- [ ] **Usage Report**
  - Select period
  - Generate report
  - Verify: Total usage statistics
  - Check: Usage by customer
  - Check: Average usage per subscription type

- [ ] **Outstanding Payments Report**
  - Generate report
  - Verify: List of unpaid invoices
  - Check: Total outstanding amount
  - Check: Aging analysis (if implemented)
  - Filter by customer or date range

- [ ] **Customer Analytics**
  - View customer growth chart
  - Check: New customers per month
  - Check: Customer churn rate
  - Check: Most active customers

---

## 4️⃣ CUSTOMER PORTAL TESTING

### 4.1 Customer Login (2 menit)
**URL:** `http://localhost:5173/customer/login`

- [ ] **Login as Customer**
  - Use customer credentials (phone/email + password)
  - Or use customer number + default password
  - Verify: Redirect to customer dashboard
  - Check: Customer name displayed

### 4.2 Customer Dashboard (2 menit)
**URL:** `/customer/dashboard`

- [ ] **Check Dashboard**
  - View current month usage
  - View outstanding balance
  - View recent invoices
  - Check: Last payment information

### 4.3 View Usage History (3 menit)
**URL:** `/customer/usage`

- [ ] **View Usage List**
  - Check: Monthly usage history
  - Verify: Meter readings shown
  - Check: Usage amount calculated
  - Filter by date range

- [ ] **View Usage Details**
  - Click on usage period
  - Verify: Detailed calculation breakdown
  - Check: Rate tiers applied correctly

### 4.4 View & Pay Invoices (5 menit)
**URL:** `/customer/invoices`

- [ ] **View Invoice List**
  - Check: All invoices (paid/unpaid)
  - Filter by status
  - Check: Due date highlighted for unpaid

- [ ] **View Invoice Details**
  - Click on invoice
  - Verify: Complete invoice details
  - Check: Usage breakdown
  - Check: Payment button available for unpaid

- [ ] **Download Invoice**
  - Download invoice PDF
  - Verify: PDF correct and readable

- [ ] **Submit Payment Confirmation**
  - Click "Pay Now" on unpaid invoice
  - View payment instructions
  - View bank accounts / QR codes
  - Fill payment form:
    - Payment date
    - Payment method
    - Account number (if bank transfer)
    - Reference number
    - Upload payment proof
  - Submit
  - Verify: Confirmation success
  - Check: Status changes to "pending verification"

### 4.5 Customer Profile (3 menit)
**URL:** `/customer/profile`

- [ ] **View Profile**
  - Check: Personal information
  - Check: Subscription details
  - Check: Meter information

- [ ] **Edit Profile**
  - Update email
  - Update phone
  - Update address
  - Verify: Changes saved

- [ ] **Change Password**
  - Enter current password
  - Enter new password
  - Confirm new password
  - Verify: Password changed successfully
  - Test: Logout and login with new password

---

## 5️⃣ CROSS-FUNCTIONAL TESTING

### 5.1 Authentication & Authorization (5 menit)

- [ ] **Test Role-Based Access**
  - Login as Customer → Try to access `/customers` (tenant admin page)
  - Verify: Redirect or access denied
  - Login as Tenant Admin → Try to access `/platform` (platform owner page)
  - Verify: Access denied
  - Login as Platform Owner → Access all platform pages
  - Verify: Works correctly

- [ ] **Test Session Management**
  - Login and wait for session timeout
  - Verify: Auto-logout after timeout
  - Check: Redirect to login page

- [ ] **Test Logout**
  - Click logout from each role
  - Verify: Redirect to login page
  - Check: Cannot access protected pages

### 5.2 Data Consistency (5 menit)

- [ ] **Invoice-Payment Consistency**
  - Create invoice → Verify amount
  - Submit payment → Verify invoice status updates
  - View customer balance → Check accuracy

- [ ] **Usage-Invoice Consistency**
  - Record usage → Generate invoice
  - Verify: Invoice amount matches usage calculation
  - Edit usage → Regenerate invoice
  - Check: Invoice recalculates correctly

- [ ] **Customer-Subscription Consistency**
  - Create customer with subscription type
  - View invoice → Check subscription pricing applied
  - Change customer subscription type
  - Generate new invoice → Check new pricing applied

### 5.3 Edge Cases & Validation (5 menit)

- [ ] **Form Validation**
  - Try to submit forms with missing required fields
  - Verify: Error messages displayed
  - Enter invalid email format
  - Verify: Email validation works
  - Enter invalid phone format
  - Verify: Phone validation works

- [ ] **Date Validations**
  - Try to record usage for future period
  - Try to generate invoice for non-existent period
  - Try to set payment date in future
  - Verify: Appropriate validations

- [ ] **Numeric Validations**
  - Enter negative meter reading
  - Enter invalid price (letters)
  - Enter zero or negative amount
  - Verify: Validation prevents submission

- [ ] **Duplicate Prevention**
  - Try to create duplicate customer number
  - Try to create duplicate subscription code
  - Try to record usage twice for same period
  - Verify: System prevents duplicates

### 5.4 Performance & UX (5 menit)

- [ ] **Loading States**
  - Check: Loading spinners appear during API calls
  - Verify: Skeleton loaders for data tables
  - Check: Button disabled during submission

- [ ] **Error Handling**
  - Simulate network error (disconnect internet)
  - Verify: Error messages displayed
  - Check: Retry mechanism (if implemented)

- [ ] **Success Notifications**
  - After each CRUD operation
  - Verify: Success toast/notification appears
  - Check: Notification auto-dismisses

- [ ] **Pagination Performance**
  - Add many records (50+ customers)
  - Test pagination navigation
  - Verify: Smooth navigation
  - Check: Page size selector works

- [ ] **Search Performance**
  - Test search with large dataset
  - Verify: Results appear quickly
  - Check: Search highlights matches

---

## 6️⃣ MOBILE RESPONSIVENESS (Optional - 10 menit)

### Test on Different Screen Sizes

- [ ] **Desktop (1920x1080)**
  - All layouts proper
  - Sidebar visible
  - Tables readable

- [ ] **Tablet (768x1024)**
  - Responsive layout adjusts
  - Sidebar collapses to hamburger menu
  - Tables scroll horizontally

- [ ] **Mobile (375x667)**
  - Mobile-friendly navigation
  - Forms stack vertically
  - Buttons easily tappable
  - Text readable without zoom

---

## ✅ Testing Checklist Summary

### Critical Paths (Must Pass)
- [ ] Platform owner can manage tenants
- [ ] Tenant can register and be approved
- [ ] Tenant admin can manage customers
- [ ] Tenant admin can record usage
- [ ] Tenant admin can generate invoices
- [ ] Tenant admin can verify payments
- [ ] Customer can view invoices
- [ ] Customer can submit payment confirmation

### Important Features
- [ ] Subscription type management works
- [ ] Water rate progressive calculation correct
- [ ] Reports generate accurately
- [ ] Payment settings configurable
- [ ] PDF downloads work

### Nice to Have
- [ ] Mobile responsive
- [ ] Loading states smooth
- [ ] Error messages helpful
- [ ] Search/filter fast

---

## 🐛 Bug Reporting Template

When you find bugs during testing, document them:

```markdown
**Bug Title:** [Brief description]
**Severity:** Critical / High / Medium / Low
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** What should happen
**Actual Result:** What actually happens
**Screenshots:** [Attach if applicable]
**Browser:** Chrome/Firefox/Safari
**Role:** Platform Owner / Tenant Admin / Customer
```

---

## 📊 Testing Results Template

After completing testing, fill this:

```markdown
## Testing Session Results
**Date:** YYYY-MM-DD
**Tester:** [Your Name]
**Duration:** [Time taken]

### Summary
- Total Test Cases: XX
- Passed: XX
- Failed: XX
- Blocked: XX

### Critical Issues Found
1. [Issue 1]
2. [Issue 2]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

### Next Steps
- [ ] Fix critical bugs
- [ ] Re-test failed cases
- [ ] Deploy to staging
```

---

## 🎯 Tips for Effective Testing

1. **Follow the sequence** - Test in order from Platform Owner → Tenant → Customer
2. **Don't skip steps** - Each step may affect the next
3. **Take notes** - Document any unexpected behavior
4. **Use different data** - Test with various inputs
5. **Test edge cases** - Not just happy paths
6. **Clear browser cache** - Between major test sections
7. **Use incognito mode** - For testing different roles simultaneously
8. **Take screenshots** - Of bugs or unclear behavior

---

## 📝 Notes

- This roadmap assumes the backend APIs are already implemented and working
- Some features might not be fully implemented yet - mark as "Not Implemented" if blocked
- Testing should be done on a development/staging environment, NOT production
- Database should be backed up before testing destructive operations

---

**Happy Testing! 🚀**
