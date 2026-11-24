/* ===== PENGATURAN WEB (edit di sini) ===== */
window.WM_CONFIG = {
  // URL Web App Google Apps Script (yang berakhiran /exec).
  // Kosong = MODE DEMO (akun disimpan di browser saja, buat coba-coba).
  API_URL: 'https://script.google.com/macros/s/AKfycbwzZxJ8fWj8q1J32NWcRqpRbCHierWf5zfJ_5ri_ur2Vxbncs-azG10gBcs-7VRePvO8Q/exec',

  // Nomor WhatsApp ReyVion (format 62, tanpa + atau spasi).
  // Nomor ini juga bisa diganti dari Google Sheets (sheet "Config" -> wa_number), jadi tidak perlu upload ulang.
  WA_NUMBER: '628979420338',
  WA_TEXT: 'Halo kak ReyVion, aku mau upgrade Premium.',

  // Credits (tampil di halaman login, menu akun, dan menu premium)
  CREDITS: {brand: 'ReyVion', dev: 'Rizanta_V', link: 'https://instagram.com/Zntaaa_V'},

  // Paket premium di menu "Premium". GANTI harga sesuai harga jualmu. days:0 = seumur hidup.
  PLANS: [
    {name: 'Mingguan', days: 7, price: 'Rp5.000', note: 'Buat coba dulu'},
    {name: 'Bulanan', days: 30, price: 'Rp15.000', note: 'Paling pas', hot: true},
    {name: '3 Bulan', days: 90, price: 'Rp35.000', note: 'Lebih irit'},
    {name: 'Seumur Hidup', days: 0, price: 'Rp99.000', note: 'Bayar sekali'}
  ],

  // Tab Promosi di panel admin (semua opsional; kosong = pakai bawaan). Poster & teks juga bisa diubah langsung di panel.
  PROMO: {
    URL: '',                      // link web yang disebar. Kosong = otomatis dari alamat web saat panel dibuka
    HEAD: 'Jualan akun premium jadi rapi & gampang',
    SUB: 'Kasir, stok akun, nota PNG, dan laporan laba — semua dari HP. Gratis dipakai!',
    TAG: 'Kasir & Rekap Toko Online'
  },

  // Tabel perbandingan Gratis vs Premium
  COMPARE: [
    ['Watermark teks, badge, logo, kontak', true, true],
    ['Download PNG / JPG / WebP', true, true],
    ['Template tema warna', true, true],
    ['Atur warna sendiri (custom)', false, true],
    ['Jumlah foto', '1 foto', 'Sampai 40 + ZIP'],
    ['Watermark Penuh (memenuhi foto)', false, true],
    ['Frame testimoni & bingkai upload', false, true],
    ['Filter foto & Maskot', false, true],
    ['Template tersimpan di akun (sync device)', false, true],
    ['Kasir: catat jual, tunai & transfer, nota PNG', true, true],
    ['Kasir: transaksi per bulan', '30', 'Tanpa batas'],
    ['Kasir: produk & stok', '10 produk', 'Tanpa batas + paket harga'],
    ['Nota tanpa watermark + logo toko', false, true],
    ['QRIS dinamis sesuai nominal & invoice', false, true],
    ['Riwayat kasir', '30 hari', 'Semua + CSV'],
    ['Laporan laba, terlaris & tren 6 bulan', false, true],
    ['Pengingat perpanjang H-3 / H-7', false, true],
    ['Klaim, Akun Simpanan, pelanggan & backup', false, true],
    ['Template WA & teks nota sendiri', false, true]
  ],

  // Kasir & Rekap Toko (index.html). Data tersimpan per akun di sheet "Records".
  STORE: {
    PREMIUM_ONLY: false,           // false = akun gratis boleh pakai kasir (dengan batas di FREE). Samakan dengan STORE_PREMIUM_ONLY di Code.gs
    REMIND_DAYS: [1, 3, 7],        // pilihan pengingat H-1, H-3, H-7
    DURATIONS: [7, 14, 30, 60, 90, 180, 365],
    // Template bawaan pesan WA. Tiap member bisa mengubahnya sendiri di Kasir → Lainnya → Pesan & Nota
    // (tersimpan di akun masing-masing). Teks di bawah dipakai kalau member belum mengatur sendiri.
    // Kode yang bisa dipakai: {nama} {app} {status} {tgl} {sisa} {harga} {toko} {email} ({akun} khusus balasan klaim)
    WA_REMIND: 'Halo kak {nama}, {app} kakak {status}. Mau diperpanjang kak? 😊',
    WA_NOTA: 'Halo kak {nama}, ini nota pembelian {app} kakak ya 🧾 Aktif sampai {tgl}. Terima kasih sudah belanja di {toko} 💖',
    WA_CLAIM: 'Halo kak {nama}, kendala {app} kakak sudah kami tangani ya. {akun} Terima kasih sudah sabar menunggu 🙏',
    NOTA_FOOT: 'Terima kasih sudah belanja 💖 Simpan nota ini sebagai bukti pembelian & garansi.',
    CLAIM_FLAG: 3                  // pembeli dengan klaim sebanyak ini (atau lebih) diberi tanda 🚩 "sering komplain"
  },

  // Batas akun GRATIS di kasir. Batas transaksi/produk/pengeluaran juga dijaga di server: samakan dengan FREE_LIM di Code.gs.
  FREE: {
    TX_MONTH: 30,          // transaksi per bulan
    PRODUCTS: 10,          // jumlah produk
    EXPENSES_MONTH: 10,    // catatan pengeluaran per bulan
    HISTORY_DAYS: 30,      // riwayat kasir yang tampil (data lama tidak dihapus, terbuka lagi saat premium)
    REMIND: [1],           // pengingat perpanjangan yang boleh dipakai (H-1)
    TIERS: 1,              // paket harga per produk
    MARK: 'Dibuat dengan ReyVion Kasir'   // watermark kecil di nota akun gratis
  },

  // Tab yang dikunci untuk akun gratis (id tab di script.js)
  PREMIUM_TABS: ['tile', 'frame', 'cfr', 'ph', 'filter', 'mascot'],

  // Daftar fitur premium yang tampil di jendela "Unlock"
  PREMIUM_LIST: [
    'Watermark memenuhi foto (Penuh)',
    'Frame testimoni, bingkai upload & atur foto',
    'Filter foto & Maskot',
    'Banyak foto sekaligus + Download ZIP',
    'Atur warna tema sendiri (custom)',
    'Simpan template sendiri & template premium',
    'Kasir tanpa batas: transaksi, produk & stok, paket harga',
    'QRIS dinamis sesuai nominal + invoice tagihan',
    'Nota tanpa watermark, logo toko & teks nota sendiri',
    'Laporan laba bersih, produk terlaris, tren 6 bulan, riwayat penuh + CSV',
    'Klaim & garansi, Akun Simpanan, pelanggan teratas, backup & pulihkan, pengingat H-3/H-7'
  ]
};
