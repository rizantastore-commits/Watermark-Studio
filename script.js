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
  camera:'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24"><path d="${IC[n]}"/></svg>`;

/* ================= DATA & KONSTANTA ================= */
const clone = o => JSON.parse(JSON.stringify(o));
const DEF = {
  text:  {on:true, value:'Rizanta Store', font:'Fredoka', pos:'br', size:6, color:'#ffffff', opacity:80, rot:0, shadow:true, stroke:false, strokeColor:'#000000'},
  badge: {on:false, value:'PROMO 50%', pos:'tr', size:7, bg:'#ff5fa2', color:'#ffffff', rot:0, opacity:100},
  tile:  {on:false, value:'Rizanta Store', font:'Fredoka', cols:3, rows:5, size:5, spread:100, rot:-30, ox:0, oy:0, color:'#ffffff', opacity:30, stagger:true},
  logo:  {on:false, src:'', pos:'tl', size:16, opacity:90},
  frame: {on:false, layout:'polaroid', theme:'pink', shape:'rect', size:'4:5', deco:'dots', title:'TESTIMONI', name:'Kak Rina',
          review:'Admin ramah, proses cepat, akun langsung aktif. Recommended banget!', stars:5, font:'Fredoka', accent:'#ff7eb6',
          border:10, card:true, zoom:100, px:0, py:0, fit:'cover'},
  filter:{bright:100, contrast:100, sat:100, blur:0, gray:0, sepia:0},
  info:  {on:false, value:'WA 0812-3456-7890  •  IG @rizanta.store', font:'Fredoka', pos:'b', style:'bar', size:32, bg:'#ff5fa2', color:'#ffffff', opacity:92},
  mascot:{on:false, emoji:'🐰', src:'', size:22, x:85, y:82, opacity:100, flip:false, bob:false}
};
const FONTS = ['Fredoka','Pacifico','Lobster','Bangers','Caveat','Dancing Script','Montserrat','Playfair Display','Baloo 2','Permanent Marker','Oswald','Chewy','Righteous','Satisfy'];
const fw = f => ({Pacifico:400, Lobster:400, Bangers:400, 'Permanent Marker':400, Chewy:400, Righteous:400, Satisfy:400, Oswald:600})[f] || 700;
const TH = { // [latar1, latar2, aksen, teks, kartu]
  pink:['#ffd1e6','#fff0f6','#ff7eb6','#5a2a47','#ffffff'], peach:['#ffd9b8','#fff4e8','#ff9a5c','#5a3320','#ffffff'],
  mint:['#bff3dd','#effcf6','#3ecf9b','#1f4a3b','#ffffff'], lavender:['#d9ccff','#f4f0ff','#9a7bff','#3a2a6b','#ffffff'],
  sky:['#bfe3ff','#eef8ff','#4aa8ff','#1f3f66','#ffffff'], sun:['#ffe99a','#fffbe6','#ffbe1a','#5a4510','#ffffff'],
  neon:['#1b1030','#3a1a6e','#ff4fd8','#ffe6fb','#2a1850'], clean:['#f4f4f4','#ffffff','#222222','#222222','#ffffff']
};
const SZ = {'4:5':[1080,1350], '1:1':[1080,1080], '9:16':[1080,1920], '3:4':[1080,1440], '16:9':[1920,1080], '4:3':[1440,1080]};
const LY = {polaroid:[.13,.13,.74,.58], kartu:[.09,.17,.82,.5], bubble:[.14,.15,.72,.56], full:[.04,.04,.92,.68]};
const P9 = ['tl','t','tr','l','c','r','bl','b','br'];

