'use strict';
const $ = s => document.querySelector(s), cv = $('#cv');

/* ================= IKON (SVG) ================= */
const IC = {
  type:'M4 7V4h16v3M9 20h6M12 4v16', tag:'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
  grid:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', image:'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  frame:'M3 3h18v18H3zM3 16h18', crop:'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  smile:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01', save:'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  eye:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', download:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  share:'M4 12v8h16v-8M16 6l-4-4-4 4M12 2v13', moon:'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  sun:'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  upload:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12', trash:'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  wand:'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', x:'M18 6L6 18M6 6l12 12',
  undo:'M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10', redo:'M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10',
  copy:'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  sliders:'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6', drop:'M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z',
  camera:'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  layers:'M12 2l10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5', plus:'M12 5v14M5 12h14', up:'M18 15l-6-6-6 6', down:'M6 9l6 6 6-6',
  prev:'M15 18l-6-6 6-6', next:'M9 18l6-6-6-6'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24"><path d="${IC[n]}"/></svg>`;

/* ================= DATA & KONSTANTA ================= */
const clone = o => JSON.parse(JSON.stringify(o));
const DEF = {
  text:  {on:true, value:'ReyVion', font:'Fredoka', pos:'br', size:6, color:'#ffffff', opacity:80, rot:0, shadow:true, stroke:false, strokeColor:'#000000'},
  badge: {on:false, value:'PROMO 50%', pos:'tr', size:7, bg:'#ff5fa2', color:'#ffffff', rot:0, opacity:100},
  tile:  {on:false, value:'ReyVion', font:'Fredoka', cols:3, rows:5, size:5, spread:100, rot:-30, ox:0, oy:0, color:'#ffffff', opacity:30, stagger:true},
  logo:  {on:false, src:'', pos:'tl', size:16, opacity:90, x:null, y:null},
  anc:   {mode:'photo'},
  frame: {on:false, layout:'polaroid', theme:'pink', shape:'rect', size:'4:5', deco:'dots', title:'TESTIMONI', name:'Kak Rina',
          review:'Admin ramah, proses cepat, akun langsung aktif. Recommended banget!', stars:5, font:'Fredoka', accent:'#ff7eb6',
          border:10, card:true, zoom:100, px:0, py:0, fit:'cover'},
  cframe:{on:false, mode:'wand', tol:35, grow:1, sx:-1, sy:-1, rx:15, ry:13, rw:71, rh:70, rr:3},
  filter:{bright:100, contrast:100, sat:100, blur:0, gray:0, sepia:0},
  info:  {on:false, value:'WA 0812-3456-7890  •  IG @rizanta.store', font:'Fredoka', pos:'b', style:'bar', size:32, bg:'#ff5fa2', color:'#ffffff', opacity:92},
  mascot:{on:false, emoji:'🐰', src:'', size:22, x:85, y:82, opacity:100, flip:false, bob:false}
};
const FONTS = ['Fredoka','Pacifico','Lobster','Bangers','Caveat','Dancing Script','Montserrat','Playfair Display','Baloo 2','Permanent Marker','Oswald','Chewy','Righteous','Satisfy'];
const fw = f => ({Pacifico:400, Lobster:400, Bangers:400, 'Permanent Marker':400, Chewy:400, Righteous:400, Satisfy:400, Oswald:600})[f] || 700;
const TH = { // [latar1, latar2, aksen, teks, kartu]
  pink:['#ffd1e6','#fff0f6','#ff7eb6','#5a2a47','#ffffff'], rose:['#ffc2d4','#fff0f4','#ff5c8a','#5a1f36','#ffffff'],
  bubblegum:['#ffb8dd','#ffe8f4','#ff4fa3','#5a1d44','#ffffff'], cherry:['#ffd6dd','#fff5f6','#e8456b','#5a1f2b','#ffffff'], peach:['#ffd9b8','#fff4e8','#ff9a5c','#5a3320','#ffffff'],
  mint:['#bff3dd','#effcf6','#3ecf9b','#1f4a3b','#ffffff'], lavender:['#d9ccff','#f4f0ff','#9a7bff','#3a2a6b','#ffffff'],
  sky:['#bfe3ff','#eef8ff','#4aa8ff','#1f3f66','#ffffff'], sun:['#ffe99a','#fffbe6','#ffbe1a','#5a4510','#ffffff'],
  neon:['#2a0a1d','#5a1a3d','#ff4fa3','#ffe6f2','#3d1229'], clean:['#f4f4f4','#ffffff','#222222','#222222','#ffffff']
};
const SZ = {'4:5':[1080,1350], '1:1':[1080,1080], '9:16':[1080,1920], '3:4':[1080,1440], '16:9':[1920,1080], '4:3':[1440,1080]};
const LY = {polaroid:[.13,.13,.74,.58], kartu:[.09,.17,.82,.5], bubble:[.14,.15,.72,.56], full:[.04,.04,.92,.68]};
const PK = ['title', 'name', 'review', 'stars', 'fit', 'zoom', 'px', 'py'], MAXI = 40; // isi yang beda tiap testi
const P9 = ['tl','t','tr','l','c','r','bl','b','br'];

// Template bawaan: hanya isi bagian yang berbeda dari DEF
const PRE = [
  {n:'Klasik Pojok', s:{text:{pos:'br', size:6, opacity:85}}},
  {n:'Anti Maling', s:{text:{on:false}, tile:{on:true, rows:6, cols:3, size:5, rot:-30, opacity:28}}},
  {n:'Cute Pink', s:{text:{font:'Pacifico', pos:'b', size:7, color:'#ff5fa2', opacity:95}, mascot:{on:true, emoji:'🐰', size:20, x:86, y:78, bob:true}}},
  {n:'Testimoni Polaroid', s:{text:{size:4, opacity:70}, frame:{on:true}, mascot:{on:true, emoji:'🎀', size:14, x:88, y:10}}},
  {n:'Story Pink Pastel', s:{text:{on:false}, frame:{on:true, size:'9:16', layout:'kartu', shape:'arch', theme:'bubblegum', accent:'#ff4fa3', deco:'star', font:'Baloo 2'}, mascot:{on:true, emoji:'🧸', size:22, x:84, y:90}}},
  {n:'Neon Bulat', s:{text:{on:false}, frame:{on:true, shape:'circle', theme:'neon', accent:'#ff4fa3', font:'Righteous'}}},
  {n:'Banner Promo', s:{text:{on:false}, badge:{on:true, rot:8}, frame:{on:true, size:'16:9', shape:'squircle', theme:'cherry', accent:'#e8456b', deco:'heart', font:'Bangers', title:'PROMO HARI INI', name:'Netflix Premium', review:'Garansi full, harga murah, fast respon. Chat admin sekarang!', stars:0}}},
  {n:'Elegan Minimal', s:{text:{font:'Playfair Display', size:4, opacity:70}, tile:{on:true, font:'Playfair Display', rows:4, cols:2, size:4, rot:-20, opacity:16}}}
];

let CF = {}, pickMode = false, pu = 0;
const FP = [['Asli',{}],['Hitam putih',{gray:100}],['Sepia',{sepia:70}],['Cerah',{bright:112,contrast:108,sat:125}],['Dramatis',{contrast:140,sat:115,bright:94}],['Lembut',{bright:108,contrast:90,sat:95}]];
let S = clone(DEF), I = {}, PID = 0, PIDN = 0, ITEMS = [], CUR = -1, UID = 0, busy = false, pend = null, FC = {}, HS = [], HI = -1, ht = 0, TP = [], still = false, WIN = null, drag = 0, lx = 0, ly = 0, off = [0, 0], HIT = {logo: null, mas: null}, GUIDE = {x: false, y: false};
const get = p => p.split('.').reduce((o, k) => o[k], S);
const set = (p, v) => { const a = p.split('.'), l = a.pop(); a.reduce((o, k) => o[k], S)[l] = v; };
const merge = (t, s) => { for (const k in s) s[k] && typeof s[k] == 'object' ? merge(t[k] = t[k] || {}, s[k]) : t[k] = s[k]; };

/* ================= PEMBUAT KONTROL ================= */
const H = t => `<h4>${t}</h4>`;
const dot = i => `<span style="justify-self:${['start','center','end'][i % 3]};align-self:${['start','center','end'][i / 3 | 0]}"></span>`;
const pos = k => `<div class="pos">${P9.map((p, i) => `<button data-set="${k}" data-val="${p}" aria-label="Posisi ${p}">${dot(i)}</button>`).join('')}</div>`;
const chips = (k, a, cls = '') => `<div class="chips ${cls}">${a.map(([v, l]) => `<button data-set="${k}" data-val="${v}">${l}</button>`).join('')}</div>`;
const R = (k, l, a, b) => `<label class="f"><span>${l}<b data-v="${k}"></b></span><input type="range" min="${a}" max="${b}" data-k="${k}"></label>`;
const C = (k, l) => `<label class="chk">${l}<input type="checkbox" data-k="${k}"></label>`;
const T = (k, l) => `<label class="f"><span>${l}</span><input type="text" data-k="${k}"></label>`;
const K = (k, l) => `<label class="f"><span>${l}</span><input type="color" data-k="${k}"></label>`;
const FS = (k, l) => `<label class="f"><span>${l}</span><select data-k="${k}">${FONTS.map(f => `<option style="font-family:'${f}'">${f}</option>`).join('')}</select></label>`;
const B = (id, i, l, c = '') => `<button class="btn ${c}" id="${id}">${ic(i)}${l}</button>`;
const FB = (id, i, l) => `<label class="btn">${ic(i)}${l}<input type="file" id="${id}" accept="image/*" hidden></label>`;

const FBM = (id, i, l, c = '') => `<label class="btn ${c}">${ic(i)}${l}<input type="file" id="${id}" accept="image/*" multiple hidden></label>`;

const TABS = [
  ['list', 'Testi', 'layers', ['<small>Pilih banyak foto sekaligus: satu foto = satu testimoni. Gaya (frame, warna, watermark) sama untuk semua, tapi nama, isi, bintang &amp; posisi foto bisa beda tiap testi. Foto tidak tersimpan kalau halaman ditutup, jadi download dulu ya.</small>',
    FBM('photos', 'plus', 'Tambah foto (bisa banyak)', 'pri'), '<div class="items" id="items"></div>',
    '<div class="grp2">' + B('dup', 'copy', 'Duplikat') + B('clr', 'trash', 'Hapus semua') + '</div>',
    H('Isi teks sekaligus'), '<small>Satu baris = satu testi, urut sesuai daftar. Format: <b>Nama | Isi testimoni</b></small>',
    '<label class="f"><textarea rows="5" id="bulk" placeholder="Kak Rina | Admin ramah, akun langsung aktif!&#10;Kak Dito | Fast respon, recommended banget"></textarea></label>', B('bulkGo', 'wand', 'Terapkan ke daftar'),
    H('Simpan semua hasil'), B('zipAll', 'download', 'Download semua (ZIP)', 'pri'), B('eachAll', 'download', 'Download satu-satu'), B('shAll', 'share', 'Bagikan semua')]],
  ['text', 'Teks', 'type', [C('text.on', 'Aktifkan watermark teks'), T('text.value', 'Nama watermark'), FS('text.font', 'Font'), H('Posisi'), pos('text.pos'), chips('anc.mode', [['photo', 'Ikut foto (tengah pas)'], ['all', 'Seluruh gambar']]),
    R('text.size', 'Ukuran', 1, 30), K('text.color', 'Warna'), R('text.opacity', 'Opacity (transparan sampai pekat)', 5, 100), R('text.rot', 'Rotasi', -90, 90), C('text.shadow', 'Bayangan teks'), C('text.stroke', 'Garis tepi teks'), K('text.strokeColor', 'Warna garis tepi')]],
  ['badge', 'Badge', 'tag', [C('badge.on', 'Tampilkan badge promo / harga'), T('badge.value', 'Teks badge (mis. Rp15.000)'), H('Posisi'), pos('badge.pos'), chips('anc.mode', [['photo', 'Ikut foto (tengah pas)'], ['all', 'Seluruh gambar']]),
    R('badge.size', 'Ukuran', 2, 20), K('badge.bg', 'Warna badge'), K('badge.color', 'Warna teks'), R('badge.rot', 'Rotasi', -45, 45), R('badge.opacity', 'Opacity', 20, 100)]],
  ['tile', 'Penuh', 'grid', [C('tile.on', 'Aktifkan watermark memenuhi foto'), T('tile.value', 'Tulisan'), FS('tile.font', 'Font'), R('tile.cols', 'Jumlah per baris', 1, 8), R('tile.rows', 'Jumlah baris', 1, 12),
    R('tile.size', 'Ukuran', 1, 15), R('tile.spread', 'Jarak', 40, 160), R('tile.rot', 'Rotasi', -90, 90), R('tile.ox', 'Geser kiri / kanan', -50, 50), R('tile.oy', 'Geser atas / bawah', -50, 50),
    K('tile.color', 'Warna'), R('tile.opacity', 'Opacity', 5, 100), C('tile.stagger', 'Susun selang-seling')]],
  ['logo', 'Logo', 'image', [C('logo.on', 'Tampilkan logo / gambar'), FB('fLogo', 'upload', 'Upload logo store'), '<small>Logo tersimpan otomatis di browser dan langsung terpasang di sesi berikutnya.</small>',
    H('Posisi'), pos('logo.pos'), '<small>Atau geser langsung logo di preview pakai mouse / jari. Garis pink muncul saat pas di tengah.</small>', B('cLogo', 'grid', 'Pusatkan logo'), H('Acuan posisi'), chips('anc.mode', [['photo', 'Ikut foto (tengah pas)'], ['all', 'Seluruh gambar']]), '<small>Saat pakai frame, "Ikut foto" membuat posisi tengah dan pinggir mengacu ke foto testimoni, jadi pas di tengah.</small>', R('logo.size', 'Ukuran', 3, 90), R('logo.opacity', 'Opacity', 5, 100), B('xLogo', 'trash', 'Hapus logo')]],
  ['frame', 'Frame', 'frame', ['<div class="note curNote"></div>', C('frame.on', 'Pakai frame testimoni'), B('pick', 'camera', 'Ganti foto'), B('goCF', 'upload', 'Pakai bingkai sendiri (upload PNG)'),
    H('Ukuran'), chips('frame.size', [['4:5', '4:5 Feed'], ['1:1', '1:1 Kotak'], ['9:16', '9:16 Story'], ['3:4', '3:4'], ['16:9', '16:9 Banner'], ['4:3', '4:3']]),
    H('Layout'), chips('frame.layout', [['polaroid', 'Polaroid'], ['kartu', 'Kartu'], ['bubble', 'Bubble'], ['full', 'Foto besar']]),
    H('Bentuk foto'), chips('frame.shape', [['rect', 'Kotak'], ['squircle', 'Squircle'], ['circle', 'Bulat'], ['arch', 'Arch'], ['heart', 'Hati'], ['star', 'Bintang'], ['hex', 'Hexagon']]),
    H('Warna'), chips('frame.theme', Object.keys(TH).map(k => [k, k[0].toUpperCase() + k.slice(1)])), K('frame.accent', 'Warna aksen'),
    H('Hiasan latar'), chips('frame.deco', [['dots', 'Titik'], ['heart', 'Hati'], ['star', 'Bintang'], ['flower', 'Bunga'], ['none', 'Polos']]),
    H('Teks'), T('frame.title', 'Judul'), T('frame.name', 'Nama pembeli'), `<label class="f"><span>Isi testimoni</span><textarea rows="3" data-k="frame.review"></textarea></label>`,
    FS('frame.font', 'Font frame'), R('frame.stars', 'Jumlah bintang', 0, 5), R('frame.border', 'Tebal border foto', 0, 30), C('frame.card', 'Kartu di belakang')]],
  ['cfr', 'Upload', 'upload', ['<small>Upload bingkai kamu (PNG). Foto tetap dipilih dari tombol <b>Foto</b>, lalu muncul di lubang bingkai.</small>',
    FB('fCF', 'upload', 'Upload bingkai (PNG)'), C('cframe.on', 'Pakai bingkai ini'), '<div class="note" id="cfNote"></div>',
    H('Bolongi bagian tengah'), '<small>Kalau tengah bingkai masih hitam atau berwarna solid (belum transparan), pilih cara membolonginya.</small>',
    chips('cframe.mode', [['none', 'Sudah transparan'], ['wand', 'Otomatis'], ['rect', 'Manual kotak']]),
    '<div class="grp" data-m="wand">' + B('pickCF', 'wand', 'Tap area di preview') + R('cframe.tol', 'Toleransi warna', 3, 120) + R('cframe.grow', 'Perluas bolongan', 0, 8) + '</div>',
    '<div class="grp" data-m="rect">' + R('cframe.rx', 'Kiri', 0, 90) + R('cframe.ry', 'Atas', 0, 90) + R('cframe.rw', 'Lebar', 5, 100) + R('cframe.rh', 'Tinggi', 5, 100) + R('cframe.rr', 'Sudut bulat', 0, 50) + '</div>',
    B('dCF', 'download', 'Simpan bingkai transparan (PNG)'), B('xCF', 'trash', 'Hapus bingkai')]],
  ['ph', 'Foto', 'crop', ['<div class="note curNote"></div>', '<small>Atur ukuran foto agar pas di dalam frame. Foto juga bisa digeser langsung di preview.</small>',
    chips('frame.fit', [['cover', 'Penuh (crop)'], ['contain', 'Muat semua']]), R('frame.zoom', 'Zoom / ukuran foto', 30, 300),
    R('frame.px', 'Geser kiri / kanan', -100, 100), R('frame.py', 'Geser atas / bawah', -100, 100), B('pas', 'wand', 'Pas di frame', 'pri'), B('pxAll', 'copy', 'Samakan zoom & posisi ke semua testi')]],
  ['filter', 'Filter', 'sliders', ['<small>Atur tampilan foto asli. Watermark dan frame tidak ikut berubah.</small>', H('Efek cepat'),
    `<div class="chips">${FP.map((p, i) => `<button data-fp="${i}">${p[0]}</button>`).join('')}</div>`,
    R('filter.bright', 'Kecerahan', 40, 180), R('filter.contrast', 'Kontras', 50, 170), R('filter.sat', 'Warna (saturasi)', 0, 200),
    R('filter.blur', 'Blur', 0, 20), R('filter.gray', 'Hitam putih', 0, 100), R('filter.sepia', 'Sepia', 0, 100)]],
  ['info', 'Kontak', 'tag', ['<small>Bar info toko: nomor WA, Instagram, atau slogan.</small>', C('info.on', 'Tampilkan bar kontak'), T('info.value', 'Isi bar (WA, IG, dll)'), FS('info.font', 'Font'),
    H('Posisi'), chips('info.pos', [['b', 'Bawah'], ['t', 'Atas']]), H('Gaya'), chips('info.style', [['bar', 'Bar penuh'], ['pill', 'Kapsul']]),
    R('info.size', 'Ukuran teks', 20, 80), K('info.bg', 'Warna latar'), K('info.color', 'Warna teks'), R('info.opacity', 'Opacity', 30, 100)]],
  ['mascot', 'Maskot', 'smile', [C('mascot.on', 'Tampilkan maskot'), chips('mascot.emoji', ['🐰', '🐱', '🐻', '🎀', '🌸', '🍓', '🧸', '🍒', '💖', '⭐'].map(e => [e, e]), 'em'),
    FB('fMas', 'upload', 'Upload maskot sendiri'), R('mascot.size', 'Ukuran', 5, 80), '<small>Geser langsung maskot di preview pakai mouse / jari. Garis pink muncul saat pas di tengah.</small>', B('cMas', 'grid', 'Pusatkan maskot'), H('Acuan posisi'), chips('anc.mode', [['photo', 'Ikut foto (tengah pas)'], ['all', 'Seluruh gambar']]), '<small>Saat pakai frame, "Ikut foto" membuat posisi tengah dan pinggir mengacu ke foto testimoni, jadi pas di tengah.</small>', R('mascot.x', 'Posisi kiri / kanan', -20, 120), R('mascot.y', 'Posisi atas / bawah', -20, 120),
    R('mascot.opacity', 'Opacity', 10, 100), C('mascot.flip', 'Balik arah (mirror)'), C('mascot.bob', 'Maskot goyang (animasi)'), B('xMas', 'trash', 'Hapus maskot upload')]],
  ['tpl', 'Template', 'save', ['<small>Pilih template, lalu ubah sesukamu. Template buatanmu tersimpan di akun, jadi tetap ada kalau login dari HP atau perangkat lain.</small>', H('Template bawaan'), '<div class="pre" id="pre"></div>',
    H('Template kamu'), '<label class="f"><span>Nama template</span><input type="text" id="tn" placeholder="mis. Template Netflix"></label>',
    B('ts', 'save', 'Simpan pengaturan ini', 'pri'), '<div class="tpls" id="tl"></div>', B('rs', 'trash', 'Reset semua')]]
];
// 4 menu utama (tidak perlu scroll) + sub-menu kecil di dalam panel
const GR = [['ls', 'Testi', 'layers', ['list']], ['wm', 'Watermark', 'drop', ['text', 'badge', 'tile', 'logo']], ['fr', 'Frame', 'frame', ['frame', 'cfr', 'ph']],
            ['ed', 'Edit', 'sliders', ['filter', 'mascot', 'info']], ['tpl', 'Template', 'save', ['tpl']]];
const LBL = {list: 'Daftar', text: 'Teks', badge: 'Badge', tile: 'Penuh', logo: 'Logo', frame: 'Bawaan', cfr: 'Upload', ph: 'Foto', filter: 'Filter', mascot: 'Maskot', info: 'Kontak', tpl: 'Template'};
const curSub = {};
$('#tabs').innerHTML = GR.map(g => `<button data-g="${g[0]}">${ic(g[2])}${g[1]}</button>`).join('');
$('#panes').innerHTML = TABS.map(t => `<div class="sec" id="s-${t[0]}">${t[3].join('')}</div>`).join('');
document.querySelectorAll('[data-i]').forEach(e => e.innerHTML = ic(e.dataset.i));
const tab = k => {
  const g = GR.find(x => x[3].includes(k)); curSub[g[0]] = k;
  $('#subs').innerHTML = g[3].length > 1 ? g[3].map(s => `<button data-tab="${s}">${LBL[s]}</button>`).join('') : '';
  $('#subs').hidden = g[3].length < 2;
  document.querySelectorAll('.sec').forEach(e => e.classList.toggle('on', e.id == 's-' + k));
  document.querySelectorAll('[data-tab]').forEach(e => e.classList.toggle('on', e.dataset.tab == k));
  document.querySelectorAll('[data-g]').forEach(e => e.classList.toggle('on', e.dataset.g == g[0]));
  $('#panes').scrollTop = 0; Auth.onTab();
};
const grp = g => tab(curSub[g] || GR.find(x => x[0] == g)[3][0]);

/* ================= SINKRONISASI, SIMPAN, ANIMASI ================= */
function sync() {
  document.querySelectorAll('[data-k]').forEach(e => {
    const v = get(e.dataset.k);
    if (e.type == 'checkbox') e.checked = v; else if (e.value !== String(v)) e.value = v;
  });
  document.querySelectorAll('[data-v]').forEach(e => e.textContent = get(e.dataset.v));
  document.querySelectorAll('[data-set]').forEach(e => e.classList.toggle('on', get(e.dataset.set) === e.dataset.val));
  $('#hLogo').innerHTML = S.logo.src ? `<img src="${S.logo.src}" alt="">` : ic('smile');
  document.querySelectorAll('[data-m]').forEach(e => e.hidden = e.dataset.m != S.cframe.mode);
  cv.style.touchAction = S.mascot.on || S.logo.on || S.frame.on || useCF() ? 'none' : 'auto';
}
const upd = () => { sync(); draw(); save(); lab(); pend = null; };
const save = () => { stash(); hpush(); try { localStorage.setItem('wm_s', JSON.stringify(S)); } catch (e) { toast('Penyimpanan browser penuh, logo besar tidak tersimpan'); } };
const tkey = () => 'wm_t_' + ((Auth.user() || {}).username || '');
const saveT = () => { try { localStorage.setItem(tkey(), JSON.stringify(TP)); } catch (e) {} }; // cache lokal; data utama di Google Sheets (per akun)
async function loadTpl() { // ambil template milik akun ini dari server
  try { TP = JSON.parse(localStorage.getItem(tkey()) || '[]'); } catch (e) { TP = []; } renderTpl();
  try { // template lama (versi sebelum sync) dipindah ke akun, sekali saja
    const old = JSON.parse(localStorage.getItem('wm_t') || '[]');
    if (old.length && Auth.isPremium()) { for (const t of old) await Auth.call('tpl_save', {name: t.n, data: JSON.stringify(t.s)}); localStorage.removeItem('wm_t'); }
  } catch (e) {}
  const r = await Auth.call('tpl_list'); if (r.ok) { TP = r.templates; saveT(); renderTpl(); }
}
window.WM_ON_AUTH = () => loadTpl();
window.WM_ON_LOGOUT = () => { TP = []; renderTpl(); };
/* riwayat undo / redo */
const hbtn = () => { $('#un').disabled = HI < 1; $('#re').disabled = HI >= HS.length - 1; };
function hnow() { const j = JSON.stringify(S); if (HS[HI] === j) return; HS = HS.slice(0, HI + 1); HS.push(j); if (HS.length > 30) HS.shift(); HI = HS.length - 1; hbtn(); }
function hpush() { clearTimeout(ht); ht = setTimeout(() => { ht = 0; hnow(); }, 350); }
function hgo(n) {
  if (ht) { clearTimeout(ht); ht = 0; hnow(); }
  const i = HI + n; if (i < 0 || i >= HS.length) return;
  HI = i; S = clone(DEF); merge(S, JSON.parse(HS[i])); loadAll(); hbtn();
}
let tt; const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200); };
const pop = () => { const e = $('.cv'); e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); };
function tw(o, k, to, ms = 500, from) { // animasi halus nilai angka (ease-out-back)
  const f = from != null ? from : o[k], t0 = performance.now();
  (function s(n) {
    const p = Math.min(1, (n - t0) / ms), q = p - 1;
    o[k] = f + (to - f) * (1 + 2.70158 * q * q * q + 1.70158 * q * q);
    sync(); draw();
    p < 1 ? requestAnimationFrame(s) : (o[k] = to, upd());
  })(t0);
}
function burst() { // konfeti hati & bintang pink
  const cs = ['#ff4f9a', '#ff7eb6', '#ffa6cc', '#ff94c2', '#ffb703'], ch = ['♥', '✦', '♡', '★', '✿'];
  for (let i = 0; i < 16; i++) {
    const e = document.createElement('i'), z = 14 + Math.random() * 16;
    e.className = 'pt'; e.textContent = ch[i % 5];
    e.style.cssText = `left:50%;top:70%;font-size:${z}px;color:${cs[i % 5]}`;
    document.body.appendChild(e);
    requestAnimationFrame(() => { e.style.transform = `translate(${(Math.random() - .5) * 380}px,${-90 - Math.random() * 240}px) rotate(${Math.random() * 540}deg)`; e.style.opacity = 0; });
    setTimeout(() => e.remove(), 1000);
  }
}

