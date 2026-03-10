1. Ketika akses POST "/api/payment-methods/bank-accounts" dengan roles "platform_owner" | seperti ada proses logout dilakukan (localStorage terkait akses_token langsung terhapus)
2. walaupun 1 akun = 1 tenant, tetap perlu dipisah antar registrasi akun dengan registrasi tenant. registrasi tenant hanya bisa dilakukan oleh user yang sudah login akun. untuk menjaga konsistensi data tenan misal dari TRIAL pindah ke SUBSCRIPTION. sehingga tidak perlu registrasi tenant lagi (tapi bisa ubah informasi tenant yang dibuat saat TRIAL)
3. Ketika calon user admin_tenant melakukan registrasi, pada form registirasi harus ada penentuan apakah user ingin "Mulai Trial 14 hari gratis" atau memilih salah satu Subscription plans.
    - Trial :
        a. Setelah berhasil registrasi, tenant langsung aktif tanpa approval dan tidak membuat invoice tagihan biaya berlangganan platform.
        b. Kolom "trial_ends_at" terisi. Sebagai penanda tenant masih masa trial
        b. Badge "Trial" akan tampil di setiap page
        c. Ketika masa Trial habis, akun otomatis berubah menjadi nonaktif dan ketika mencoba login muncul modal warning pemberitahuan masa trial habis dan saran untuk berlangganan + tombol navigasi ke element Subscription plans.
    - Subscription plans :
        a. Setelah berhasil registrasi dan admin_platform melakukan approval, akan otomatis terbuat invoice tagihan biaya berlangganan platform
        b. Selama tagihan berlangganan belum berubah menjadi terbayar, menu yang akan tersedia hanya "Konfirmasi pembayaran" (jika sudah melakukan konfirmasi pembayaran yang ditampilkan hanya notifikasi "menunggu validasi pembayaran oleh admin_platform". jika belum melakukan konfirmasi pembayaran yang ditampilkan adalah form konfirmasi pembayaran)