// Template bawaan: hanya isi bagian yang berbeda dari DEF
const PRE = [
  {n:'Klasik Pojok', s:{text:{pos:'br', size:6, opacity:85}}},
  {n:'Anti Maling', s:{text:{on:false}, tile:{on:true, rows:6, cols:3, size:5, rot:-30, opacity:28}}},
  {n:'Cute Pink', s:{text:{font:'Pacifico', pos:'b', size:7, color:'#ff5fa2', opacity:95}, mascot:{on:true, emoji:'🐰', size:20, x:86, y:78, bob:true}}},
  {n:'Testimoni Polaroid', s:{text:{size:4, opacity:70}, frame:{on:true}, mascot:{on:true, emoji:'🎀', size:14, x:88, y:10}}},
  {n:'Story Lavender', s:{text:{on:false}, frame:{on:true, size:'9:16', layout:'kartu', shape:'arch', theme:'lavender', accent:'#9a7bff', deco:'star', font:'Baloo 2'}, mascot:{on:true, emoji:'🦄', size:22, x:84, y:90}}},
  {n:'Neon Bulat', s:{text:{on:false}, frame:{on:true, shape:'circle', theme:'neon', accent:'#ff4fd8', font:'Righteous'}}},
  {n:'Banner Promo', s:{text:{on:false}, badge:{on:true, rot:8}, frame:{on:true, size:'16:9', shape:'squircle', theme:'mint', accent:'#3ecf9b', deco:'heart', font:'Bangers', title:'PROMO HARI INI', name:'Netflix Premium', review:'Garansi full, harga murah, fast respon. Chat admin sekarang!', stars:0}}},
  {n:'Elegan Minimal', s:{text:{font:'Playfair Display', size:4, opacity:70}, tile:{on:true, font:'Playfair Display', rows:4, cols:2, size:4, rot:-20, opacity:16}}}
];

const FP = [['Asli',{}],['Hitam putih',{gray:100}],['Sepia',{sepia:70}],['Cerah',{bright:112,contrast:108,sat:125}],['Dramatis',{contrast:140,sat:115,bright:94}],['Lembut',{bright:108,contrast:90,sat:95}]];
let S = clone(DEF), I = {}, PID = 0, FC = {}, HS = [], HI = -1, ht = 0, TP = [], still = false, WIN = null, drag = 0, lx = 0, ly = 0;
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