/* ================= GAMBAR & FONT ================= */
function loadImg(k, src) {
  if (k == 'photo') PID++;
  if (!src) { I[k] = null; draw(); return; }
  const im = new Image(); im.onload = () => { I[k] = im; draw(); }; im.src = src;
}
function shrink(f, max, cb) { // kecilkan gambar upload agar muat di penyimpanan browser
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const s = Math.min(1, max / Math.max(im.width, im.height)), k = document.createElement('canvas');
    k.width = im.width * s; k.height = im.height * s; k.getContext('2d').drawImage(im, 0, 0, k.width, k.height); cb(k.toDataURL('image/png'));
  }; im.src = r.result; };
  r.readAsDataURL(f);
}
const fl = f => document.fonts && document.fonts.load(`${fw(f)} 40px "${f}"`).then(draw).catch(() => 0);

/* ================= GAMBAR CANVAS ================= */
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
const AX = p => { const n = P9.indexOf(p); return [n % 3, n / 3 | 0]; };
function starPath(c, cx, cy, r) { for (let i = 0; i < 10; i++) { const g = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? .45 : 1; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(g) * r * k, cy + Math.sin(g) * r * k); } c.closePath(); }
function heartPath(c, cx, cy, r) { c.moveTo(cx, cy + r * .9); c.bezierCurveTo(cx - r * 1.4, cy - r * .1, cx - r * .6, cy - r * 1.1, cx, cy - r * .35); c.bezierCurveTo(cx + r * .6, cy - r * 1.1, cx + r * 1.4, cy - r * .1, cx, cy + r * .9); }
function flowerPath(c, cx, cy, r) { for (let i = 0; i < 5; i++) { const g = i * Math.PI * 2 / 5, px = cx + Math.cos(g) * r * .55, py = cy + Math.sin(g) * r * .55; c.moveTo(px + r * .45, py); c.arc(px, py, r * .45, 0, 7); } }
function shp(c, x, y, w, h, s) { // bentuk jendela foto
  c.beginPath(); const cx = x + w / 2, cy = y + h / 2;
  if (s == 'circle') c.ellipse(cx, cy, w / 2, h / 2, 0, 0, 7);
  else if (s == 'arch') c.roundRect(x, y, w, h, [w / 2, w / 2, 40, 40]);
  else if (s == 'squircle') c.roundRect(x, y, w, h, Math.min(w, h) * .3);
  else if (s == 'heart') { c.moveTo(cx, y + h); c.bezierCurveTo(x - w * .1, y + h * .55, x + w * .05, y - h * .05, cx, y + h * .28); c.bezierCurveTo(x + w * .95, y - h * .05, x + w * 1.1, y + h * .55, cx, y + h); }
  else if (s == 'star' || s == 'hex') { const st = s == 'star', n = st ? 10 : 6; for (let i = 0; i < n; i++) { const k = st && i % 2 ? .45 : 1, g = -Math.PI / 2 + i * Math.PI * 2 / n; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(g) * w / 2 * k, cy + Math.sin(g) * h / 2 * k); } c.closePath(); }
  else c.roundRect(x, y, w, h, 40);
}
function placeholder(c, x, y, w, h) {
  const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#ffd1e6'); g.addColorStop(1, '#ffb3d4');
  c.fillStyle = g; c.fillRect(x, y, w, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `700 ${Math.min(w, h) * .06}px Fredoka,sans-serif`; c.fillText('Pilih foto dulu ya', x + w / 2, y + h / 2);
}
function wrap(c, t, mw) { const o = []; let l = ''; for (const w of t.split(' ')) { const n = l ? l + ' ' + w : w; if (c.measureText(n).width > mw && l) { o.push(l); l = w; } else l = n; } if (l) o.push(l); return o; }

function photoSrc() { // foto dengan filter (di-cache supaya ringan)
  const p = I.photo, f = S.filter; if (!p) return null;
  if (f.bright == 100 && f.contrast == 100 && f.sat == 100 && !f.blur && !f.gray && !f.sepia) return p;
  const key = PID + JSON.stringify(f); if (FC.key == key) return FC.cv;
  const sc = Math.min(1, 1600 / Math.max(p.width, p.height)), w = Math.round(p.width * sc), h = Math.round(p.height * sc), o = document.createElement('canvas');
  o.width = w; o.height = h; const x = o.getContext('2d', {willReadFrequently: true});
  if (f.blur > 0 && 'filter' in x) x.filter = `blur(${f.blur * w / 1000}px)`;
  x.drawImage(p, 0, 0, w, h); x.filter = 'none';
  if (f.bright != 100 || f.contrast != 100 || f.sat != 100 || f.gray || f.sepia) {
    const d = x.getImageData(0, 0, w, h), a = d.data, br = f.bright / 100, ct = f.contrast / 100, st = f.sat / 100, gy = f.gray / 100, sp = f.sepia / 100;
    for (let i = 0; i < a.length; i += 4) {
      let r = (a[i] * br - 128) * ct + 128, g = (a[i + 1] * br - 128) * ct + 128, b = (a[i + 2] * br - 128) * ct + 128;
      const l = .299 * r + .587 * g + .114 * b;
      r = l + (r - l) * st; g = l + (g - l) * st; b = l + (b - l) * st;
      if (gy) { r += (l - r) * gy; g += (l - g) * gy; b += (l - b) * gy; }
      if (sp) { const R_ = r * .393 + g * .769 + b * .189, G_ = r * .349 + g * .686 + b * .168, B_ = r * .272 + g * .534 + b * .131; r += (R_ - r) * sp; g += (G_ - g) * sp; b += (B_ - b) * sp; }
      a[i] = r; a[i + 1] = g; a[i + 2] = b;
    }
    x.putImageData(d, 0, 0);
  }
  FC = {key, cv: o}; return o;
}
function drawFrame(c, W, H) {
  const F = S.frame, th = TH[F.theme] || TH.pink, a = F.accent, u = Math.min(W, H) / 1080, L = W > H * 1.2,
        ly = L ? [.06, .17, .5, .7] : LY[F.layout] || LY.polaroid, ff = `"${F.font}",sans-serif`, m = 45 * u;
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, th[0]); g.addColorStop(1, th[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (F.deco != 'none') { // hiasan latar berpola
    c.save(); c.fillStyle = 'rgba(255,255,255,.5)'; const r = 17 * u;
    for (let y = 0, row = 0; y < H + 90 * u; y += 90 * u, row++) for (let x = (row % 2) * 45 * u; x < W + 90 * u; x += 90 * u) {
      c.beginPath();
      if (F.deco == 'heart') heartPath(c, x, y, r); else if (F.deco == 'star') starPath(c, x, y, r); else if (F.deco == 'flower') flowerPath(c, x, y, r); else c.arc(x, y, r * .45, 0, 7);
      c.fill();
    }
    c.restore();
  }
  if (F.card) { c.save(); c.shadowColor = 'rgba(0,0,0,.2)'; c.shadowBlur = 30 * u; c.fillStyle = th[4]; rr(c, m, m, W - 2 * m, H - 2 * m, (F.layout == 'bubble' ? 110 : 50) * u); c.fill(); c.restore(); }
  const x = ly[0] * W, y = ly[1] * H, w = ly[2] * W, h = ly[3] * H; WIN = {x, y, w, h};
  c.save(); shp(c, x, y, w, h, F.shape); c.clip(); c.fillStyle = th[1]; c.fillRect(x, y, w, h);
  const im = photoSrc();
  if (im) { const b = (F.fit == 'cover' ? Math.max : Math.min)(w / im.width, h / im.height) * F.zoom / 100, dw = im.width * b, dh = im.height * b;
    c.drawImage(im, x + (w - dw) / 2 + w * F.px / 100, y + (h - dh) / 2 + h * F.py / 100, dw, dh); }
  else placeholder(c, x, y, w, h);
  c.restore();
  if (F.border > 0) { c.strokeStyle = a; c.lineWidth = F.border * u; shp(c, x, y, w, h, F.shape); c.stroke(); }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (F.title) { c.font = `${fw(F.font)} ${44 * u}px ${ff}`; const pw = c.measureText(F.title).width + 100 * u, py = (m + y) / 2;
    c.fillStyle = a; rr(c, W / 2 - pw / 2, py - 45 * u, pw, 90 * u, 45 * u); c.fill(); c.fillStyle = '#fff'; c.fillText(F.title, W / 2, py + 2 * u); }
  const tx = L ? W * .77 : W / 2, ty = L ? H * .3 : y + h + 75 * u, tw_ = L ? W * .32 : W - 260 * u;
  if (F.stars) { c.fillStyle = '#ffb703'; const gap = 68 * u, x0 = tx - (F.stars - 1) * gap / 2; for (let i = 0; i < F.stars; i++) { c.beginPath(); starPath(c, x0 + i * gap, ty, 28 * u); c.fill(); } }
  c.fillStyle = th[3]; c.font = `${fw(F.font)} ${54 * u}px ${ff}`; c.fillText(F.name || '', tx, ty + 80 * u);
  c.font = `400 ${38 * u}px ${ff}`; c.globalAlpha = .85;
  wrap(c, F.review || '', tw_).slice(0, L ? 7 : 3).forEach((t, i) => c.fillText(t, tx, ty + 145 * u + i * 50 * u)); c.globalAlpha = 1;
}
const box = (W, H) => S.anc.mode != 'all' && WIN && (S.frame.on || useCF()) ? [WIN.x, WIN.y, WIN.w, WIN.h] : [0, 0, W, H]; // area acuan posisi: foto di dalam frame, atau seluruh gambar
function drawTile(c, W, H) {
  const t = S.tile; if (!t.on || !t.value) return; const [bx, by, bw, bh] = box(W, H);
  c.save(); c.globalAlpha = t.opacity / 100; c.fillStyle = t.color; c.font = `${fw(t.font)} ${W * t.size / 100}px "${t.font}",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let r = 0; r < t.rows; r++) for (let k = 0; k < t.cols; k++) {
    let px = (k + .5) / t.cols * bw + (t.stagger && r % 2 ? bw / t.cols / 2 : 0), py = (r + .5) / t.rows * bh;
    px = bx + bw / 2 + (px - bw / 2) * t.spread / 100 + W * t.ox / 100; py = by + bh / 2 + (py - bh / 2) * t.spread / 100 + H * t.oy / 100;
    c.save(); c.translate(px, py); c.rotate(t.rot * Math.PI / 180); c.fillText(t.value, 0, 0); c.restore();
  }
  c.restore();
}
function drawInfo(c, W, H) {
  const n = S.info; if (!n.on || !n.value) return;
  let fs = W * n.size / 1000; const ft = () => `${fw(n.font)} ${fs}px "${n.font}",sans-serif`;
  c.save(); c.font = ft();
  const mx = W * (n.style == 'bar' ? .94 : .86), t0 = c.measureText(n.value).width; if (t0 > mx) { fs *= mx / t0; c.font = ft(); }
  const bh = fs * 2.3, tw1 = c.measureText(n.value).width; let y;
  c.globalAlpha = n.opacity / 100; c.fillStyle = n.bg;
  if (n.style == 'bar') { y = n.pos == 't' ? 0 : H - bh; c.fillRect(0, y, W, bh); }
  else { const w = tw1 + fs * 2, m = W * .03; y = n.pos == 't' ? m : H - m - bh; c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = fs * .4; rr(c, (W - w) / 2, y, w, bh, bh / 2); c.fill(); c.shadowColor = 'transparent'; }
  c.globalAlpha = 1; c.fillStyle = n.color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n.value, W / 2, y + bh / 2 + fs * .05); c.restore();
}
function drawText(c, W, H) {
  const x = S.text; if (!x.on || !x.value) return;
  const [i, j] = AX(x.pos), m = W * .03, [bx, by, bw, bh] = box(W, H);
  c.save(); c.globalAlpha = x.opacity / 100; c.fillStyle = x.color; c.font = `${fw(x.font)} ${W * x.size / 100}px "${x.font}",sans-serif`;
  c.textAlign = ['left', 'center', 'right'][i]; c.textBaseline = ['top', 'middle', 'bottom'][j];
  if (x.shadow) { c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = W * .008; c.shadowOffsetY = W * .003; }
  c.translate(bx + [m, bw / 2, bw - m][i], by + [m, bh / 2, bh - m][j]); c.rotate(x.rot * Math.PI / 180);
  if (x.stroke) { c.lineJoin = 'round'; c.lineWidth = W * x.size / 100 * .14; c.strokeStyle = x.strokeColor; c.strokeText(x.value, 0, 0); }
  c.fillText(x.value, 0, 0); c.restore();
}
function drawBadge(c, W, H) {
  const b = S.badge; if (!b.on || !b.value) return;
  const [i, j] = AX(b.pos), m = W * .04, fs = W * b.size / 100, [bx, by, bw0, bh0] = box(W, H);
  c.save(); c.globalAlpha = b.opacity / 100; c.font = `700 ${fs}px Fredoka,sans-serif`;
  const bw = c.measureText(b.value).width + fs * 1.2, bh = fs * 1.9;
  c.translate(bx + [m + bw / 2, bw0 / 2, bw0 - m - bw / 2][i], by + [m + bh / 2, bh0 / 2, bh0 - m - bh / 2][j]); c.rotate(b.rot * Math.PI / 180);
  c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = fs * .3; c.fillStyle = b.bg; rr(c, -bw / 2, -bh / 2, bw, bh, bh / 2); c.fill();
  c.shadowColor = 'transparent'; c.fillStyle = b.color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.value, 0, fs * .05); c.restore();
}
function drawLogo(c, W, H) {
  const l = S.logo; HIT.logo = null; if (!l.on || !I.logo) return;
  const [bx, by, bw, bh] = box(W, H), w = W * l.size / 100, h = w * I.logo.height / I.logo.width; let x, y;
  if (l.x != null && l.y != null) { x = bx + bw * l.x / 100 - w / 2; y = by + bh * l.y / 100 - h / 2; } // posisi bebas (digeser)
  else { const [i, j] = AX(l.pos), m = W * .03; x = bx + [m, (bw - w) / 2, bw - m - w][i]; y = by + [m, (bh - h) / 2, bh - m - h][j]; }
  HIT.logo = {x, y, w, h}; c.save(); c.globalAlpha = l.opacity / 100; c.drawImage(I.logo, x, y, w, h); c.restore();
}
function drawMascot(c, W, H) {
  const m = S.mascot; HIT.mas = null; if (!m.on) return;
  const [bx, by, bw, bh] = box(W, H), w = W * m.size / 100, bb = m.bob && !still ? Math.sin(performance.now() / 280) : 0, cx = bx + bw * m.x / 100, cy = by + bh * m.y / 100;
  HIT.mas = {cx, cy, r: Math.max(w, 80) * .7};
  c.save(); c.globalAlpha = m.opacity / 100; c.translate(cx, cy + bb * H * .012); c.rotate(bb * .08); if (m.flip) c.scale(-1, 1);
  if (I.mas) { const h = w * I.mas.height / I.mas.width; c.drawImage(I.mas, -w / 2, -h / 2, w, h); }
  else { c.font = `${w}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(m.emoji, 0, 0); }
  c.restore();
}
function draw(t) { // akun gratis: fitur premium tidak ikut digambar
  if (Auth.isPremium()) return drawRaw(t);
  const b = [S.tile.on, S.frame.on, S.cframe.on, S.mascot.on, S.filter];
  S.tile.on = S.frame.on = S.cframe.on = S.mascot.on = false; S.filter = DEF.filter;
  try { return drawRaw(t); } finally { [S.tile.on, S.frame.on, S.cframe.on, S.mascot.on, S.filter] = b; }
}
function drawRaw(t) {
  t = t instanceof HTMLCanvasElement ? t : cv; // bisa menggambar ke canvas lain (untuk export)
  const F = S.frame, p = I.photo; let W, H;
  const U = useCF();
  if (U) [W, H] = [CF.work.width, CF.work.height];
  else if (F.on) [W, H] = SZ[F.size] || SZ['4:5'];
  else if (p) { const s = Math.min(1, 1400 / Math.max(p.width, p.height)); W = Math.round(p.width * s); H = Math.round(p.height * s); }
  else { W = 1080; H = 1080; }
  t.width = W; t.height = H;
  const c = t.getContext('2d');
  if (!U && !F.on) WIN = null;
  if (U) drawCF(c, W, H); else if (F.on) drawFrame(c, W, H); else if (p) c.drawImage(photoSrc(), 0, 0, W, H); else placeholder(c, 0, 0, W, H);
  drawTile(c, W, H); drawInfo(c, W, H); drawText(c, W, H); drawBadge(c, W, H); drawLogo(c, W, H); drawMascot(c, W, H);
  if (t === cv && drag && (GUIDE.x || GUIDE.y)) { // garis bantu tengah saat menggeser
    const [bx, by, bw, bh] = box(W, H); c.save(); c.strokeStyle = '#ff2d87'; c.lineWidth = Math.max(2, W / 360); c.setLineDash([W / 60, W / 90]); c.beginPath();
    if (GUIDE.x) { c.moveTo(bx + bw / 2, by); c.lineTo(bx + bw / 2, by + bh); } if (GUIDE.y) { c.moveTo(bx, by + bh / 2); c.lineTo(bx + bw, by + bh / 2); } c.stroke(); c.restore();
  }
}

/* ================= BINGKAI SENDIRI (upload PNG + bolongi tengah) ================= */
const useCF = () => S.cframe.on && !!CF.work;
const note = t => { const e = $('#cfNote'); if (e) e.textContent = t; };
const idb = (m, k, v) => new Promise((res, rej) => {
  const q = indexedDB.open('wm', 1); q.onupgradeneeded = () => q.result.createObjectStore('f'); q.onerror = () => rej(q.error);
  q.onsuccess = () => { const st = q.result.transaction('f', m == 'get' ? 'readonly' : 'readwrite').objectStore('f'), r = m == 'get' ? st.get(k) : m == 'put' ? st.put(v, k) : st.delete(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); };
});
function flood(W, H, sx, sy, ok) { // isi area yang saling nyambung (tanpa rekursi)
  const m = new Uint8Array(W * H), st = new Int32Array(W * H), s0 = sy * W + sx; if (!ok(s0)) return null;
  let sp = 0, n = 0, x0 = W, y0 = H, x1 = 0, y1 = 0; m[s0] = 1; st[sp++] = s0;
  while (sp) {
    const i = st[--sp], x = i % W, y = i / W | 0; n++;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    if (x > 0 && !m[i - 1] && ok(i - 1)) { m[i - 1] = 1; st[sp++] = i - 1; }
    if (x < W - 1 && !m[i + 1] && ok(i + 1)) { m[i + 1] = 1; st[sp++] = i + 1; }
    if (y > 0 && !m[i - W] && ok(i - W)) { m[i - W] = 1; st[sp++] = i - W; }
    if (y < H - 1 && !m[i + W] && ok(i + W)) { m[i + W] = 1; st[sp++] = i + W; }
  }
  return {m, n, b: [x0, y0, x1 - x0 + 1, y1 - y0 + 1]};
}
function growMask(m, W, H, k) {
  for (let t = 0; t < k; t++) { const c = m.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x;
      if (!c[i] && ((x > 0 && c[i - 1]) || (x < W - 1 && c[i + 1]) || (y > 0 && c[i - W]) || (y < H - 1 && c[i + W]))) m[i] = 1; } }
}
function punchWand(x, w, h, m) { // "tongkat ajaib": bolongi area warna mirip dari titik yang dipilih
  const d = x.getImageData(0, 0, w, h), a = d.data, sx = m.sx >= 0 ? Math.min(w - 1, m.sx) : w >> 1, sy = m.sy >= 0 ? Math.min(h - 1, m.sy) : h >> 1;
  let r0 = 0, g0 = 0, b0 = 0, n = 0;
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const xx = sx + i, yy = sy + j; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const o = (yy * w + xx) * 4; r0 += a[o]; g0 += a[o + 1]; b0 += a[o + 2]; n++; }
  r0 /= n; g0 /= n; b0 /= n;
  const t = m.tol, r = flood(w, h, sx, sy, i => { const o = i * 4; return a[o + 3] < 16 || (Math.abs(a[o] - r0) <= t && Math.abs(a[o + 1] - g0) <= t && Math.abs(a[o + 2] - b0) <= t); });
  if (!r || r.n < 400) return {err: 'kecil'};
  if (r.n > w * h * .9) return {err: 'besar'};
  growMask(r.m, w, h, m.grow);
  for (let i = 0; i < r.m.length; i++) if (r.m[i]) a[i * 4 + 3] = 0;
  x.putImageData(d, 0, 0);
  const g = m.grow, b = r.b, x0 = Math.max(0, b[0] - g), y0 = Math.max(0, b[1] - g);
  return {hole: [x0, y0, Math.min(w, b[0] + b[2] + g) - x0, Math.min(h, b[1] + b[3] + g) - y0]};
}
function findHole(x, w, h) { // cari lubang transparan yang sudah ada (terdekat dari tengah)
  const a = x.getImageData(0, 0, w, h).data; let bs = null, bd = Infinity;
  for (let y = 0; y < h; y += 4) for (let xx = 0; xx < w; xx += 4) if (a[(y * w + xx) * 4 + 3] < 16) { const dd = (xx - w / 2) ** 2 + (y - h / 2) ** 2; if (dd < bd) { bd = dd; bs = [xx, y]; } }
  if (!bs) return null;
  const r = flood(w, h, bs[0], bs[1], i => a[i * 4 + 3] < 16); return r && r.n > 400 ? r.b : null;
}
function punch(quiet) {
  if (!CF.orig) return;
  const m = S.cframe, w = CF.orig.width, h = CF.orig.height, key = [m.mode, m.sx, m.sy, m.tol, m.grow, m.rx, m.ry, m.rw, m.rh, m.rr].join();
  if (CF.key == key && CF.work) { if (!quiet) draw(); return; }
  const k = document.createElement('canvas'); k.width = w; k.height = h;
  const x = k.getContext('2d', {willReadFrequently: true}); x.drawImage(CF.orig, 0, 0);
  let hole = null, msg = '';
  if (m.mode == 'rect') {
    const hx = w * m.rx / 100, hy = h * m.ry / 100, hw = w * m.rw / 100, hh = h * m.rh / 100;
    x.save(); x.globalCompositeOperation = 'destination-out'; rr(x, hx, hy, hw, hh, Math.min(hw, hh) * m.rr / 100); x.fill(); x.restore();
    hole = [hx, hy, hw, hh]; msg = 'Bolongan kotak dibuat manual. Geser slider sampai pas dengan bingkai.';
  } else if (m.mode == 'wand') {
    const r = punchWand(x, w, h, m);
    if (r.hole) { hole = r.hole; msg = `Bolongan terdeteksi (${Math.round(hole[2])}×${Math.round(hole[3])} px). Kalau belum pas, ubah toleransi atau tap area lain.`; }
    else msg = r.err == 'besar' ? 'Area terlalu luas, mungkin yang kena latar bingkai. Turunkan toleransi atau tap bagian tengah.' : 'Area di titik itu terlalu kecil. Tap bagian tengah bingkai yang mau dibolongi.';
  } else {
    hole = findHole(x, w, h); msg = hole ? 'Memakai area transparan bawaan bingkai.' : 'Bingkai ini belum punya area transparan. Pilih "Otomatis" atau "Manual kotak".';
  }
  CF.work = k; CF.hole = hole; CF.key = key; note(msg);
  if (!quiet) draw();
}
function loadCF(f, fresh) {
  const u = URL.createObjectURL(f), im = new Image();
  im.onerror = () => { URL.revokeObjectURL(u); toast('Bingkai tidak bisa dibaca, coba file PNG lain'); };
  im.onload = () => {
    URL.revokeObjectURL(u);
    const sc = Math.min(1, 2400 / Math.max(im.width, im.height)), w = Math.round(im.width * sc), h = Math.round(im.height * sc), o = document.createElement('canvas');
    o.width = w; o.height = h; const x = o.getContext('2d', {willReadFrequently: true}); x.drawImage(im, 0, 0, w, h);
    CF = {orig: o, work: null, hole: null, key: ''};
    if (fresh) {
      const a = x.getImageData(0, 0, w, h).data; let t = 0; for (let i = 3; i < a.length; i += 4) if (a[i] < 16) t++;
      const m = S.cframe; m.on = true; m.sx = m.sy = -1; S.frame.on = false; m.mode = t / (w * h) > .004 ? 'none' : 'wand';
      punch(1);
      if (!CF.hole) { pickMode = true; toast('Tap bagian tengah bingkai yang mau dibolongi'); }
      else toast(m.mode == 'none' ? 'Bingkai transparan terpasang' : 'Bingkai terpasang, tengahnya dibolongi otomatis');
      f.arrayBuffer().then(buf => idb('put', 'cf', {buf, type: f.type})).catch(() => toast('Bingkai tidak tersimpan permanen, upload lagi nanti'));
      pop(); upd();
    } else { punch(1); upd(); }
  };
  im.src = u;
}
function drawCF(c, W, H) {
  if (pickMode) { c.drawImage(CF.orig, 0, 0, W, H); return; }
  const [x, y, w, h] = CF.hole || [W * .1, H * .1, W * .8, H * .8], F = S.frame, im = photoSrc(); WIN = {x, y, w, h};
  c.save(); c.beginPath(); c.rect(x - 2, y - 2, w + 4, h + 4); c.clip();
  if (im) { c.fillStyle = '#fff'; c.fillRect(x, y, w, h); const b = (F.fit == 'cover' ? Math.max : Math.min)(w / im.width, h / im.height) * F.zoom / 100, dw = im.width * b, dh = im.height * b;
    c.drawImage(im, x + (w - dw) / 2 + w * F.px / 100, y + (h - dh) / 2 + h * F.py / 100, dw, dh); }
  else placeholder(c, x, y, w, h);
  c.restore(); c.drawImage(CF.work, 0, 0, W, H);
}

