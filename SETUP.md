# Pasang sistem login & premium (± 10 menit)

## 1. Google Sheets + Apps Script
1. Buat Google Sheets baru (nama bebas, mis. "Database Watermark Studio").
2. Menu **Extensions → Apps Script**. Hapus isi default, tempel seluruh isi `apps-script/Code.gs`, **Save**.
3. Pilih fungsi **setup** di dropdown → **Run** → izinkan akses. Ini membuat sheet `Users` dan `Config`.
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy → salin URL yang berakhiran `/exec`.

> Setiap mengubah Code.gs, deploy ulang: **Deploy → Manage deployments → Edit → New version**. URL tetap sama.

## 2. Hubungkan ke web
Buka `config.js`:
- `API_URL` → tempel URL `/exec` tadi
- `WA_NUMBER` → nomor WhatsApp Rizanta Studio (format `62812…`)

Nomor WA & pesan juga bisa diganti kapan saja di sheet **Config** (tanpa upload ulang).

## 3. Jadikan dirimu admin
1. Buka web → **Daftar** dengan username kamu.
2. Di sheet **Users**, ubah kolom `role` di barismu dari `free` menjadi `admin`.
3. Buka `admin.html` → kelola member di sana.

## 4. Upload
Upload semua file ke hosting (`index.html`, `admin.html`, `*.js`, `*.css`). Folder `apps-script` tidak perlu diupload.

## Cara pakai panel admin
Buka `admin.html` → cari member → **Atur** → pilih role **Premium** + durasi (7 hari, 1 bulan, … atau seumur hidup) → **Simpan**.
Saat durasi habis, akun otomatis kembali gratis dan fitur premium terkunci lagi.

## Uji coba tanpa Sheets
Kalau `API_URL` dikosongkan, web jalan di **mode demo** (data di browser). Admin demo: `admin` / `admin123`.

## Update v7 (template tersimpan di akun)
1. Buka Apps Script, **ganti seluruh isi Code.gs** dengan versi baru → Save.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
3. Sheet baru **Templates** dibuat otomatis saat template pertama disimpan. Jangan diedit manual.
4. Di sheet **Config**, ubah `wa_text` jadi "Halo kak Rizanta Studio, ..." kalau masih tertulis Rizanta Store.
5. Harga paket diatur di `config.js` → `PLANS`.
