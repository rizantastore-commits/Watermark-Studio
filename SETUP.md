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

## v19 — Panel admin baru & Akun Simpanan (tim FH)
- **Panel admin** (`admin.html`): kartu member lebih lega, filter dengan hitungan, urutkan, bar sisa premium, tombol cepat "+30 hari", banner premium segera habis, unduh daftar member (CSV).
- **Akun Simpanan** (`akun.js`, `akun.css`): di tab *Produk* → *🔐 Akun Simpanan*. Catat email, password, status, pemegang/marker, tgl berakhir, modal, dan daftar profil (nama + PIN + dipakai oleh). Salin data akun, laporan untuk marker, CSV.
- Data tersimpan sebagai catatan tipe `a` di sheet Records (tidak perlu ubah / deploy ulang Code.gs). Ikut backup & pulihkan.

## Update v20 — Akun Simpanan: masa aktif, pemakai per profil, pengingat marker, 1 sheet per member
**WAJIB deploy ulang Apps Script** (Code.gs berubah):
1. Buka Apps Script, **ganti seluruh isi Code.gs** dengan versi baru → Save.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
3. Upload (timpa): `akun.js`, `akun.css`, `toko.js`, `index.html`.

**Data per member = 1 sheet sendiri.** Setiap member punya sheet bernama `Rec_<username>` (mis. `Rec_budi`), dibuat otomatis saat member itu pertama menyimpan data. Kolom: `id | tipe | data | updatedAt`. Kolom `tipe` berisi penjualan / produk / pengeluaran / akun / klaim / qris / template / logo / kasir, jadi gampang difilter di Sheets.
- **Data lama aman.** Sheet gabungan `Records` dipindah otomatis ke sheet member masing-masing, tepat saat member itu membuka kasir atau menyimpan data. Tidak perlu aksi manual. Setelah semua member sempat login sekali, sheet `Records` kosong dan boleh dihapus.
- Ganti nama pengguna → sheet ikut diganti namanya. Hapus member (admin) → sheet-nya ikut dihapus.
- Jangan mengubah kolom `data` secara manual (isinya JSON).

**Akun Simpanan (tab Produk → 🔐 Akun Simpanan)**
- **Masa aktif akun:** isi *Tanggal aktif*, pilih durasi (7 hari, 1 bulan, 2 bulan, 3 bulan, 6 bulan, 1 tahun, atau isi hari sendiri), *Tanggal berakhir* terisi otomatis dan masih bisa diubah. 1 bulan = 30 hari.
- **Pengingat minta laporan ke marker:** pilih H-1 / H-3 / H-5 / H-7 atau isi hari sendiri (bawaan H-3, bisa "Tanpa"). Saat masa akun tinggal sekian hari, muncul banner di tab Akun Simpanan (dan ringkasannya di Rekap, plus angka merah di tab). Tombol **WA** membuka chat ke marker dengan pesan siap kirim (isi *WA marker* di akun); kalau nomor kosong, pesan disalin. **Sudah** menyembunyikan pengingat untuk masa aktif itu; kalau tanggal berakhir diperpanjang, pengingat muncul lagi otomatis.
- **Terpakai per profil, bukan per akun:** ketuk sebuah profil di kartu akun → isi *Dipakai oleh*, *WA pemakai* (opsional), *tanggal mulai* dan durasi. Tersedia tombol **Perpanjang** (sambung dari tgl berakhir) dan **Kosongkan profil**. Status akun dihitung otomatis: Tersedia (semua kosong), Sebagian terpakai, atau Penuh. Bermasalah / Mati tetap diatur manual. Profil yang segera habis tampil di banner, dengan tombol WA ke pemakai kalau nomornya diisi.
- Saat mencatat penjualan dengan "Ambil dari akun simpanan", profil kosong pertama terisi otomatis lengkap dengan tanggal mulai dan durasi penjualan itu.
- Laporan untuk marker dan CSV sekarang memuat tgl aktif, tgl berakhir, serta pemakai + masa pakai tiap profil.
- Opsional di `config.js`: `AKUN: {DURATIONS: [[7,'7 hari'],[30,'1 bulan']], REMIND_DAYS: [1,3,5,7], DEFAULT_REMIND: 3, WA_MARKER: 'Halo kak {marker}, akun {app} ({email}) {status}. ...'}`. Kode pesan: `{marker} {app} {email} {status} {tgl} {sisa}`.

