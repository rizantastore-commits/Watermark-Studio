'use strict';
/* Kasir (POS): pilih produk → keranjang → total → QRIS sesuai nominal / tunai → nota → riwayat.
   Setiap item terjual disimpan sebagai catatan penjualan biasa (sheet "Records") + kode nota (inv), jadi
   rekap, pengingat, stok, laporan, refund, dan klaim yang sudah ada tetap jalan. */
(() => {
  const Q = s => document.querySelector(s), E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const T = () => window.TK, rp = n => T().rp(n), toast = m => T().toast(m);
  const PAYS = {qris: '📲 QRIS', cash: '💵 Tunai', tf: '🏦 Transfer'};
  const FH = s => `700 ${s}px Fredoka, Nunito, sans-serif`, FB = s => `700 ${s}px Nunito, sans-serif`;
  let CART = [], DISC = 0, PAY = 'qris', CASH = 0, BUYER = '', WA = '', TAB = 'pos', HF = 'today', HQ = '', TIERP = null, PINV = null, BUSY = false, RC = null, LOGO_IMG = null, LOGO_SRC = '';
  const n0 = x => Math.max(0, Math.round(+x || 0));
  const sub = () => CART.reduce((t, i) => t + n0(i.price), 0), tot = () => Math.max(0, sub() - Math.min(n0(DISC), sub()));
  const durTxt = d => d % 365 == 0 ? d / 365 + ' tahun' : d % 30 == 0 ? d / 30 + ' bulan' : d + ' hari';

  /* ---------- kerangka tampilan (dibuat sekali) ---------- */
  function skeleton() {
    Q('#v-kasir').innerHTML = `
    <nav class="seg ks-tabs" id="ksTabs">
      <button type="button" data-kstab="pos" class="on">${IC('cart')} Kasir</button>
      <button type="button" data-kstab="his">${IC('receipt')} Riwayat</button>
      <button type="button" data-kstab="shop">${IC('store')} Toko</button>
    </nav>
    <div id="ks-pos" class="ks-grid">
      <div class="ks-main">
        <div class="tk-card wide"><h3>📦 Pilih produk</h3>
          <div class="ks-prods" id="ksProds"></div><div class="ks-tiers" id="ksTiers" hidden></div>
          <div class="ks-add">
            <input type="text" id="ksName" list="appl" placeholder="Atau ketik nama aplikasi…" maxlength="60" aria-label="Nama aplikasi">
            <input type="number" id="ksPrice" inputmode="numeric" min="0" placeholder="Harga">
            <input type="number" id="ksDays" inputmode="numeric" min="1" placeholder="Hari" value="30">
            <button class="btn pri" data-ksadd type="button">+ Tambah</button>
          </div>
        </div>
        <div class="tk-card wide"><h3>🧺 Pesanan</h3><div id="ksCart"></div></div>
        <div class="tk-card wide"><h3>👤 Pembeli <small>(opsional)</small></h3>
          <div class="row2"><label class="f"><span>Nama</span><input type="text" id="ksBuyer" maxlength="40" placeholder="mis. Budi"></label>
          <label class="f"><span>No. WhatsApp</span><input type="tel" id="ksWa" maxlength="20" inputmode="tel" placeholder="08xxxxxxxxxx"></label></div>
        </div>
        <div class="tk-card wide" id="ksPvCard" hidden><h3>👀 Pratinjau nota</h3><small id="ksPvNote"></small>
          <div class="qr-canvas-wrap ks-pvw"><canvas id="ksPvLive"></canvas></div>
        </div>
      </div>
      <aside class="ks-side"><div class="tk-card wide ks-pay">
        <div class="ln"><span>Subtotal</span><b id="ksSub">Rp0</b></div>
        <label class="ks-disc"><span>Diskon (Rp)</span><input type="number" id="ksDisc" inputmode="numeric" min="0" placeholder="0"></label>
        <div class="ks-total"><small>TOTAL BAYAR</small><b id="ksTot">Rp0</b></div>
        <div class="seg ks-method" id="ksMethod">${Object.entries(PAYS).map(([k, l]) => `<button type="button" data-kspay="${k}" class="${k == PAY ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div id="ksPayBox"></div>
        <button class="btn pri wide" data-ksinv type="button">${IC('receipt')} Buat invoice & QR tagihan</button>
        <button class="btn pri wide ks-done" id="ksDone" data-ksdone type="button">${IC('check')} Pembayaran diterima · Selesai</button>
        <button class="btn" data-ksclear type="button">Kosongkan pesanan</button>
      </div></aside>
    </div>
    <div id="ks-his" hidden>
      <div class="stats" id="ksHStats"></div>
      <div class="tools"><input type="search" id="ksHQ" placeholder="Cari no. nota, pembeli, produk…" aria-label="Cari riwayat"><button class="btn" data-kscsv type="button" aria-label="Unduh CSV">${IC('download')}</button></div>
      <div class="chips" id="ksHF"></div><div class="tk-list" id="ksHList"></div>
    </div>
    <div id="ks-shop" hidden>
      <div class="ks-grid">
        <div class="ks-main">
        <div class="tk-card wide"><h3>🏪 Profil toko</h3><small>Tampil di header nota. Tersimpan di akunmu.</small>
          <div class="ks-logo"><div class="ks-lg" id="ksLg">🧾</div><div class="ks-lgb">
            <label class="btn pri" style="cursor:pointer">${IC('camera')} Upload logo<input type="file" id="ksLogoF" accept="image/*" hidden></label>
            <button class="btn" data-kslogodel type="button">Hapus</button></div></div>
          <label class="f"><span>Nama toko</span><input type="text" id="ksShop" maxlength="40" placeholder="mis. Rizanta Store"></label>
          <label class="f"><span>No. HP / WhatsApp toko</span><input type="tel" id="ksPhone" maxlength="20" inputmode="tel" placeholder="08xxxxxxxxxx"></label>
          <label class="f"><span>Alamat / IG / link toko</span><input type="text" id="ksAddr" maxlength="120" placeholder="mis. IG @rizantastore · Jakarta"></label>
          <label class="f"><span>Teks bawah nota</span><input type="text" id="ksFoot" maxlength="140"></label>
          <button class="btn pri" data-ksshopsave type="button">Simpan profil toko</button>
        </div>
        <div class="tk-card wide ks-iv"><h3>🎨 Tampilan invoice</h3><small>Atur tema, bentuk, dan posisi. Pratinjau di kanan langsung berubah.</small>
          ${IVOPTS.map(([k, l, ch]) => `<div class="ks-ivg"><span>${l}</span><div class="ks-ch">${ch.map(([v, t]) => `<button type="button" data-iv="${k}:${v}">${t}</button>`).join('')}</div></div>`).join('')}
          <div class="ks-ivg"><span>Warna aksen</span><div class="ks-ch"><input type="color" id="ivAccent" value="#ff5fa2" aria-label="Warna aksen"><button type="button" data-ivacc0>Ikut warna tema</button></div></div>
          <div class="ks-ivb"><button class="btn pri" data-ksshopsave type="button">${IC('save')} Simpan tampilan</button><button class="btn" data-ivreset type="button">Kembalikan bawaan</button></div>
        </div>
        </div>
        <div class="tk-card wide ks-pvs"><h3>👀 Pratinjau nota</h3>
          <div class="ks-ch ks-pvm"><button type="button" data-ivprev="inv">${IC('hourglass')} Invoice + QR</button><button type="button" data-ivprev="nota">${IC('check')} Nota lunas</button></div>
          <div class="qr-canvas-wrap ks-pvw"><canvas id="ksPv"></canvas></div></div>
      </div>
    </div>`;
    const m = document.createElement('div'); m.className = 'mdl'; m.id = 'ks-rc'; m.hidden = true; m.innerHTML = '<div class="mcard ed"></div>'; document.body.appendChild(m);
  }

  /* ---------- produk & keranjang ---------- */
  function renderProds() {
    const P = T().P, el = Q('#ksProds'); if (!el) return;
    el.innerHTML = P.length ? P.map(p => `<button type="button" class="ks-prod${+p.stock <= 0 ? ' out' : ''}" data-ksprod="${E(p.id)}"><b>${E(p.name)}</b><small>${p.tiers && p.tiers[0] ? 'mulai ' + rp(Math.min(...p.tiers.map(t => t.price))) : 'isi harga manual'}</small><i>${+p.stock <= 0 ? 'habis' : 'stok ' + p.stock}</i></button>`).join('')
      : '<small>Belum ada produk. Isi dulu di tab Produk, atau ketik nama aplikasi di bawah.</small>';
  }
  function addItem(o) {
    CART.push({k: T().uid(), pid: o.pid, app: o.app, days: n0(o.days) || 30, price: n0(o.price), cost: n0(o.cost), start: T().today(), email: ''});
    renderCart(); renderPay();
  }
  function renderCart() {
    const el = Q('#ksCart'); if (!el) return;
    if (!CART.length) { el.innerHTML = '<div class="empty ks-empty">Belum ada pesanan. Ketuk produk di atas ya 👆</div>'; return; }
    el.innerHTML = CART.map((i, x) => `<div class="ks-it" data-k="${i.k}">
      <div class="ks-ith"><b>${x + 1}. ${E(i.app)}</b><button type="button" class="ib" data-ksdel="${i.k}" aria-label="Hapus item">${IC('x')}</button></div>
      <div class="ks-itg">
        <label class="f"><span>Harga (Rp)</span><input type="number" data-kf="price" inputmode="numeric" min="0" value="${i.price || ''}"></label>
        <label class="f"><span>Durasi (hari)</span><input type="number" data-kf="days" inputmode="numeric" min="1" value="${i.days}"></label>
        <label class="f"><span>Tanggal mulai</span><input type="date" data-kf="start" value="${i.start}"></label>
        <label class="f"><span>Akun / email</span><input type="text" data-kf="email" maxlength="80" value="${E(i.email)}" placeholder="opsional"></label>
      </div><small class="ks-end" data-ksend>Berakhir ${T().fd(T().addD(i.start, i.days))} · ${durTxt(i.days)}</small></div>`).join('');
  }

  /* ---------- panel pembayaran + QRIS sesuai nominal ---------- */
  function drawQR(cv, payload, S0) {
    const q = qrcode(0, 'M'); q.addData(payload); q.make(); const n = q.getModuleCount(), Z = 4, S = S0 || 264, c = Math.floor(S / (n + Z * 2)), W = c * (n + Z * 2);
    cv.width = cv.height = W; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, W); x.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + Z) * c, (r + Z) * c, c, c);
  }
  function renderPay() {
    const t = tot(); Q('#ksSub').textContent = rp(sub()); Q('#ksTot').textContent = rp(t);
    const box = Q('#ksPayBox'), qc = T().QCFG;
    if (PAY == 'qris') {
      if (!qc || !qc.raw) box.innerHTML = '<div class="prev">QRIS tokomu belum diatur. <button class="btn" type="button" data-ksqrset>Atur QRIS sekarang</button></div>';
      else if (t <= 0) box.innerHTML = '<div class="prev ks-qwait">Tambahkan pesanan dulu. QR tampil di pratinjau nota sesuai total.</div>';
      else box.innerHTML = '<div class="prev ks-qwait">QR pembayaran ada di <b>pratinjau nota</b> 👈 Tekan “Buat invoice” untuk kirim ke pembeli.</div>';
    } else if (PAY == 'cash') {
      const ch = CASH - t;
      box.innerHTML = `<label class="f"><span>Uang diterima (Rp)</span><input type="number" id="ksCash" inputmode="numeric" min="0" value="${CASH || ''}"></label>
        <div class="chips"><button type="button" data-kscash="${t}">Uang pas</button>${[20000, 50000, 100000].filter(v => v >= t).slice(0, 3).map(v => `<button type="button" data-kscash="${v}">${rp(v)}</button>`).join('')}</div>
        <div class="tk-out"><div class="ln"><span>Kembalian</span><b id="ksChg" class="${ch < 0 ? 'neg' : ''}">${CASH ? (ch < 0 ? 'Kurang ' + rp(-ch) : rp(ch)) : '-'}</b></div></div>`;
    } else box.innerHTML = '<div class="prev">Terima transfer dari pembeli, cek mutasi rekening, lalu tekan Selesai.</div>';
    Q('#ksDone').disabled = BUSY || !CART.length; schedulePv();
  }
  /* ---------- pratinjau nota langsung (QR ikut tergambar di dalam nota) ---------- */
  let PVT = 0;
  function schedulePv() { clearTimeout(PVT); PVT = setTimeout(paintPv, 120); }
  async function paintPv() {
    const card = Q('#ksPvCard'), cv = Q('#ksPvLive'); if (!card || !cv || TAB != 'pos') return;
    const t = tot(); if (!CART.length || t <= 0) { card.hidden = true; return; }
    const qc = T().QCFG, hasQ = PAY == 'qris' && qc && qc.raw, s = sub();
    await Promise.all([syncLogo(), fonts()]); if (!CART.length) return;
    const o = {unpaid: PAY == 'qris', inv: PINV || nextInv(), date: T().today(), time: hhmm(), buyer: BUYER.trim(), pay: PAY, cash: PAY == 'cash' ? n0(CASH) : 0,
      disc: Math.min(n0(DISC), s), total: tot(), merch: qc && qc.merch, qr: hasQ ? T().buildDynamicQRIS(qc.raw, tot()) : '',
      items: CART.map(i => ({app: i.app || '-', days: i.days, start: i.start, end: T().addD(i.start, i.days), price: i.price, email: i.email}))};
    card.hidden = false; Q('#ksPvNote').textContent = PAY == 'qris' ? (hasQ ? 'Pembeli bisa scan QR di nota ini, nominal sudah terisi otomatis.' : 'QRIS tokomu belum diatur, jadi QR belum muncul.') : 'Begini tampilan nota setelah transaksi selesai.';
    paintReceipt(cv, o, profile());
  }
  function cashLive() { const t = tot(), ch = CASH - t, el = Q('#ksChg'); if (el) { el.textContent = CASH ? (ch < 0 ? 'Kurang ' + rp(-ch) : rp(ch)) : '-'; el.classList.toggle('neg', ch < 0); } schedulePv(); }

  /* ---------- selesaikan transaksi ---------- */
  const hhmm = () => { const d = new Date(Auth.now()); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function nextInv() {
    const d = T().today().replace(/-/g, '').slice(2), seen = new Set(T().R.filter(r => r.inv && r.inv.startsWith('INV' + d)).map(r => r.inv));
    return 'INV' + d + '-' + String(seen.size + 1).padStart(3, '0');
  }
  async function finish() {
    if (BUSY) return; if (!CART.length) return toast('Pesanan masih kosong'); if (window.Gate && !Gate.canSell()) return;
    const bad = CART.find(i => !i.start || !(i.days > 0)); if (bad) return toast('Tanggal & durasi wajib diisi: ' + bad.app);
    const total = tot(); if (total <= 0 && !confirm('Total Rp0. Tetap simpan?')) return;
    if (PAY == 'cash' && CASH < total) return toast('Uang diterima masih kurang');
    BUSY = true; Q('#ksDone').disabled = true;
    const inv = PINV || nextInv(), time = hhmm(), s = sub(), disc = Math.min(n0(DISC), s), saved = []; let left = disc;
    for (let x = 0; x < CART.length; x++) {
      const i = CART[x], share = x == CART.length - 1 ? left : Math.min(left, s ? Math.round(disc * i.price / s) : 0); left -= share;
      const net = Math.max(0, i.price - share), end = T().addD(i.start, i.days);
      const rec = {id: T().uid(), hist: [{d: i.start, days: i.days, price: net, cost: i.cost}], renewals: 0, created: Date.now() + x, app: i.app, pid: i.pid || undefined,
        email: i.email.trim(), buyer: BUYER.trim(), wa: WA.trim(), orderDate: i.start, days: i.days, end, price: net, cost: i.cost, note: '', rm: window.Gate && Gate.free() ? Gate.F.REMIND.slice() : [T().RMS[1] || 3], rmDone: null,
        inv, pay: PAY, dsc: share || undefined, cash: PAY == 'cash' ? CASH : undefined, time};
      if (!(await T().persist(rec))) { BUSY = false; renderPay(); return toast('Gagal menyimpan, coba lagi'); }
      saved.push(rec);
    }
    const used = {}; CART.forEach(i => { if (i.pid) used[i.pid] = (used[i.pid] || 0) + 1; });
    for (const pid in used) { const p = T().P.find(x => x.id == pid); if (p) await T().persist({...p, stock: Math.max(0, (+p.stock || 0) - used[pid])}); }
    PINV = null; CART = []; DISC = 0; CASH = 0; BUYER = WA = ''; BUSY = false;
    Q('#ksDisc').value = Q('#ksBuyer').value = Q('#ksWa').value = ''; renderCart(); renderPay(); renderProds();
    toast('Transaksi ' + inv + ' selesai ✓'); openReceipt(orderOf(inv, saved));
  }
  function orderOf(inv, rs) {
    rs = rs || T().R.filter(r => r.inv == inv); const f = rs[0];
    return {inv, date: f.orderDate, time: f.time || '', buyer: f.buyer, wa: f.wa, pay: f.pay || 'tf', cash: f.cash || 0, disc: rs.reduce((t, r) => t + (r.dsc || 0), 0),
      total: rs.reduce((t, r) => t + (r.price || 0), 0), items: rs.map(r => ({app: r.app, days: r.days, start: r.orderDate, end: r.end, price: (r.price || 0) + (r.dsc || 0), email: r.email}))};
  }

  /* ---------- nota (kanvas) ---------- */
  function wrap(ctx, text, w) {
    const out = []; let line = '';
    String(text || '').split(/\s+/).forEach(wd => { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > w && line) { out.push(line); line = wd; } else line = t; });
    if (line) out.push(line); return out.length ? out : [''];
  }
  /* ---------- tema & tampilan invoice (bisa diatur per toko, tersimpan di profil toko: WT.iv) ---------- */
  const TH = {
    pink:     {bg1: '#fff0f6', bg2: '#ffe3ef', paper: '#ffffff', line: '#ffb8d8', ink: '#3b1d2e', sub: '#8c5a73', lab: '#9e6b84', body: '#6b3e54', ac: '#ff5fa2', hi: '#d81b60', soft: '#fff5f9', sl: '#ffd1e6', dash: '#f0c3d8'},
    mint:     {bg1: '#e9fbf3', bg2: '#d2f4e5', paper: '#ffffff', line: '#8fdcb8', ink: '#12372a', sub: '#3f7a64', lab: '#4d8a73', body: '#2d5a48', ac: '#1fbf84', hi: '#0d8f5f', soft: '#f1fcf7', sl: '#bdeed7', dash: '#a9dfc6'},
    ocean:    {bg1: '#eaf4ff', bg2: '#d3e8ff', paper: '#ffffff', line: '#9cc8f5', ink: '#10284a', sub: '#4a6f9c', lab: '#5a7fa8', body: '#2c4a73', ac: '#3b8dea', hi: '#1565c0', soft: '#f3f8ff', sl: '#c5dcf7', dash: '#b3d1f0'},
    lavender: {bg1: '#f5efff', bg2: '#e6d9ff', paper: '#ffffff', line: '#c9b0f5', ink: '#2a1a4a', sub: '#70589c', lab: '#7e68a8', body: '#4a3673', ac: '#8f5ff0', hi: '#6a35d1', soft: '#f8f4ff', sl: '#dccbf7', dash: '#cdb9ee'},
    sunset:   {bg1: '#fff3e6', bg2: '#ffe1c4', paper: '#ffffff', line: '#ffc08a', ink: '#3d2210', sub: '#94603a', lab: '#a06c46', body: '#6b4325', ac: '#ff8a3d', hi: '#d9540a', soft: '#fff8f0', sl: '#ffd9b8', dash: '#f2c9a3'},
    gold:     {bg1: '#faf6ea', bg2: '#efe4c2', paper: '#fffef9', line: '#d8bd6b', ink: '#2b2410', sub: '#7d6a2e', lab: '#8a7637', body: '#51441c', ac: '#c9a227', hi: '#8f6f0a', soft: '#fffbee', sl: '#ecdca0', dash: '#dfcb86'},
    dark:     {bg1: '#1a1424', bg2: '#271c38', paper: '#2b2139', line: '#5b4a7a', ink: '#f5ecff', sub: '#b8a6d6', lab: '#a897c8', body: '#d6c8ee', ac: '#ff5fa2', hi: '#ff8cc0', soft: '#35294a', sl: '#55427a', dash: '#5b4a7a', dk: 1},
    mono:     {bg1: '#efefef', bg2: '#e0e0e0', paper: '#ffffff', line: '#222222', ink: '#111111', sub: '#555555', lab: '#666666', body: '#333333', ac: '#111111', hi: '#111111', soft: '#f6f6f6', sl: '#cfcfcf', dash: '#999999'}
  };
  const IVD = {theme: 'pink', accent: '', paper: 'card', corner: 'mid', frame: 'solid', head: 'center', logo: 'circle', total: 'box', qrPos: 'center', qrSize: 'm', font: 'fun', pattern: 'none'};
  const IVOPTS = [
    ['theme', 'Tema', [['pink', '🌸 Pink'], ['mint', '🍃 Mint'], ['ocean', '🌊 Ocean'], ['lavender', '🔮 Lavender'], ['sunset', '🌅 Sunset'], ['gold', '✨ Gold'], ['dark', '🌙 Dark'], ['mono', '🧾 Struk']]],
    ['paper', 'Bentuk kertas', [['card', '🪪 Kartu'], ['struk', '🧾 Struk sobek']]],
    ['corner', 'Sudut', [['sq', 'Kotak'], ['mid', 'Sedang'], ['rnd', 'Bulat']]],
    ['frame', 'Bingkai kartu', [['solid', 'Garis'], ['dashed', 'Putus-putus'], ['none', 'Tanpa']]],
    ['head', 'Posisi header (logo & nama)', [['left', '◀ Kiri'], ['center', 'Tengah'], ['right', 'Kanan ▶']]],
    ['logo', 'Bentuk logo', [['circle', 'Bulat'], ['round', 'Tumpul'], ['square', 'Kotak'], ['none', 'Sembunyi']]],
    ['total', 'Gaya total', [['box', 'Kotak'], ['line', 'Garis'], ['block', 'Blok warna']]],
    ['qrPos', 'Posisi QR', [['left', '◀ Kiri'], ['center', 'Tengah'], ['right', 'Kanan ▶']]],
    ['qrSize', 'Ukuran QR', [['s', 'Kecil'], ['m', 'Sedang'], ['l', 'Besar']]],
    ['font', 'Jenis huruf', [['fun', 'Imut'], ['clean', 'Rapi'], ['mono', 'Struk']]],
    ['pattern', 'Motif latar', [['none', 'Polos'], ['dots', 'Titik-titik']]]
  ];
  const ivOf = iv => { const o = {...IVD}; if (iv && typeof iv == 'object') IVOPTS.forEach(([k, , ch]) => { if (ch.some(c => c[0] == iv[k])) o[k] = iv[k]; }); if (iv && /^#[0-9a-f]{6}$/i.test(iv.accent || '')) o.accent = iv.accent.toLowerCase(); return o; };
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), toHx = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const tint = (h, t) => toHx(hx(h).map(v => v + (255 - v) * t)), shade = (h, t) => toHx(hx(h).map(v => v * (1 - t)));
  function themeOf(iv) {
    const b = {...(TH[iv.theme] || TH.pink)};
    if (iv.accent) { b.ac = iv.accent; if (b.dk) b.hi = tint(iv.accent, .3); else { b.hi = shade(iv.accent, .22); b.soft = tint(iv.accent, .94); b.sl = tint(iv.accent, .78); b.line = tint(iv.accent, .6); b.dash = tint(iv.accent, .65); b.bg1 = tint(iv.accent, .93); b.bg2 = tint(iv.accent, .85); b.ink = shade(iv.accent, .8); b.sub = shade(iv.accent, .3); b.lab = shade(iv.accent, .2); b.body = shade(iv.accent, .55); if (iv.theme == 'mono') b.ink = '#111111'; } }
    return b;
  }

  function paintReceipt(cv, o, prof) {
    const W = 540, SC = 2, PX = 44, IW = W - PX * 2, ctx = cv.getContext('2d'); cv.width = W * SC; cv.height = 3600 * SC;
    const iv = ivOf(prof.iv), th = themeOf(iv), RR = T().drawRoundRect;
    const fh = s => iv.font == 'mono' ? `700 ${Math.round(s * .9)}px "Courier New", monospace` : iv.font == 'clean' ? `800 ${s}px Nunito, sans-serif` : FH(s);
    const fb = s => iv.font == 'mono' ? `700 ${Math.round(s * .9 * 10) / 10}px "Courier New", monospace` : FB(s);
    const rOut = {sq: 0, mid: 16, rnd: 34}[iv.corner], rIn = {sq: 0, mid: 10, rnd: 20}[iv.corner], rPill = iv.corner == 'sq' ? 3 : 14;
    const al = iv.head, side = al != 'center', hasLogo = iv.logo != 'none';
    const run = draw => { ctx.setTransform(SC, 0, 0, SC, 0, 0); return draw(); };
    const body = H => {
      let y = 52;
      const dots = a => { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = th.ac; for (let r = 0, yy = 14; yy < H; yy += 22, r++) for (let xx = r % 2 ? 25 : 14; xx < W; xx += 22) { ctx.beginPath(); ctx.arc(xx, yy, 1.7, 0, 7); ctx.fill(); } ctx.restore(); };
      const paperPath = () => {
        if (iv.paper != 'struk') return RR(ctx, 22, 22, W - 44, H - 44, rOut);
        const x0 = 22, x1 = W - 22, y0 = 22, y1 = H - 22, d = 7, n = Math.round((x1 - x0) / 11), st = (x1 - x0) / n; ctx.beginPath(); ctx.moveTo(x0, y0 + d);
        for (let i = 1; i <= n; i++) ctx.lineTo(x0 + i * st, y0 + (i % 2 ? 0 : d)); ctx.lineTo(x1, y1 - d);
        for (let i = n - 1; i >= 0; i--) ctx.lineTo(x0 + i * st, y1 - (i % 2 ? 0 : d)); ctx.closePath();
      };
      if (H) {
        const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, th.bg1); g.addColorStop(1, th.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        if (iv.pattern == 'dots') dots(.35);
        ctx.save(); if (iv.paper == 'struk') { ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3; } ctx.fillStyle = th.paper; paperPath(); ctx.fill(); ctx.restore();
        if (iv.pattern == 'dots') { ctx.save(); paperPath(); ctx.clip(); dots(.13); ctx.restore(); }
        if (iv.paper != 'struk' && iv.frame != 'none') { ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = th.line; if (iv.frame == 'dashed') ctx.setLineDash([11, 8]); paperPath(); ctx.stroke(); ctx.restore(); }
      }
      /* header: logo + nama toko + alamat, posisi kiri / tengah / kanan */
      const R = side ? 32 : 40, lgR = iv.logo == 'circle' ? R : iv.logo == 'round' ? R * .34 : 0;
      const drawLogo = (x, yy) => { if (!H) return; ctx.save(); RR(ctx, x, yy, R * 2, R * 2, lgR); ctx.fillStyle = th.soft; ctx.fill(); ctx.clip();
        if (prof.img) ctx.drawImage(prof.img, x, yy, R * 2, R * 2); else { ctx.fillStyle = th.ac; ctx.font = fh(side ? 28 : 34); ctx.textAlign = 'center'; ctx.fillText('🧾', x + R, yy + R + 11); } ctx.restore(); };
      const nameFs = side ? 23 : 26, nameLH = side ? 27 : 30, addrLines = [];
      ctx.font = fh(nameFs); const tw = side && hasLogo ? IW - R * 2 - 16 : IW, nl = wrap(ctx, prof.name, tw).slice(0, 2);
      ctx.font = fb(13); [prof.addr, prof.phone ? '📞 ' + prof.phone : ''].filter(Boolean).forEach(l => wrap(ctx, l, tw).slice(0, 2).forEach(t => addrLines.push(t)));
      if (!side) {
        if (hasLogo) { drawLogo(W / 2 - R, y); y += R * 2 + 26; } else y += 26;
        ctx.textAlign = 'center'; ctx.fillStyle = th.ink; ctx.font = fh(nameFs); nl.forEach(t => { if (H) ctx.fillText(t, W / 2, y); y += nameLH; });
        ctx.fillStyle = th.sub; ctx.font = fb(13); addrLines.forEach(t => { if (H) ctx.fillText(t, W / 2, y); y += 19; });
      } else {
        const left = al == 'left', lx = left ? PX : W - PX - R * 2, ax = hasLogo ? (left ? PX + R * 2 + 16 : W - PX - R * 2 - 16) : (left ? PX : W - PX);
        const textH = nl.length * nameLH + (addrLines.length ? 4 + addrLines.length * 19 : 0), blockH = Math.max(hasLogo ? R * 2 : 0, textH);
        if (hasLogo) drawLogo(lx, y); let ty = y + (blockH - textH) / 2 + nameLH - 6;
        if (H) ctx.textAlign = left ? 'left' : 'right';
        ctx.fillStyle = th.ink; ctx.font = fh(nameFs); nl.forEach(t => { if (H) ctx.fillText(t, ax, ty); ty += nameLH; });
        ctx.fillStyle = th.sub; ctx.font = fb(13); ty += 4; addrLines.forEach(t => { if (H) ctx.fillText(t, ax, ty); ty += 19; });
        y += blockH + 12;
      }
      ctx.textAlign = 'center';
      const bx = w => al == 'left' ? PX : al == 'right' ? W - PX - w : W / 2 - w / 2;   // kotak kecil mengikuti posisi header
      y += 4; if (H) { ctx.fillStyle = o.unpaid ? '#ffa726' : th.ac; RR(ctx, bx(160), y, 160, 28, rPill); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = fh(14); ctx.textAlign = 'center'; ctx.fillText(o.unpaid ? 'INVOICE' : 'NOTA PEMBELIAN', bx(160) + 80, y + 19); } y += 40;
      const dash = () => { if (H) { ctx.save(); ctx.strokeStyle = th.dash; ctx.lineWidth = 2; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(PX, y); ctx.lineTo(W - PX, y); ctx.stroke(); ctx.restore(); } y += 20; };
      dash(); const meta = (l, v) => { if (!v) return; if (H) { ctx.textAlign = 'left'; ctx.fillStyle = th.lab; ctx.font = fb(13); ctx.fillText(l, PX, y); ctx.textAlign = 'right'; ctx.fillStyle = th.ink; ctx.fillText(v, W - PX, y); } y += 21; };
      meta('No. nota', o.inv); meta('Tanggal', T().fd(o.date) + (o.time ? ' · ' + o.time : '')); meta('Pembeli', o.buyer); meta('Kasir', prof.cashier); y -= 4; dash();
      o.items.forEach(i => {
        ctx.font = fb(15); const il = wrap(ctx, i.app, IW - 120).slice(0, 2);
        if (H) { ctx.textAlign = 'left'; ctx.fillStyle = th.ink; il.forEach((t, k) => ctx.fillText(t, PX, y + k * 19)); ctx.textAlign = 'right'; ctx.fillText(rp(i.price), W - PX, y); }
        y += il.length * 19; ctx.font = fb(12.5); if (H) { ctx.textAlign = 'left'; ctx.fillStyle = th.lab; ctx.fillText(`${durTxt(i.days)} · ${T().fd(i.start)} – ${T().fd(i.end)}`, PX, y); } y += 18;
        if (i.email && prof.showAcc) { if (H) { ctx.textAlign = 'left'; ctx.fillText('Akun: ' + i.email, PX, y); } y += 18; } y += 8;
      });
      y -= 4; dash(); const row = (l, v, b) => { if (H) { ctx.textAlign = 'left'; ctx.fillStyle = th.body; ctx.font = fb(14); ctx.fillText(l, PX, y); ctx.textAlign = 'right'; ctx.fillStyle = b || th.ink; ctx.fillText(v, W - PX, y); } y += 22; };
      if (o.disc > 0) { row('Subtotal', rp(o.total + o.disc)); row('Diskon', '−' + rp(o.disc), th.hi); }
      if (H) {
        const lbl = o.unpaid ? 'TOTAL TAGIHAN' : 'TOTAL BAYAR', bl = iv.total == 'block'; ctx.textAlign = 'center';
        if (iv.total == 'line') { ctx.strokeStyle = th.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(PX, y - 6); ctx.lineTo(W - PX, y - 6); ctx.moveTo(PX, y + 64); ctx.lineTo(W - PX, y + 64); ctx.stroke(); }
        else { ctx.fillStyle = bl ? th.ac : th.soft; RR(ctx, PX, y - 6, IW, 70, rIn); ctx.fill(); if (!bl) { ctx.strokeStyle = th.sl; ctx.lineWidth = 2; ctx.stroke(); } }
        ctx.fillStyle = bl ? 'rgba(255,255,255,.85)' : th.sub; ctx.font = fb(12); ctx.fillText(lbl, W / 2, y + 14); ctx.fillStyle = bl ? '#fff' : th.hi; ctx.font = fh(32); ctx.fillText(rp(o.total), W / 2, y + 50);
      } y += 88;
      row('Metode', (PAYS[o.pay] || o.pay).replace(/^\S+\s/, ''));
      if (!o.unpaid && o.pay == 'cash' && o.cash) { row('Tunai', rp(o.cash)); row('Kembalian', rp(o.cash - o.total)); }
      y += 6; const bw = o.unpaid ? 236 : 92; if (H) { ctx.fillStyle = o.unpaid ? '#fff1cc' : '#d9f7e6'; RR(ctx, bx(bw), y, bw, 26, rPill); ctx.fill(); ctx.fillStyle = o.unpaid ? '#8a5a00' : '#116b3a'; ctx.font = fh(13); ctx.textAlign = 'center'; ctx.fillText(o.unpaid ? '⏳ MENUNGGU PEMBAYARAN' : '✓ LUNAS', bx(bw) + bw / 2, y + 18); } y += 26 + 20;
      if (o.unpaid && o.qr) {
        const QS = {s: 190, m: 240, l: 290}[iv.qrSize], BW = QS + 24, qx = iv.qrPos == 'left' ? PX : iv.qrPos == 'right' ? W - PX - BW : W / 2 - BW / 2;
        const tx = iv.qrPos == 'left' ? qx : iv.qrPos == 'right' ? qx + BW : W / 2, ta = iv.qrPos == 'left' ? 'left' : iv.qrPos == 'right' ? 'right' : 'center';
        if (H) { const qc = document.createElement('canvas'); drawQR(qc, o.qr, QS * SC); ctx.fillStyle = '#fff'; RR(ctx, qx, y, BW, BW, Math.min(rIn + 4, 22)); ctx.fill(); ctx.strokeStyle = th.sl; ctx.lineWidth = 2; ctx.stroke(); ctx.drawImage(qc, qx + 12, y + 12, QS, QS); }
        y += BW + 22; if (H) { ctx.textAlign = ta; ctx.fillStyle = th.ink; ctx.font = fb(14); ctx.fillText(o.merch || 'QRIS', tx, y); } y += 20; if (H) { ctx.fillStyle = th.sub; ctx.font = fb(12.5); ctx.fillText('Scan pakai e-wallet / m-banking, nominal sudah terisi', tx, y, IW); } y += 30;
      } else y += 4;
      ctx.font = fb(13); ctx.textAlign = 'center'; ctx.fillStyle = th.body; wrap(ctx, o.unpaid ? 'Silakan bayar sesuai nominal tagihan. Nota LUNAS dikirim setelah pembayaran diterima 💖' : prof.foot, IW).slice(0, 3).forEach(t => { if (H) ctx.fillText(t, W / 2, y); y += 18; });
      if (window.Gate && Gate.mark()) { y += 6; if (H) { const mk = Gate.mark(); ctx.save(); ctx.textAlign = 'center'; ctx.font = fb(12); const tw = Math.min(IW, ctx.measureText(mk).width + 36); ctx.fillStyle = 'rgba(0,0,0,.05)'; RR(ctx, W / 2 - tw / 2, y, tw, 26, 13); ctx.fill(); ctx.fillStyle = '#9a7a8c'; ctx.fillText(mk, W / 2, y + 17); ctx.restore(); } y += 30; }
      return y + 44;
    };
    const H = Math.ceil(run(() => body(0))); cv.height = H * SC; run(() => body(H));
  }
  function profile(over) {
    const w = T().WT || {}, o = over || {};
    return {name: o.name ?? T().shopName(), phone: o.phone ?? w.phone ?? '', addr: o.addr ?? w.addr ?? '', foot: ((window.Gate && Gate.free()) ? '' : (o.foot ?? w.foot)) || T().tplOf('foot'), img: (window.Gate && Gate.free()) ? null : LOGO_IMG, cashier: (Auth.user() || {}).username, showAcc: true, iv: (window.Gate && Gate.free()) ? undefined : (o.iv !== undefined ? o.iv : w.iv)};
  }
  function syncLogo() { const s = T().LG ? T().LG.img : ''; if (s == LOGO_SRC) return Promise.resolve(); LOGO_SRC = s; LOGO_IMG = null; if (!s) return Promise.resolve(); return new Promise(r => { const im = new Image(); im.onload = () => { LOGO_IMG = im; r(); }; im.onerror = r; im.src = s; }); }
  async function fonts() { try { await Promise.all([document.fonts.load(FH(26)), document.fonts.load(FB(14))]); } catch (e) {} }

  /* ---------- jendela nota ---------- */
  async function openReceipt(o) {
    RC = o; await Promise.all([syncLogo(), fonts()]);
    const m = Q('#ks-rc'); m.querySelector('.mcard').innerHTML = `<button class="mx" data-ksclose aria-label="Tutup">${IC('x')}</button><h3>🧾 Nota ${E(o.inv)}</h3>
      <div class="qr-canvas-wrap nt-wrap"><canvas id="ksRc"></canvas></div>
      <div class="tk-ckrow"><label class="tk-ck"><input type="checkbox" id="ksRcAcc" checked> Tampilkan akun/email</label></div>
      <button class="btn pri wide" data-ksrcshare type="button">${IC('send')} Kirim ke WhatsApp</button>
      <div class="row2"><button class="btn" data-ksrccopy type="button">${IC('clipboard')} Salin gambar</button><button class="btn" data-ksrcdl type="button">${IC('download')} Unduh PNG</button></div>
      <button class="btn wide" data-ksclose type="button">Transaksi baru</button>`;
    m.hidden = false; paintRc();
  }
  async function openInvoice() {
    if (!CART.length) return toast('Pesanan masih kosong'); if (tot() <= 0) return toast('Total masih Rp0');
    const qc = T().QCFG; if (PAY == 'qris' && !(qc && qc.raw)) return toast('Atur QRIS tokomu dulu');
    PINV = PINV || nextInv(); const s = sub(), t = tot();
    RC = {unpaid: true, inv: PINV, date: T().today(), time: hhmm(), buyer: BUYER.trim(), wa: WA.trim(), pay: PAY, cash: 0, disc: Math.min(n0(DISC), s), total: t, merch: qc && qc.merch,
      qr: PAY == 'qris' ? T().buildDynamicQRIS(qc.raw, t) : '', items: CART.map(i => ({app: i.app, days: i.days, start: i.start, end: T().addD(i.start, i.days), price: i.price, email: i.email}))};
    await Promise.all([syncLogo(), fonts()]);
    Q('#ks-rc .mcard').innerHTML = `<button class="mx" data-ksclose aria-label="Tutup">${IC('x')}</button><h3>🧾 Invoice ${E(RC.inv)}</h3><small>Kirim ke pembeli, lalu tandai lunas setelah bayar.</small>
      <div class="qr-canvas-wrap nt-wrap"><canvas id="ksRc"></canvas></div>
      <div class="tk-ckrow"><label class="tk-ck"><input type="checkbox" id="ksRcAcc" checked> Tampilkan akun/email</label></div>
      <button class="btn pri wide" data-ksrcshare type="button">${IC('send')} Kirim invoice ke WhatsApp</button>
      <div class="row2"><button class="btn" data-ksrccopy type="button">${IC('clipboard')} Salin gambar</button><button class="btn" data-ksrcdl type="button">${IC('download')} Unduh PNG</button></div>
      <button class="btn pri wide" data-ksinvpaid type="button">${IC('check')} Sudah dibayar · Tandai LUNAS</button>
      <button class="btn wide" data-ksclose type="button">Kembali ke kasir</button>`;
    Q('#ks-rc').hidden = false; paintRc();
  }
  const paintRc = () => { const cv = Q('#ksRc'); if (cv && RC) { const p = profile(); p.showAcc = !Q('#ksRcAcc') || Q('#ksRcAcc').checked; paintReceipt(cv, RC, p); } };
  const rcBlob = () => new Promise(r => Q('#ksRc').toBlob(r, 'image/png'));
  async function rcShare() {
    const blob = await rcBlob(), name = `${RC.unpaid ? 'Invoice' : 'Nota'}-${RC.inv}.png`, file = new File([blob], name, {type: 'image/png'});
    const msg = RC.unpaid ? `Halo kak${RC.buyer ? ' ' + RC.buyer : ''}, berikut invoice ${RC.inv} sebesar ${rp(RC.total)} dari ${T().shopName()} 🧾 ${RC.qr ? 'Silakan scan QR untuk membayar ya 🙏' : 'Mohon dibayar sesuai nominal ya 🙏'}` : `Halo kak${RC.buyer ? ' ' + RC.buyer : ''}, ini nota pembelian kakak ya 🧾 ${RC.inv}. Terima kasih sudah belanja di ${T().shopName()} 💖`;
    if (navigator.canShare && navigator.canShare({files: [file]})) { try { await navigator.share({files: [file], text: msg}); return; } catch (e) { if (e && e.name == 'AbortError') return; } }
    let ok = false; if (navigator.clipboard && window.ClipboardItem) { try { await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]); ok = true; } catch (e) {} }
    const n = T().waNum(RC.wa); window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    if (ok) toast('Nota disalin, Paste (Ctrl+V) di chat WA ✓'); else { T().saveBlob(blob, name); toast('Nota diunduh, lampirkan di chat WA ⬇'); }
  }

  /* ---------- riwayat ---------- */
  let HIDDEN = 0;
  function orders() {
    const m = {}; T().R.filter(r => r.inv && !r.ref).forEach(r => (m[r.inv] = m[r.inv] || []).push(r));
    let all = Object.keys(m).map(k => orderOf(k, m[k])).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time) || b.inv.localeCompare(a.inv)); HIDDEN = 0;
    if (window.Gate && Gate.free()) { const cut = T().addD(T().today(), -(Gate.F.HISTORY_DAYS - 1)), ls = all.filter(o => o.date >= cut); HIDDEN = all.length - ls.length; all = ls; }
    return all;
  }
  function renderHis() {
    if (!Q('#ksHList')) return;
    const td = T().today(), mo = td.slice(0, 7), wk = T().addD(td, -6), F = [['today', 'Hari ini'], ['week', '7 hari'], ['month', 'Bulan ini'], ['all', 'Semua']];
    Q('#ksHF').innerHTML = F.map(([k, l]) => `<button type="button" data-kshf="${k}" class="${HF == k ? 'on' : ''}">${l}</button>`).join('');
    const q = HQ.toLowerCase(), ls = orders().filter(o => (HF == 'all' || (HF == 'today' ? o.date == td : HF == 'week' ? o.date >= wk : o.date.startsWith(mo))) && (!q || (o.inv + ' ' + o.buyer + ' ' + o.items.map(i => i.app).join(' ')).toLowerCase().includes(q)));
    const sum = k => ls.filter(o => o.pay == k).reduce((t, o) => t + o.total, 0), all = ls.reduce((t, o) => t + o.total, 0);
    Q('#ksHStats').innerHTML = `<div class="st"><b>${ls.length}</b><span>Transaksi</span></div><div class="st"><b>${rp(all)}</b><span>Total omzet</span></div><div class="st"><b>${rp(sum('cash'))}</b><span>Tunai</span></div><div class="st"><b>${rp(sum('qris') + sum('tf'))}</b><span>QRIS + Transfer</span></div>`;
    Q('#ksHList').innerHTML = ls.length ? ls.map(o => `<div class="tk-rec ks-hr"><div class="ks-hrh"><b>${E(o.inv)}</b><span class="badge ok">${E((PAYS[o.pay] || o.pay))}</span></div>
      <div class="ks-hrm">${T().fd(o.date)}${o.time ? ' · ' + o.time : ''}${o.buyer ? ' · ' + E(o.buyer) : ''}</div><div class="ks-hri">${o.items.map(i => E(i.app) + ' (' + durTxt(i.days) + ')').join(', ')}</div>
      <div class="ks-hrf"><b>${rp(o.total)}</b><span><button class="btn" type="button" data-ksrc="${E(o.inv)}">${IC('receipt')} Nota</button> <button class="btn" type="button" data-kswa="${E(o.inv)}">${IC('message')} WA</button></span></div></div>`).join('')
      : '<div class="empty">Belum ada transaksi di periode ini.</div>';
    if (window.Gate) Gate.histNote(HIDDEN);
  }
  function csv() {
    const rows = [['No Nota', 'Tanggal', 'Jam', 'Pembeli', 'WA', 'Produk', 'Durasi (hari)', 'Berakhir', 'Harga', 'Diskon', 'Metode']];
    T().R.filter(r => r.inv).sort((a, b) => a.inv.localeCompare(b.inv)).forEach(r => rows.push([r.inv, r.orderDate, r.time || '', r.buyer, r.wa, r.app, r.days, r.end, r.price, r.dsc || 0, r.pay || '']));
    const t = '\ufeff' + rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
    T().saveBlob(new Blob([t], {type: 'text/csv;charset=utf-8'}), `riwayat-kasir-${T().today()}.csv`);
  }

  /* ---------- profil toko ---------- */
  let SHOPDIRTY = false, IV = ivOf(null), PVM = 'inv';
  function syncIV() {
    document.querySelectorAll('[data-iv]').forEach(b => { const [k, v] = b.dataset.iv.split(':'); b.classList.toggle('on', IV[k] == v); });
    document.querySelectorAll('[data-ivprev]').forEach(b => b.classList.toggle('on', b.dataset.ivprev == PVM));
    const a = Q('#ivAccent'); if (a) a.value = IV.accent || themeOf(IV).ac;
  }
  function renderShop(force) {
    if (!Q('#ksShop') || (SHOPDIRTY && !force)) return; const w = T().WT || {}; IV = ivOf(w.iv); syncIV();
    Q('#ksShop').value = w.shop || ''; Q('#ksPhone').value = w.phone || ''; Q('#ksAddr').value = w.addr || ''; Q('#ksFoot').value = w.foot != null ? w.foot : T().tplOf('foot');
    syncLogo().then(() => { const lg = Q('#ksLg'); lg.innerHTML = LOGO_SRC ? `<img src="${LOGO_SRC}" alt="Logo">` : '🧾'; shopPv(); });
  }
  async function shopPv() { await Promise.all([syncLogo(), fonts()]); const cv = Q('#ksPv'); if (!cv || TAB != 'shop') return;
    const nm = Q('#ksShop').value.trim() || T().shopName(), un = PVM == 'inv';
    paintReceipt(cv, {unpaid: un, inv: 'INV261121-001', date: T().today(), time: '14:30', buyer: 'Budi', pay: un ? 'qris' : 'cash', cash: un ? 0 : 50000, disc: 5000, total: 30000, merch: nm.toUpperCase(), qr: un ? '00020101021226contoh-tampilan-invoice-' + nm : '',
      items: [{app: 'Netflix Premium', days: 30, start: T().today(), end: T().addD(T().today(), 30), price: 35000, email: 'akun@mail.com'}]},
      profile({name: nm, phone: Q('#ksPhone').value.trim(), addr: Q('#ksAddr').value.trim(), foot: Q('#ksFoot').value.trim() || T().tplOf('foot'), iv: IV})); }
  function saveShop() {
    const w = T().WT, rec = {...(w || {}), t: 'w', id: (w && w.id) || 'wa_tpl', shop: Q('#ksShop').value.trim().slice(0, 40), phone: Q('#ksPhone').value.trim().slice(0, 20), addr: Q('#ksAddr').value.trim().slice(0, 120), foot: Q('#ksFoot').value.trim().slice(0, 140), iv: ivOf(IV)};
    SHOPDIRTY = false; T().persist(rec).then(ok => ok && toast('Profil toko tersimpan ✓'));
  }
  function logoFromFile(f) {
    const im = new Image(), u = URL.createObjectURL(f);
    im.onload = () => { URL.revokeObjectURL(u); const s = Math.min(im.width, im.height), sx = (im.width - s) / 2, sy = (im.height - s) / 2; let out = '';
      for (const px of [128, 112, 96, 80, 64]) { const c = document.createElement('canvas'); c.width = c.height = px; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, px, px); x.drawImage(im, sx, sy, s, s, 0, 0, px, px);
        for (const q of [.85, .7, .55]) { const d = c.toDataURL('image/jpeg', q); if (d.length < 7000) { out = d; break; } } if (out) break; }
      if (!out) return toast('Logo terlalu rumit, coba gambar yang lebih sederhana');
      T().persist({t: 'l', id: 'shop_logo', img: out}).then(ok => ok && toast('Logo tersimpan ✓'));
    };
    im.onerror = () => toast('File itu bukan gambar yang valid'); im.src = u;
  }

  /* ---------- tab & render ---------- */
  function setTab(k) {
    TAB = k; ['pos', 'his', 'shop'].forEach(x => Q('#ks-' + x).hidden = x != k);
    document.querySelectorAll('#ksTabs button').forEach(b => b.classList.toggle('on', b.dataset.kstab == k)); render(true);
  }
  function render(force) {
    if (!Q('#ks-pos')) return; renderProds();
    if (TAB == 'pos') { if (force) renderCart(); if (!(document.activeElement && document.activeElement.id == 'ksCash')) renderPay(); } if (TAB == 'his') renderHis(); if (TAB == 'shop') renderShop(force);
  }

  /* ---------- event ---------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b || !Q('#v-kasir')) return; const d = b.dataset, TKR = () => T().R;
    if (d.kstab) return setTab(d.kstab);
    if (d.ksprod) { const p = T().P.find(x => x.id == d.ksprod); if (!p) return; const ts = p.tiers || [];
      if (ts.length > 1) { TIERP = p; const el = Q('#ksTiers'); el.hidden = false; el.innerHTML = `<small>${E(p.name)}, pilih paket:</small>` + ts.map((t, i) => `<button type="button" data-kstier="${i}">${durTxt(t.d)} · ${rp(t.price)}</button>`).join(''); return; }
      Q('#ksTiers').hidden = true; if (ts.length == 1) return addItem({pid: p.id, app: p.name, days: ts[0].d, price: ts[0].price, cost: p.cost});
      addItem({pid: p.id, app: p.name, days: 30, price: 0, cost: p.cost}); return toast('Isi harganya di pesanan'); }
    if (d.kstier != null && TIERP) { const t = TIERP.tiers[+d.kstier]; Q('#ksTiers').hidden = true; return addItem({pid: TIERP.id, app: TIERP.name, days: t.d, price: t.price, cost: TIERP.cost}); }
    if (d.ksadd != null) { const app = Q('#ksName').value.trim(); if (!app) return toast('Isi nama aplikasi dulu');
      const p = T().P.find(x => x.name.toLowerCase() == app.toLowerCase()); addItem({pid: p && p.id, app, days: +Q('#ksDays').value || 30, price: +Q('#ksPrice').value || 0, cost: p ? p.cost : 0}); Q('#ksName').value = Q('#ksPrice').value = ''; return; }
    if (d.ksdel) { CART = CART.filter(i => i.k != d.ksdel); renderCart(); return renderPay(); }
    if (d.ksclear != null) { if (CART.length && !confirm('Kosongkan semua pesanan?')) return; PINV = null; CART = []; DISC = 0; CASH = 0; Q('#ksDisc').value = ''; renderCart(); return renderPay(); }
    if (d.kspay) { PAY = d.kspay; document.querySelectorAll('#ksMethod button').forEach(x => x.classList.toggle('on', x.dataset.kspay == PAY)); return renderPay(); }
    if (d.kscash != null) { CASH = +d.kscash; return renderPay(); }
    if (d.ksqrset != null) return T().setView('qris');
    if (d.ksdone != null) return finish();
    if (d.ksinv != null) return openInvoice();
    if (d.ksinvpaid != null) { Q('#ks-rc').hidden = true; return finish(); }
    if (d.ksclose != null) { Q('#ks-rc').hidden = true; return; }
    if (d.ksrcshare != null) return rcShare();
    if (d.ksrccopy != null) { try { await navigator.clipboard.write([new ClipboardItem({'image/png': rcBlob()})]); toast('Nota disalin 📋'); } catch (er) { toast('Browser tidak mengizinkan salin, pakai Unduh'); } return; }
    if (d.ksrcdl != null) return T().saveBlob(await rcBlob(), `${RC.unpaid ? 'Invoice' : 'Nota'}-${RC.inv}.png`);
    if (d.kshf) { HF = d.kshf; return renderHis(); }
    if (d.ksrc) { const rs = TKR().filter(r => r.inv == d.ksrc); return rs.length && openReceipt(orderOf(d.ksrc, rs)); }
    if (d.kswa) { const rs = TKR().filter(r => r.inv == d.kswa); return rs.length && openReceipt(orderOf(d.kswa, rs)); }
    if (d.kscsv != null) return csv();
    if (d.iv) { const [k, v] = d.iv.split(':'); IV[k] = v; SHOPDIRTY = true; syncIV(); return shopPv(); }
    if (d.ivacc0 != null) { IV.accent = ''; SHOPDIRTY = true; syncIV(); return shopPv(); }
    if (d.ivreset != null) { IV = ivOf(null); SHOPDIRTY = true; syncIV(); return shopPv(); }
    if (d.ivprev) { PVM = d.ivprev; syncIV(); return shopPv(); }
    if (d.ksshopsave != null) return saveShop();
    if (d.kslogodel != null) { if (T().LG && confirm('Hapus logo toko?')) T().remove(T().LG.id); return; }
  });
  document.addEventListener('input', e => {
    const t = e.target, id = t.id; if (!Q('#v-kasir')) return;
    if (t.dataset.kf) { const it = CART.find(i => i.k == t.closest('[data-k]').dataset.k); if (!it) return; const f = t.dataset.kf;
      it[f] = f == 'price' || f == 'days' ? n0(t.value) : t.value; const en = t.closest('.ks-it').querySelector('[data-ksend]');
      if (it.start && it.days > 0) en.textContent = `Berakhir ${T().fd(T().addD(it.start, it.days))} · ${durTxt(it.days)}`; return f == 'price' ? renderPay() : schedulePv(); }
    if (id == 'ksDisc') { DISC = n0(t.value); return renderPay(); }
    if (id == 'ksBuyer') { BUYER = t.value; schedulePv(); } if (id == 'ksWa') WA = t.value;
    if (id == 'ksCash') { CASH = n0(t.value); return cashLive(); }
    if (id == 'ksHQ') { HQ = t.value; return renderHis(); }
    if (id == 'ivAccent') { IV.accent = t.value; SHOPDIRTY = true; return shopPv(); }
    if (/^ks(Shop|Phone|Addr|Foot)$/.test(id)) { SHOPDIRTY = true; shopPv(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id == 'ksLogoF') { const f = e.target.files[0]; e.target.value = ''; if (f) logoFromFile(f); }
    if (e.target.id == 'ksRcAcc') paintRc();
  });

  function init() { if (!Q('#v-kasir')) return; skeleton(); renderCart(); renderPay(); }
  window.Kasir = {render};
  init();
})();
