/* Batas & kunci akun gratis (Gate). Dimuat setelah toko.js, kasir.js, akun.js.
   Angka batas diatur di config.js → FREE. Batas transaksi/produk/pengeluaran juga dijaga di server (Code.gs → FREE_LIM). */
(() => {
  'use strict';
  const D = {TX_MONTH: 30, PRODUCTS: 10, EXPENSES_MONTH: 10, HISTORY_DAYS: 30, REMIND: [1], TIERS: 1, MARK: 'Dibuat dengan ReyVion Kasir'};
  const F = Object.assign({}, D, (window.WM_CONFIG || {}).FREE || {});
  const Q = s => document.querySelector(s), QA = s => document.querySelectorAll(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const T = () => window.TK;
  const free = () => !!Auth.user() && !Auth.isPremium();

  /* ---------- jendela ajakan upgrade ---------- */
  function limit(msg, code) {
    Auth.upsell('');
    const t = Q('#upT'); if (!t) return;
    t.innerHTML = code == 'premium' ? esc(msg) + ' Chat admin di WhatsApp untuk upgrade.' : '<b>Batas akun gratis tercapai.</b> ' + esc(msg) + ' Upgrade premium untuk tanpa batas.';
  }

  /* ---------- pemakaian bulan ini ---------- */
  const ym = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  function usage() {
    const m = T().today().slice(0, 7), s = new Set();
    T().R.forEach(r => { if (ym(r.created || Date.now()) == m) s.add(r.inv || r.id); });
    return {tx: s.size, prod: T().P.length, ex: T().X.filter(x => String(x.date || '').slice(0, 7) == m).length};
  }
  function canSell() {
    if (!free()) return true;
    if (usage().tx >= F.TX_MONTH) { limit(`Maksimal ${F.TX_MONTH} transaksi per bulan.`); return false; }
    return true;
  }
  function histNote(n) {
    const el = Q('#ksHList'); if (!el || !free() || !n) return;
    el.insertAdjacentHTML('beforeend', lockCard(`${n} transaksi lebih lama disembunyikan`, `Akun gratis menampilkan riwayat ${F.HISTORY_DAYS} hari terakhir. Datamu tetap aman dan terbuka lagi saat premium.`, 'Buka semua'));
  }
  const lockCard = (t, s, b) => `<div class="gt-lock"><b>🔒 ${esc(t)}</b><small>${esc(s || 'Khusus akun premium')}</small><button class="btn pri" data-plans type="button">👑 ${esc(b || 'Buka')}</button></div>`;

  /* ---------- fitur yang dikunci untuk akun gratis ---------- */
  const RULES = [
    {s: '[data-v="klaim"]', n: 'Klaim & Garansi'}, {s: '[data-claim]', n: 'Klaim & Garansi', nm: 1},
    {s: '[data-v="alat"]', n: 'Pelanggan teratas & Backup'},
    {s: '[data-v="qris"]', n: 'QRIS Dinamis'}, {s: '[data-ksqrset]', n: 'QRIS Dinamis', nm: 1}, {s: '[data-kspay="qris"]', n: 'Pembayaran QRIS dinamis'}, {s: '[data-qrec]', n: 'QR sesuai harga'},
    {s: '[data-ksinv]', n: 'Invoice & QR tagihan'},
    {s: '[data-v="pesan"]', n: 'Template WA & teks nota sendiri'},
    {s: '[data-ps="acc"]', n: 'Akun Simpanan'},
    {s: '#csv', n: 'Unduh CSV rekap'}, {s: '#lapcsv', n: 'Unduh CSV laporan'}, {s: '#lapcopy', n: 'Salin ringkasan laporan'}, {s: '[data-kscsv]', n: 'Unduh CSV riwayat'},
    {s: '[data-iv],[data-ivacc0],[data-ivreset],#ivAccent', n: 'Tampilan invoice sendiri', nm: 1},
    {s: '[data-rm]', n: 'Pengingat H-3 / H-7', t: el => !F.REMIND.includes(+el.dataset.rm)},
    {s: '[data-tradd]', n: 'Paket harga bertingkat', t: () => QA('#pTiers .tk-trow').length >= F.TIERS}
  ];
  function hit(e) {
    for (const r of RULES) { const el = e.target.closest(r.s); if (el && (!r.t || r.t(el))) return r; }
    const lb = e.target.closest('label'); if (lb && lb.querySelector('#ksLogoF')) return {n: 'Logo toko di nota'};
    if (e.target.id == 'ksFoot') return {n: 'Teks bawah nota sendiri'};
    return null;
  }
  document.addEventListener('click', e => {
    if (!free() || e.target.closest('[data-plans]')) return;
    const r = hit(e); if (!r) return;
    e.preventDefault(); e.stopImmediatePropagation(); Auth.upsell(r.n);
  }, true);

  /* ---------- laporan: ringkas untuk gratis ---------- */
  function lockLap() {
    if (!free()) return;
    const sum = Q('#lapSum');
    if (sum && !sum.querySelector('.gt-lock') && sum.children.length > 5) { [5, 3, 2, 1].forEach(i => sum.children[i].remove()); sum.insertAdjacentHTML('beforeend', lockCard('Laba bersih, modal & pengeluaran')); }
    [['#lapTop', 'Produk terlaris'], ['#lapTr', 'Grafik tren 6 bulan']].forEach(([s, t]) => { const el = Q(s); if (el && !el.querySelector('.gt-lock')) el.innerHTML = lockCard(t); });
  }
  ['lapSum', 'lapTop', 'lapTr'].forEach(id => { const el = document.getElementById(id); if (el) new MutationObserver(lockLap).observe(el, {childList: true}); });

  /* ---------- bilah pemakaian + tanda 🔒 ---------- */
  const meter = (l, v, m) => { const p = Math.min(100, Math.round(v / m * 100)); return `<div class="gt-m ${p >= 100 ? 'full' : p >= 80 ? 'warn' : ''}"><span>${l} <b>${v}/${m}</b></span><i style="--p:${p}%"></i></div>`; };
  function paint() {
    const on = free(); let bar = Q('#gtBar'); const host = Q('#v-kasir');
    QA('[data-gt]').forEach(el => el.removeAttribute('data-gt'));
    if (!on || !host || !T()) { if (bar) bar.hidden = true; return; }
    lockLap();
    RULES.forEach(r => { if (r.nm) return; QA(r.s).forEach(el => { if (!r.t || r.t(el)) el.setAttribute('data-gt', '1'); }); });
    const ff = Q('#ksFoot'); if (ff) { ff.readOnly = true; ff.title = 'Teks bawah nota sendiri: khusus premium'; }
    const pq = Q('#ksMethod [data-kspay="qris"]'); if (pq && pq.classList.contains('on')) { const c = Q('#ksMethod [data-kspay="cash"]'); if (c) c.dispatchEvent(new MouseEvent('click', {bubbles: true})); }
    if (!bar) { bar = document.createElement('div'); bar.id = 'gtBar'; bar.className = 'gt-bar'; host.parentNode.insertBefore(bar, host); }
    const show = ['#v-kasir', '#v-rekap', '#v-prod', '#v-lap'].some(s => Q(s) && !Q(s).hidden); bar.hidden = !show; if (!show) return;
    const u = usage(), h = meter('Transaksi bulan ini', u.tx, F.TX_MONTH) + meter('Produk', u.prod, F.PRODUCTS) + meter('Pengeluaran bulan ini', u.ex, F.EXPENSES_MONTH);
    const html = `<div class="gt-h"><b>🆓 Akun Gratis</b><button class="btn pri" data-plans type="button">👑 Upgrade</button></div><div class="gt-ms">${h}</div>`;
    if (bar.dataset.h != html) { bar.dataset.h = html; bar.innerHTML = html; }
  }
  setInterval(paint, 700); document.addEventListener('click', () => setTimeout(paint, 60)); paint();

  window.Gate = {F, free, mark: () => free() ? F.MARK : '', usage, canSell, limit, histNote};
})();