const TABS = [
  ['text', 'Teks', 'type', [C('text.on', 'Aktifkan watermark teks'), T('text.value', 'Nama watermark'), FS('text.font', 'Font'), H('Posisi'), pos('text.pos'),
    R('text.size', 'Ukuran', 1, 30), K('text.color', 'Warna'), R('text.opacity', 'Opacity (transparan sampai pekat)', 5, 100), R('text.rot', 'Rotasi', -90, 90), C('text.shadow', 'Bayangan teks'), C('text.stroke', 'Garis tepi teks'), K('text.strokeColor', 'Warna garis tepi')]],
  ['badge', 'Badge', 'tag', [C('badge.on', 'Tampilkan badge promo / harga'), T('badge.value', 'Teks badge (mis. Rp15.000)'), H('Posisi'), pos('badge.pos'),
    R('badge.size', 'Ukuran', 2, 20), K('badge.bg', 'Warna badge'), K('badge.color', 'Warna teks'), R('badge.rot', 'Rotasi', -45, 45), R('badge.opacity', 'Opacity', 20, 100)]],
  ['tile', 'Penuh', 'grid', [C('tile.on', 'Aktifkan watermark memenuhi foto'), T('tile.value', 'Tulisan'), FS('tile.font', 'Font'), R('tile.cols', 'Jumlah per baris', 1, 8), R('tile.rows', 'Jumlah baris', 1, 12),
    R('tile.size', 'Ukuran', 1, 15), R('tile.spread', 'Jarak', 40, 160), R('tile.rot', 'Rotasi', -90, 90), R('tile.ox', 'Geser kiri / kanan', -50, 50), R('tile.oy', 'Geser atas / bawah', -50, 50),
    K('tile.color', 'Warna'), R('tile.opacity', 'Opacity', 5, 100), C('tile.stagger', 'Susun selang-seling')]],
  ['logo', 'Logo', 'image', [C('logo.on', 'Tampilkan logo / gambar'), FB('fLogo', 'upload', 'Upload logo store'), '<small>Logo tersimpan otomatis di browser dan langsung terpasang di sesi berikutnya.</small>',
    H('Posisi'), pos('logo.pos'), R('logo.size', 'Ukuran', 3, 90), R('logo.opacity', 'Opacity', 5, 100), B('xLogo', 'trash', 'Hapus logo')]],
  ['frame', 'Frame', 'frame', [C('frame.on', 'Pakai frame testimoni'), B('pick', 'camera', 'Ganti foto'),
    H('Ukuran'), chips('frame.size', [['4:5', '4:5 Feed'], ['1:1', '1:1 Kotak'], ['9:16', '9:16 Story'], ['3:4', '3:4'], ['16:9', '16:9 Banner'], ['4:3', '4:3']]),
    H('Layout'), chips('frame.layout', [['polaroid', 'Polaroid'], ['kartu', 'Kartu'], ['bubble', 'Bubble'], ['full', 'Foto besar']]),
    H('Bentuk foto'), chips('frame.shape', [['rect', 'Kotak'], ['squircle', 'Squircle'], ['circle', 'Bulat'], ['arch', 'Arch'], ['heart', 'Hati'], ['star', 'Bintang'], ['hex', 'Hexagon']]),
    H('Warna'), chips('frame.theme', Object.keys(TH).map(k => [k, k[0].toUpperCase() + k.slice(1)])), K('frame.accent', 'Warna aksen'),
    H('Hiasan latar'), chips('frame.deco', [['dots', 'Titik'], ['heart', 'Hati'], ['star', 'Bintang'], ['flower', 'Bunga'], ['none', 'Polos']]),
    H('Teks'), T('frame.title', 'Judul'), T('frame.name', 'Nama pembeli'), `<label class="f"><span>Isi testimoni</span><textarea rows="3" data-k="frame.review"></textarea></label>`,
    FS('frame.font', 'Font frame'), R('frame.stars', 'Jumlah bintang', 0, 5), R('frame.border', 'Tebal border foto', 0, 30), C('frame.card', 'Kartu di belakang')]],
  ['ph', 'Foto', 'crop', ['<small>Atur ukuran foto agar pas di dalam frame. Foto juga bisa digeser langsung di preview.</small>',
    chips('frame.fit', [['cover', 'Penuh (crop)'], ['contain', 'Muat semua']]), R('frame.zoom', 'Zoom / ukuran foto', 30, 300),
    R('frame.px', 'Geser kiri / kanan', -100, 100), R('frame.py', 'Geser atas / bawah', -100, 100), B('pas', 'wand', 'Pas di frame', 'pri')]],
  ['filter', 'Filter', 'sliders', ['<small>Atur tampilan foto asli. Watermark dan frame tidak ikut berubah.</small>', H('Efek cepat'),
    `<div class="chips">${FP.map((p, i) => `<button data-fp="${i}">${p[0]}</button>`).join('')}</div>`,
    R('filter.bright', 'Kecerahan', 40, 180), R('filter.contrast', 'Kontras', 50, 170), R('filter.sat', 'Warna (saturasi)', 0, 200),
    R('filter.blur', 'Blur', 0, 20), R('filter.gray', 'Hitam putih', 0, 100), R('filter.sepia', 'Sepia', 0, 100)]],
  ['info', 'Kontak', 'tag', ['<small>Bar info toko: nomor WA, Instagram, atau slogan.</small>', C('info.on', 'Tampilkan bar kontak'), T('info.value', 'Isi bar (WA, IG, dll)'), FS('info.font', 'Font'),
    H('Posisi'), chips('info.pos', [['b', 'Bawah'], ['t', 'Atas']]), H('Gaya'), chips('info.style', [['bar', 'Bar penuh'], ['pill', 'Kapsul']]),
    R('info.size', 'Ukuran teks', 20, 80), K('info.bg', 'Warna latar'), K('info.color', 'Warna teks'), R('info.opacity', 'Opacity', 30, 100)]],
  ['mascot', 'Maskot', 'smile', [C('mascot.on', 'Tampilkan maskot'), chips('mascot.emoji', ['🐰', '🐱', '🐻', '🦄', '🌸', '🎀', '💖', '⭐'].map(e => [e, e]), 'em'),
    FB('fMas', 'upload', 'Upload maskot sendiri'), R('mascot.size', 'Ukuran', 5, 80), R('mascot.x', 'Posisi kiri / kanan', 0, 100), R('mascot.y', 'Posisi atas / bawah', 0, 100),
    R('mascot.opacity', 'Opacity', 10, 100), C('mascot.flip', 'Balik arah (mirror)'), C('mascot.bob', 'Maskot goyang (animasi)'), B('xMas', 'trash', 'Hapus maskot upload')]],
  ['tpl', 'Template', 'save', ['<small>Pilih template, lalu ubah sesukamu. Logo store ikut terpasang otomatis.</small>', H('Template bawaan'), '<div class="pre" id="pre"></div>',
    H('Template kamu'), '<label class="f"><span>Nama template</span><input type="text" id="tn" placeholder="mis. Template Netflix"></label>',
    B('ts', 'save', 'Simpan pengaturan ini', 'pri'), '<div class="tpls" id="tl"></div>', B('rs', 'trash', 'Reset semua')]]
];
// 4 menu utama (tidak perlu scroll) + sub-menu kecil di dalam panel
const GR = [['wm', 'Watermark', 'drop', ['text', 'badge', 'tile', 'logo']], ['fr', 'Frame', 'frame', ['frame', 'ph']],
            ['ed', 'Edit', 'sliders', ['filter', 'mascot', 'info']], ['tpl', 'Template', 'save', ['tpl']]];
