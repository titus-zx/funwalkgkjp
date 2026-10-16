# Fun Walk GKJ Pamulang 2026

Form pendaftaran keluarga, Rp10.000 per peserta (1–30 orang). Frontend dan API berjalan di Vercel; data tetap tersimpan di Google Sheets melalui Google Apps Script.

## Deploy Vercel
Repo yang terhubung ke Vercel otomatis membangun halaman dari `Index.html` ke `public/index.html`. Endpoint `/api/register` berjalan sebagai Node.js Function. Tidak perlu framework atau dependensi npm.

1. Buat atau buka Google Sheet tujuan, lalu pilih **Extensions / Ekstensi > Apps Script**. Salin isi `Code.gs` ke file kode default `Code.gs` (biasanya tampil sebagai **Code**).
2. Tambahkan file **HTML** bernama **Index**, lalu salin isi `Index.html`. Atur zona waktu project ke **Asia/Jakarta** di Project Settings (atau gunakan `appsscript.json` repo).
3. Pilih fungsi **setupSheet** di editor, klik **Run / Jalankan**, lalu berikan izin Sheets dan Drive. Spreadsheet asal otomatis disimpan sebagai `SPREADSHEET_ID`; tidak perlu mengisi ID manual. Tab **Pendaftaran**, judul kolom, dan folder bukti bayar dibuat otomatis. Data lama tidak dihapus.
4. Deploy Apps Script sebagai **Web app**, Execute as **Me**, akses **Anyone**. Untuk deployment lama, pilih Manage deployments > Edit > New version > Deploy agar fungsi `doPost` terbaru aktif.
5. Salin URL deployment berakhiran `/exec`.
6. Di Vercel > Project > Settings > Environment Variables, tambahkan `APPS_SCRIPT_URL` berisi URL tersebut untuk Production dan Preview. Jangan pakai URL `/dev`.
7. Redeploy Vercel. Gunakan Root Directory root repo dan pengaturan build/output dari `vercel.json`; hapus override lama yang bertentangan.
8. Uji pendaftaran dari URL Vercel dan pastikan satu baris baru masuk ke tab **Pendaftaran**.

Tanpa konfigurasi Apps Script, halaman tetap tampil tetapi pengiriman menampilkan pesan bahwa pendaftaran belum dibuka. Jangan memakai penyimpanan sementara di Function Vercel karena data tidak persisten.

## Pengembangan
`npm run build` menyiapkan halaman statis. `npm test` memeriksa endpoint dengan respons Apps Script tiruan. Edit `Index.html` sebagai sumber halaman; folder `public` dibuat otomatis. Hosting Apps Script lama juga tetap didukung.

## Data
Kolom: Waktu Daftar | ID Pendaftaran | Nama Keluarga | No HP | Jumlah Peserta | Biaya Pendaftaran (Rp).

Form tidak memproses pembayaran. Batasi akses spreadsheet kepada panitia. Endpoint publik dapat menerima spam atau pendaftaran berulang; jika pengiriman terputus, periksa spreadsheet sebelum mengirim ulang.

## Wilayah, bukti bayar, dan daftar pendaftaran
- Pilihan wilayah wajib: PP1, PP2, Reni Jaya, Bukit Indah, Serpong.
- Bukti bayar opsional: kamera atau unggah JPG/PNG/WebP maksimal 2 MB. Tanpa bukti, status **Belum bayar**; dengan bukti, **Menunggu verifikasi**.
- Kolom G–I ditambahkan sebagai Wilayah Pelayanan, Bukti Bayar, Status Pembayaran, tanpa menggeser data lama.
- **Penting setelah update:** salin Code.gs dan Index.html terbaru ke Apps Script, jalankan setupSheet kembali, izinkan akses Drive, lalu deploy versi baru. Update repo/Vercel saja tidak memperbarui Apps Script.
- setupSheet membuat folder Drive untuk bukti dan menyimpan ID di Script Property PAYMENT_FOLDER_ID. Bisa diisi dahulu dengan ID folder milik panitia. Folder dan file tidak dibuat publik; beri akses hanya ke panitia yang meninjau.
- Panitia memeriksa bukti melalui tautan di kolom H, lalu mengisi **Lunas** pada kolom I setelah pembayaran benar-benar diterima. Bayar tunai atau bayar belakangan juga dikonfirmasi dengan mengisi Lunas pada baris pendaftaran yang sama.
- Tabel publik menampilkan nama keluarga dan jumlah peserta dari semua pendaftaran, tanpa menyaring status pembayaran. Bukti, wilayah, nomor HP, dan data lain tidak dikirim ke tabel publik.
- Untuk bayar belakangan, peserta dapat menghubungi panitia dengan ID pendaftaran; belum ada fitur unggah bukti susulan mandiri.
- Uji pendaftaran tanpa bukti dan dengan bukti; keduanya harus muncul di tabel dengan hanya nama keluarga serta jumlah peserta. Jangan menandai Lunas otomatis hanya karena gambar diunggah.


## Spreadsheet terikat dan Web App
Jalankan setupSheet dari editor yang dibuka lewat spreadsheet tujuan sebelum deployment pertama. Saat Vercel memanggil Web App, script membuka spreadsheet memakai ID yang sudah disimpan karena spreadsheet aktif dapat bernilai null dalam request Web App. Jika menyalin project ke spreadsheet lain, jalankan setupSheet pada salinan tersebut untuk menghubungkan spreadsheet baru.
