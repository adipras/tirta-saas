# BACKEND
1. Format response API tidak konsisten
2. GET http://localhost:8081/api/customers/export | 404 Not Found
3. GET http://localhost:8081/api/water-rates?page=1&limit=100&active=false | tetap mendapatkan data water-rates yang active = 1(true)
4. Ketika proses Create New Customer ada sub-porses Create New Invoice | invoice_number tidak terbuat. (Pada DB kolom invoice_number terisi string kosong)


# FRONTEND
1. http://127.0.0.1:5174/admin/platform/subscription-payments | TypeError: payments.filter is not a function
2. http://127.0.0.1:5174/admin/platform/settings | Data Bank Accounts dan QR Code data masih temporary save (belum disimpan di DB)
3. http://127.0.0.1:5174/admin/platform/analytics | Platform Usage > Total Users seharusnya user platform_owner tidak dihitung.
4. http://127.0.0.1:5174/admin (tenant_admin) | Dashboard masih menggunakan data temporary dummy (belum menggunakan respon API)
7. http://127.0.0.1:5174/admin/subscriptions | Invalid response format: null > installHook.js:1
8. http://127.0.0.1:5174/admin/subscriptions > Ada Matric Card "Total Types" dan "Active Types". (tidak ada kolom active pada Tabel subscription_types)
9. http://127.0.0.1:5174/admin/invoices (tenant_admin) | TypeError: data is not iterable
10. http://127.0.0.1:5174/admin/payments (tenant_admin) | TypeError: data is not iterable
11. http://127.0.0.1:5174/admin/usage/create > Field Customer | Seharusnya bisa cari berdasarkan name atau meter_number
12. http://127.0.0.1:5174/admin/usage/create > Field Calculated Usage | Automatic calculation tidak bekerja
13. http://127.0.0.1:5174/admin/usage/bulk-import | Page Not Found "The page you are looking for does not exist."
14. http://127.0.0.1:5174/admin/settings | Data Bank Accounts dan QR Code data masih temporary save (belum disimpan di DB)
15. http://127.0.0.1:5174/admin/reports/revenue?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'toLocaleString')
16. http://127.0.0.1:5174/admin/reports/payments?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'toLocaleString')
17. http://127.0.0.1:5174/admin/reports/customers?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'map')
18. http://127.0.0.1:5174/admin/reports/usage?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'toLocaleString')
19. http://127.0.0.1:5174/admin/reports/outstanding?startDate=2026-01-31&endDate=2026-02-17 | TypeError: Cannot read properties of undefined (reading 'toLocaleString')
20. Setelah berhasil login dengan user role meter_reader hanya menampilkan halaman kosong.