## Update v21 — Panel admin baru: pantau semua akses + rapi di HP
**WAJIB deploy ulang Apps Script** (Code.gs berubah):
1. Buka Apps Script, **ganti seluruh isi Code.gs** dengan versi baru → Save.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
3. Upload (timpa): `admin.html`, `admin.js`, `api.js`, dan 2 file BARU: `admin-plus.js`, `admin-plus.css`.
4. Sheet baru **Log** dan kolom baru **lastSeen** (sheet Users) dibuat otomatis. Jangan diedit manual.

**4 tab di panel admin** (menu bawah di HP, baris tab di komputer):
- **📊 Ringkasan**: 8 angka (total, premium, gratis, habis ≤7 hari, online sekarang, aktif 24 jam, daftar 24 jam, nonaktif), grafik pendaftar 14 hari, daftar premium segera habis (tombol +30 hr), member aktif terbaru, pemakai kasir terbanyak.
- **👥 Member**: cari (username/nama/catatan), filter, urutkan (termasuk terakhir aktif), **centang beberapa member → aksi massal** (tambah premium N hari, jadikan gratis, nonaktifkan, aktifkan). Kartu menampilkan aktif terakhir + jumlah catatan kasir & template. Jendela **Atur** kini punya rincian pemakaian (catatan per jenis, template, waktu masuk), **Paksa keluar** dari semua perangkat, dan reset password lewat formulir (bukan kotak prompt).
- **🛰️ Aktivitas**: log masuk, gagal masuk (percobaan salah password), pendaftaran, ganti nama/password, dan semua aksi admin. Disimpan di sheet `Log` (maks. 3000 baris, yang lama dibuang otomatis).
- **⚙️ Pengaturan**: nomor WhatsApp, pesan WA awal, buka/tutup pendaftaran. Tersimpan di sheet `Config`, berlaku langsung tanpa upload ulang.

Catatan: "online" = membuka web dalam 15 menit terakhir (dicatat maksimal tiap 5 menit supaya Sheets tidak boros tulis). Kalau tab Aktivitas/Pengaturan menampilkan pesan "Code.gs belum diperbarui", berarti langkah deploy di atas belum dilakukan.


## Update v22 — Akun gratis boleh pakai Kasir (dengan batas), fitur premium dikunci
**WAJIB deploy ulang Apps Script** (Code.gs berubah, batas dijaga di server):
1. Buka Apps Script, **ganti seluruh isi Code.gs** dengan versi baru → Save.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
3. Upload (timpa): `index.html`, `toko.js`, `kasir.js`, `config.js`, dan 2 file BARU: `premium.js`, `premium.css`.

**Akun gratis (batas bisa diubah di `config.js` → `FREE` dan `Code.gs` → `FREE_LIM`, samakan angkanya):**
- Kasir dasar: keranjang, diskon, **tunai & transfer**, nota PNG dengan **watermark kecil** ("Dibuat dengan ReyVion Kasir").
- **30 transaksi/bulan**, **10 produk** (1 paket harga per produk), **10 pengeluaran/bulan**.
- Riwayat kasir menampilkan **30 hari terakhir** (data lama tidak dihapus, terbuka lagi saat premium).
- Pengingat perpanjang **H-1** saja. Laporan: omzet + jumlah transaksi. Hitung refund tetap gratis.
- Bilah pemakaian (🆓 Akun Gratis) tampil di tab Kasir/Rekap/Produk/Laporan, ada tombol Upgrade.

