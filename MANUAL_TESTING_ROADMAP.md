# Manual Testing Roadmap - Tirta SaaS
**Created:** December 26, 2024  
**Purpose:** Panduan sistematis untuk melakukan pengujian manual melalui UI

---

## 📋 Testing Prerequisites

### 1. Setup Awal
- [ ] Backend server berjalan di `http://localhost:3001`
- [ ] Frontend server berjalan di `http://localhost:5173`
- [ ] Database PostgreSQL tersedia dan termigrasi
- [ ] File `.env` dikonfigurasi dengan benar di backend dan frontend

### 2. Data Awal yang Dibutuhkan
- [ ] Platform Owner account sudah ada (seeded)
- [ ] Minimal 1 Tenant aktif untuk testing
- [ ] Koneksi database bersih atau gunakan data seed

---

## 🎯 Testing Flow Sequence

Testing dilakukan mengikuti user journey dari berbagai role:

1. **Platform Owner Flow** (15 menit)
2. **Tenant Registration Flow** (10 menit)
3. **Tenant Admin Flow** (45 menit)
4. **Customer Flow** (15 menit)

**Total Estimated Time:** ~90 menit untuk full testing

---

## 1️⃣ PLATFORM OWNER TESTING

### 1.1 Login & Dashboard (5 menit)
**URL:** `http://localhost:5173/login`

- [ ] **Test Login Platform Owner**
  - Email: `platform@tirta.com` (sesuaikan dengan seed data)
  - Password: sesuai seed
  - Verify: Redirect ke platform dashboard
  - Check: Role badge menampilkan "Platform Owner"

- [ ] **Test Dashboard Platform**
  - URL: `/platform/dashboard`
  - Verify: Stats cards (Total Tenants, Active, Pending, Revenue)
  - Check: Tenant list table dengan status
  - Check: Grafik subscription trends (jika ada)

### 1.2 Tenant Management (5 menit)
**URL:** `/platform/tenants`

- [ ] **View Tenant List**
  - Check: Pagination works
  - Check: Search by name/village code works
  - Check: Filter by status (trial/active/inactive/suspended)

- [ ] **View Tenant Details**
  - Click detail icon pada tenant
  - Verify: Tenant information lengkap
  - Check: Subscription information (should show TRIAL initially)
  - Check: Trial expiry date
  - Check: Admin contact details

- [ ] **View Trial Tenants**
  - Find tenant with status "trial"
  - Verify: Trial period shown
  - Check: Days remaining displayed
  - **Expected (TODO):** Should see pending subscription payments

- [ ] **Suspend Trial/Active Tenant**
  - Find trial or active tenant
  - Click "Suspend" action
  - Enter suspension reason
  - Verify: Status berubah ke "suspended"

### 1.3 Platform Payment Settings (5 menit)
**URL:** `/settings/platform-payment`

- [ ] **Add Bank Account**
  - Click "Add Bank Account"
  - Fill form:
    - Bank Name: "Bank BCA"
    - Account Number: "1234567890"
    - Account Name: "PT Tirta SaaS"
    - Bank Code: "BCA"
    - Mark as Primary
  - Submit
  - Verify: Bank account muncul di list

- [ ] **Add QR Code**
  - Click "Add QR Code"
  - Select type: "QRIS"
  - Upload image (PNG/JPG max 2MB)
  - Mark as Active
  - Submit
  - Verify: QR code preview muncul

- [ ] **Edit & Delete Payment Method**
  - Edit bank account → Update account name
  - Delete QR code → Confirm deletion
  - Verify: Changes applied

---

## 2️⃣ TENANT REGISTRATION TESTING

### 2.1 Self-Service Registration (5 menit)
**URL:** `http://localhost:5173/register-tenant`

> **Note:** Registration saat ini adalah single-step form dengan auto-trial. Step 3 (Subscription Selection) dan Step 4 (Payment) belum diimplementasikan.

- [ ] **Test Registration Form (Single Step)**
  
  **Organization Information:**
  - Organization Name: "PDAM Desa Sukamaju"
  - Village Code: "DSK001"
  - Phone: "081234567890"
  - Email: "sukamaju@example.com"
  - Address: Complete address
  
  **Admin Account:**
  - Admin Name: "Admin Sukamaju"
  - Admin Email: "admin@sukamaju.com"
  - Admin Phone: "081234567890"
  - Password: "SecurePass123!"
  - Confirm Password: "SecurePass123!"
  
  - Click "Register"
  - Verify: Form validation works for required fields

- [ ] **Test Registration Success**
  - Verify: Success message displayed
  - Verify: Message mentions "14-day free trial"
  - Check: Auto redirect to login page after 3 seconds
  - Verify: Can login immediately with admin credentials

- [ ] **Test Trial Status After Login**
  - Login with admin credentials
  - Verify: Status shows "TRIAL"
  - Check: Access to all features (no restrictions during trial)
  - **Expected (TODO):** Upgrade banner/button should be visible

---

## 3️⃣ TENANT ADMIN TESTING

### 3.1 Login After Registration (2 menit)
**URL:** `http://localhost:5173/login`

- [ ] **Login as Tenant Admin**
  - Email: admin@sukamaju.com
  - Password: SecurePass123!
  - Verify: Redirect to tenant dashboard
  - Check: Role badge shows "Tenant Admin"
  - Check: Status badge shows "TRIAL"
  - **Expected (TODO):** Upgrade subscription banner/button visible

### 3.2 Dashboard Overview (3 menit)
**URL:** `/dashboard`

- [ ] **Check Dashboard Stats**
  - Total Customers count
  - Active Customers count
  - This Month Usage
  - Outstanding Payments
  - Recent activities list
  - Verify: All numbers are accurate

### 3.3 Subscription Type Management (5 menit)
**URL:** `/subscriptions`

- [ ] **Create Subscription Type**
  - Click "Add Subscription Type"
  - Fill form:
    - Name: "Rumah Tangga"
    - Code: "RT"
    - Description: "Untuk pelanggan rumah tangga"
    - Base Price: 50000
    - Mark as Active
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
