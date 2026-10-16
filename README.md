# Fun Walk GKJ Pamulang 2026

Form pendaftaran keluarga, Rp10.000 per peserta (1–30 orang). Frontend dan API berjalan di Vercel; data tetap tersimpan di Google Sheets melalui Google Apps Script.

## Deploy Vercel
Repo yang terhubung ke Vercel otomatis membangun halaman dari `Index.html` ke `public/index.html`. Endpoint `/api/register` berjalan sebagai Node.js Function. Tidak perlu framework atau dependensi npm.

1. Siapkan Google Sheet dan project Apps Script menggunakan `Code.gs`, `Index.html`, serta `appsscript.json`.
2. Atur Script Property `SPREADSHEET_ID` ke ID spreadsheet. Jalankan `setupSheet` dan berikan izin akses.
3. Deploy Apps Script sebagai **Web app**, Execute as **Me**, akses **Anyone**. Untuk deployment lama, pilih Manage deployments > Edit > New version > Deploy agar fungsi `doPost` terbaru aktif.
4. Salin URL deployment berakhiran `/exec`.
5. Di Vercel > Project > Settings > Environment Variables, tambahkan `APPS_SCRIPT_URL` berisi URL tersebut untuk Production dan Preview. Jangan pakai URL `/dev`.
6. Redeploy Vercel. Gunakan Root Directory root repo dan pengaturan build/output dari `vercel.json`; hapus override lama yang bertentangan.
7. Uji pendaftaran dari URL Vercel dan pastikan satu baris baru masuk ke tab **Pendaftaran**.

Tanpa konfigurasi Apps Script, halaman tetap tampil tetapi pengiriman menampilkan pesan bahwa pendaftaran belum dibuka. Jangan memakai penyimpanan sementara di Function Vercel karena data tidak persisten.

## Pengembangan
`npm run build` menyiapkan halaman statis. `npm test` memeriksa endpoint dengan respons Apps Script tiruan. Edit `Index.html` sebagai sumber halaman; folder `public` dibuat otomatis. Hosting Apps Script lama juga tetap didukung.

## Data
Kolom: Waktu Daftar | ID Pendaftaran | Nama Keluarga | No HP | Jumlah Peserta | Biaya Pendaftaran (Rp).

Form tidak memproses pembayaran. Batasi akses spreadsheet kepada panitia. Endpoint publik dapat menerima spam atau pendaftaran berulang; jika pengiriman terputus, periksa spreadsheet sebelum mengirim ulang.

## Wilayah, bukti bayar, dan daftar pembayaran
- Pilihan wilayah wajib: PP1, PP2, Reni Jaya, Bukit Indah, Serpong.
- Bukti bayar opsional: kamera atau unggah JPG/PNG/WebP maksimal 2 MB. Tanpa bukti, status **Belum bayar**; dengan bukti, **Menunggu verifikasi**.
- Kolom G–I ditambahkan sebagai Wilayah Pelayanan, Bukti Bayar, Status Pembayaran, tanpa menggeser data lama.
- **Penting setelah update:** salin Code.gs dan Index.html terbaru ke Apps Script, jalankan setupSheet kembali, izinkan akses Drive, lalu deploy versi baru. Update repo/Vercel saja tidak memperbarui Apps Script.
- setupSheet membuat folder Drive untuk bukti dan menyimpan ID di Script Property PAYMENT_FOLDER_ID. Bisa diisi dahulu dengan ID folder milik panitia. Folder dan file tidak dibuat publik; beri akses hanya ke panitia yang meninjau.
- Panitia memeriksa bukti melalui tautan di kolom H, lalu mengisi **Lunas** pada kolom I setelah pembayaran benar-benar diterima. Bayar tunai atau bayar belakangan juga dikonfirmasi dengan mengisi Lunas pada baris pendaftaran yang sama.
- Tabel publik hanya mengambil nama keluarga dan jumlah peserta dari baris berstatus Lunas. Bukti, wilayah, nomor HP, dan data lain tidak dikirim ke tabel publik.
- Untuk bayar belakangan, peserta dapat menghubungi panitia dengan ID pendaftaran; belum ada fitur unggah bukti susulan mandiri.
- Uji tanpa bukti, dengan bukti, lalu tandai satu pendaftaran uji Lunas dan pastikan hanya nama serta jumlah peserta tampil. Jangan menandai Lunas otomatis hanya karena gambar diunggah.