const LBL = {text: 'Teks', badge: 'Badge', tile: 'Penuh', logo: 'Logo', frame: 'Frame', ph: 'Foto', filter: 'Filter', mascot: 'Maskot', info: 'Kontak', tpl: 'Template'};
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
  $('#panes').scrollTop = 0;
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
  cv.style.touchAction = S.mascot.on || S.frame.on ? 'none' : 'auto';
}
const upd = () => { sync(); draw(); save(); };
const save = () => { hpush(); try { localStorage.setItem('wm_s', JSON.stringify(S)); } catch (e) { toast('Penyimpanan browser penuh, logo besar tidak tersimpan'); } };
const saveT = () => { try { localStorage.setItem('wm_t', JSON.stringify(TP)); } catch (e) { toast('Template tidak bisa disimpan, penyimpanan penuh'); } };
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
function burst() {
  const cs = ['#ff5fa2', '#ff8a5c', '#b79bff', '#ffd166'];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('i'), z = 6 + Math.random() * 8;
    s.className = 'pt';
    s.style.cssText = `left:50%;top:70%;width:${z}px;height:${z}px;background:${cs[i % 4]};border-radius:${i % 2 ? '50%' : '3px'}`;
    document.body.appendChild(s);
    requestAnimationFrame(() => { s.style.transform = `translate(${(Math.random() - .5) * 380}px,${-90 - Math.random() * 240}px) rotate(${Math.random() * 540}deg)`; s.style.opacity = 0; });
    setTimeout(() => s.remove(), 1000);
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
function drawTile(c, W, H) {
  const t = S.tile; if (!t.on || !t.value) return;
  c.save(); c.globalAlpha = t.opacity / 100; c.fillStyle = t.color; c.font = `${fw(t.font)} ${W * t.size / 100}px "${t.font}",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let r = 0; r < t.rows; r++) for (let k = 0; k < t.cols; k++) {
    let px = (k + .5) / t.cols * W + (t.stagger && r % 2 ? W / t.cols / 2 : 0), py = (r + .5) / t.rows * H;
    px = W / 2 + (px - W / 2) * t.spread / 100 + W * t.ox / 100; py = H / 2 + (py - H / 2) * t.spread / 100 + H * t.oy / 100;
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
  const [i, j] = AX(x.pos), m = W * .03;
  c.save(); c.globalAlpha = x.opacity / 100; c.fillStyle = x.color; c.font = `${fw(x.font)} ${W * x.size / 100}px "${x.font}",sans-serif`;
  c.textAlign = ['left', 'center', 'right'][i]; c.textBaseline = ['top', 'middle', 'bottom'][j];
  if (x.shadow) { c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = W * .008; c.shadowOffsetY = W * .003; }
  c.translate([m, W / 2, W - m][i], [m, H / 2, H - m][j]); c.rotate(x.rot * Math.PI / 180);
  if (x.stroke) { c.lineJoin = 'round'; c.lineWidth = W * x.size / 100 * .14; c.strokeStyle = x.strokeColor; c.strokeText(x.value, 0, 0); }
  c.fillText(x.value, 0, 0); c.restore();
}
function drawBadge(c, W, H) {
  const b = S.badge; if (!b.on || !b.value) return;
  const [i, j] = AX(b.pos), m = W * .04, fs = W * b.size / 100;
  c.save(); c.globalAlpha = b.opacity / 100; c.font = `700 ${fs}px Fredoka,sans-serif`;
  const bw = c.measureText(b.value).width + fs * 1.2, bh = fs * 1.9;
  c.translate([m + bw / 2, W / 2, W - m - bw / 2][i], [m + bh / 2, H / 2, H - m - bh / 2][j]); c.rotate(b.rot * Math.PI / 180);
  c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = fs * .3; c.fillStyle = b.bg; rr(c, -bw / 2, -bh / 2, bw, bh, bh / 2); c.fill();
  c.shadowColor = 'transparent'; c.fillStyle = b.color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.value, 0, fs * .05); c.restore();
}
function drawLogo(c, W, H) {
  const l = S.logo; if (!l.on || !I.logo) return;
  const [i, j] = AX(l.pos), m = W * .03, w = W * l.size / 100, h = w * I.logo.height / I.logo.width;
  c.save(); c.globalAlpha = l.opacity / 100; c.drawImage(I.logo, [m, (W - w) / 2, W - m - w][i], [m, (H - h) / 2, H - m - h][j], w, h); c.restore();
}
function drawMascot(c, W, H) {
  const m = S.mascot; if (!m.on) return;
  const w = W * m.size / 100, bb = m.bob && !still ? Math.sin(performance.now() / 280) : 0;
  c.save(); c.globalAlpha = m.opacity / 100; c.translate(W * m.x / 100, H * m.y / 100 + bb * H * .012); c.rotate(bb * .08); if (m.flip) c.scale(-1, 1);
  if (I.mas) { const h = w * I.mas.height / I.mas.width; c.drawImage(I.mas, -w / 2, -h / 2, w, h); }
  else { c.font = `${w}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(m.emoji, 0, 0); }
  c.restore();
}
function draw() {
  const F = S.frame, p = I.photo; let W, H;
  if (F.on) [W, H] = SZ[F.size] || SZ['4:5'];
  else if (p) { const s = Math.min(1, 1400 / Math.max(p.width, p.height)); W = Math.round(p.width * s); H = Math.round(p.height * s); }
  else { W = 1080; H = 1080; }
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  if (F.on) drawFrame(c, W, H); else if (p) c.drawImage(photoSrc(), 0, 0, W, H); else placeholder(c, 0, 0, W, H);
  drawTile(c, W, H); drawInfo(c, W, H); drawText(c, W, H); drawBadge(c, W, H); drawLogo(c, W, H); drawMascot(c, W, H);
}

