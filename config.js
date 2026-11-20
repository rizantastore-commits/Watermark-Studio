/* ===== PENGATURAN WEB (edit di sini) ===== */
window.WM_CONFIG = {
  // URL Web App Google Apps Script (yang berakhiran /exec).
  // Kosong = MODE DEMO (akun disimpan di browser saja, buat coba-coba).
  API_URL: 'https://script.google.com/macros/s/AKfycbwzZxJ8fWj8q1J32NWcRqpRbCHierWf5zfJ_5ri_ur2Vxbncs-azG10gBcs-7VRePvO8Q/exec',

  // Nomor WhatsApp Rizanta Studio (format 62, tanpa + atau spasi).
  // Nomor ini juga bisa diganti dari Google Sheets (sheet "Config" -> wa_number), jadi tidak perlu upload ulang.
  WA_NUMBER: '628979420338',
  WA_TEXT: 'Halo kak Rizanta Studio, aku mau upgrade Premium Watermark Studio.',

  // Credits (tampil di halaman login, menu akun, dan menu premium)
  CREDITS: {brand: 'Rizanta Studio', dev: 'Rizanta_V', link: 'https://instagram.com/Zntaaa_V'},

  // Paket premium di menu "Premium". GANTI harga sesuai harga jualmu. days:0 = seumur hidup.
  PLANS: [
    {name: 'Mingguan', days: 7, price: 'Rp5.000', note: 'Buat coba dulu'},
    {name: 'Bulanan', days: 30, price: 'Rp15.000', note: 'Paling pas', hot: true},
    {name: '3 Bulan', days: 90, price: 'Rp35.000', note: 'Lebih irit'},
    {name: 'Seumur Hidup', days: 0, price: 'Rp99.000', note: 'Bayar sekali'}
  ],

  // Tabel perbandingan Gratis vs Premium
  COMPARE: [
    ['Watermark teks, badge, logo, kontak', true, true],
    ['Download PNG / JPG / WebP', true, true],
    ['Jumlah foto', '1 foto', 'Sampai 40 + ZIP'],
    ['Watermark Penuh (memenuhi foto)', false, true],
    ['Frame testimoni & bingkai upload', false, true],
    ['Filter foto & Maskot', false, true],
    ['Template tersimpan di akun (sync device)', false, true],
    ['Kasir: rekap, produk & stok, laporan, refund, pengingat', false, true]
  ],

  // Kasir & Rekap Toko (index.html). Data tersimpan per akun di sheet "Records".
  STORE: {
    PREMIUM_ONLY: true,            // true = khusus premium/admin. Samakan dengan STORE_PREMIUM_ONLY di Code.gs
    REMIND_DAYS: [1, 3, 7],        // pilihan pengingat H-1, H-3, H-7
    DURATIONS: [7, 14, 30, 60, 90, 180, 365],
    // {nama} {app} {status} otomatis terisi saat klik tombol WA ke pembeli
    WA_REMIND: 'Halo kak {nama}, {app} kakak {status}. Mau diperpanjang kak? 😊'
  },

  // Tab yang dikunci untuk akun gratis (id tab di script.js)
  PREMIUM_TABS: ['tile', 'frame', 'cfr', 'ph', 'filter', 'mascot'],

  // Daftar fitur premium yang tampil di jendela "Unlock"
  PREMIUM_LIST: [
    'Watermark memenuhi foto (Penuh)',
    'Frame testimoni, bingkai upload & atur foto',
    'Filter foto & Maskot',
    'Banyak foto sekaligus + Download ZIP',
    'Simpan template sendiri & template premium',
    'Kasir & rekap toko: produk & stok, laporan laba, refund, pengingat perpanjangan, backup data'
  ]
};
