# BACKEND
1. ✅ Format response API tidak konsisten - FIXED: Added response_helper.go with standardized response format
2. ✅ GET http://localhost:8081/api/customers/export | 404 Not Found - FIXED: Added export route to customer.go
3. ✅ GET http://localhost:8081/api/water-rates?page=1&limit=100&active=false | tetap mendapatkan data water-rates yang active = 1(true) - FIXED: Added active filter to GetWaterRates
4. ✅ Ketika proses Create New Customer ada sub-porses Create New Invoice | invoice_number tidak terbuat. (Pada DB kolom invoice_number terisi string kosong) - FIXED: Added invoice number generation in CreateCustomer
5. ✅ Ketika create/update customer menambahkan data Subscription Types baru (anomali) - FIXED: Changed Save() to Select().Updates() and Update() to prevent GORM from saving associations
6. ✅ GET http://localhost:8081/api/invoices/outstanding | 400 Bad Request with response {"error":"Invalid invoice ID"} - FIXED: Added GetOutstandingInvoices endpoint with customer_id query param, registered route before /:id to avoid conflict


# FRONTEND
1. ✅ http://127.0.0.1:5174/admin/platform/subscription-payments | TypeError: payments.filter is not a function - FIXED: Updated platformSubscriptionService to handle new response format
2. ✅ http://127.0.0.1:5174/admin/platform/settings | Data Bank Accounts masih temporary - FIXED: Wired to GET/POST/PUT/DELETE /api/payment-methods/bank-accounts. QR Code: FIXED with new backend model+endpoints+file upload, frontend wired to qrCodeService.
3. ✅ http://127.0.0.1:5174/admin/platform/analytics | Platform Usage > Total Users tidak exclude platform_owner - FIXED: Backend already filters WHERE role != platform_owner (line 1042)
4. ✅ http://127.0.0.1:5174/admin (tenant_admin) | Dashboard masih menggunakan data temporary dummy - FIXED: Wired to report endpoints (customers, outstanding, usage, revenue)
5. ✅ Found 10 errors ketika npm run build - FIXED: Template literal syntax, import paths, field mapping
6. ✅ Uncaught SyntaxError: The requested module does not provide export named 'default' - FIXED: Missing closing brace in InvoiceList.tsx
7. ✅ http://127.0.0.1:5174/admin/subscriptions | Invalid response format: null > installHook.js:1 - FIXED: Updated subscriptionService to handle new response format
8. ✅ http://127.0.0.1:5174/admin/subscriptions > Ada Matric Card "Total Types" dan "Active Types". (tidak ada kolom active pada Tabel subscription_types) - FIXED: Replaced "Active Types" metric with "Avg Monthly Fee"
9. ✅ http://127.0.0.1:5174/admin/invoices (tenant_admin) | TypeError: data is not iterable - FIXED: Updated invoiceService to handle new response format
10. ✅ http://127.0.0.1:5174/admin/payments (tenant_admin) | TypeError: data is not iterable - FIXED: Updated paymentService to handle new response format
11. ✅ http://127.0.0.1:5174/admin/usage/create > Field Customer | Seharusnya bisa cari berdasarkan name atau meter_number - FIXED: Created CustomerSearchSelect component using Headless UI Combobox
12. ✅ http://127.0.0.1:5174/admin/usage/create > Field Calculated Usage | Automatic calculation tidak bekerja - FIXED: Backend now filters water usage by customer_id; frontend properly fetches previous reading
13. ✅ http://127.0.0.1:5174/admin/usage/bulk-import | Page Not Found - FIXED: Added BulkImportWaterUsage page, route, backend POST /api/water-usage/bulk-import endpoint
14. ✅ http://127.0.0.1:5174/admin/settings | Data Bank Accounts masih temporary - FIXED: Wired to GET/POST/PUT/DELETE /api/payment-methods/bank-accounts. QR Code: FIXED same as #2.
15. ✅ http://127.0.0.1:5174/admin/reports/revenue?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'toLocaleString') - FIXED: Updated reportService to handle new response format
16. ✅ http://127.0.0.1:5174/admin/reports/payments?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'toLocaleString') - FIXED: Updated reportService to handle new response format
17. ✅ http://127.0.0.1:5174/admin/reports/customers?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'map') - FIXED: Updated reportService to handle new response format
18. ✅ http://127.0.0.1:5174/admin/reports/usage?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'toLocaleString') - FIXED: Updated reportService to handle new response format
19. ✅ http://127.0.0.1:5174/admin/reports/outstanding?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'toLocaleString') - FIXED: Updated reportService to handle new response format
20. ✅ Setelah berhasil login dengan user role meter_reader hanya menampilkan halaman kosong. - FIXED: Added meter_reader to allowed roles in PrivateRoute and updated role handling
21. ✅ http://127.0.0.1:5174/admin/invoices | TypeError: Cannot read properties of undefined (reading 'toFixed') - FIXED: Added field mapping in invoiceService.getInvoices() for backend response
22. ✅ http://127.0.0.1:5174/admin/invoices/{id} | TypeError: Cannot read properties of undefined (reading 'charAt') - FIXED: Added null check in getStatusBadge and field mapping in getInvoiceById()
23. ✅ Invoice list tampilan kolom mising data & format dolar - FIXED: Backend includes customer data in response, frontend uses Rupiah format, added Type column
24. ✅ Invoice detail response tidak lengkap - FIXED: Backend GetInvoice includes invoice_number, customer_name, customer object, due_date
25. ✅ Invoice detail tampilan tidak cocok dengan data - FIXED: Redesigned invoice detail UI with distinction between Registration and Monthly invoices, modern layout with gradient header, structured sections
26. ✅ http://127.0.0.1:5174/admin/payments/new | Field Customer tidak bisa cari & tidak bisa select multiple invoices - FIXED: Implemented CustomerSearchSelect with search by name/meter_number, invoice card UI with multiple selection, payment summary, allow payment for inactive customers
27. ✅ http://127.0.0.1:5174/admin/payments/new | Setelah pilih customer tidak muncul list invoice - FIXED: Backend outstanding endpoint added, frontend UUID type mismatch fixed (Number→string), field mapping added in paymentService28. ✅ http://127.0.0.1:5174/admin/payments (tenant_admin) | Data tidak muncul setelah record payment - FIXED: Backend Preload Invoice.Customer (nested), frontend getPayments mapping dari raw array ke camelCase fields
29. ✅ http://127.0.0.1:5174/admin/payment-verification | Page kosong, tidak load data dari API - FIXED: Replaced hardcoded empty array dengan real API call ke paymentProofService.getPaymentProofs(), Verify/Reject terhubung ke endpoint backend
30. ✅ http://127.0.0.1:5174/admin/usage/create > Field Calculated Usage | Automatic calculation tidak bekerja - FIXED: Backend GetWaterUsages now filters by customer_id & usage_month query params; frontend getCustomerUsageHistoryById now uses list endpoint (not non-existent /customer/:id), parses usage_records properly, uses index [0] for latest reading
31. ✅ http://127.0.0.1:5174/admin/subscriptions > Matric Card "Active Types" selalu 0 (tidak ada kolom active di DB) - FIXED: Replaced "Active Types" metric with "Avg Monthly Fee" yang dihitung dari data yang ada
32. ✅ http://127.0.0.1:5174/admin/settings | Bank Account berhasil dibuat tapi data tidak muncul (tenant_id tersimpan sebagai 00000000) - FIXED: payment_method_controller.go semua method pakai c.GetString("tenant_id") → return empty string karena middleware simpan sebagai uuid.UUID. Fix: ganti ke helpers.RequireTenantID(c) di semua 10 method (bank accounts + QR codes)
33. ✅ BACKEND: Ketika create/update customer masih menambahkan data Subscription Types baru (anomali) - FIXED: 3 lokasi Save(&customer) diganti: DeactivateCustomer→Update("is_active",false), UpdateCustomerProfile→Select().Updates(), ChangeCustomerPassword→Update("password",hash)
34. ✅ UI/UX: Tampilan halaman index (list data) tidak konsisten - FIXED: InvoiceList filter implemented (search/status/type), WaterRateList + UserManagementList standardized (Clear button, role filter, consistent card layout)
35. ⬜ UI/UX: Delete data sebaiknya menggunakan modal konfirmasi bukan 2x klik (double click)
36. ⬜ UI/UX: Penggunaan icon pada metric card yang terkesan asal - perlu disesuaikan agar relevan dengan konteks datanya