**Khusus premium (dikunci, tombol bertanda 🔒):** QRIS dinamis (bayar & QR per catatan), invoice & QR tagihan, nota tanpa watermark, logo toko, teks bawah nota & tampilan invoice sendiri, template WA sendiri, laporan laba/modal/pengeluaran/terlaris/tren 6 bulan, salin ringkasan, unduh CSV (rekap, laporan, riwayat), pengingat H-3/H-7, paket harga bertingkat, Klaim & garansi, Akun Simpanan, Pelanggan teratas & Backup/pulihkan.

**Dijaga di server (tidak bisa ditembus lewat DevTools):** batas transaksi/produk/pengeluaran, paket harga >1, dan jenis catatan khusus premium (klaim, QRIS, logo, akun simpanan). Catatan template dari akun gratis hanya menyimpan nama toko, HP, dan alamat.

Catatan: batas bulanan dihitung per bulan kalender (zona Asia/Jakarta). Mengedit catatan yang sudah ada selalu boleh, jadi akun yang premiumnya habis tidak kehilangan data. Item dalam satu transaksi (satu nomor nota) dihitung 1 transaksi. Untuk menutup kasir lagi dari akun gratis, set `PREMIUM_ONLY: true` di `config.js` dan `STORE_PREMIUM_ONLY = true` di `Code.gs`.


## Update v22 — Keamanan & anti-kehilangan data
**WAJIB deploy ulang Apps Script** dan jalankan `installTriggers` sekali.

### Langkah pasang (urut)
1. Apps Script → **ganti seluruh isi Code.gs** dengan versi baru → Save.
2. Pilih fungsi **installTriggers** di dropdown → **Run** → klik *Izinkan* (akan minta akses Google Drive & kirim email; wajar, untuk backup & peringatan). Ini memasang jadwal harian jam 03.00 dan langsung membuat 1 backup. Cek Drive: folder **ReyVion Backup**.
3. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
4. Upload (timpa) ke hosting: `index.html`, `admin.html`, `watermark.html`, `admin.js`, `admin-plus.js`, `auth.js`, `settings.js`.
5. **Semua member akan diminta login ulang satu kali** (token sekarang disimpan sebagai hash). Normal, bukan error.

### Yang berubah
- **Backup harian otomatis** ke Google Drive (folder `ReyVion Backup`, 14 salinan terakhir). Tombol **💾 Backup sekarang** ada di Admin → Pengaturan. Kalau backup gagal atau login gagal 24 jam terakhir ≥ 30x, kamu dapat **email peringatan**.
- **Hapus member = pindah ke Sampah** (filter *Sampah* di tab Member). Bisa **Pulihkan** selama 30 hari, lalu terhapus permanen otomatis. Perlu ketik ulang username untuk konfirmasi. Username di Sampah tidak bisa dipakai orang lain.
- **Token login disimpan sebagai hash.** Kalau Google Sheet bocor, token yang terbaca tidak bisa dipakai masuk. Token admin berlaku 3 hari (member 30 hari).
- **Password baru minimal 8 karakter**, password umum (12345678, password123, dll.) dan password sama dengan username ditolak. Password lama tetap bisa dipakai login; aturan baru berlaku saat daftar / ganti / reset.
- **Batas pendaftaran** 20 akun/jam (ubah `REG_PER_HOUR` di Code.gs). **Kunci login bertahap**: 5x salah → kunci 5 menit, lalu 10, 20, 60 menit kalau terus dicoba.
- **Mode maintenance** (Admin → Pengaturan): hanya admin yang bisa masuk. **🚨 Keluarkan semua member** untuk keadaan darurat.
- **CSP** di `index.html`, `admin.html`, `watermark.html`: halaman hanya boleh terhubung ke Apps Script dan memuat skrip dari diri sendiri + jsdelivr (QR). Ini mempersulit pencurian token lewat skrip nakal. Kalau suatu saat menambah layanan luar (mis. analytics), tambahkan domainnya di tag `Content-Security-Policy`.
- Log aktivitas mencatat: pindah ke sampah, pulihkan, hapus permanen, keluarkan semua, backup, dan pendaftaran yang dibatasi.