/* ================= DAFTAR TESTI (BANYAK FOTO) ================= */
const wait = ms => new Promise(r => setTimeout(r, ms));
const keepTxt = () => { const it = ITEMS[CUR]; if (it && ITEMS.length > 1) PK.forEach(k => S.frame[k] = it[k]); }; // template hanya ganti gaya, teks tiap testi tetap
function stash() { const it = ITEMS[CUR]; if (it) PK.forEach(k => it[k] = S.frame[k]); } // simpan isi frame ke testi yang sedang dibuka
function loadItem(i) { CUR = i; const it = ITEMS[i]; PK.forEach(k => S.frame[k] = it[k]); I.photo = it.img; PID = ++PIDN; }
function readPhoto(f) { // baca foto, kecilkan (maks 1600px) supaya banyak foto tetap ringan
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      const s = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), k = document.createElement('canvas');
      k.width = Math.max(1, Math.round(im.naturalWidth * s)); k.height = Math.max(1, Math.round(im.naturalHeight * s));
      k.getContext('2d').drawImage(im, 0, 0, k.width, k.height); URL.revokeObjectURL(u); res(k);
    };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('bad')); };
    im.src = u;
  });
}
function thumbOf(src) {
  const k = document.createElement('canvas'), z = 96, s = Math.max(z / src.width, z / src.height); k.width = k.height = z;
  k.getContext('2d').drawImage(src, (z - src.width * s) / 2, (z - src.height * s) / 2, src.width * s, src.height * s); return k.toDataURL('image/jpeg', .7);
}
function newItem(img, n, first) {
  const F = S.frame, o = {id: ++UID, img, thumb: thumbOf(img), title: F.title, name: first && F.name !== DEF.frame.name ? F.name : 'Pembeli ' + n,
    review: first ? F.review : DEF.frame.review, stars: F.stars, fit: 'cover', zoom: 100, px: 0, py: 0};
  return o;
}
async function addPhotos(files) {
  files = files.filter(f => f && f.type.startsWith('image/')); if (!files.length) return toast('Pilih file gambar ya');
  if (!Auth.isPremium()) { if (files.length > 1) { toast('Akun gratis: 1 foto saja, foto pertama dipakai'); Auth.upsell('Banyak foto sekaligus'); } files = files.slice(0, 1); ITEMS = []; CUR = -1; } // gratis = 1 foto
  const room = MAXI - ITEMS.length; if (room <= 0) return toast(`Maksimal ${MAXI} testi sekali kerja`);
  const skip = Math.max(0, files.length - room); files = files.slice(0, room); stash();
  const first = ITEMS.length; let ok = 0, bad = 0;
  for (const f of files) {
    try { ITEMS.push(newItem(await readPhoto(f), ITEMS.length + 1, !ITEMS.length)); ok++; } catch (e) { bad++; }
    if (files.length > 2) toast(`Memuat foto ${ok + bad}/${files.length}…`);
  }
  if (!ok) return toast('Foto tidak bisa dibaca (format tidak didukung)');
  pickItem(first); burst();
  toast(`${ok} foto ditambahkan` + (bad ? `, ${bad} gagal dibaca` : '') + (skip ? `, ${skip} dilewati (maks ${MAXI})` : ''));
}
async function replacePhoto(f) {
  if (CUR < 0) return addPhotos([f]);
  try { const k = await readPhoto(f), it = ITEMS[CUR]; it.img = k; it.thumb = thumbOf(k); I.photo = k; PID = ++PIDN; upd(); drawList(); pop(); }
  catch (e) { toast('Foto tidak bisa dibaca'); }
}
function pickItem(i) {
  if (i < 0 || i >= ITEMS.length) return;
  if (i != CUR) { stash(); loadItem(i); HS = [JSON.stringify(S)]; HI = 0; hbtn(); } // riwayat undo dimulai ulang per testi
  upd(); drawList(); pop();
}
function removeItem(i) {
  if (i < 0 || i >= ITEMS.length) return; stash(); ITEMS.splice(i, 1);
  if (!ITEMS.length) { CUR = -1; I.photo = null; PID = ++PIDN; }
  else { if (i < CUR) CUR--; else if (i == CUR) CUR = Math.min(i, ITEMS.length - 1); loadItem(CUR); }
  HS = [JSON.stringify(S)]; HI = 0; hbtn(); upd(); drawList(); toast('Testi dihapus');
}
function moveItem(i, d) {
  const j = i + d; if (j < 0 || j >= ITEMS.length) return; stash();
  [ITEMS[i], ITEMS[j]] = [ITEMS[j], ITEMS[i]]; if (CUR == i) CUR = j; else if (CUR == j) CUR = i; pend = null; drawList();
}
function bulkFill() {
  if (!ITEMS.length) return toast('Upload fotonya dulu ya');
  const ls = $('#bulk').value.split('\n').map(x => x.trim()).filter(Boolean); if (!ls.length) return toast('Isi teksnya dulu');
  stash(); let n = 0;
  ls.forEach((l, i) => {
    const it = ITEMS[i]; if (!it) return; const [a, ...r] = l.split('|');
    if (r.length) { if (a.trim()) it.name = a.trim(); const v = r.join('|').trim(); if (v) it.review = v; } else it.review = l;
    n++;
  });
  loadItem(CUR); upd(); drawList(); burst();
  toast(`${n} testi terisi` + (ls.length > n ? `, ${ls.length - n} baris tidak terpakai (fotonya kurang)` : ''));
}
function fillLabel(i) {
  const it = ITEMS[i]; if (!it) return;
  document.querySelectorAll(`[data-lb="${i}"]`).forEach(e => e.textContent = `${i + 1}. ${it.name || '(tanpa nama)'}`);
  document.querySelectorAll(`[data-lr="${i}"]`).forEach(e => e.textContent = it.review || '(isi kosong)');
}
function lab() {
  const n = ITEMS.length;
  document.querySelectorAll('.curNote').forEach(e => e.textContent = n > 1 ? `Sedang mengedit testi ${CUR + 1} dari ${n}. Nama, isi, bintang & posisi foto khusus testi ini; gaya & warna berlaku untuk semua.` : '');
  fillLabel(CUR);
}
function drawList() {
  const n = ITEMS.length, st = $('#strip');
  $('#items').innerHTML = n ? ITEMS.map((it, i) => `<div class="it${i == CUR ? ' on' : ''}"><button class="itm" data-it="${i}"><img src="${it.thumb}" alt=""><span><b data-lb="${i}"></b><small data-lr="${i}"></small></span></button>`
    + `<button class="mini" data-mv="${i}:-1" aria-label="Naikkan" ${i ? '' : 'disabled'}>${ic('up')}</button><button class="mini" data-mv="${i}:1" aria-label="Turunkan" ${i < n - 1 ? '' : 'disabled'}>${ic('down')}</button>`
    + `<button class="mini" data-rm="${i}" aria-label="Hapus">${ic('x')}</button></div>`).join('')
    : '<div class="empty">Belum ada foto. Tap tombol di atas dan pilih banyak foto sekaligus.</div>';
  st.hidden = n < 2;
  st.innerHTML = ITEMS.map((it, i) => `<button class="th${i == CUR ? ' on' : ''}" data-it="${i}" aria-label="Testi ${i + 1}"><img src="${it.thumb}" alt=""><b>${i + 1}</b></button>`).join('')
    + `<label class="th add" aria-label="Tambah foto">${ic('plus')}<input type="file" id="photos2" accept="image/*" multiple hidden></label>`;
  $('.app').classList.toggle('multi', n > 1);
  ['dup', 'clr', 'zipAll', 'eachAll', 'shAll', 'bulkGo'].forEach(id => { const e = document.getElementById(id); if (e) e.disabled = !n; });
  ITEMS.forEach((_, i) => fillLabel(i)); lab();
  const a = st.querySelector('.on'); if (a) st.scrollLeft = a.offsetLeft - (st.clientWidth - a.offsetWidth) / 2;
}