/* ================= TEMPLATE ================= */
function pre() { $('#pre').innerHTML = PRE.map((p, i) => `<button data-pre="${i}">${p.n}</button>`).join(''); }
function applyPre(i) {
  const k = S.logo.src; S = clone(DEF); merge(S, PRE[i].s);
  if (k) { S.logo.src = k; S.logo.on = true; S.logo.size = 14; }
  loadAll(); pop(); burst(); toast(`${PRE[i].n} dipakai, tinggal edit`);
}
function renderTpl() {
  $('#tl').innerHTML = TP.map((t, i) => `<div class="tpl"><span></span><button class="btn" data-use="${i}">Pakai</button><button class="btn" data-del="${i}" aria-label="Hapus">${ic('x')}</button></div>`).join('') || '<small>Belum ada template buatanmu.</small>';
  document.querySelectorAll('.tpl span').forEach((e, i) => e.textContent = TP[i].n);
}
function saveTpl() {
  const n = $('#tn').value.trim() || 'Template ' + (TP.length + 1), d = {n, s: clone(S)}, i = TP.findIndex(t => t.n == n);
  i >= 0 ? TP[i] = d : TP.push(d); saveT(); renderTpl(); toast('Template tersimpan'); burst();
}
function loadAll() { [S.text.font, S.tile.font, S.frame.font, S.info.font].forEach(fl); loadImg('logo', S.logo.src); loadImg('mas', S.mascot.src); upd(); renderTpl(); }

