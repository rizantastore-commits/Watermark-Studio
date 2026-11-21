# Pasang sistem login & premium (± 10 menit)

## 1. Google Sheets + Apps Script
1. Buat Google Sheets baru (nama bebas, mis. "Database ReyVion").
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
- `WA_NUMBER` → nomor WhatsApp ReyVion (format `62812…`)

Nomor WA & pesan juga bisa diganti kapan saja di sheet **Config** (tanpa upload ulang).

## 3. Jadikan dirimu admin
1. Buka web → **Daftar** dengan username kamu.
2. Di sheet **Users**, ubah kolom `role` di barismu dari `free` menjadi `admin`.
3. Buka `admin.html` → kelola member di sana.

## 4. Upload
Upload semua file ke hosting (`index.html`, `watermark.html`, `admin.html`, `*.js`, `*.css`). Folder `apps-script` tidak perlu diupload.

## Cara pakai panel admin
Buka `admin.html` → cari member → **Atur** → pilih role **Premium** + durasi (7 hari, 1 bulan, … atau seumur hidup) → **Simpan**.
Saat durasi habis, akun otomatis kembali gratis dan fitur premium terkunci lagi.

## Uji coba tanpa Sheets
Kalau `API_URL` dikosongkan, web jalan di **mode demo** (data di browser). Admin demo: `admin` / `admin123`.

## Update v7 (template tersimpan di akun)
1. Buka Apps Script, **ganti seluruh isi Code.gs** dengan versi baru → Save.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
3. Sheet baru **Templates** dibuat otomatis saat template pertama disimpan. Jangan diedit manual.
4. Di sheet **Config**, ubah `wa_text` jadi "Halo kak ReyVion, ..." kalau masih tertulis nama lama.
5. Harga paket diatur di `config.js` → `PLANS`.

## Update v9 (Kasir jadi halaman utama + produk, stok, laporan)
Halaman utama (`index.html`) sekarang **Kasir & Rekap Toko**. Editor watermark pindah ke `watermark.html` (ada tombol 🎀 di kasir dan tombol 🧾 di watermark). Semua data **per akun**: tiap member punya rekap, produk, stok, dan pengeluaran sendiri, tidak saling terlihat.

Fitur kasir: rekap akun (order, sisa durasi, tgl perpanjangan, pengingat H-1/H-3/H-7), **produk & stok** (modal, paket harga, stok berkurang otomatis saat jual, peringatan stok menipis, salin daftar harga untuk WA), **laporan bulanan** (omzet, modal, pengeluaran, laba bersih, produk terlaris, riwayat), dan **hitung refund**.

Cara update:
1. Buka Apps Script, **ganti seluruh isi Code.gs** dengan versi baru → Save.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
3. Upload SEMUA file ini ke hosting (timpa yang lama): `index.html`, `watermark.html`, `toko.html`, `toko.js`, `toko.css`, `admin.html`, `auth.js`, `auth.css`, `api.js`, `config.js`. (`toko.html` hanya pengalihan untuk bookmark lama.)
4. Sheet **Records** dibuat otomatis. Jangan diedit manual.

Pengaturan di `config.js` → `STORE`:
- `PREMIUM_ONLY: true` = hanya premium/admin yang bisa memakai kasir (akun gratis melihat kartu kunci + tombol ke Watermark). Kalau mau dibuka untuk semua, ubah jadi `false` **dan** ubah `STORE_PREMIUM_ONLY` di `Code.gs` jadi `false` (lalu deploy New version).
- `REMIND_DAYS` = pilihan pengingat. `DURATIONS` = tombol durasi cepat. `WA_REMIND` = teks WA ke pembeli.

Catatan: pengingat tampil sebagai banner saat halaman dibuka (bukan notifikasi otomatis saat web tertutup). Batas 2000 catatan per akun (penjualan + produk + pengeluaran). Modal per penjualan sudah dihitung di laporan dari harga modal; menu Pengeluaran khusus biaya lain (iklan, fee, dll.).


## Update v10 (perbaikan scroll, pratinjau kasir untuk akun gratis, fitur baru)
Tidak ada perubahan di `Code.gs`, jadi **tidak perlu deploy ulang Apps Script**. Cukup upload file berikut ke hosting (timpa yang lama): `index.html`, `toko.js`, `toko.css`, `admin.css`, `config.js`.

**Perbaikan bug scroll:** di halaman Kasir (dan Admin) scroll dengan roda mouse / sentuhan sebelumnya macet dan harus menarik scrollbar di kanan. Penyebabnya `body` ber-`overflow:auto` dan `overscroll-behavior:none` padahal tingginya `auto`, sehingga event scroll tertahan di body. Sekarang `body.adminpg` memakai `overflow:visible` dan `overscroll-behavior:auto` (di `admin.css`).