/* ================= EXPORT BANYAK (ZIP / SATU-SATU / BAGIKAN) ================= */
const fname = (i, fm) => {
  const e = fm == 'jpeg' ? 'jpg' : fm; if (i < 0 || ITEMS.length < 2) return 'watermark-' + Date.now() + '.' + e;
  const fr = S.frame.on || useCF(), sl = fr ? String(ITEMS[i].name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) : '';
  return `${fr ? 'testi' : 'foto'}-${String(i + 1).padStart(2, '0')}${sl ? '-' + sl : ''}.${e}`;
};
const saveBlob = (b, n) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = n; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
function renderBlob(it, fm, q) { // gambar satu testi ke canvas sementara, tanpa mengubah tampilan editor
  const o = document.createElement('canvas'), bk = {}, bi = I.photo;
  if (it) { PK.forEach(k => { bk[k] = S.frame[k]; S.frame[k] = it[k]; }); I.photo = it.img; PID = ++PIDN; }
  still = true;
  try { draw(o); } finally { still = false; if (it) { PK.forEach(k => S.frame[k] = bk[k]); I.photo = bi; PID = ++PIDN; } }
  return new Promise(r => o.toBlob(r, 'image/' + fm, q));
}
async function renderAll() {
  stash(); const fm = $('#fmt').value, out = [];
  for (let i = 0; i < ITEMS.length; i++) {
    toast(`Memproses ${i + 1}/${ITEMS.length}…`);
    const b = await renderBlob(ITEMS[i], fm, .95); if (!b) throw new Error('gagal'); out.push({name: fname(i, fm), blob: b}); await wait(16);
  }
  return out;
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = d => { let c = -1; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function makeZip(fs) { // ZIP tanpa kompresi (gambar sudah terkompresi), tanpa library
  const enc = new TextEncoder(), parts = [], cen = [], d = new Date(); let off = 0, cl = 0;
  const dt = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dd = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  fs.forEach(f => {
    const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length, h = new DataView(new ArrayBuffer(30)), c = new DataView(new ArrayBuffer(46));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
    h.setUint32(14, crc, true); h.setUint32(18, sz, true); h.setUint32(22, sz, true); h.setUint16(26, nm.length, true);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, sz, true); c.setUint32(24, sz, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    parts.push(h, nm, f.data); cen.push(c, nm); off += 30 + nm.length + sz; cl += 46 + nm.length;
  });
  const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, fs.length, true); e.setUint16(10, fs.length, true); e.setUint32(12, cl, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, e], {type: 'application/zip'});
}
async function doShare(files) {
  try { if (!navigator.canShare({files})) return toast('Perangkat ini belum mendukung bagikan banyak foto'); await navigator.share({files}); }
  catch (e) { if (e.name == 'NotAllowedError') { pend = files; toast('Siap! Ketuk "Bagikan semua" sekali lagi'); } else if (e.name != 'AbortError') toast('Gagal membagikan'); }
}
async function batch(mode) {
  if (mode == 'share' && pend) { const f = pend; pend = null; return doShare(f); }
  if (!ITEMS.length) return toast('Belum ada foto');
  if (busy) return toast('Masih memproses, tunggu sebentar ya'); busy = true;
  try {
    const fs = await renderAll();
    if (mode == 'zip') {
      const z = []; for (const f of fs) z.push({name: f.name, data: new Uint8Array(await f.blob.arrayBuffer())});
      saveBlob(makeZip(z), 'testimoni-' + new Date().toISOString().slice(0, 10) + '.zip'); toast(`${fs.length} gambar tersimpan dalam ZIP`); burst();
    } else if (mode == 'each') {
      for (const f of fs) { saveBlob(f.blob, f.name); await wait(400); } toast(`${fs.length} gambar tersimpan`); burst();
    } else await doShare(fs.map(f => new File([f.blob], f.name, {type: f.blob.type})));
  } catch (e) { toast('Gagal memproses, coba lagi'); }
  finally { busy = false; draw(); }
}