### Wajib dilakukan manual (tidak bisa lewat kode)
- Aktifkan **2-Step Verification / passkey** di akun Google pemilik Sheet.
- **Jangan share** Google Sheet ke siapa pun. Siapa pun yang bisa membuka Sheet bisa membaca semua data member.
- Folder `ReyVion Backup` juga berisi data lengkap: jangan dibagikan.
- Tes pulihkan: sekali-sekali buka salinan backup di Drive untuk memastikan datanya utuh.

### Belum dikerjakan (catatan jujur)
- Password di **Akun Simpanan** masih tersimpan polos di Sheet `Rec_<username>` (dilindungi hanya oleh keamanan Sheet).
- Hash password tetap SHA-256 ×300 (Apps Script tidak punya bcrypt/argon2; menaikkan iterasi terlalu banyak membuat login lambat dan menahan semua pengguna).
- Apps Script tidak bisa membaca IP pengunjung, jadi pembatasan login per-username, bukan per-IP.
- Mode DEMO (`api.js`) tidak meniru fitur baru ini; fitur v22 hanya jalan di mode LIVE.


## Update v28 — Pusat pengumuman & "Apa yang baru"
Admin menulis pengumuman **sekali**, tampil sebagai **banner di atas halaman** semua member (Kasir & Watermark), plus riwayatnya di tombol **🔔 Apa yang baru**. Cocok untuk info update, promo paket, dan pemberitahuan maintenance. Jadi kamu punya jalur resmi selain WA.

**WAJIB deploy ulang Apps Script** (ada endpoint baru).

### Langkah pasang (urut)
1. Apps Script → **ganti seluruh isi Code.gs** dengan versi baru → Save.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama). Sheet **Announcements** dibuat otomatis saat pengumuman pertama disimpan (atau jalankan `setup()` lagi, aman, data lama tidak dihapus).
3. Upload (timpa) ke hosting: `index.html`, `watermark.html`, `admin.html`, `auth.js`, `api.js`, `admin-plus.js`, `admin-plus.css`. **File baru:** `announce.js`, `announce.css`, `admin-ann.js`.
4. Member **tidak perlu login ulang**.

### Cara pakai (Admin → tab 📣 Info)
- **+ Pengumuman** → pilih *Mulai cepat* (Update fitur / Promo paket / Maintenance / Info umum) atau tulis sendiri. Ada **pratinjau** persis seperti yang dilihat member.
- **Jenis:** Info, Promo, Update, Maintenance (beda warna & ikon).
- **Untuk siapa:** semua member, hanya akun gratis (cocok untuk promo upgrade), atau hanya premium (cocok untuk info fitur premium).
- **Tombol (opsional):** *Lihat paket* (membuka daftar harga), *Chat WhatsApp* (pesan otomatis berisi judul pengumuman + username), atau link `https://…` sendiri.
- **Jadwal:** *Mulai tayang* boleh diisi tanggal/jam nanti (mis. pemberitahuan maintenance). *Banner tampil selama* 1 / 3 / 7 / 30 hari atau tanpa batas.
- **Sematkan 📌:** member tidak bisa menutup bannernya (pakai untuk hal penting seperti maintenance).
- **Tayangkan:** matikan untuk menyimpan sebagai **draf**. Tombol **Sembunyikan / Tayangkan** di daftar untuk menarik pengumuman sementara tanpa menghapusnya.

