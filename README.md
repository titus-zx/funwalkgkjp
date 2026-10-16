# Fun Walk GKJ Pamulang 2026 — Pendaftaran

Google Apps Script Web App + Google Sheets, tanpa server tambahan.

## Fitur
- Satu perwakilan keluarga: nama keluarga, nomor HP, jumlah peserta 1–30
- Perhitungan biaya otomatis Rp10.000 per orang
- Validasi di browser dan server
- Data tersimpan ke Google Sheets, dengan ID pendaftaran dan waktu
- Tampilan responsif untuk HP

## Deploy
1. Buat Spreadsheet Google baru di akun panitia. Salin ID dari URL Spreadsheet (bagian di antara /d/ dan /edit).
2. Buka https://script.google.com dan buat project baru.
3. Salin `Code.gs` ke file kode Apps Script. Tambahkan file HTML bernama **Index** dan salin `Index.html` ke dalamnya. Sesuaikan `appsscript.json` melalui Project Settings > Show appsscript.json.
4. Di Apps Script > Project Settings > Script Properties, tambahkan `SPREADSHEET_ID` = ID Google Spreadsheet tadi.
5. Jalankan fungsi `setupSheet` sekali dari editor dan berikan izin yang diminta.
6. Deploy > New deployment > Web app. Execute as: **Me**. Who has access: **Anyone** (jika peserta umum tanpa login).
7. Buka URL `/exec` dan uji dengan satu pendaftaran; pastikan datanya masuk ke tab **Pendaftaran**.

Untuk pengembangan melalui Codex, edit repo ini, lalu sinkronkan ke Apps Script dengan clasp atau copy-paste manual. `.clasp.json.example` adalah contoh; jangan commit file `.clasp.json` yang berisi ID project personal.

## Kolom Google Sheets
Waktu Daftar | ID Pendaftaran | Nama Keluarga | No HP | Jumlah Peserta | Biaya Pendaftaran (Rp)

## Catatan keamanan
- Simpan ID Spreadsheet sebagai Script Property, jangan di HTML.
- Jangan membagikan Spreadsheet publik; hanya URL Web App.
- Form publik dapat menerima spam atau pendaftaran ganda. Pantau data, pertimbangkan CAPTCHA / proteksi rate limit sebelum digunakan luas.
- Tidak ada pembayaran daring atau verifikasi pembayaran.
- Berikan akses data nomor HP hanya kepada panitia yang membutuhkan.