/* ================= TEMPLATE ================= */
function pre() { $('#pre').innerHTML = PRE.map((p, i) => `<button data-pre="${i}">${p.n}</button>`).join(''); }
function applyPre(i) {
  const k = S.logo.src; S = clone(DEF); merge(S, PRE[i].s); keepTxt();
  if (k) { S.logo.src = k; S.logo.on = true; S.logo.size = 14; }
  loadAll(); pop(); burst(); toast(`${PRE[i].n} dipakai, tinggal edit`);
}
function renderTpl() {
  $('#tl').innerHTML = TP.map((t, i) => `<div class="tpl"><span></span><button class="btn" data-use="${i}">Pakai</button><button class="btn" data-del="${i}" aria-label="Hapus">${ic('x')}</button></div>`).join('') || '<small>Belum ada template buatanmu.</small>';
  document.querySelectorAll('.tpl span').forEach((e, i) => e.textContent = TP[i].n);
}
function saveTpl() {
  const n = $('#tn').value.trim() || 'Template ' + (TP.length + 1), d = {n, s: clone(S)}, i = TP.findIndex(t => t.n == n);
  i >= 0 ? TP[i] = d : TP.push(d); saveT(); renderTpl(); toast('Menyimpan ke akun…');
  Auth.call('tpl_save', {name: n, data: JSON.stringify(d.s)}).then(r => { toast(r.ok ? 'Template tersimpan di akunmu ☁️' : r.error); if (r.ok) burst(); else loadTpl(); });
}
function loadAll() { [S.text.font, S.tile.font, S.frame.font, S.info.font].forEach(fl); loadImg('logo', S.logo.src); loadImg('mas', S.mascot.src); if (CF.orig) punch(1); upd(); renderTpl(); }