**Pratinjau Kasir untuk akun gratis:** akun yang belum premium sekarang melihat penjelasan fitur, cara kerja, dan **contoh tampilan kasir yang bisa dicoba** (tab Rekap, Produk, Laporan, Refund dengan data fiktif; kalkulator refund benar-benar jalan). Data contoh dibuat di browser dan tidak dikirim ke server. Tombol aksi di contoh hanya menampilkan petunjuk, dan tiap beberapa klik muncul ajakan upgrade.

**Fitur baru kasir (premium):**
- **Urutkan** catatan (segera habis, terbaru, nama, harga) dan **jumlah** di tiap filter.
- Statistik **Potensi perpanjang ≤ 7 hari** (total harga akun yang akan jatuh tempo).
- **Duplikat** catatan untuk jual produk yang sama ke pembeli lain.
- Laporan: **grafik tren 6 bulan** (omzet + laba) dan tombol **salin ringkasan** bulan (siap tempel ke WA).
- Tab baru **Alat**: pelanggan teratas (total belanja, tombol WA), daftar jatuh tempo 7 hari (bisa disalin), **backup & pulihkan** semua data ke file JSON (maksimal 500 catatan sekali pulihkan; isi file divalidasi dulu).
- Tombol **tema terang/gelap** di header kasir.


## Update v11 (tema sendiri, ganti nama & password)
**Wajib deploy ulang Apps Script** karena ada aksi baru (`acct_update`):
1. Buka Apps Script, **ganti seluruh isi Code.gs** dengan versi baru → Save.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
3. Upload SEMUA file ini ke hosting (timpa yang lama): `index.html`, `watermark.html`, `admin.html`, `script.js`, `toko.js`, `toko.css`, `auth.js`, `api.js`, dan 3 file BARU: `theme.js`, `theme.css`, `settings.js`.

**Menu Pengaturan** (tombol 🎨 di header tiap halaman, atau tombol ⚙️ Pengaturan di jendela akun). Di HP tampil sebagai lembar dari bawah, jadi perubahan tema langsung kelihatan di belakangnya.
- **Tema**: 12 template (Otomatis ikut mode HP, Pink Manis/Malam, Mint, Langit Biru, Lavender, Persik, Kopi Susu, Hitam Putih, Malam Biru, Hutan Malam, Plum Malam), **warna sendiri** (teks, latar, aksen) dan **10 pilihan font**. Warna lain (kotak, garis, bayangan, tombol) dihitung otomatis dari 3 warna itu. Kalau teks susah dibaca, muncul peringatan, dan kombinasi yang benar-benar tidak terbaca tidak diterapkan. Pilihan **tersimpan di akun** (sheet `Users`, kolom baru `theme`, dibuat otomatis saat tema pertama disimpan), jadi di perangkat mana pun tema akun itu ikut. Tiap akun punya tema sendiri dan tidak saling memengaruhi. Perangkat juga menyimpan salinan lokal (`wm_theme`) supaya halaman tidak berkedip; saat keluar akun, salinan lokal dihapus agar tema tidak terbawa ke akun lain di perangkat yang sama.
- **Akun**: ganti nama pengguna dan/atau password. **Password saat ini wajib diisi** untuk setiap perubahan. Salah 5x → dikunci 5 menit. Ganti nama otomatis memindahkan rekap, produk, dan template ke nama baru (sheet `Records` dan `Templates`). Ganti password membuat perangkat lain otomatis keluar, perangkat yang dipakai tetap masuk.

Perbaikan tampilan HP kecil (≤360px): halaman Admin dan Kasir tidak lagi bisa digeser ke samping.


## Update v16 (nota PNG, template WA per member, catatan klaim, kasir dirapikan)
**Tidak perlu deploy ulang Apps Script** (Code.gs tidak berubah). Semua data baru disimpan di sheet `Records` yang sudah ada. Upload file ini ke hosting (timpa yang lama): `index.html`, `toko.js`, `toko.css`, `theme.css`, `config.js`.

**Tampilan kasir dirapikan**
- Menu atas jadi 5 tab tetap (menempel di atas saat scroll): Rekap, Produk, Laporan, Klaim, Lainnya. Refund, QRIS, Pesan & Nota, serta Pelanggan & Backup dipindah ke tab **Lainnya** (ada tombol "← Lainnya" untuk kembali).
- Ringkasan angka dan banner pengingat hanya tampil di Rekap, tidak lagi memenuhi halaman lain.
- Kartu penjualan: 3 aksi utama (Perpanjang, WA, Nota) + tombol ⋯ untuk QR, Klaim, Refund, Duplikat, Edit.

**1. Nota PNG**: tombol **🧾 Nota** di tiap kartu. Isinya nama toko, produk, durasi, tanggal mulai & berakhir, harga, status lunas, dan teks bawah. Di HP tombol kirim membuka pilihan aplikasi dengan gambar terlampir; di komputer gambar disalin lalu tinggal Paste di chat WA. Email akun dan catatan bisa disembunyikan lewat centang.