/* ================= AKSI TOMBOL ================= */
function download() {
  still = true; draw(); const fm = $('#fmt').value;
  cv.toBlob(b => {
    still = false; draw();
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'watermark-' + Date.now() + '.' + (fm == 'jpeg' ? 'jpg' : fm); a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Gambar tersimpan'); burst();
  }, 'image/' + fm, .95);
}
function preview() {
  still = true; draw(); const u = cv.toDataURL('image/jpeg', .92); still = false; draw();
  const o = document.createElement('div'); o.className = 'ov';
  o.innerHTML = `<img src="${u}" alt="Preview"><button class="btn" aria-label="Tutup">${ic('x')}</button>`;
  o.onclick = () => { o.classList.add('out'); setTimeout(() => o.remove(), 250); };
  document.body.appendChild(o);
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
const setPhoto = f => { loadImg('photo', URL.createObjectURL(f)); pop(); };
function toggleTheme() {
  const d = document.documentElement, dark = (d.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) == 'dark';
  d.dataset.theme = dark ? 'light' : 'dark'; try { localStorage.setItem('wm_th', d.dataset.theme); } catch (e) {} themeIcon();
}
function themeIcon() { const d = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); $('#th').innerHTML = ic(d == 'dark' ? 'sun' : 'moon'); }
const ACT = {
  dl: download, pv: preview, cp: copyImg, un: () => hgo(-1), re: () => hgo(1),
  xFil: () => { S.filter = clone(DEF.filter); upd(); }, sh: share, th: toggleTheme, ts: saveTpl,
  pick: () => $('#photo').click(),
  pas: () => { S.frame.fit = 'cover'; tw(S.frame, 'zoom', 100, 600); tw(S.frame, 'px', 0, 600); tw(S.frame, 'py', 0, 600); },
  xLogo: () => { S.logo.src = ''; S.logo.on = false; I.logo = null; upd(); },
  xMas: () => { S.mascot.src = ''; I.mas = null; upd(); },
  rs: () => { if (confirm('Reset semua pengaturan, termasuk logo dan maskot?')) { S = clone(DEF); loadAll(); } }
};

/* ================= EVENT ================= */
document.addEventListener('input', e => {
  const t = e.target, k = t.dataset.k; if (!k) return;
  set(k, t.type == 'checkbox' ? t.checked : t.type == 'range' ? +t.value : t.value);
  if (k.endsWith('.font')) fl(t.value);
  upd();
});
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.tab) return tab(d.tab);
  if (d.g) return grp(d.g);
  if (d.fp != null) { Object.assign(S.filter, DEF.filter, FP[d.fp][1]); pop(); return upd(); }
  if (d.pre != null) return applyPre(+d.pre);
  if (d.use != null) { S = clone(DEF); merge(S, TP[d.use].s); loadAll(); pop(); burst(); return toast('Template dipakai'); }
  if (d.del != null) { TP.splice(d.del, 1); saveT(); return renderTpl(); }
  if (d.set) {
    set(d.set, d.val); pop();
    if (d.set.startsWith('info.')) S.info.on = true;
    if (d.set.startsWith('frame.') && d.set != 'frame.fit') S.frame.on = true;
    if (d.set == 'frame.theme') S.frame.accent = TH[d.val][2];
    if (d.set == 'logo.pos') S.logo.on = true;
    if (d.set == 'badge.pos') S.badge.on = true;
    if (d.set == 'text.pos') S.text.on = true;
    if (d.set == 'mascot.emoji') { S.mascot.src = ''; I.mas = null; S.mascot.on = true; tw(S.mascot, 'size', S.mascot.size, 500, 1); }
    return upd();
  }
  if (ACT[b.id]) ACT[b.id]();
});
document.addEventListener('change', e => {
  const t = e.target, f = t.files && t.files[0]; if (!f) return;
  if (t.id == 'photo') setPhoto(f);
  if (t.id == 'fLogo') shrink(f, 600, s => { S.logo.src = s; S.logo.on = true; loadImg('logo', s); upd(); toast('Logo tersimpan otomatis'); });
  if (t.id == 'fMas') shrink(f, 600, s => { S.mascot.src = s; S.mascot.on = true; loadImg('mas', s); upd(); });
  t.value = '';
});