/* ================= AKSI TOMBOL ================= */
function download() {
  still = true; draw(); const fm = $('#fmt').value;
  cv.toBlob(b => {
    still = false; draw();
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fname(CUR, fm); a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Gambar tersimpan'); burst();
  }, 'image/' + fm, .95);
}
function preview() {
  if ($('.ov')) return; stash();
  const n = ITEMS.length, o = document.createElement('div'); let i = Math.max(0, CUR), url = '', dead = false;
  o.className = 'ov';
  o.innerHTML = `<div class="ovs"><img alt="Preview"></div><div class="ovt"><span class="ovc"></span><button class="btn" data-ov="x" aria-label="Tutup">${ic('x')}</button></div>`
    + (n > 1 ? `<button class="btn ovn l" data-ov="-1" aria-label="Sebelumnya">${ic('prev')}</button><button class="btn ovn r" data-ov="1" aria-label="Berikutnya">${ic('next')}</button>` : '');
  const sc = o.querySelector('.ovs'), im = sc.firstChild, cn = o.querySelector('.ovc');
  const show = async () => {
    o.classList.add('ld'); sc.classList.remove('z'); im.style.width = ''; sc.scrollTo(0, 0);
    const b = await renderBlob(n ? ITEMS[i] : null, 'jpeg', .92); if (dead) return;
    if (!b) { close(); return toast('Preview gagal dibuat'); }
    if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(b); im.src = url;
    cn.textContent = (n > 1 ? `${i + 1} / ${n} · ` : '') + 'Ketuk gambar untuk zoom'; o.classList.remove('ld');
  };
  const go = d => { i = (i + d + n) % n; show(); };
  const key = e => { if (e.key == 'Escape') close(); else if (n > 1 && e.key == 'ArrowLeft') go(-1); else if (n > 1 && e.key == 'ArrowRight') go(1); };
  function close() {
    if (dead) return; dead = true; removeEventListener('keydown', key); o.classList.add('out');
    setTimeout(() => { o.remove(); if (url) URL.revokeObjectURL(url); }, 250);
    if (n && i != CUR) pickItem(i);
  }
  im.onclick = () => { const z = sc.classList.toggle('z'); im.style.width = z ? im.naturalWidth + 'px' : ''; };
  o.onclick = e => { const b = e.target.closest('[data-ov]'); if (b) b.dataset.ov == 'x' ? close() : go(+b.dataset.ov); else if (e.target === sc) close(); };
  addEventListener('keydown', key); document.body.appendChild(o); show();
}
function share() {
  still = true; draw();
  cv.toBlob(async bl => {
    still = false; draw();
    try { const f = new File([bl], 'watermark.png', {type: 'image/png'}); if (navigator.canShare({files: [f]})) await navigator.share({files: [f]}); else toast('Bagikan belum didukung di perangkat ini'); }
    catch (e) { if (e.name != 'AbortError') toast('Gagal membagikan'); }
  });
}
function copyImg() {
  still = true; draw();
  cv.toBlob(async b => {
    still = false; draw();
    try { await navigator.clipboard.write([new ClipboardItem({'image/png': b})]); toast('Gambar disalin ke clipboard'); } catch (e) { toast('Gagal menyalin gambar'); }
  }, 'image/png');
}
function toggleTheme() { if (window.WM_SETTINGS) WM_SETTINGS.open('tema'); } // tema diatur di settings.js
function themeIcon() {}
const ACT = {
  dup: () => { if (CUR < 0) return; if (ITEMS.length >= MAXI) return toast(`Maksimal ${MAXI} testi sekali kerja`); stash(); ITEMS.splice(CUR + 1, 0, {...ITEMS[CUR], id: ++UID}); pickItem(CUR + 1); toast('Testi diduplikat'); },
  clr: () => { if (ITEMS.length && confirm('Hapus semua foto & testi di daftar?')) { ITEMS = []; CUR = -1; I.photo = null; PID = ++PIDN; HS = [JSON.stringify(S)]; HI = 0; hbtn(); upd(); drawList(); } },
  bulkGo: bulkFill, zipAll: () => batch('zip'), eachAll: () => batch('each'), shAll: () => batch('share'),
  pxAll: () => { if (ITEMS.length < 2) return toast('Baru ada 1 testi'); stash(); const F = S.frame; ITEMS.forEach(it => { it.fit = F.fit; it.zoom = F.zoom; it.px = F.px; it.py = F.py; }); toast('Zoom & posisi disamakan ke semua testi'); },
  dl: download, pv: preview, cp: copyImg, un: () => hgo(-1), re: () => hgo(1),
  goCF: () => tab('cfr'),
  pickCF: () => { if (!CF.orig) return toast('Upload bingkai dulu ya'); S.cframe.on = true; S.frame.on = false; pickMode = true; upd(); toast('Tap bagian tengah bingkai yang mau dibolongi'); },
  dCF: () => { if (!CF.work) return toast('Belum ada bingkai'); CF.work.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'bingkai-transparan.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Bingkai transparan tersimpan'); }, 'image/png'); },
  xCF: () => { CF = {}; pickMode = false; S.cframe = clone(DEF.cframe); idb('del', 'cf').catch(() => 0); note(''); upd(); toast('Bingkai dihapus'); },
  xFil: () => { S.filter = clone(DEF.filter); upd(); }, sh: share, th: toggleTheme, ts: saveTpl,
  pick: () => $('#photoRep').click(),
  pas: () => { S.frame.fit = 'cover'; tw(S.frame, 'zoom', 100, 600); tw(S.frame, 'px', 0, 600); tw(S.frame, 'py', 0, 600); },
  cLogo: () => { S.logo.on = true; S.logo.x = S.logo.y = 50; upd(); },
  cMas: () => { S.mascot.on = true; S.mascot.x = S.mascot.y = 50; upd(); },
  xLogo: () => { S.logo.src = ''; S.logo.on = false; I.logo = null; upd(); },
  xMas: () => { S.mascot.src = ''; I.mas = null; upd(); },
  rs: () => { if (confirm('Reset semua pengaturan, termasuk logo dan maskot?')) { S = clone(DEF); keepTxt(); loadAll(); } }
};