### Perilaku yang perlu kamu tahu
- Banner muncul paling lambat **5 menit** setelah terbit (atau langsung saat member membuka ulang halaman / kembali ke tab).
- Member bisa **menutup** banner (tersimpan **per perangkat**, jadi di HP lain bisa muncul lagi). Yang disematkan tidak bisa ditutup.
- Setelah banner berakhir, **promo & maintenance hilang**, sedangkan jenis **Update tetap tersimpan** di riwayat 🔔 sebagai catatan "apa yang baru". Angka merah di 🔔 menghitung pengumuman yang belum dibuka; member baru tidak dibanjiri pengumuman lama.
- Di halaman Watermark (layar tetap) hanya **1 banner** ditampilkan, sisanya lewat tombol "+N". Di HP, tombol 🔔 ada di menu ☰.
- Pengumuman hanya terlihat **setelah login**, tidak di halaman login. Saat **mode maintenance** menyala member tidak bisa masuk sama sekali, jadi **umumkan maintenance sebelum** menyalakannya.
- Batas: judul 80 karakter, isi 500 karakter, maksimal 100 pengumuman. Tag `<` `>` dibuang otomatis. Link tombol hanya boleh `https://` (atau halaman sendiri seperti `index.html`).
- Template "Mulai cepat" berisi tanda **…** sebagai tempat mengisi tanggal/detail. Kalau masih tersisa saat disimpan, kamu akan diingatkan.
- Terbit / ubah / hapus pengumuman tercatat di tab **Aktivitas**.
- **Mode DEMO** (tanpa Sheets) juga meniru fitur ini, jadi bisa dicoba dulu (admin `admin` / `admin123`).
- Kalau Code.gs belum di-deploy, banner tidak tampil dan tab Info menampilkan pesan agar deploy versi terbaru.


## Update v29 — Pengumuman lebih bagus & tampilan dipercantik
**Tidak perlu deploy ulang Apps Script** (Code.gs tidak berubah). Cukup upload (timpa) 3 file: `announce.js`, `announce.css`, `admin-ann.js`.

### Untuk member
- **Kartu baru:** garis aksen warna per jenis, ikon dalam tile, label jenis berwarna, bayangan lembut, tombol promo berkilau. Maintenance diberi strip kuning supaya terlihat penting.
- **Banner berputar (carousel):** kalau ada lebih dari satu pengumuman, tampil satu per satu (ganti tiap 7 detik, bisa digeser di HP, titik navigasi + tombol *Lihat semua*). Berhenti otomatis saat disentuh atau saat teks dibuka. Halaman Watermark tetap 1 banner + tombol "🔔 +N".
- **Hitung mundur:** promo menampilkan "⏳ Berakhir 5 jam lagi" (merah kalau kurang dari 24 jam), maintenance menampilkan sampai kapan.
- **Teks panjang:** otomatis dipotong dengan tombol *Selengkapnya / Ringkas*.
- **Format teks:** `**tebal**` dan daftar dengan awalan `- ` (aman, tag HTML tetap dibuang).
- **Riwayat 🔔:** dikelompokkan *Hari ini / Kemarin / Minggu ini / Lebih lama*, ada filter per jenis, penanda **Baru**, tampilan kosong yang lebih ramah, dan lonceng bergoyang saat ada yang baru. Tutup dengan Esc.
- Banner tidak lagi digambar ulang tiap menit (animasi tidak mengulang), menutup banner pakai animasi geser.

### Untuk admin (tab 📣 Info)
- **Cari** pengumuman, daftar diurutkan (Tayang → Terjadwal → Draf → Selesai), garis warna per jenis, info *"Tayang X lagi"* / *"Sisa X"*.
- Tombol **📄 Gandakan** (salinan jadi draf).
- Pilih jenis lewat kartu bergambar; toolbar **B**, **• Daftar**, dan emoji cepat; penghitung judul & isi.
- Jadwal cepat: *Sekarang / +1 jam / Besok 08.00 / Minggu depan*.
- Pratinjau bisa diganti **Banner** / **Riwayat 🔔**; tombol Terbitkan menempel di bawah; **Ctrl+Enter** untuk menyimpan.
- Template Update fitur & Maintenance sudah memakai format daftar / tebal.


## Update v30 — Bantuan, Checklist Member Baru, FAQ & Lapor/Usul Fitur
**WAJIB deploy ulang Apps Script** (endpoint `fb_send`, `admin_fb_list`, `admin_fb_update`):
1. Buka Apps Script, **ganti seluruh isi `Code.gs`** dengan versi terbaru → **Save**.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
3. Sheet baru **Feedback** dibuat otomatis saat masukan pertama dikirim (atau jalankan `setup()` sekali).
4. Upload (timpa) semua file di folder `reyvion-v30` ke hosting (termasuk file baru `help.js` dan `help.css`).