// seret foto ke halaman, tempel (Ctrl+V), dan shortcut keyboard
['dragenter', 'dragover'].forEach(n => addEventListener(n, e => e.preventDefault()));
addEventListener('drop', e => { e.preventDefault(); const f = [...(e.dataTransfer?.files || [])].find(f => f.type.startsWith('image/')); if (f) setPhoto(f); });
addEventListener('paste', e => { const it = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/')); if (it) { setPhoto(it.getAsFile()); toast('Foto ditempel'); } });
addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase(), ed = /^(INPUT|TEXTAREA)$/.test(e.target.tagName) && !['range', 'checkbox', 'color'].includes(e.target.type);
  if (k == 's') { e.preventDefault(); download(); }
  else if (!ed && k == 'z') { e.preventDefault(); hgo(e.shiftKey ? 1 : -1); }
  else if (!ed && k == 'y') { e.preventDefault(); hgo(1); }
});

// geser maskot / foto langsung di preview
const cp = e => { const r = cv.getBoundingClientRect(), s = Math.min(r.width / cv.width, r.height / cv.height);
  return [(e.clientX - r.left - (r.width - cv.width * s) / 2) / s, (e.clientY - r.top - (r.height - cv.height * s) / 2) / s]; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
cv.addEventListener('pointerdown', e => {
  const [X, Y] = cp(e), m = S.mascot; lx = X; ly = Y; drag = 0;
  if (m.on && Math.hypot(X - cv.width * m.x / 100, Y - cv.height * m.y / 100) < Math.max(cv.width * m.size / 100, 80) * .7) drag = 1;
  else if (S.frame.on && WIN && X > WIN.x && X < WIN.x + WIN.w && Y > WIN.y && Y < WIN.y + WIN.h) drag = 2;
  else if (m.on) { drag = 1; m.x = clamp(X / cv.width * 100, 0, 100); m.y = clamp(Y / cv.height * 100, 0, 100); sync(); draw(); }
  if (drag) cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', e => {
  if (!drag) return; const [X, Y] = cp(e);
  if (drag == 1) { S.mascot.x = clamp(X / cv.width * 100, 0, 100); S.mascot.y = clamp(Y / cv.height * 100, 0, 100); }
  else { const F = S.frame; F.px = clamp(F.px + (X - lx) / WIN.w * 100, -100, 100); F.py = clamp(F.py + (Y - ly) / WIN.h * 100, -100, 100); lx = X; ly = Y; }
  sync(); draw();
});
cv.addEventListener('pointerup', () => { if (drag) { drag = 0; save(); } });

/* ================= MULAI ================= */
try {
  const s = localStorage.getItem('wm_s'); if (s) merge(S, JSON.parse(s));
  TP = JSON.parse(localStorage.getItem('wm_t') || '[]');
  const th = localStorage.getItem('wm_th'); if (th) document.documentElement.dataset.theme = th;
} catch (e) {}
themeIcon(); tab('text'); pre(); loadAll();
HS = [JSON.stringify(S)]; HI = 0; hbtn();
if (navigator.canShare) $('#sh').hidden = false;
if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) $('#cp').hidden = false;
(function loop() { if (S.mascot.on && S.mascot.bob && !drag) draw(); requestAnimationFrame(loop); })();