/* ================= EVENT ================= */
document.addEventListener('input', e => {
  const t = e.target, k = t.dataset.k; if (!k) return;
  set(k, t.type == 'checkbox' ? t.checked : t.type == 'range' ? +t.value : t.value);
  if (k.endsWith('.font')) fl(t.value);
  if (k == 'frame.on' && t.checked) S.cframe.on = false;
  if (k == 'cframe.on' && t.checked) S.frame.on = false;
  if (k.startsWith('cframe.') && k != 'cframe.on') { clearTimeout(pu); pu = setTimeout(() => punch(), S.cframe.mode == 'rect' ? 25 : 180); }
  upd();
});
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.tab) return tab(d.tab);
  if (d.it != null) return pickItem(+d.it);
  if (d.mv) { const [a, n] = d.mv.split(':').map(Number); return moveItem(a, n); }
  if (d.rm != null) return removeItem(+d.rm);
  if (d.g) return grp(d.g);
  if (d.fp != null) { Object.assign(S.filter, DEF.filter, FP[d.fp][1]); pop(); return upd(); }
  if (d.pre != null) return applyPre(+d.pre);
  if (d.use != null) { S = clone(DEF); merge(S, TP[d.use].s); keepTxt(); loadAll(); pop(); burst(); return toast('Template dipakai'); }
  if (d.del != null) { const nm = TP[d.del].n; TP.splice(d.del, 1); saveT(); renderTpl(); Auth.call('tpl_delete', {name: nm}).then(r => { if (!r.ok) { toast(r.error); loadTpl(); } }); return; }
  if (d.set) {
    set(d.set, d.val); pop();
    if (d.set.startsWith('info.')) S.info.on = true;
    if (d.set.startsWith('frame.') && d.set != 'frame.fit') { S.frame.on = true; S.cframe.on = false; }
    if (d.set == 'cframe.mode') { S.cframe.on = true; S.frame.on = false; punch(1); }
    if (d.set == 'frame.theme') S.frame.accent = TH[d.val][2];
    if (d.set == 'logo.pos') { S.logo.on = true; S.logo.x = S.logo.y = null; }
    if (d.set == 'badge.pos') S.badge.on = true;
    if (d.set == 'text.pos') S.text.on = true;
    if (d.set == 'mascot.emoji') { S.mascot.src = ''; I.mas = null; S.mascot.on = true; tw(S.mascot, 'size', S.mascot.size, 500, 1); }
    return upd();
  }
  if (ACT[b.id]) ACT[b.id]();
});
document.addEventListener('change', e => {
  const t = e.target, f = t.files && t.files[0]; if (!f) return;
  const all = [...t.files];
  if (t.id == 'photo' || t.id == 'photos' || t.id == 'photos2') addPhotos(all);
  if (t.id == 'photoRep') replacePhoto(f);
  if (t.id == 'fCF') loadCF(f, true);
  if (t.id == 'fLogo') shrink(f, 600, s => { S.logo.src = s; S.logo.on = true; loadImg('logo', s); upd(); toast('Logo tersimpan otomatis'); });
  if (t.id == 'fMas') shrink(f, 600, s => { S.mascot.src = s; S.mascot.on = true; loadImg('mas', s); upd(); });
  t.value = '';
});