**2. Template WA per member**: Lainnya → **Pesan & Nota**. Tiap akun mengatur sendiri template pengingat, caption nota, dan balasan klaim, plus nama toko dan teks bawah nota. Kode yang bisa dipakai: `{nama} {app} {status} {tgl} {sisa} {harga} {toko} {email}` (`{akun}` khusus balasan klaim). Ada pratinjau langsung. Teks di `config.js` (`WA_REMIND`, `WA_NOTA`, `WA_CLAIM`, `NOTA_FOOT`) sekarang jadi bawaan untuk member yang belum mengatur sendiri.

**3. Catatan klaim & garansi**: tab **Klaim**. Catat komplain, klaim garansi, atau ganti akun per pembeli (status Baru / Diproses / Selesai, akun lama → baru; email di catatan penjualan bisa ikut diperbarui). Pembeli yang punya klaim tampil dengan lencana di kartu & daftar pelanggan, dan 🚩 merah kalau mencapai `STORE.CLAIM_FLAG` (bawaan 3). Backup/pulihkan sekarang ikut membawa klaim, template, dan QRIS.


## Update v17 (watermark: logo & maskot bisa digeser, posisi tengah pas di frame)
Tidak ada perubahan di `Code.gs`. Upload `script.js` saja (timpa yang lama).
- **Logo dan maskot bisa digeser langsung** di preview pakai mouse atau jari. Posisinya tidak melompat ke pointer (titik pegangnya tetap), dan muncul garis bantu pink saat tepat di tengah (otomatis menempel). Tombol **Pusatkan logo / maskot** ada di tab masing-masing. Memilih salah satu dari 9 posisi preset akan mengembalikan logo ke mode preset.
- **Posisi tengah mengikuti foto saat pakai frame.** Teks, badge, logo, maskot, dan watermark Penuh sekarang mengacu ke area foto testimoni, jadi "tengah" benar-benar di tengah foto, bukan tengah kanvas (yang bergeser karena ada judul dan nama di frame). Kalau mau seperti dulu, pilih **Acuan posisi → Seluruh gambar** di tab Logo atau Maskot.


## Update v18 (Kasir beneran: keranjang → QRIS sesuai nominal → nota → riwayat)
**Tidak perlu deploy ulang Apps Script.** Semua tersimpan di sheet `Records` yang sudah ada. Upload (timpa): `index.html`, `toko.js`, `config.js` (tidak berubah), dan 2 file BARU: `kasir.js`, `kasir.css`.

Tab pertama di kasir sekarang **🛒 Kasir** (jadi halaman utama), isinya 3 bagian:
- **Kasir**: ketuk produk (atau ketik nama aplikasi, harga, durasi) → masuk pesanan. Tiap item bisa diubah harga, durasi, tanggal mulai, dan akun. Isi nama/WA pembeli (opsional), diskon (opsional). Total dihitung otomatis. Pilih metode bayar:
  - **QRIS**: QR langsung muncul di bawah total, nominalnya otomatis sesuai total (pakai QRIS yang diatur di Lainnya → QRIS Dinamis).
  - **Tunai**: isi uang diterima, kembalian dihitung.
  - **Transfer**: konfirmasi manual.
  Tekan **Selesai** → transaksi tersimpan, stok produk berkurang, nomor nota dibuat (INVyymmdd-001), dan nota PNG langsung muncul (kirim WA / salin / unduh).
- **Riwayat**: semua transaksi kasir (filter hari ini / 7 hari / bulan ini / semua, cari, total per metode bayar, cetak ulang nota, unduh CSV).
- **Toko**: nama toko, no. HP, alamat/IG, **logo** (di-crop bulat & dikecilkan otomatis), teks bawah nota, dengan pratinjau nota langsung.

Tiap item yang terjual tetap jadi catatan penjualan biasa, jadi Rekap, pengingat perpanjangan, Laporan, Refund, dan Klaim ikut jalan otomatis. Backup/pulihkan ikut membawa logo & profil toko.

### Tambahan v18: Invoice tagihan → Nota LUNAS
Di panel pembayaran ada tombol **🧾 Buat invoice & QR tagihan**. Isinya gambar invoice (logo, nama toko, no. HP, rincian pesanan, total, status *Menunggu pembayaran*, dan QR QRIS sesuai nominal) yang bisa dikirim ke WA, disalin, atau diunduh PNG. Setelah pembeli bayar, tekan **✓ Sudah dibayar · Tandai LUNAS**: transaksi tersimpan dan muncul **Nota LUNAS** dengan nomor yang sama dengan invoicenya. Upload ulang `kasir.js` saja.