// seret foto ke halaman, tempel (Ctrl+V), dan shortcut keyboard
['dragenter', 'dragover'].forEach(n => addEventListener(n, e => e.preventDefault()));
addEventListener('drop', e => { e.preventDefault(); const fs = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/')); if (fs.length) addPhotos(fs); });
addEventListener('paste', e => { const fs = [...(e.clipboardData?.items || [])].filter(i => i.type.startsWith('image/')).map(i => i.getAsFile()).filter(Boolean); if (fs.length) addPhotos(fs); });
addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase(), ed = /^(INPUT|TEXTAREA)$/.test(e.target.tagName) && !['range', 'checkbox', 'color'].includes(e.target.type);
  if (k == 's') { e.preventDefault(); download(); }
  else if (!ed && k == 'z') { e.preventDefault(); hgo(e.shiftKey ? 1 : -1); }
  else if (!ed && k == 'y') { e.preventDefault(); hgo(1); }
});

addEventListener('keydown', e => {
  if ($('.ov') || ITEMS.length < 2 || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key == 'ArrowLeft' || e.key == 'ArrowRight') { e.preventDefault(); pickItem(clamp(CUR + (e.key == 'ArrowLeft' ? -1 : 1), 0, ITEMS.length - 1)); }
});
addEventListener('beforeunload', e => { if (ITEMS.length > 1) { e.preventDefault(); e.returnValue = ''; } });

// geser maskot / foto langsung di preview
const cp = e => { const r = cv.getBoundingClientRect(), s = Math.min(r.width / cv.width, r.height / cv.height);
  return [(e.clientX - r.left - (r.width - cv.width * s) / 2) / s, (e.clientY - r.top - (r.height - cv.height * s) / 2) / s]; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hitAt = (X, Y) => {
  const m = HIT.mas, l = HIT.logo, pd = 12;
  if (S.mascot.on && m && Math.hypot(X - m.cx, Y - m.cy) < m.r) return 1;
  if (S.logo.on && l && X > l.x - pd && X < l.x + l.w + pd && Y > l.y - pd && Y < l.y + l.h + pd) return 3;
  if ((S.frame.on || useCF()) && WIN && X > WIN.x && X < WIN.x + WIN.w && Y > WIN.y && Y < WIN.y + WIN.h) return 2;
  return 0;
};
cv.addEventListener('pointerdown', e => {
  const [X, Y] = cp(e), m = S.mascot; lx = X; ly = Y; drag = 0; off = [0, 0];
  if (pickMode && CF.orig) { pickMode = false; S.cframe.mode = 'wand'; S.cframe.sx = Math.round(X); S.cframe.sy = Math.round(Y); punch(1); upd(); toast(CF.hole ? 'Bolongan dibuat' : 'Area tidak ketemu, coba tap titik lain'); if (!CF.hole) pickMode = true; return; }
  drag = hitAt(X, Y);
  if (drag == 1) off = [HIT.mas.cx - X, HIT.mas.cy - Y];
  else if (drag == 3) off = [HIT.logo.x + HIT.logo.w / 2 - X, HIT.logo.y + HIT.logo.h / 2 - Y];
  else if (!drag && m.on) { drag = 1; pointMove(X, Y); sync(); draw(); }
  if (drag) { cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; e.preventDefault(); }
});
function pointMove(X, Y) { // geser maskot / logo: posisi disimpan sebagai persen dari area acuan, menempel ke tengah kalau dekat
  const [bx, by, bw, bh] = box(cv.width, cv.height), o = drag == 1 ? S.mascot : S.logo;
  let px = clamp((X + off[0] - bx) / bw * 100, -25, 125), py = clamp((Y + off[1] - by) / bh * 100, -25, 125);
  GUIDE.x = Math.abs(px - 50) < 2.2; GUIDE.y = Math.abs(py - 50) < 2.2; if (GUIDE.x) px = 50; if (GUIDE.y) py = 50;
  o.x = Math.round(px * 10) / 10; o.y = Math.round(py * 10) / 10;
}
cv.addEventListener('pointermove', e => {
  const [X, Y] = cp(e);
  if (!drag) { if (e.pointerType == 'mouse') cv.style.cursor = hitAt(X, Y) ? 'grab' : ''; return; }
  if (drag == 1 || drag == 3) pointMove(X, Y);
  else { const F = S.frame; F.px = clamp(F.px + (X - lx) / WIN.w * 100, -100, 100); F.py = clamp(F.py + (Y - ly) / WIN.h * 100, -100, 100); lx = X; ly = Y; }
  sync(); draw();
});
const dragEnd = () => { if (drag) { drag = 0; GUIDE.x = GUIDE.y = false; cv.style.cursor = ''; draw(); save(); } };
cv.addEventListener('pointerup', dragEnd); cv.addEventListener('pointercancel', dragEnd);

/* ================= MULAI ================= */
try {
  const s = localStorage.getItem('wm_s'); if (s) merge(S, JSON.parse(s));
} catch (e) {}
themeIcon(); tab('list'); pre(); loadAll(); drawList();
HS = [JSON.stringify(S)]; HI = 0; hbtn();
try { idb('get', 'cf').then(v => { if (v) loadCF(new Blob([v.buf], {type: v.type}), false); }).catch(() => 0); } catch (e) {}
if (navigator.canShare) $('#sh').hidden = false;
try { $('#shAll').hidden = !(navigator.canShare && navigator.canShare({files: [new File(['x'], 'a.png', {type: 'image/png'})]})); } catch (e) { $('#shAll').hidden = true; }
if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) $('#cp').hidden = false;
(function loop() { if (S.mascot.on && S.mascot.bob && !drag && Auth.isPremium()) draw(); requestAnimationFrame(loop); })();
