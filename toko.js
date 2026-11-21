'use strict';
/* Kasir & Rekap Toko: rekap jualan, produk & stok, pengeluaran, laporan, refund.
   Semua data per akun (Google Sheets via Apps Script, sheet "Records"). Jenis catatan: tanpa t = penjualan, t:'p' = produk, t:'x' = pengeluaran. */
(() => {
  const Q = s => document.querySelector(s), A = window.WM_API, C = window.WM_CONFIG, S = C.STORE || {}, E = Auth.esc, DAY = 864e5;
  const RMS = S.REMIND_DAYS || [1, 3, 7], DURS = S.DURATIONS || [7, 14, 30, 60, 90, 180, 365], XCAT = ['Iklan', 'Operasional', 'Fee / Admin', 'Lainnya'];
  const DL = {30: '1 bulan', 60: '2 bulan', 90: '3 bulan', 180: '6 bulan', 365: '1 tahun'};
  let LG = null, ALL = [], R = [], P = [], X = [], QCFG = null, CL = [], WT = null; // semua catatan | penjualan | produk | pengeluaran | konfigurasi QRIS | klaim | template pesan
  let CF = 'all', CQS = '', CE = null, NT = null, WPDIRTY = false, WPLAST = null; const OPEN = new Set(); // klaim: filter, cari, edit | nota aktif | form pesan | kartu yang dibuka
  let FLT = 'all', QS = '', EDIT = null, EPID = '', EDAYS = 30, ERM = [], RN = null, RDAYS = 30, RRM = [], PE = null, XE = null;
  let RFREC = null, RFRES = null, RFMAN = false, lockedNow = null, VIEW = 'kasir', SRT = 'due';

  let tt; window.toast = m => { const t = Q('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); };

  /* ---------- tanggal & uang ---------- */
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const today = () => ymd(new Date(Auth.now()));
  const addD = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const diff = (a, b) => Math.round((parse(b) - parse(a)) / DAY);
  const fd = s => s ? parse(s).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-';
  const fm = m => parse(m + '-01').toLocaleDateString('id-ID', {month: 'long', year: 'numeric'});
  const rp = n => (n < 0 ? '−' : '') + 'Rp' + Math.abs(Math.round(+n || 0)).toLocaleString('id-ID');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const v = id => (Q('#' + id) || {value: ''}).value;
  const num = id => +v(id) || 0;
  const dlab = d => DL[d] || d + ' hari';
  const key = s => String(s || '').trim().toLowerCase();
  const ckey = () => 'wm_rec_' + ((Auth.user() || {}).username || '');
  const modalOpen = () => ['#em', '#rn', '#pm', '#xm', '#cm', '#nt'].some(s => !Q(s).hidden);

  /* ---------- status penjualan ---------- */
  const left = r => diff(today(), r.end);
  const state = r => r.ref ? 'ref' : left(r) < 0 ? 'ex' : left(r) <= 7 ? 'soon' : 'ok';
  const leftTxt = dl => dl < 0 ? `Lewat ${-dl} hari` : dl == 0 ? 'Berakhir hari ini' : `Sisa ${dl} hari`;
  const bucket = (dl, sel) => { if (dl < 0) return -1; for (const x of [...sel].sort((a, b) => a - b)) if (dl <= x) return x; return null; };
  const due = r => { if (r.ref || !r.rm || !r.rm.length) return false; const b = bucket(left(r), r.rm); return b !== null && b !== (r.rmDone == null ? null : r.rmDone); };
  const rmTxt = r => r.rm && r.rm.length ? '🔔 Ingatkan ' + [...r.rm].sort((a, b) => b - a).map(x => 'H-' + x).join(', ') : '🔕 Tanpa pengingat';
  const low = p => (+p.stock || 0) <= (p.min == null ? 3 : +p.min);

  /* ---------- simpan / muat ---------- */
  const split = () => { R = ALL.filter(x => !x.t); P = ALL.filter(x => x.t == 'p'); X = ALL.filter(x => x.t == 'x'); QCFG = ALL.find(x => x.t == 'q') || null; CL = ALL.filter(x => x.t == 'c'); WT = ALL.find(x => x.t == 'w') || null; LG = ALL.find(x => x.t == 'l') || null; };
  const cache = () => { try { localStorage.setItem(ckey(), JSON.stringify(ALL)); } catch (e) {} };
  const upsert = rec => { const i = ALL.findIndex(x => x.id == rec.id); i < 0 ? ALL.push(rec) : ALL[i] = rec; };
  function showErr(m) { const e = Q('#tkErr'); e.textContent = m || ''; e.hidden = !m; }
  async function load() {
    try { ALL = JSON.parse(localStorage.getItem(ckey()) || '[]'); } catch (e) { ALL = []; }
    split(); render();
    const r = await Auth.call('rec_list');
    if (!r.ok) { if (r.code != 'session') showErr(r.error); return; }
    showErr(''); ALL = r.records || []; cache(); split(); render();
  }
  async function persist(rec) {
    upsert(rec); cache(); split(); render();
    const r = await Auth.call('rec_save', {id: rec.id, data: JSON.stringify(rec)});
    if (!r.ok) { toast(r.error); showErr(r.error); load(); } else showErr('');
    return r.ok;
  }
  async function remove(id) {
    ALL = ALL.filter(x => x.id != id); cache(); split(); render();
    const r = await Auth.call('rec_delete', {id}); if (!r.ok) { toast(r.error); load(); }
  }

  /* ---------- laporan ---------- */
  function report(mo, RR = R, XX = X) {
    let omz = 0, hpp = 0, ref = 0, n = 0, ren = 0; const top = {}, tx = [];
    RR.forEach(r => {
      (r.hist || []).forEach((h, i) => {
        if (String(h.d).slice(0, 7) != mo) return;
        const pr = +h.price || 0, c = h.cost != null ? +h.cost : (+r.cost || 0), k = key(r.app);
        omz += pr; hpp += c; n++; if (i > 0) ren++;
        const t = top[k] = top[k] || {name: r.app, n: 0, omz: 0, laba: 0}; t.n++; t.omz += pr; t.laba += pr - c;
        tx.push({d: h.d, j: i > 0 ? 'Perpanjang' : 'Baru', app: r.app, buyer: r.buyer, amt: pr, cost: c});
      });
      if (r.ref && String(r.ref.date).slice(0, 7) == mo) { ref += +r.ref.amount || 0; tx.push({d: r.ref.date, j: 'Refund', app: r.app, buyer: r.buyer, amt: -(+r.ref.amount || 0), cost: 0}); }
    });
    const ex = XX.filter(x => String(x.date).slice(0, 7) == mo).sort((a, b) => String(b.date).localeCompare(String(a.date))), exp = ex.reduce((s, x) => s + (+x.amount || 0), 0);
    return {omz, hpp, ref, n, ren, exp, ex, laba: omz - ref - hpp - exp, top: Object.values(top).sort((a, b) => b.omz - a.omz), tx: tx.sort((a, b) => String(b.d).localeCompare(String(a.d)))};
  }

  /* ---------- statistik & banner ---------- */
  function statsHtml(RR, PP, XX, mo, lbl) {
    lbl = lbl || 'bulan ini'; const rep = report(mo || today().slice(0, 7), RR, XX), cnt = f => RR.filter(f).length, pot = RR.filter(r => !r.ref && left(r) >= 0 && left(r) <= 7).reduce((t, r) => t + (+r.price || 0), 0);
    return [[cnt(r => ['ok', 'soon'].includes(state(r))), 'Akun aktif', ''], [cnt(r => state(r) == 'soon'), 'Habis ≤ 7 hari', ''], [cnt(due), 'Perlu diingatkan', ''],
      [PP.filter(low).length, 'Stok menipis', ''], [rp(pot), 'Potensi perpanjang ≤ 7 hari', ''], [rp(rep.omz - rep.ref), 'Omzet ' + lbl, ''], [rp(rep.laba), 'Laba ' + lbl, 'hl' + (rep.laba < 0 ? ' neg' : '')]]
      .map(([x, l, c]) => `<div class="st ${c.split(' ')[0]}"><b class="${c.includes('neg') ? 'neg' : ''}">${x}</b><span>${l}</span></div>`).join('');
  }
  function stats() { const el = Q('#stats'); el.hidden = VIEW != 'rekap'; el.innerHTML = statsHtml(R, P, X); }
  function remind() {
    const ls = R.filter(due).sort((a, b) => left(a) - left(b)), el = Q('#remind');
    document.title = (ls.length ? `(${ls.length}) ` : '') + 'Kasir & Rekap Toko · ReyVion';
    el.hidden = !ls.length || VIEW != 'rekap'; if (!ls.length) return;
    el.innerHTML = remindHtml(ls);
  }
  function remindHtml(ls) {
    return `<b>🔔 ${ls.length} akun perlu diingatkan</b>` + ls.slice(0, 6).map(r =>
      `<div class="tk-rmr"><span><strong>${E(r.app)}</strong>${r.buyer ? ' · ' + E(r.buyer) : ''}<small>${leftTxt(left(r))} · ${fd(r.end)}</small></span><button class="btn" data-wa="${r.id}" type="button">WA</button><button class="btn" data-ack="${r.id}" type="button">Sudah</button></div>`).join('')
      + (ls.length > 6 ? `<small>+${ls.length - 6} lainnya, lihat di filter "Perlu diingatkan"</small>` : '');
  }
  function lowstk() {
    const ls = P.filter(low).sort((a, b) => a.stock - b.stock), el = Q('#lowstk'); el.hidden = !ls.length || !['rekap', 'prod'].includes(VIEW); if (el.hidden) return;
    el.innerHTML = `<b>📦 Stok menipis</b><small>${ls.map(p => `${E(p.name)} (${+p.stock <= 0 ? 'habis' : p.stock})`).join(' · ')}</small>` + (VIEW != 'prod' ? '<button class="btn" data-v="prod" type="button">Lihat produk</button>' : '');
  }

  /* ---------- daftar penjualan ---------- */
  const FILTERS = [['all', 'Semua'], ['ok', 'Aktif'], ['soon', 'Segera habis'], ['ex', 'Lewat'], ['due', 'Perlu diingatkan'], ['ref', 'Refund']];
  const match = (r, f = FLT) => f == 'all' || (f == 'due' ? due(r) : state(r) == f);
  const order = r => (r.ref ? 1e6 : 0) + left(r);
  function card(r) {
    const dl = left(r), s = state(r), tot = Math.max(1, +r.days || 1), pct = r.ref ? 100 : Math.min(100, Math.max(0, (tot - dl) / tot * 100));
    const bd = s == 'ref' ? ['rf', 'Refund'] : [s, leftTxt(dl)], open = OPEN.has(r.id);
    const acts = r.ref ? `<button class="btn" data-claim="${r.id}" type="button">🛡️ Klaim</button><button class="btn" data-edit="${r.id}" type="button">Edit</button>`
      : `<button class="btn pri" data-renew="${r.id}" type="button">🔁 Perpanjang</button><button class="btn" data-wa="${r.id}" type="button">WA</button><button class="btn" data-nota="${r.id}" type="button" title="Buat nota PNG">🧾 Nota</button><button class="btn tk-mb" data-more="${r.id}" type="button" aria-label="Aksi lainnya" aria-expanded="${open}">⋯</button>`;
    const sec = r.ref ? '' : `<div class="tk-act tk-sec"><button class="btn" data-qrec="${r.id}" type="button" title="Buat QRIS sesuai harga">📲 QR</button><button class="btn" data-claim="${r.id}" type="button">🛡️ Klaim</button><button class="btn" data-rf="${r.id}" type="button">💸 Refund</button><button class="btn" data-dup="${r.id}" type="button" title="Jual lagi ke pembeli lain">⧉ Duplikat</button><button class="btn" data-edit="${r.id}" type="button">✎ Edit</button></div>`;
    const laba = (+r.price || 0) - (+r.cost || 0), cb = claimBadge(claimsOf(r.buyer));
    return `<article class="tk-rec ${s}${open ? ' mo' : ''}"><div class="tk-h"><strong>${E(r.app)}</strong><span class="badge ${bd[0]}">${E(bd[1])}</span></div>
      ${r.email ? `<small>📧 ${E(r.email)}</small>` : ''}${r.buyer || r.wa ? `<small>👤 ${E(r.buyer || '')}${r.wa ? ' · ' + E(r.wa) : ''}${cb}</small>` : ''}
      <div class="tk-grid"><span>Tgl order<b>${fd(r.orderDate)}</b></span><span>Durasi<b>${dlab(r.days)}</b></span><span>${r.ref ? 'Refund' : 'Perpanjangan'}<b>${r.ref ? rp(r.ref.amount) + ' · ' + fd(r.ref.date) : fd(r.end)}</b></span><span>Harga${r.cost ? ' · laba' : ''}<b>${rp(r.price)}${r.cost ? ` · <i class="${laba < 0 ? 'neg' : 'plus'}" style="font-style:normal">${rp(laba)}</i>` : ''}</b></span></div>
      <div class="tk-pg"><i style="width:${pct}%"></i></div>
      <small>${r.ref ? 'Sudah di-refund' : rmTxt(r)}${r.renewals ? ` · ${r.renewals}× diperpanjang` : ''}${r.note ? ' · ' + E(r.note) : ''}</small>
      <div class="tk-act">${acts}</div>${sec}</article>`;
  }
  const SORTS = {
    due: (a, b) => order(a) - order(b),
    new: (a, b) => (b.created || 0) - (a.created || 0),
    name: (a, b) => key(a.app).localeCompare(key(b.app)) || key(a.buyer).localeCompare(key(b.buyer)),
    price: (a, b) => (+b.price || 0) - (+a.price || 0)
  };
  function rekapParts(RR, f, qs, srt) {
    const chips = FILTERS.map(([k, l]) => `<button type="button" data-f="${k}" class="${f == k ? 'on' : ''}">${l}<em>${RR.filter(r => match(r, k)).length}</em></button>`).join('');
    const ls = RR.filter(r => match(r, f) && [r.app, r.email, r.buyer, r.note, r.wa].join(' ').toLowerCase().includes(qs)).sort(SORTS[srt] || SORTS.due);
    return {chips, ls};
  }
  function renderRekap() {
    const x = rekapParts(R, FLT, QS, SRT); Q('#flt').innerHTML = x.chips;
    Q('#list').innerHTML = x.ls.map(card).join('') || `<div class="empty">${R.length ? 'Tidak ada catatan yang cocok.' : 'Belum ada catatan. Klik “+ Catat” untuk mulai merekap jualanmu.'}</div>`;
  }

  /* ---------- produk & stok ---------- */
  const sold = (p, RR = R) => { let n = 0, omz = 0; RR.filter(r => r.pid == p.id || (!r.pid && key(r.app) == key(p.name))).forEach(r => (r.hist || []).forEach(h => { n++; omz += +h.price || 0; })); return {n, omz}; };
  function pcard(p, RR) {
    const st = +p.stock <= 0 ? 'ex' : low(p) ? 'soon' : 'ok', sd = sold(p, RR);
    return `<article class="tk-rec ${st}"><div class="tk-h"><strong>${E(p.name)}</strong><span class="badge ${st}">${+p.stock <= 0 ? 'Stok habis' : 'Stok ' + p.stock}</span></div>
      ${p.cat ? `<small>🏷️ ${E(p.cat)}</small>` : ''}
      <div class="tk-tiers">${(p.tiers || []).map(t => `<span class="tk-tier">${dlab(t.d)}<b>${rp(t.price)}</b>${p.cost ? `<em>laba ${rp(t.price - p.cost)}</em>` : ''}</span>`).join('') || '<small>Belum ada paket harga</small>'}</div>
      <div class="tk-grid"><span>Modal / akun<b>${rp(p.cost)}</b></span><span>Terjual<b>${sd.n}× · ${rp(sd.omz)}</b></span></div>
      ${p.note ? `<small>${E(p.note)}</small>` : ''}
      <div class="tk-act"><button class="btn pri" data-stk="${p.id}" data-q="1" type="button">+ Stok</button><button class="btn" data-stk="${p.id}" data-q="-1" type="button">− Stok</button><button class="btn" data-pedit="${p.id}" type="button">Edit</button></div></article>`;
  }
  function renderProd() {
    Q('#plist').innerHTML = [...P].sort((a, b) => key(a.name).localeCompare(key(b.name))).map(p => pcard(p, R)).join('') || '<div class="empty">Belum ada produk. Klik “+ Produk” untuk mengisi katalog, stok, dan daftar harga.</div>';
    Q('#appl').innerHTML = [...new Set(R.map(r => r.app).concat(P.map(p => p.name)))].map(a => `<option value="${E(a)}">`).join('');
    Q('#catl').innerHTML = [...new Set(P.map(p => p.cat).filter(Boolean))].map(a => `<option value="${E(a)}">`).join('');
  }
  const trow = (t = {}) => `<div class="tk-trow"><input type="number" class="td" min="1" max="3650" inputmode="numeric" placeholder="durasi (hari)" value="${t.d || ''}"><input type="number" class="tp" min="0" inputmode="numeric" placeholder="harga (Rp)" value="${t.price ?? ''}"><button class="btn" type="button" data-trdel aria-label="Hapus paket">✕</button></div>`;
  function peditor(p) {
    PE = p || null; const d = p || {name: '', cat: '', cost: '', stock: 0, min: 3, tiers: [{d: 30, price: ''}], note: ''};
    Q('#pm .ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">✕</button><h3>${p ? 'Edit produk' : 'Tambah produk'}</h3>
    <label class="f"><span>Nama produk</span><input type="text" id="pName" maxlength="60" placeholder="mis. Netflix Premium" value="${E(d.name)}"></label>
    <div class="row2"><label class="f"><span>Kategori (opsional)</span><input type="text" id="pCat" list="catl" maxlength="30" placeholder="mis. Streaming" value="${E(d.cat || '')}"></label>
    <label class="f"><span>Modal per akun (Rp)</span><input type="number" id="pCost" min="0" inputmode="numeric" value="${d.cost || ''}"></label></div>
    <div class="row2"><label class="f"><span>Stok (akun / slot tersedia)</span><input type="number" id="pStock" min="0" inputmode="numeric" value="${d.stock ?? 0}"></label>
    <label class="f"><span>Ingatkan jika stok ≤</span><input type="number" id="pMin" min="0" inputmode="numeric" value="${d.min ?? 3}"></label></div>
    <div class="sec2"><h4>Paket harga</h4><div id="pTiers" class="sec2">${(d.tiers && d.tiers.length ? d.tiers : [{}]).map(trow).join('')}</div>
    <button class="btn" type="button" data-tradd>+ Paket harga</button></div>
    <label class="f"><span>Catatan (opsional)</span><input type="text" id="pNote" maxlength="200" value="${E(d.note || '')}"></label>
    <button class="btn pri wide" id="psave" type="button">Simpan produk</button>
    ${p ? '<button class="btn danger wide" id="pdel" type="button">Hapus produk</button>' : ''}`;
    Q('#pm').hidden = false;
  }
  function savePrd() {
    const name = v('pName').trim(); if (!name) return toast('Nama produk wajib diisi');
    if (P.some(x => key(x.name) == key(name) && (!PE || x.id != PE.id))) return toast('Nama produk itu sudah ada');
    const tiers = [...document.querySelectorAll('#pTiers .tk-trow')].map(r => ({d: Math.floor(+r.querySelector('.td').value) || 0, price: Math.round(+r.querySelector('.tp').value) || 0})).filter(t => t.d > 0).sort((a, b) => a.d - b.d).slice(0, 8);
    const rec = {...(PE || {t: 'p', id: uid(), created: Date.now()}), name, cat: v('pCat').trim(), cost: num('pCost'), stock: Math.max(0, Math.floor(num('pStock'))), min: Math.max(0, Math.floor(num('pMin'))), tiers, note: v('pNote').trim()};
    Q('#pm').hidden = true; persist(rec).then(ok => ok && toast('Produk tersimpan ✓'));
  }
  function stockAdj(p, q) {
    const n = Math.floor(+prompt(q > 0 ? `Tambah stok ${p.name} berapa?` : `Kurangi stok ${p.name} berapa?`, '1'));
    if (!(n > 0)) return; persist({...p, stock: Math.max(0, (+p.stock || 0) + q * n)}).then(ok => ok && toast(`Stok ${p.name}: ${Math.max(0, (+p.stock || 0) + q * n)}`));
  }
  function priceList() {
    const ls = P.filter(p => p.tiers && p.tiers.length); if (!ls.length) return '';
    return ['*Daftar Harga*', ''].concat(...ls.map(p => [`*${p.name}*${+p.stock <= 0 ? ' (stok habis)' : ''}`, ...p.tiers.map(t => `• ${dlab(t.d)} — ${rp(t.price)}`), ''])).join('\n').trim();
  }

  /* ---------- WhatsApp & salin ---------- */
  /* template pesan: milik akun (record t:'w'), kalau belum diatur pakai bawaan dari config.js */
  const WT_DEF = {
    remind: S.WA_REMIND || 'Halo kak {nama}, {app} kakak {status}. Mau diperpanjang kak? 😊',
    nota: S.WA_NOTA || 'Halo kak {nama}, ini nota pembelian {app} kakak ya 🧾 Aktif sampai {tgl}. Terima kasih sudah belanja di {toko} 💖',
    claim: S.WA_CLAIM || 'Halo kak {nama}, kendala {app} kakak sudah kami tangani ya. {akun} Terima kasih sudah sabar menunggu 🙏',
    foot: S.NOTA_FOOT || 'Terima kasih sudah belanja 💖 Simpan nota ini sebagai bukti pembelian & garansi.'
  };
  const tplOf = k => { const t = WT && typeof WT[k] == 'string' ? WT[k].trim() : ''; return t || WT_DEF[k]; };
  const shopName = () => (WT && String(WT.shop || '').trim()) || (Auth.user() || {}).username || 'Toko';
  const fill = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m).replace(/kak\s+,/g, 'kak,').replace(/[ \t]{2,}/g, ' ').trim();
  function waVars(r) {
    const dl = left(r), st = dl < 0 ? `sudah berakhir ${-dl} hari lalu (${fd(r.end)})` : dl == 0 ? `berakhir hari ini (${fd(r.end)})` : `akan berakhir ${dl} hari lagi (${fd(r.end)})`;
    return {nama: r.buyer || '', app: r.app || '', status: st, tgl: fd(r.end), sisa: dl < 0 ? 'sudah lewat' : dl == 0 ? 'hari ini' : dl + ' hari', harga: rp(r.price), toko: shopName(), email: r.email || '', akun: ''};
  }
  const waMsg = r => fill(tplOf('remind'), waVars(r));
  const waNum = w => { let n = String(w || '').replace(/\D/g, ''); if (n.startsWith('0')) n = '62' + n.slice(1); return n; };
  function copy(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(() => true, () => false);
    const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} a.remove(); return Promise.resolve(ok);
  }
  async function sendWa(r) {
    const msg = waMsg(r), n = waNum(r.wa);
    if (n) return window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    toast(await copy(msg) ? 'Nomor WA belum diisi, teks pengingat disalin' : 'Nomor WA belum diisi');
  }

  /* ---------- jendela catat / edit penjualan ---------- */
  const durChips = cur => DURS.map(d => `<button type="button" data-dur="${d}" class="${cur == d ? 'on' : ''}">${dlab(d)}</button>`).join('');
  const rmChips = sel => RMS.map(d => `<button type="button" data-rm="${d}" class="${sel.includes(d) ? 'on' : ''}">H-${d}</button>`).join('');
  const tierChips = p => (p && p.tiers || []).map((t, i) => `<button type="button" data-tier="${i}">${dlab(t.d)} · ${rp(t.price)}</button>`).join('');
  function setDur(m, n) {
    if (m == 'e') EDAYS = n; else RDAYS = n;
    Q('#' + m + 'Days').value = DURS.includes(n) ? '' : n;
    document.querySelectorAll(`#${m}Dur button`).forEach(x => x.classList.toggle('on', +x.dataset.dur == n));
    return m == 'e' ? syncEnd() : rPrev();
  }
  function editor(r, pre) {
    EDIT = r || null; const d = r || pre || {app: '', email: '', buyer: '', wa: '', price: '', cost: '', orderDate: today(), days: 30, rm: [RMS.includes(3) ? 3 : RMS[0]], note: ''};
    EDAYS = +d.days || 30; ERM = [...(d.rm || [])]; EPID = d.pid || '';
    Q('#em .ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">✕</button><h3>${r ? 'Edit catatan' : 'Catat penjualan'}</h3>
    ${P.length ? `<label class="f"><span>Pilih dari produk (opsional)</span><select id="eProd"><option value="">— ketik manual —</option>${P.map(p => `<option value="${p.id}" ${EPID == p.id ? 'selected' : ''}>${E(p.name)} · stok ${+p.stock || 0}</option>`).join('')}</select></label>` : ''}
    <div class="chips" id="eTiers" ${EPID && (P.find(p => p.id == EPID) || {tiers: []}).tiers.length ? '' : 'hidden'}>${tierChips(P.find(p => p.id == EPID))}</div>
    <label class="f"><span>Nama aplikasi / produk</span><input type="text" id="eApp" list="appl" maxlength="60" placeholder="mis. Netflix Premium" value="${E(d.app)}"></label>
    <label class="f"><span>Email / akun yang dijual</span><input type="text" id="eEmail" maxlength="80" placeholder="mis. akun01@gmail.com" value="${E(d.email || '')}"></label>
    <div class="row2"><label class="f"><span>Nama pembeli</span><input type="text" id="eBuyer" maxlength="40" value="${E(d.buyer || '')}"></label>
    <label class="f"><span>WhatsApp pembeli</span><input type="tel" id="eWa" maxlength="20" placeholder="08xxxxxxxxxx" value="${E(d.wa || '')}"></label></div>
    <div class="row2"><label class="f"><span>Tgl order</span><input type="date" id="eOrd" value="${d.orderDate}"></label>
    <label class="f"><span>Tgl perpanjangan berikutnya</span><input type="date" id="eEnd" value="${r ? d.end : addD(d.orderDate, EDAYS)}"></label></div>
    <div class="sec2"><h4>Durasi</h4><div class="chips" id="eDur">${durChips(EDAYS)}</div>
    <label class="f"><span>Atau isi sendiri (hari)</span><input type="number" id="eDays" min="1" max="3650" inputmode="numeric" placeholder="mis. 45" value="${DURS.includes(EDAYS) ? '' : EDAYS}"></label></div>
    <div class="row2"><label class="f"><span>Harga jual (Rp)</span><input type="number" id="ePrice" inputmode="numeric" min="0" value="${d.price}"></label>
    <label class="f"><span>Modal (Rp)</span><input type="number" id="eCost" inputmode="numeric" min="0" value="${d.cost || ''}"></label></div>
    <label class="tk-ck" id="eStkW" ${!r && EPID ? '' : 'hidden'}><input type="checkbox" id="eStk" checked> Kurangi stok produk (−1)</label>
    <div class="sec2"><h4>Ingatkan perpanjangan</h4><div class="chips" id="eRm">${rmChips(ERM)}</div><small>Boleh pilih lebih dari satu. Kosongkan kalau tidak perlu.</small></div>
    <label class="f"><span>Catatan (profil, slot, dll.)</span><input type="text" id="eNote" maxlength="200" value="${E(d.note || '')}"></label>
    <button class="btn pri wide" id="esave" type="button">Simpan</button>
    ${r ? '<button class="btn danger wide" id="edel" type="button">Hapus catatan</button>' : ''}`;
    Q('#em').hidden = false;
  }
  function pickProd(id) {
    EPID = id || ''; const p = P.find(x => x.id == id), t = Q('#eTiers');
    t.innerHTML = tierChips(p); t.hidden = !(p && p.tiers && p.tiers.length); Q('#eStkW').hidden = !p || !!EDIT;
    if (p) { Q('#eApp').value = p.name; Q('#eCost').value = p.cost || ''; if (p.tiers && p.tiers.length === 1) useTier('e', p.tiers[0]); }
  }
  function useTier(m, t) { setDur(m, t.d); Q('#' + (m == 'e' ? 'ePrice' : 'rPrice')).value = t.price; }
  function syncEnd() { if (!EDIT || !EDIT.renewals) { const o = v('eOrd'); if (o && Q('#eEnd')) Q('#eEnd').value = addD(o, EDAYS); } }
  function saveEd() {
    const app = v('eApp').trim(), ord = v('eOrd'), price = num('ePrice'), cost = num('eCost');
    if (!app) return toast('Nama aplikasi wajib diisi');
    if (!ord) return toast('Tgl order wajib diisi');
    if (!(EDAYS > 0)) return toast('Pilih atau isi durasi dulu');
    const end = v('eEnd') || addD(ord, EDAYS), rec = EDIT ? {...EDIT} : {id: uid(), hist: [], renewals: 0, created: Date.now()};
    Object.assign(rec, {app, pid: EPID || undefined, email: v('eEmail').trim(), buyer: v('eBuyer').trim(), wa: v('eWa').trim(), orderDate: ord, days: EDAYS, end, price, cost, note: v('eNote').trim(), rm: [...ERM], rmDone: null});
    if (!EDIT) rec.hist.push({d: ord, days: EDAYS, price, cost});
    else if (!rec.renewals && rec.hist.length == 1) rec.hist[0] = {d: ord, days: EDAYS, price, cost};
    const p = !EDIT && EPID && Q('#eStk') && Q('#eStk').checked ? P.find(x => x.id == EPID) : null;
    Q('#em').hidden = true;
    persist(rec).then(ok => {
      if (!ok) return; toast('Tersimpan ✓');
      if (p) { const ns = Math.max(0, (+p.stock || 0) - 1); persist({...p, stock: ns}); if (ns <= (p.min == null ? 3 : +p.min)) setTimeout(() => toast(`Stok ${p.name} tinggal ${ns}`), 1500); }
    });
  }

  /* ---------- jendela perpanjang ---------- */
  function renewer(r) {
    RN = r; RDAYS = +r.days || 30; RRM = [...(r.rm || [])]; const dl = left(r), p = P.find(x => x.id == r.pid);
    Q('#rn .ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">✕</button><h3>Perpanjang ${E(r.app)}</h3>
    <small>${E(r.buyer || 'Tanpa nama')} · berakhir ${fd(r.end)} (${leftTxt(dl).toLowerCase()})</small>
    <div class="chips" id="rTiers" ${p && p.tiers.length ? '' : 'hidden'}>${tierChips(p)}</div>
    <div class="sec2"><h4>Perpanjang berapa lama?</h4><div class="chips" id="rDur">${durChips(RDAYS)}</div>
    <label class="f"><span>Atau isi sendiri (hari)</span><input type="number" id="rDays" min="1" max="3650" inputmode="numeric" placeholder="mis. 45" value="${DURS.includes(RDAYS) ? '' : RDAYS}"></label></div>
    <div class="row2"><label class="f"><span>Mulai hitung dari</span><select id="rFrom"><option value="end" ${dl >= 0 ? 'selected' : ''}>Sambung dari tgl berakhir</option><option value="today" ${dl < 0 ? 'selected' : ''}>Hari ini</option></select></label>
    <label class="f"><span>Harga perpanjangan (Rp)</span><input type="number" id="rPrice" inputmode="numeric" min="0" value="${r.price || ''}"></label></div>
    <label class="f"><span>Modal perpanjangan (Rp)</span><input type="number" id="rCost" inputmode="numeric" min="0" value="${r.cost || ''}"></label>
    <div class="sec2"><h4>Ingatkan perpanjangan berikutnya</h4><div class="chips" id="rRm">${rmChips(RRM)}</div></div>
    <div class="prev" id="rPrev"></div>
    <button class="btn pri wide" id="rsave" type="button">Simpan perpanjangan</button>`;
    Q('#rn').hidden = false; rPrev();
  }
  const rEnd = () => addD(v('rFrom') == 'today' ? today() : RN.end, RDAYS);
  function rPrev() { const p = Q('#rPrev'); if (p) p.textContent = RDAYS > 0 ? `Tgl perpanjangan berikutnya: ${fd(rEnd())} (${dlab(RDAYS)})` : 'Pilih durasi dulu'; }
  function saveRn() {
    if (!(RDAYS > 0)) return toast('Pilih atau isi durasi dulu');
    const price = num('rPrice'), cost = num('rCost'), rec = {...RN, hist: [...(RN.hist || [])]};
    rec.end = rEnd(); rec.days = RDAYS; rec.price = price; rec.cost = cost; rec.renewals = (rec.renewals || 0) + 1; rec.rm = [...RRM]; rec.rmDone = null;
    rec.hist.push({d: today(), days: RDAYS, price, cost});
    Q('#rn').hidden = true; persist(rec).then(ok => ok && toast(`Diperpanjang sampai ${fd(rec.end)} ✓`));
  }

  /* ---------- pengeluaran ---------- */
  function xeditor(x) {
    XE = x || null; const d = x || {date: today(), label: '', cat: XCAT[0], amount: ''};
    Q('#xm .ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">✕</button><h3>${x ? 'Edit pengeluaran' : 'Catat pengeluaran'}</h3>
    <label class="f"><span>Keterangan</span><input type="text" id="xLabel" maxlength="80" placeholder="mis. Iklan IG, beli pulsa, fee admin" value="${E(d.label)}"></label>
    <div class="row2"><label class="f"><span>Tanggal</span><input type="date" id="xDate" value="${d.date}"></label>
    <label class="f"><span>Jumlah (Rp)</span><input type="number" id="xAmt" min="0" inputmode="numeric" value="${d.amount}"></label></div>
    <label class="f"><span>Kategori</span><select id="xCat">${XCAT.map(c => `<option ${d.cat == c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    <button class="btn pri wide" id="xsave" type="button">Simpan</button>${x ? '<button class="btn danger wide" id="xdel" type="button">Hapus</button>' : ''}`;
    Q('#xm').hidden = false;
  }
  function saveX() {
    const label = v('xLabel').trim(), amount = Math.round(num('xAmt')), date = v('xDate');
    if (!label) return toast('Isi keterangan dulu'); if (!(amount > 0)) return toast('Isi jumlah pengeluaran'); if (!date) return toast('Isi tanggal');
    const rec = {...(XE || {t: 'x', id: uid()}), label, amount, date, cat: v('xCat')};
    Q('#xm').hidden = true; persist(rec).then(ok => ok && toast('Pengeluaran tersimpan ✓'));
  }

  /* ---------- tampilan laporan ---------- */
  function fillMonths() {
    const s = Q('#lapM'); if (s.options.length) return; const t = today(), base = parse(t.slice(0, 7) + '-01');
    for (let i = 0; i < 24; i++) { const d = new Date(base.getFullYear(), base.getMonth() - i, 1), m = ymd(d).slice(0, 7); s.add(new Option(fm(m), m)); }
  }
  function lapParts(x, edit) {
    return {
      sum: [[rp(x.omz), 'Omzet'], [rp(x.ref), 'Refund'], [rp(x.hpp), 'Modal terjual'], [rp(x.exp), 'Pengeluaran'], [x.n, 'Transaksi (' + x.ren + ' perpanjang)']]
        .map(([b, l]) => `<div class="st"><b>${b}</b><span>${l}</span></div>`).join('') + `<div class="st hl"><b class="${x.laba < 0 ? 'neg' : ''}">${rp(x.laba)}</b><span>Laba bersih</span></div>`,
      top: x.top.slice(0, 8).map(t => `<div class="tk-line"><span>${E(t.name)}<br><small>${t.n} transaksi · laba ${rp(t.laba)}</small></span><b>${rp(t.omz)}</b></div>`).join('') || '<small>Belum ada penjualan di bulan ini.</small>',
      ex: x.ex.map(e => `<div class="tk-line"><span>${E(e.label)}<br><small>${fd(e.date)} · ${E(e.cat || '')}</small></span><b>${rp(e.amount)}</b>${edit ? `<button class="btn" data-xedit="${e.id}" type="button">Edit</button>` : ''}</div>`).join('') || '<small>Belum ada pengeluaran di bulan ini.</small>',
      tx: x.tx.map(t => `<div class="tk-line"><span>${E(t.app)}${t.buyer ? ' · ' + E(t.buyer) : ''}<br><small>${fd(t.d)} · ${t.j}</small></span><b class="${t.amt < 0 ? 'neg' : ''}">${rp(t.amt)}</b></div>`).join('') || '<small>Belum ada transaksi di bulan ini.</small>'
    };
  }
  function renderLap() {
    fillMonths(); const m = v('lapM') || today().slice(0, 7), p = lapParts(report(m), true);
    Q('#lapSum').innerHTML = p.sum; Q('#lapTop').innerHTML = p.top; Q('#lapEx').innerHTML = p.ex; Q('#lapTx').innerHTML = p.tx; Q('#lapTr').innerHTML = trendHtml(R, X);
  }
  function lapText() {
    const m = v('lapM') || today().slice(0, 7), x = report(m);
    return [`📊 Ringkasan ${fm(m)}`, `Omzet: ${rp(x.omz)}`, `Refund: ${rp(x.ref)}`, `Modal terjual: ${rp(x.hpp)}`, `Pengeluaran: ${rp(x.exp)}`, `Laba bersih: ${rp(x.laba)}`, `Transaksi: ${x.n} (${x.ren} perpanjang)`]
      .concat(x.top.length ? ['', 'Terlaris:'].concat(x.top.slice(0, 5).map((t, i) => `${i + 1}. ${t.name} (${t.n}×) ${rp(t.omz)}`)) : []).join('\n');
  }
  function lapCsv() {
    const m = v('lapM') || today().slice(0, 7), x = report(m), rows = [['Tanggal', 'Jenis', 'Aplikasi / keterangan', 'Pembeli', 'Jumlah', 'Modal']]
      .concat(x.tx.map(t => [t.d, t.j, t.app, t.buyer, t.amt, t.cost])).concat(x.ex.map(e => [e.date, 'Pengeluaran', e.label, e.cat, -e.amount, '']));
    dlCsv(rows, `laporan-${m}.csv`);
  }

  /* ---------- refund ---------- */
  const SK = () => 'wm_rfset_' + ((Auth.user() || {}).username || '');
  function loadSet() { try { const s = JSON.parse(localStorage.getItem(SK()) || '{}'); Q('#rfFT').value = s.ft || 'pct'; Q('#rfF').value = s.f ?? ''; Q('#rfG').value = s.g ?? ''; } catch (e) {} }
  function saveSet() { try { localStorage.setItem(SK(), JSON.stringify({ft: v('rfFT'), f: v('rfF'), g: v('rfG')})); } catch (e) {} }
  function autoUsed() { if (RFMAN) return; const o = v('rfO'), t = v('rfT'); Q('#rfU').value = o && t ? Math.max(0, diff(o, t)) : ''; }
  function calc() {
    const Pr = num('rfP'), D = num('rfD'), U = Math.max(0, num('rfU')), G = num('rfG'), F = num('rfF'), pct = v('rfFT') == 'pct', o = Q('#rfOut'); RFRES = null;
    Q('#rfrec').hidden = !RFREC;
    if (!(Pr > 0 && D > 0)) { o.innerHTML = '<small>Isi harga bayar dan durasi total, hasilnya muncul di sini.</small>'; return; }
    RFRES = rfMath(Pr, D, U, G, F, pct); o.innerHTML = rfHtml(RFRES);
  }
  const rfMath = (Pr, D, U, G, F, pct) => {
    const per = Pr / D, used = Math.min(U, D), sisa = Math.max(0, D - U), full = G > 0 && U <= G;
    const gross = Math.round(full ? Pr : per * sisa), fee = full ? 0 : Math.min(gross, Math.round(pct ? gross * F / 100 : F)), net = Math.max(0, gross - fee);
    return {P: Pr, D, U, per, used, sisa, full, gross, fee, net, pct, F, G};
  };
  const rfHtml = x => {
    const ln = (a, b) => `<div class="ln"><span>${a}</span><b>${b}</b></div>`;
    return ln('Harga per hari', `${rp(x.P)} ÷ ${x.D} = ${rp(x.per)}`) + ln('Terpakai', `${x.U} hari × ${rp(x.per)} = ${rp(x.per * x.used)}`)
      + ln('Sisa', `${x.sisa} hari × ${rp(x.per)} = ${rp(x.per * x.sisa)}`) + (x.full ? ln('Garansi', `terpakai ≤ ${x.G} hari → refund penuh`) : '')
      + ln(`Potongan admin${x.pct && !x.full ? ` (${x.F}%)` : ''}`, '− ' + rp(x.fee)) + `<div class="net"><span>Refund bersih</span><b>${rp(x.net)}</b></div>`;
  };
  const rfText = () => { const x = RFRES; if (!x) return ''; return [`Rincian refund${RFREC ? ' ' + RFREC.app : ''}`, `Harga bayar: ${rp(x.P)} untuk ${x.D} hari`, `Terpakai ${x.U} hari, sisa ${x.sisa} hari`, `Nilai per hari: ${rp(x.per)}`, x.full ? `Garansi refund penuh (terpakai ≤ ${v('rfG')} hari)` : `Refund sebelum potongan: ${rp(x.gross)}`, `Potongan admin: ${rp(x.fee)}`, `Refund bersih: ${rp(x.net)}`].join('\n'); };
  function refundFrom(r) {
    RFREC = r; RFMAN = false; setView('refund');
    Q('#rfP').value = r.price || ''; Q('#rfD').value = r.days || ''; Q('#rfO').value = addD(r.end, -(+r.days || 0)); Q('#rfT').value = today();
    const s = Q('#rfSrc'); s.hidden = false; s.textContent = `Dari catatan: ${r.app}${r.buyer ? ' · ' + r.buyer : ''}`;
    autoUsed(); calc(); window.scrollTo({top: 0, behavior: 'smooth'});
  }
  function refundReset() { RFREC = null; RFMAN = false; ['rfP', 'rfD', 'rfO', 'rfU'].forEach(i => Q('#' + i).value = ''); Q('#rfT').value = today(); Q('#rfSrc').hidden = true; calc(); }
  function refundRecord() {
    if (!RFREC || !RFRES) return;
    if (!confirm(`Catat refund ${rp(RFRES.net)} untuk ${RFREC.app}? Catatan ini akan ditandai refund.`)) return;
    const rec = {...RFREC, ref: {date: v('rfT') || today(), amount: RFRES.net}, rmDone: null};
    persist(rec).then(ok => { if (ok) { toast('Refund dicatat ✓'); refundReset(); setView('rekap'); } });
  }

  /* ---------- v10: tren, pelanggan, backup, tema ---------- */
  const rpS = n => { const a = Math.abs(n); return (n < 0 ? '−' : '') + (a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',') + 'jt' : a >= 1e3 ? Math.round(a / 1e3) + 'rb' : Math.round(a)); };
  function trendHtml(RR, XX) {
    const base = parse(today().slice(0, 7) + '-01'), ms = [];
    for (let i = 5; i >= 0; i--) ms.push(ymd(new Date(base.getFullYear(), base.getMonth() - i, 1)).slice(0, 7));
    const rows = ms.map(m => ({m, x: report(m, RR, XX)})), mx = Math.max(1, ...rows.map(r => r.x.omz));
    return `<div class="tk-bars">${rows.map(({m, x}) => `<div class="tk-bar"><b>${rpS(x.omz)}</b><div class="tk-bt"><i style="height:${Math.round(x.omz / mx * 100)}%"></i></div><span>${parse(m + '-01').toLocaleDateString('id-ID', {month: 'short'})}</span><small class="${x.laba < 0 ? 'neg' : 'plus'}">${rpS(x.laba)}</small></div>`).join('')}</div><small>Batang = omzet, angka kecil di bawah = laba bersih tiap bulan.</small>`;
  }
  function customers() {
    const m = {};
    R.forEach(r => {
      const nm = (r.buyer || '').trim(); if (!nm) return; const k = key(nm), c = m[k] = m[k] || {name: nm, n: 0, total: 0, last: '', rec: null};
      (r.hist || []).forEach(h => { c.n++; c.total += +h.price || 0; if (String(h.d) > c.last) c.last = String(h.d); });
      if (r.ref) c.total -= +r.ref.amount || 0;
      if (!c.rec || String(r.end) > String(c.rec.end)) c.rec = r;
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }
  const dueList = () => R.filter(r => !r.ref && left(r) <= 7).sort((a, b) => left(a) - left(b));
  function renderAlat() {
    const cs = customers().slice(0, 10);
    Q('#alCust').innerHTML = cs.map((c, i) => `<div class="tk-line c3"><span>${i + 1}. ${E(c.name)}${claimBadge(claimsOf(c.name))}<br><small>${c.n} transaksi · terakhir ${fd(c.last)}</small></span><b>${rp(c.total)}</b><button class="btn" data-cwa="${c.rec.id}" type="button">WA</button></div>`).join('') || '<small>Belum ada pembeli bernama. Isi “Nama pembeli” saat mencatat penjualan.</small>';
    const ds = dueList();
    Q('#alDue').innerHTML = ds.map(r => `<div class="tk-line"><span>${E(r.app)}${r.buyer ? ' · ' + E(r.buyer) : ''}<br><small>${leftTxt(left(r))} · ${fd(r.end)}</small></span><b>${rp(r.price)}</b></div>`).join('') || '<small>Tidak ada akun yang jatuh tempo dalam 7 hari. Aman 🎉</small>';
    Q('#dueCopy').hidden = !ds.length;
  }
  function dueText() {
    return ['⏰ Jatuh tempo 7 hari ke depan', ''].concat(dueList().map((r, i) => `${i + 1}. ${r.app}${r.buyer ? ' · ' + r.buyer : ''} — ${leftTxt(left(r)).toLowerCase()} (${fd(r.end)}) · ${rp(r.price)}`)).join('\n');
  }
  function custWa(r) {
    let n = String((r || {}).wa || '').replace(/\D/g, ''); if (n.startsWith('0')) n = '62' + n.slice(1);
    return n ? window.open('https://wa.me/' + n, '_blank', 'noopener') : toast('Nomor WA pembeli ini belum diisi');
  }
  function backup() {
    if (!ALL.length) return toast('Belum ada data untuk di-backup');
    const a = document.createElement('a'), u = (Auth.user() || {}).username || '';
    a.href = URL.createObjectURL(new Blob([JSON.stringify({app: 'rizanta-kasir', v: 1, user: u, at: new Date().toISOString(), records: ALL}, null, 1)], {type: 'application/json'}));
    a.download = `backup-kasir-${today()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Backup diunduh ✓');
  }
  const N0 = x => Math.max(0, +x || 0), T1 = (x, n) => String(x ?? '').slice(0, n), D1 = x => /^\d{4}-\d{2}-\d{2}$/.test(String(x)) ? String(x) : '', A1 = a => Array.isArray(a) ? a : [];
  function clean(x) { // file backup tidak dipercaya: semua nilai dipaksa ke tipe yang aman
    if (!x || typeof x != 'object') return null; const id = T1(x.id, 40).replace(/[^\w-]/g, ''); if (!id) return null;
    if (x.t == 'p') return x.name ? {t: 'p', id, name: T1(x.name, 60), cat: T1(x.cat, 30), cost: N0(x.cost), stock: Math.floor(N0(x.stock)), min: Math.floor(N0(x.min)), note: T1(x.note, 200), created: N0(x.created) || Date.now(),
      tiers: A1(x.tiers).slice(0, 8).map(t => ({d: Math.floor(N0(t && t.d)), price: N0(t && t.price)})).filter(t => t.d > 0)} : null;
    if (x.t == 'c') return x.buyer && D1(x.date) ? {t: 'c', id, rid: T1(x.rid, 40), buyer: T1(x.buyer, 40), wa: T1(x.wa, 20), app: T1(x.app, 60), date: D1(x.date), kind: ['komplain', 'garansi', 'ganti'].includes(x.kind) ? x.kind : 'komplain',
      status: ['baru', 'proses', 'selesai'].includes(x.status) ? x.status : 'baru', issue: T1(x.issue, 300), fix: T1(x.fix, 200), oldAcc: T1(x.oldAcc, 80), newAcc: T1(x.newAcc, 80), doneAt: D1(x.doneAt) || undefined, created: N0(x.created) || Date.now()} : null;
    if (x.t == 'l') return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(x.img || '') && x.img.length < 7500 ? {t: 'l', id, img: x.img} : null;
    if (x.t == 'w') return {t: 'w', id, phone: T1(x.phone, 20), addr: T1(x.addr, 120), shop: T1(x.shop, 40), foot: T1(x.foot, 140), remind: T1(x.remind, 400), nota: T1(x.nota, 400), claim: T1(x.claim, 400), iv: x.iv && typeof x.iv == 'object' ? Object.fromEntries(Object.entries(x.iv).slice(0, 16).map(([k, v]) => [T1(k, 12), T1(v, 12)])) : undefined};
    if (x.t == 'q') { const q = validateAndParseQRIS(x.raw); return q.ok ? {t: 'q', id, raw: q.raw, merch: T1(q.merch, 60), city: T1(q.city, 60), presets: A1(x.presets).slice(0, 12).map(p => ({label: T1(p && p.label, 50), amt: N0(p && p.amt)})).filter(p => p.amt > 0)} : null; }
    if (x.t == 'x') return x.label && D1(x.date) ? {t: 'x', id, label: T1(x.label, 80), amount: N0(x.amount), date: D1(x.date), cat: T1(x.cat, 30)} : null;
    if (!x.app || !D1(x.orderDate) || !D1(x.end)) return null;
    return {id, pid: x.pid ? T1(x.pid, 40) : undefined, app: T1(x.app, 60), email: T1(x.email, 80), buyer: T1(x.buyer, 40), wa: T1(x.wa, 20), orderDate: D1(x.orderDate), end: D1(x.end), days: Math.floor(N0(x.days)) || 30,
      price: N0(x.price), cost: N0(x.cost), note: T1(x.note, 200), rm: A1(x.rm).map(Number).filter(n => n > 0 && n <= 365).slice(0, 5), rmDone: x.rmDone == null ? null : N0(x.rmDone),
      inv: x.inv ? T1(x.inv, 30) : undefined, pay: x.pay ? T1(x.pay, 10) : undefined, dsc: N0(x.dsc) || undefined, cash: N0(x.cash) || undefined, time: x.time ? T1(x.time, 5) : undefined,
      renewals: Math.floor(N0(x.renewals)), created: N0(x.created) || Date.now(), ref: x.ref && D1(x.ref.date) ? {date: D1(x.ref.date), amount: N0(x.ref.amount)} : undefined,
      hist: A1(x.hist).slice(-60).map(h => ({d: D1(h && h.d) || D1(x.orderDate), days: Math.floor(N0(h && h.days)), price: N0(h && h.price), cost: N0(h && h.cost)}))};
  }
  let restoring = false;
  async function restore(file) {
    if (!file || restoring) return; let d; try { d = JSON.parse(await file.text()); } catch (e) { return toast('File ini bukan backup yang valid'); }
    const rs = A1(Array.isArray(d) ? d : d && d.records).map(clean).filter(Boolean).slice(0, 500);
    if (!rs.length) return toast('Tidak ada catatan yang bisa dipulihkan di file ini');
    if (!confirm(`Pulihkan ${rs.length} catatan? Catatan dengan ID yang sama akan ditimpa, sisanya tetap aman.`)) return;
    restoring = true; let ok = 0;
    for (const rec of rs) {
      const r = await Auth.call('rec_save', {id: rec.id, data: JSON.stringify(rec)}); if (!r.ok) { toast(r.error); break; }
      upsert(rec); ok++; if (ok % 5 == 0) toast(`Memulihkan ${ok}/${rs.length}…`);
    }
    restoring = false; cache(); split(); render(); toast(`${ok} catatan dipulihkan ✓`);
  }
  const paintTheme = () => {};
  function flipTheme() { if (window.WM_SETTINGS) WM_SETTINGS.open('tema'); } // tema diatur di settings.js

  /* ---------- contoh tampilan untuk akun gratis (data fiktif, tidak dikirim ke server) ---------- */
  let DM = null, DF = 'all', DQ = '', DCLICK = 0;
  function demoData() {
    const ago = n => addD(today(), -n);
    const mk = (id, app, buyer, wa, email, days, price, cost, hs, extra) => { const last = ago(hs[hs.length - 1]); return {id, app, buyer, wa, email, days, price, cost, orderDate: last, end: addD(last, days), renewals: hs.length - 1, rm: [3], note: '', hist: hs.map(a => ({d: ago(a), days, price, cost})), ...extra}; };
    return {
      R: [mk('d1', 'Netflix Premium', 'Budi', '0812-xxxx-0001', 'budi.nflx@gmail.com', 30, 35000, 22000, [102, 72, 42, 12], {pid: 'p1', note: 'Profil 2'}),
        mk('d2', 'Spotify Family', 'Sari', '0812-xxxx-0002', 'sari.sp@gmail.com', 30, 25000, 15000, [87, 57, 27], {pid: 'p2'}),
        mk('d3', 'Canva Pro', 'Dimas', '0812-xxxx-0003', 'dimas.cv@mail.com', 30, 15000, 8000, [70, 40], {pid: 'p3'}),
        mk('d4', 'YouTube Premium', 'Rina', '0812-xxxx-0004', 'rina.yt@gmail.com', 90, 60000, 38000, [20], {pid: 'p4', rm: [7]}),
        mk('d5', 'Disney+ Hotstar', 'Andi', '0812-xxxx-0005', '', 30, 30000, 18000, [12], {ref: {date: ago(3), amount: 18900}, rm: []}),
        mk('d6', 'ChatGPT Plus', 'Tono', '0812-xxxx-0006', 'tono.ai@gmail.com', 30, 85000, 60000, [58, 28, 4], {rm: [3]}),
        mk('d7', 'CapCut Pro', 'Maya', '0812-xxxx-0007', 'maya.cc@gmail.com', 30, 20000, 9000, [51, 21, 9], {rm: [1]})],
      P: [{id: 'p1', name: 'Netflix Premium', cat: 'Streaming', cost: 22000, stock: 8, min: 3, tiers: [{d: 7, price: 12000}, {d: 30, price: 35000}, {d: 90, price: 95000}]},
        {id: 'p2', name: 'Spotify Family', cat: 'Musik', cost: 15000, stock: 2, min: 3, tiers: [{d: 30, price: 25000}, {d: 90, price: 68000}]},
        {id: 'p3', name: 'Canva Pro', cat: 'Desain', cost: 8000, stock: 0, min: 3, tiers: [{d: 30, price: 15000}, {d: 365, price: 120000}]},
        {id: 'p4', name: 'YouTube Premium', cat: 'Streaming', cost: 38000, stock: 5, min: 2, tiers: [{d: 30, price: 25000}, {d: 90, price: 60000}]}],
      X: []
    };
  }
  function demoMonth(RR, XX) { // bulan yang transaksinya paling banyak (bulan ini atau bulan lalu) supaya contoh selalu terisi
    const cur = today().slice(0, 7), c0 = parse(cur + '-01'), prev = ymd(new Date(c0.getFullYear(), c0.getMonth() - 1, 1)).slice(0, 7);
    return report(cur, RR, XX).n >= report(prev, RR, XX).n ? cur : prev;
  }
  const dx = h => h.replace(/ data-(renew|wa|rf|edit|dup|ack|stk|pedit|xedit|nota|claim|qrec)="[^"]*"( data-q="[^"]*")?/g, ' data-dx="$1"');
  function dmRekap() {
    const x = rekapParts(DM.R, DF, DQ, 'due'), ls = DM.R.filter(due).sort((a, b) => left(a) - left(b)), rm = Q('#dRm');
    rm.hidden = !ls.length; rm.innerHTML = ls.length ? dx(remindHtml(ls)) : '';
    Q('#dFlt').innerHTML = x.chips.replace(/data-f=/g, 'data-dflt=');
    Q('#dList').innerHTML = x.ls.map(r => dx(card(r))).join('') || '<div class="empty">Tidak ada catatan yang cocok.</div>';
  }
  function dmLap() {
    const m = DM.m, p = lapParts(report(m, DM.R, DM.X), false);
    Q('#dLapM').textContent = fm(m); Q('#dLapSum').innerHTML = p.sum; Q('#dLapTop').innerHTML = p.top; Q('#dLapEx').innerHTML = p.ex; Q('#dLapTx').innerHTML = p.tx; Q('#dLapTr').innerHTML = trendHtml(DM.R, DM.X);
  }
  function dmRefund() {
    const n = id => Math.max(0, +(Q('#' + id) || {}).value || 0), Pr = n('dP'), D = n('dD'), o = Q('#dOut');
    if (!(Pr > 0 && D > 0)) { o.innerHTML = '<small>Isi harga bayar dan durasi total, hasilnya muncul di sini.</small>'; return; }
    o.innerHTML = rfHtml(rfMath(Pr, D, n('dU'), 0, n('dF'), true));
  }
  function demoInit() {
    if (DM) return; DM = demoData(); const box = Q('#dm'), m0 = demoMonth(DM.R, []), cap = d => d > today() ? today() : d;
    DM.m = m0; DM.X = [{id: 'x1', label: 'Iklan Instagram', cat: 'Iklan', amount: 10000, date: cap(addD(m0 + '-01', 4))}, {id: 'x2', label: 'Fee admin marketplace', cat: 'Fee / Admin', amount: 5000, date: cap(addD(m0 + '-01', 9))}];
    Q('#dStats').innerHTML = statsHtml(DM.R, DM.P, DM.X, m0, m0 == today().slice(0, 7) ? '' : parse(m0 + '-01').toLocaleDateString('id-ID', {month: 'long'})); dmRekap(); dmLap(); dmRefund();
    Q('#dPl').innerHTML = DM.P.map(p => dx(pcard(p, DM.R))).join('');
    const HINT = {add: 'Di versi premium: pilih produk, harga & stok terisi otomatis', renew: 'Perpanjang: tanggal berikutnya & riwayat dihitung otomatis', wa: 'WA: pesan pengingat sudah terisi, tinggal kirim',
      rf: 'Refund: dihitung otomatis dari sisa hari', edit: 'Edit catatan kapan saja', dup: 'Duplikat: jual produk yang sama ke pembeli lain', ack: 'Tandai sudah diingatkan', stk: 'Stok bisa ditambah / dikurangi sekali klik',
      pedit: 'Edit produk, modal & paket harga', xedit: 'Edit pengeluaran', xadd: 'Catat biaya iklan, fee, dll. untuk laba bersih', nota: 'Nota PNG: nama toko, produk, durasi & harga, siap kirim ke WA', claim: 'Catat klaim, garansi & ganti akun per pembeli', qrec: 'QRIS otomatis sesuai harga', csv: 'Unduh rekap ke CSV / Excel', padd: 'Isi katalog produk sekali, dipakai terus', pcopy: 'Salin daftar harga siap tempel ke WA'};
    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); const d = b.dataset;
      if (d.dv) { box.querySelectorAll('[data-dv]').forEach(x => x.classList.toggle('on', x == b)); ['rekap', 'prod', 'lap', 'refund'].forEach(k => Q('#dv-' + k).hidden = k != d.dv); return; }
      if (d.dflt) { DF = d.dflt; return dmRekap(); }
      if (d.more) { b.closest('.tk-rec').classList.toggle('mo'); return; }
      if (d.dx) { toast((HINT[d.dx] || 'Ini contoh tampilan') + ' ✨'); if (++DCLICK % 4 == 0) Auth.upsell('Kasir & Rekap Toko'); }
    });
    box.addEventListener('input', e => { if (e.target.id == 'dQ') { DQ = e.target.value.trim().toLowerCase(); dmRekap(); } else if (/^d[PDUF]$/.test(e.target.id)) dmRefund(); });
  }

  /* ---------- QRIS Dinamis per Akun (t:'q') ---------- */
  function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function parseTLV(raw) {
    const tags = [];
    let i = 0;
    while (i + 4 <= raw.length) {
      const tag = raw.slice(i, i + 2);
      const len = parseInt(raw.slice(i + 2, i + 4), 10);
      if (isNaN(len) || i + 4 + len > raw.length) return null;
      const val = raw.slice(i + 4, i + 4 + len);
      tags.push({tag, val});
      i += 4 + len;
    }
    return i === raw.length ? tags : null;
  }

  function validateAndParseQRIS(rawInput) {
    const raw = String(rawInput || '').trim();
    if (!raw.startsWith('000201')) return {ok: false, error: 'Kode bukan format QRIS standar (harus diawali 000201).'};
    const tags = parseTLV(raw);
    if (!tags) return {ok: false, error: 'Struktur data QRIS tidak valid atau terpotong.'};
    const crcTag = tags.find(t => t.tag === '63');
    if (!crcTag) return {ok: false, error: 'Checksum CRC QRIS tidak ditemukan.'};
    const bodyWithoutCrc = raw.slice(0, raw.length - 4);
    const expectedCrc = crc16(bodyWithoutCrc);
    if (crcTag.val.toUpperCase() !== expectedCrc) {
      return {ok: false, error: 'Checksum QRIS tidak cocok. Pastikan gambar QRIS jelas & tidak terpotong.'};
    }
    const merch = (tags.find(t => t.tag === '59') || {}).val || 'Merchant QRIS';
    const city = (tags.find(t => t.tag === '60') || {}).val || '';
    const hasMerchantTag = tags.some(t => { const n = Number(t.tag); return n >= 2 && n <= 51; });
    if (!hasMerchantTag) {
      return {ok: false, error: 'QR ini bukan QRIS pembayaran standar.'};
    }
    return {ok: true, raw, merch: merch.trim(), city: city.trim()};
  }

  function buildDynamicQRIS(baseRaw, amount) {
    const tags = parseTLV(baseRaw);
    if (!tags) return '';
    const amtStr = String(Math.round(amount));
    const filtered = tags.filter(t => !['01', '54', '55', '56', '57', '63'].includes(t.tag));
    const out = [];
    let inserted54 = false;
    for (const t of filtered) {
      if (t.tag === '00') {
        out.push(t);
        out.push({tag: '01', val: '12'}); // 12 = Dynamic QRIS
      } else {
        if (!inserted54 && Number(t.tag) > 54 && amount > 0) {
          out.push({tag: '54', val: amtStr});
          inserted54 = true;
        }
        out.push(t);
      }
    }
    if (!inserted54 && amount > 0) out.push({tag: '54', val: amtStr});
    const payload = out.map(t => t.tag + String(t.val.length).padStart(2, '0') + t.val).join('') + '6304';
    return payload + crc16(payload);
  }

  function decodeQRFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject('Pilih file gambar dulu.');
      if (typeof jsQR !== 'function') return reject('Library pembaca QR belum siap, muat ulang halaman.');
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDim = Math.max(img.width, img.height);
        const targetDims = [maxDim, 1200, 900, 600, 1600];
        const cv = document.createElement('canvas');
        const ctx = cv.getContext('2d', {willReadFrequently: true});
        for (const td of targetDims) {
          const sc = td / maxDim;
          const w = Math.round(img.width * sc), h = Math.round(img.height * sc);
          if (w < 50 || h < 50 || w > 2200 || h > 2200) continue;
          cv.width = w; cv.height = h;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const idata = ctx.getImageData(0, 0, w, h);
          const code = jsQR(idata.data, w, h, {inversionAttempts: 'attemptBoth'});
          if (code && code.data) return resolve(code.data);
        }
        reject('QR tidak terbaca. Pastikan gambar jelas, tidak buram, dan seluruh kotak QR terlihat.');
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject('Gagal membaca file gambar.'); };
      img.src = url;
    });
  }

  function qrTotalAmount() {
    const base = Math.max(0, Math.round(num('qrAmt')));
    if (!(base > 0)) return {base: 0, fee: 0, total: 0};
    const ft = v('qrFeeType'), fv = Math.max(0, num('qrFeeVal'));
    const fee = ft === 'rp' ? Math.round(fv) : ft === 'pct' ? Math.round(base * fv / 100) : 0;
    return {base, fee, total: base + fee};
  }

  function drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  function renderQRCanvas() {
    const cv = Q('#qrCanvas');
    if (!cv || !QCFG || !QCFG.raw) return;
    const ctx = cv.getContext('2d');
    const W = 540, H = 680;
    cv.width = W; cv.height = H;

    const {base, fee, total} = qrTotalAmount();
    const note = v('qrNote').trim();
    const payload = total > 0 ? buildDynamicQRIS(QCFG.raw, total) : QCFG.raw;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#fff0f6');
    grad.addColorStop(1, '#ffe3ef');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Outer white card
    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, 28, 28, W - 56, H - 56, 32);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffb8d8';
    ctx.stroke();

    // Header badge
    ctx.fillStyle = '#ff5fa2';
    drawRoundRect(ctx, W / 2 - 90, 50, 180, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px Fredoka, Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QRIS PEMBAYARAN', W / 2, 72);

    // Merchant Name
    ctx.fillStyle = '#3b1d2e';
    ctx.font = '700 24px Fredoka, Nunito, sans-serif';
    const merchText = (QCFG.merch || 'Merchant QRIS').slice(0, 28);
    ctx.fillText(merchText, W / 2, 118);

    // Nominal box
    ctx.fillStyle = '#fff5f9';
    drawRoundRect(ctx, 56, 136, W - 112, note ? 92 : 72, 20);
    ctx.fill();
    ctx.strokeStyle = '#ffd1e6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#8c5a73';
    ctx.font = '700 13px Nunito, sans-serif';
    ctx.fillText(total > 0 ? 'TOTAL TAGIHAN' : 'NOMINAL BEBAS (INPUT MANUAL DI APLIKASI)', W / 2, 160);

    ctx.fillStyle = '#d81b60';
    ctx.font = '700 32px Fredoka, Nunito, sans-serif';
    ctx.fillText(total > 0 ? rp(total) : 'Rp —', W / 2, 196);

    if (note) {
      ctx.fillStyle = '#6b3e54';
      ctx.font = '700 14px Nunito, sans-serif';
      ctx.fillText(note.slice(0, 42), W / 2, 218);
    }

    // Generate QR Matrix
    const qrY = note ? 248 : 230;
    const qrSize = 310;
    const qrX = (W - qrSize) / 2;

    if (typeof qrcode === 'function') {
      const qr = qrcode(0, 'M');
      qr.addData(payload);
      qr.make();
      const count = qr.getModuleCount();
      const pad = 16;
      const cell = (qrSize - pad * 2) / count;

      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, qrX, qrY, qrSize, qrSize, 20);
      ctx.fill();
      ctx.strokeStyle = '#f3d1e0';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#1f1218';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(qrX + pad + c * cell, qrY + pad + r * cell, Math.ceil(cell), Math.ceil(cell));
          }
        }
      }
    }

    // Footer instruction
    const footY = qrY + qrSize + 34;
    ctx.fillStyle = '#6b3e54';
    ctx.font = '700 14px Nunito, sans-serif';
    ctx.fillText('Scan menggunakan DANA, GoPay, OVO, ShopeePay,', W / 2, footY);
    ctx.fillText('BCA, BRI, Mandiri, SeaBank & semua M-Banking', W / 2, footY + 20);
    if (fee > 0) {
      ctx.fillStyle = '#9e6b84';
      ctx.font = '600 12px Nunito, sans-serif';
      ctx.fillText(`(Termasuk biaya layanan ${rp(fee)})`, W / 2, footY + 42);
    }
  }

  function updateQRCalcUI() {
    const {base, fee, total} = qrTotalAmount();
    const out = Q('#qrCalcOut');
    if (!out) return;
    if (!(base > 0)) {
      out.innerHTML = '<small>Masukkan nominal tagihan untuk membuat QRIS otomatis terisi nominal.</small>';
    } else {
      out.innerHTML = `<div class="ln"><span>Nominal utama</span><b>${rp(base)}</b></div>`
        + (fee > 0 ? `<div class="ln"><span>Biaya layanan</span><b>+ ${rp(fee)}</b></div>` : '')
        + `<div class="net"><span>Total di-scan pembeli</span><b>${rp(total)}</b></div>`;
    }
    renderQRCanvas();
  }

  function renderQR() {
    const st = Q('#qrStatus'), setup = Q('#qrSetupBox'), bar = Q('#qrSavedBar'), work = Q('#qrWork'), pcard = Q('#qrPresetsCard');
    if (!st) return;
    const has = !!(QCFG && QCFG.raw);
    st.textContent = has ? 'Aktif' : 'Belum diatur';
    st.className = 'badge ' + (has ? 'ok' : 'soon');
    setup.hidden = has;
    bar.hidden = !has;
    work.hidden = !has;
    if (has) {
      Q('#qrMerchName').textContent = QCFG.merch || 'Merchant QRIS';
      Q('#qrMerchCity').textContent = (QCFG.city ? QCFG.city + ' · ' : '') + 'Tersimpan di akun ' + ((Auth.user() || {}).username || '');
      updateQRCalcUI();
      const presets = QCFG.presets || [];
      pcard.hidden = !presets.length;
      if (presets.length) {
        Q('#qrPresetList').innerHTML = presets.map((pr, idx) =>
          `<div class="tk-line c3"><span><b>${E(pr.label || 'Paket')}</b><br><small>${rp(pr.amt)}</small></span><b>${rp(pr.amt)}</b><div style="display:flex;gap:4px"><button class="btn pri" type="button" data-qruse="${idx}">Pakai</button><button class="btn" type="button" data-qrpdel="${idx}">✕</button></div></div>`
        ).join('');
      }
    } else {
      pcard.hidden = true;
    }
  }

  async function saveQRConfig(rawStr) {
    const parsed = validateAndParseQRIS(rawStr);
    if (!parsed.ok) return toast(parsed.error);
    const rec = {
      t: 'q',
      id: (QCFG && QCFG.id) || 'qris_cfg',
      raw: parsed.raw,
      merch: parsed.merch,
      city: parsed.city,
      presets: (QCFG && QCFG.presets) || []
    };
    const ok = await persist(rec);
    if (ok) {
      Q('#qrManualWrap').hidden = true;
      Q('#qrRawIn').value = '';
      toast('QRIS berhasil disimpan ke akunmu ✓');
    }
  }

  async function copyQRImage() {
    const cv = Q('#qrCanvas');
    if (!cv) return;
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
        return toast('Gambar QRIS disalin! Tinggal Paste (Ctrl+V) di WA pembeli 📋');
      } catch (e) {}
    }
    downloadQRImage();
    toast('Browser tidak mendukung salin gambar langsung, gambar diunduh sebagai PNG ⬇');
  }

  function downloadQRImage() {
    const cv = Q('#qrCanvas');
    if (!cv) return;
    const {total} = qrTotalAmount();
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = `QRIS-${total > 0 ? total : 'toko'}-${today()}.png`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 500);
  }

  function qrisFromRecord(r) {
    if (!r) return;
    setView('qris');
    if (!QCFG || !QCFG.raw) {
      return toast('Upload / atur QRIS tokomu dulu di sini ya!');
    }
    Q('#qrAmt').value = r.price || '';
    Q('#qrNote').value = `${r.app}${r.buyer ? ' - ' + r.buyer : ''}`.slice(0, 50);
    updateQRCalcUI();
    window.scrollTo({top: 0, behavior: 'smooth'});
    toast(`QRIS ${rp(r.price)} siap disalin!`);
  }

  /* ---------- Klaim & garansi (t:'c'): riwayat komplain, klaim garansi, ganti akun per pembeli ---------- */
  const KINDS = [['komplain', '🗣️ Komplain'], ['garansi', '🛡️ Klaim garansi'], ['ganti', '🔁 Ganti akun']];
  const KSTAT = [['baru', 'Baru', 'ex'], ['proses', 'Diproses', 'soon'], ['selesai', 'Selesai', 'ok']];
  const kLabel = k => (KINDS.find(x => x[0] == k) || KINDS[0])[1];
  const FLAG = Math.max(2, +S.CLAIM_FLAG || 3);
  const claimsOf = name => { const k = key(name); return k ? CL.filter(c => key(c.buyer) == k).length : 0; };
  const claimBadge = n => n ? ` <span class="badge cl${n >= FLAG ? ' hot' : ''}">${n >= FLAG ? '🚩' : '🛡️'} ${n} klaim</span>` : '';
  function claimBuyers() { // pembeli yang punya klaim, paling banyak di atas
    const m = {};
    CL.forEach(c => { const k = key(c.buyer); if (!k) return; const o = m[k] = m[k] || {name: c.buyer, n: 0, open: 0, last: '', wa: ''}; o.n++; if (c.status != 'selesai') o.open++; if (String(c.date) > o.last) o.last = String(c.date); if (c.wa) o.wa = c.wa; });
    return Object.values(m).sort((a, b) => b.n - a.n || String(b.last).localeCompare(String(a.last)));
  }
  function ccard(c) {
    const st = KSTAT.find(x => x[0] == c.status) || KSTAT[0], n = claimsOf(c.buyer);
    return `<article class="tk-rec ${st[2]}"><div class="tk-h"><strong>${E(c.app || 'Tanpa nama aplikasi')}</strong><span class="badge ${st[2]}">${st[1]}</span></div>
      <small>👤 ${E(c.buyer || '-')}${c.wa ? ' · ' + E(c.wa) : ''}${claimBadge(n)}</small>
      <small>${kLabel(c.kind)} · ${fd(c.date)}</small>
      <div class="tk-note">${E(c.issue || '-')}</div>
      ${c.kind == 'ganti' && (c.oldAcc || c.newAcc) ? `<div class="tk-grid tk-wrap"><span>Akun lama<b>${E(c.oldAcc || '-')}</b></span><span>Akun baru<b>${E(c.newAcc || '-')}</b></span></div>` : ''}
      ${c.fix ? `<small>✅ ${E(c.fix)}</small>` : ''}
      <div class="tk-act">${c.status != 'selesai' ? `<button class="btn pri" data-cdone="${c.id}" type="button">✔ Selesai</button>` : ''}<button class="btn" data-cwa2="${c.id}" type="button">WA</button><button class="btn" data-cedit="${c.id}" type="button">Edit</button></div></article>`;
  }
  function renderKlaim() {
    const open = CL.filter(c => c.status != 'selesai').length, hot = claimBuyers().filter(b => b.n >= FLAG).length;
    Q('#klStats').innerHTML = [[CL.length, 'Total klaim'], [open, 'Belum selesai'], [CL.filter(c => c.kind == 'ganti').length, 'Ganti akun'], [hot, 'Pembeli 🚩']].map(([b, l]) => `<div class="st"><b>${b}</b><span>${l}</span></div>`).join('');
    Q('#cflt').innerHTML = [['all', 'Semua'], ...KSTAT.map(x => [x[0], x[1]])].map(([k, l]) => `<button type="button" data-cf="${k}" class="${CF == k ? 'on' : ''}">${l}<em>${k == 'all' ? CL.length : CL.filter(c => c.status == k).length}</em></button>`).join('');
    const ls = CL.filter(c => (CF == 'all' || c.status == CF) && [c.buyer, c.app, c.issue, c.fix, c.wa, c.oldAcc, c.newAcc].join(' ').toLowerCase().includes(CQS)).sort((a, b) => (a.status == 'selesai') - (b.status == 'selesai') || String(b.date).localeCompare(String(a.date)) || (b.created || 0) - (a.created || 0));
    Q('#clist').innerHTML = ls.map(ccard).join('') || `<div class="empty">${CL.length ? 'Tidak ada klaim yang cocok.' : 'Belum ada klaim. Klik “+ Klaim” kalau ada pembeli yang komplain, minta garansi, atau ganti akun.'}</div>`;
    const top = claimBuyers().filter(b => b.n >= 2);
    Q('#cTop').innerHTML = top.map(b => `<div class="tk-line c3"><span>${E(b.name)}${claimBadge(b.n)}<br><small>${b.n} klaim${b.open ? ` · ${b.open} belum selesai` : ''} · terakhir ${fd(b.last)}</small></span><b>${b.n}×</b><button class="btn" data-cfind="${E(b.name)}" type="button">Lihat</button></div>`).join('') || '<small>Belum ada pembeli dengan 2 klaim atau lebih. Aman 🎉</small>';
    const dot = Q('#klDot'); if (dot) dot.hidden = !open;
  }
  function ceditor(c, sale) {
    CE = c || null; const d = c || {rid: sale ? sale.id : '', buyer: sale ? sale.buyer || '' : '', wa: sale ? sale.wa || '' : '', app: sale ? sale.app : '', date: today(), kind: 'komplain', status: 'baru', issue: '', fix: '', oldAcc: sale ? sale.email || '' : '', newAcc: ''};
    const sales = [...R].sort((a, b) => key(a.buyer).localeCompare(key(b.buyer)) || key(a.app).localeCompare(key(b.app)));
    Q('#cm .ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">✕</button><h3>${c ? 'Edit klaim' : 'Catat klaim'}</h3>
    <label class="f"><span>Dari catatan penjualan (opsional)</span><select id="cSale"><option value="">— isi manual —</option>${sales.map(r => `<option value="${r.id}" ${d.rid == r.id ? 'selected' : ''}>${E(r.buyer || 'Tanpa nama')} · ${E(r.app)}</option>`).join('')}</select></label>
    <div class="row2"><label class="f"><span>Nama pembeli</span><input type="text" id="cBuyer" maxlength="40" value="${E(d.buyer || '')}"></label>
    <label class="f"><span>WhatsApp pembeli</span><input type="tel" id="cWa" maxlength="20" value="${E(d.wa || '')}"></label></div>
    <label class="f"><span>Aplikasi / produk</span><input type="text" id="cApp" list="appl" maxlength="60" value="${E(d.app || '')}"></label>
    <div class="row2"><label class="f"><span>Jenis</span><select id="cKind">${KINDS.map(k => `<option value="${k[0]}" ${d.kind == k[0] ? 'selected' : ''}>${k[1]}</option>`).join('')}</select></label>
    <label class="f"><span>Tanggal</span><input type="date" id="cDate" value="${d.date}"></label></div>
    <label class="f"><span>Masalah / keluhan</span><textarea id="cIssue" rows="3" maxlength="300" placeholder="mis. akun tidak bisa login, profil kena kick">${E(d.issue || '')}</textarea></label>
    <div class="sec2" id="cSwap" ${d.kind == 'ganti' ? '' : 'hidden'}><div class="row2"><label class="f"><span>Akun lama</span><input type="text" id="cOld" maxlength="80" value="${E(d.oldAcc || '')}"></label>
    <label class="f"><span>Akun baru</span><input type="text" id="cNew" maxlength="80" placeholder="email / akun pengganti" value="${E(d.newAcc || '')}"></label></div>
    <label class="tk-ck" id="cApplyW"><input type="checkbox" id="cApply" checked> Perbarui email di catatan penjualan</label></div>
    <div class="row2"><label class="f"><span>Status</span><select id="cStat">${KSTAT.map(k => `<option value="${k[0]}" ${d.status == k[0] ? 'selected' : ''}>${k[1]}</option>`).join('')}</select></label>
    <label class="f"><span>Solusi / hasil</span><input type="text" id="cFix" maxlength="200" placeholder="mis. diganti akun baru" value="${E(d.fix || '')}"></label></div>
    <button class="btn pri wide" id="csave" type="button">Simpan klaim</button>
    ${c ? '<button class="btn danger wide" id="cdel" type="button">Hapus klaim</button>' : ''}`;
    cSyncApply(); Q('#cm').hidden = false;
  }
  const cSyncApply = () => { const w = Q('#cApplyW'); if (w) w.hidden = !v('cSale'); };
  function cPickSale(id) {
    const r = R.find(x => x.id == id); cSyncApply(); if (!r) return;
    Q('#cBuyer').value = r.buyer || ''; Q('#cWa').value = r.wa || ''; Q('#cApp').value = r.app || ''; Q('#cOld').value = r.email || '';
  }
  function saveClaim() {
    const buyer = v('cBuyer').trim(), issue = v('cIssue').trim(), date = v('cDate'), kind = v('cKind');
    if (!buyer) return toast('Nama pembeli wajib diisi, biar riwayatnya terlacak');
    if (!issue) return toast('Tulis masalahnya dulu');
    if (!date) return toast('Isi tanggal');
    const rid = v('cSale') || '', newAcc = kind == 'ganti' ? v('cNew').trim() : '';
    const rec = {...(CE || {t: 'c', id: uid(), created: Date.now()}), rid, buyer, wa: v('cWa').trim(), app: v('cApp').trim(), date, kind, status: v('cStat'), issue, fix: v('cFix').trim(), oldAcc: kind == 'ganti' ? v('cOld').trim() : '', newAcc};
    if (rec.status == 'selesai' && !rec.doneAt) rec.doneAt = today();
    const sale = rid ? R.find(x => x.id == rid) : null, apply = kind == 'ganti' && newAcc && sale && Q('#cApply') && Q('#cApply').checked && sale.email !== newAcc;
    Q('#cm').hidden = true;
    persist(rec).then(ok => {
      if (!ok) return; toast('Klaim tersimpan ✓');
      if (apply) persist({...sale, email: newAcc}).then(o => o && setTimeout(() => toast('Email di catatan penjualan ikut diperbarui ✓'), 1400));
    });
  }
  function claimWa(c) {
    const sale = c.rid ? R.find(x => x.id == c.rid) : null, base = sale ? waVars(sale) : {tgl: '', sisa: '', harga: '', toko: shopName(), email: '', status: ''};
    const msg = fill(tplOf('claim'), {...base, nama: c.buyer || '', app: c.app || '', akun: c.newAcc ? `Akun baru: ${c.newAcc}.` : ''}), n = waNum(c.wa);
    if (n) return window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    copy(msg).then(ok => toast(ok ? 'Nomor WA belum diisi, teks balasan disalin' : 'Nomor WA belum diisi'));
  }

  /* ---------- Nota PNG ---------- */
  const NT_W = 540;
  const FONT_H = '700 {s}px Fredoka, Nunito, sans-serif', FONT_B = '700 {s}px Nunito, sans-serif';
  const fnt = (f, s) => f.replace('{s}', s);
  function wrapText(ctx, text, maxW) {
    const out = []; String(text || '').split('\n').forEach(par => {
      let line = ''; par.split(/\s+/).filter(Boolean).forEach(w => {
        let t = line ? line + ' ' + w : w;
        if (ctx.measureText(t).width <= maxW) { line = t; return; }
        if (line) out.push(line); line = '';
        while (ctx.measureText(w).width > maxW) { let i = w.length; while (i > 1 && ctx.measureText(w.slice(0, i)).width > maxW) i--; out.push(w.slice(0, i)); w = w.slice(i); }
        line = w;
      });
      out.push(line);
    });
    return out;
  }
  function notaData(r) {
    const h = (r.hist || [])[(r.hist || []).length - 1] || {d: r.orderDate, days: r.days, price: r.price}, days = +h.days || +r.days || 30;
    return {
      no: 'NT' + String(h.d || r.orderDate).replace(/-/g, '').slice(2) + '-' + String(r.id).slice(-4).toUpperCase() + (r.renewals > 1 ? '-' + r.renewals : ''),
      kind: r.renewals > 0 ? 'NOTA PERPANJANGAN' : 'NOTA PEMBELIAN', date: h.d || r.orderDate, days, price: +h.price || +r.price || 0,
      from: addD(r.end, -days), end: r.end
    };
  }
  function drawNota(cv, r, o) {
    const d = notaData(r), ctx = cv.getContext('2d'), SC = 2, W = NT_W, PADX = 56, IW = W - PADX * 2;
    const rows = [['Pembeli', r.buyer || '-'], ['Produk', r.app]];
    if (o.email && r.email) rows.push(['Akun', r.email]);
    rows.push(['Durasi', dlab(d.days)], ['Mulai', fd(d.from)], ['Berakhir', fd(d.end)]);
    if (o.note && r.note) rows.push(['Catatan', r.note]);
    cv.width = W * SC; cv.height = 2000 * SC; ctx.setTransform(SC, 0, 0, SC, 0, 0);
    ctx.font = fnt(FONT_B, 15); const lay = rows.map(([l, val]) => ({l, lines: wrapText(ctx, val, IW - 110).slice(0, 3)}));
    const shopLines = (ctx.font = fnt(FONT_H, 26), wrapText(ctx, shopName(), IW).slice(0, 2));
    ctx.font = fnt(FONT_B, 13); const footLines = wrapText(ctx, (WT && WT.foot != null && String(WT.foot).trim()) ? WT.foot : WT_DEF.foot, IW).slice(0, 3);
    let H = 50 + 34 + 22 + shopLines.length * 30 + 14 + 22 + 30 + 16 + lay.reduce((t, x) => t + x.lines.length * 20 + 12, 0) + 16 + 96 + 26 + footLines.length * 18 + 44;
    cv.height = H * SC; ctx.setTransform(SC, 0, 0, SC, 0, 0); ctx.textAlign = 'center';
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fff0f6'); g.addColorStop(1, '#ffe3ef'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff'; drawRoundRect(ctx, 28, 28, W - 56, H - 56, 32); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#ffb8d8'; ctx.stroke();
    let y = 50; ctx.fillStyle = '#ff5fa2'; const bw = d.kind.length > 15 ? 230 : 190; drawRoundRect(ctx, W / 2 - bw / 2, y, bw, 34, 17); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = fnt(FONT_H, 15); ctx.fillText(d.kind, W / 2, y + 22); y += 34 + 34;
    ctx.fillStyle = '#3b1d2e'; ctx.font = fnt(FONT_H, 26); shopLines.forEach(t => { ctx.fillText(t, W / 2, y); y += 30; }); y -= 4;
    ctx.fillStyle = '#8c5a73'; ctx.font = fnt(FONT_B, 13); ctx.fillText(`${d.no} · ${fd(d.date)}`, W / 2, y + 16); y += 34;
    ctx.fillStyle = '#d9f7e6'; drawRoundRect(ctx, W / 2 - 46, y, 92, 26, 13); ctx.fill(); ctx.fillStyle = '#116b3a'; ctx.font = fnt(FONT_H, 13); ctx.fillText('✓ LUNAS', W / 2, y + 18); y += 26 + 18;
    const dash = yy => { ctx.save(); ctx.strokeStyle = '#f0c3d8'; ctx.lineWidth = 2; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(PADX, yy); ctx.lineTo(W - PADX, yy); ctx.stroke(); ctx.restore(); };
    dash(y); y += 22;
    lay.forEach(x => {
      ctx.textAlign = 'left'; ctx.fillStyle = '#9e6b84'; ctx.font = fnt(FONT_B, 14); ctx.fillText(x.l, PADX, y);
      ctx.textAlign = 'right'; ctx.fillStyle = '#3b1d2e'; ctx.font = fnt(FONT_B, 15); x.lines.forEach((t, i) => ctx.fillText(t, W - PADX, y + i * 20)); y += x.lines.length * 20 + 12;
    });
    y += 2; dash(y); y += 18;
    ctx.fillStyle = '#fff5f9'; drawRoundRect(ctx, PADX, y, IW, 78, 20); ctx.fill(); ctx.strokeStyle = '#ffd1e6'; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#8c5a73'; ctx.font = fnt(FONT_B, 13); ctx.fillText('TOTAL BAYAR', W / 2, y + 26);
    ctx.fillStyle = '#d81b60'; ctx.font = fnt(FONT_H, 34); ctx.fillText(rp(d.price), W / 2, y + 62); y += 78 + 28;
    ctx.fillStyle = '#6b3e54'; ctx.font = fnt(FONT_B, 13); footLines.forEach((t, i) => ctx.fillText(t, W / 2, y + i * 18));
  }
  async function openNota(r) {
    if (!r || r.ref) return toast('Catatan yang sudah di-refund tidak bisa dibuatkan nota');
    NT = r; const d = notaData(r);
    Q('#nt .ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">✕</button><h3>🧾 Nota pembelian</h3>
    <small>${E(r.app)}${r.buyer ? ' · ' + E(r.buyer) : ''} · ${d.no}</small>
    <div class="qr-canvas-wrap nt-wrap"><canvas id="ntCv"></canvas></div>
    <div class="tk-ckrow">${r.email ? '<label class="tk-ck"><input type="checkbox" id="ntEm" checked> Tampilkan akun</label>' : ''}${r.note ? '<label class="tk-ck"><input type="checkbox" id="ntNote"> Tampilkan catatan</label>' : ''}</div>
    <button class="btn pri wide" id="ntShare" type="button">📤 Kirim ke WhatsApp</button>
    <div class="row2"><button class="btn" id="ntCopy" type="button">📋 Salin gambar</button><button class="btn" id="ntDl" type="button">⬇ Unduh PNG</button></div>
    <small class="tk-hint">Di HP, tombol kirim langsung membuka pilihan aplikasi dengan gambar terlampir. Di komputer, gambar disalin lalu tinggal Paste (Ctrl+V) di chat WA.</small>`;
    Q('#nt').hidden = false;
    try { await Promise.all([document.fonts.load(fnt(FONT_H, 26)), document.fonts.load(fnt(FONT_B, 14))]); } catch (e) {}
    paintNota();
  }
  const notaOpts = () => ({email: !Q('#ntEm') || Q('#ntEm').checked, note: !!(Q('#ntNote') && Q('#ntNote').checked)});
  function paintNota() { const cv = Q('#ntCv'); if (cv && NT) drawNota(cv, NT, notaOpts()); }
  const notaBlob = () => new Promise(res => Q('#ntCv').toBlob(res, 'image/png'));
  const notaName = () => `Nota-${notaData(NT).no}.png`;
  function saveBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
  async function notaCopy(quiet) {
    if (navigator.clipboard && window.ClipboardItem) {
      try { await navigator.clipboard.write([new ClipboardItem({'image/png': notaBlob()})]); if (!quiet) toast('Nota disalin! Tinggal Paste (Ctrl+V) di chat WA 📋'); return true; } catch (e) {}
    }
    return false;
  }
  async function notaShare() {
    if (!NT) return; const msg = fill(tplOf('nota'), waVars(NT)), blob = await notaBlob(), file = new File([blob], notaName(), {type: 'image/png'});
    if (navigator.canShare && navigator.canShare({files: [file]})) {
      try { await navigator.share({files: [file], text: msg}); return; } catch (e) { if (e && e.name == 'AbortError') return; }
    }
    const ok = await notaCopy(true), n = waNum(NT.wa);
    window.open(n ? `https://wa.me/${n}?text=${encodeURIComponent(msg)}` : 'https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    if (ok) toast('Nota sudah disalin. Tempel (Paste) gambarnya di chat WA ✓'); else { saveBlob(blob, notaName()); toast('Nota diunduh, lampirkan gambarnya di chat WA ⬇'); }
  }

  /* ---------- Pesan & Nota (template WA per akun, t:'w') ---------- */
  const VARS = [['nama', 'Nama pembeli'], ['app', 'Aplikasi'], ['status', 'Status sisa hari'], ['tgl', 'Tgl berakhir'], ['sisa', 'Sisa hari'], ['harga', 'Harga'], ['toko', 'Nama toko'], ['email', 'Akun/email'], ['akun', 'Akun baru (klaim)']];
  const wpSample = () => { const r = [...R].filter(x => !x.ref).sort((a, b) => left(a) - left(b))[0]; return r ? waVars(r) : {nama: 'Budi', app: 'Netflix Premium', status: 'akan berakhir 3 hari lagi (24 Nov 2026)', tgl: '24 Nov 2026', sisa: '3 hari', harga: 'Rp35.000', toko: shopName(), email: 'akun@gmail.com', akun: ''}; };
  function wpPreview() {
    const sm = wpSample(), shop = v('wpShop').trim(); if (shop) sm.toko = shop;
    [['wpRemind', 'wpRemindPv', {}], ['wpNota', 'wpNotaPv', {}], ['wpClaim', 'wpClaimPv', {akun: 'Akun baru: akun.baru@gmail.com.'}]].forEach(([i, p, ex]) => { Q('#' + p).textContent = 'Pratinjau: ' + (fill(v(i) || '', {...sm, ...ex}) || '(kosong, pakai bawaan)'); });
  }
  function renderPesan(force) {
    if (!Q('#wpVars')) return; if (WPDIRTY && !force) return;
    Q('#wpVars').innerHTML = VARS.map(([k, l]) => `<button type="button" data-var="${k}" title="${l}">{${k}}</button>`).join('');
    Q('#wpShop').value = (WT && WT.shop) || ''; Q('#wpShop').placeholder = (Auth.user() || {}).username || 'Nama tokomu';
    Q('#wpFoot').value = (WT && WT.foot != null) ? WT.foot : WT_DEF.foot;
    Q('#wpRemind').value = tplOf('remind'); Q('#wpNota').value = tplOf('nota'); Q('#wpClaim').value = tplOf('claim'); WPDIRTY = false; wpPreview();
  }
  function saveTpl() {
    const rec = {...(WT || {}), t: 'w', id: (WT && WT.id) || 'wa_tpl', shop: v('wpShop').trim().slice(0, 40), foot: v('wpFoot').trim().slice(0, 140), remind: v('wpRemind').trim().slice(0, 400), nota: v('wpNota').trim().slice(0, 400), claim: v('wpClaim').trim().slice(0, 400)};
    WPDIRTY = false; persist(rec).then(ok => ok && toast('Pengaturan pesan & nota tersimpan di akunmu ✓'));
  }
  function resetTpl() {
    if (!confirm('Kembalikan semua template ke bawaan? Nama toko juga dikosongkan.')) return;
    if (!WT) { WPDIRTY = false; return renderPesan(true); }
    WPDIRTY = false; remove(WT.id).then(() => renderPesan(true)); toast('Template dikembalikan ke bawaan');
  }
  function insertVar(k) {
    const ta = WPLAST && document.body.contains(WPLAST) ? WPLAST : Q('#wpRemind'), a = ta.selectionStart ?? ta.value.length, b = ta.selectionEnd ?? a, t = `{${k}}`;
    ta.value = ta.value.slice(0, a) + t + ta.value.slice(b); ta.focus(); ta.setSelectionRange(a + t.length, a + t.length); WPDIRTY = true; wpPreview();
  }

  /* ---------- umum ---------- */
  function render() {
    stats(); remind(); lowstk(); renderRekap(); renderProd(); renderLap(); renderAlat(); renderQR(); renderKlaim(); renderPesan(); if (window.Kasir) Kasir.render();
    const hq = Q('#hubQr'); if (hq) hq.textContent = QCFG && QCFG.raw ? '✅ Aktif · ' + (QCFG.merch || 'tersimpan') : 'Belum diatur · upload QRIS tokomu';
  }
  const VIEWS = ['kasir', 'rekap', 'prod', 'lap', 'klaim', 'more', 'refund', 'qris', 'pesan', 'alat'], SUBV = ['refund', 'qris', 'pesan', 'alat']; // sub-halaman ikut menyalakan tab "Lainnya"
  function setView(k) {
    VIEW = k; VIEWS.forEach(x => Q('#v-' + x).hidden = x != k);
    const tab = SUBV.includes(k) ? 'more' : k;
    document.querySelectorAll('#vt button').forEach(b => b.classList.toggle('on', b.dataset.v == tab));
    if (k == 'refund') calc(); if (k == 'pesan') renderPesan(); stats(); remind(); lowstk();
  }
  function dlCsv(rows, name) {
    const q = x => '"' + String(x ?? '').replace(/"/g, '""') + '"';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\n')], {type: 'text/csv;charset=utf-8'}));
    a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv() {
    const rows = [['Aplikasi', 'Email', 'Pembeli', 'WA', 'Tgl order', 'Durasi (hari)', 'Tgl perpanjangan', 'Sisa hari', 'Status', 'Harga', 'Modal', 'Diperpanjang (x)', 'Refund', 'Catatan']]
      .concat([...R].sort((a, b) => order(a) - order(b)).map(r => [r.app, r.email, r.buyer, r.wa, r.orderDate, r.days, r.end, r.ref ? '' : left(r), {ok: 'Aktif', soon: 'Segera habis', ex: 'Lewat', ref: 'Refund'}[state(r)], r.price, r.cost, r.renewals || 0, r.ref ? r.ref.amount : '', r.note]));
    dlCsv(rows, `rekap-toko-${today()}.csv`);
  }
  function lockCheck() {
    if (!Auth.user()) return;
    const lock = S.PREMIUM_ONLY !== false && !Auth.isPremium(); if (lock === lockedNow) return;
    lockedNow = lock; Q('#lk').hidden = !lock; Q('#panel').hidden = lock; if (lock) demoInit(); if (!lock) { loadSet(); Q('#rfT').value = today(); calc(); load(); }
  }
  const pick = (arr, x) => { const i = arr.indexOf(x); i < 0 ? arr.push(x) : arr.splice(i, 1); };

  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset, rec = id => ALL.find(x => x.id == id);
    if (d.v) { setView(d.v); return window.scrollTo(0, 0); }
    if (d.more) { OPEN.has(d.more) ? OPEN.delete(d.more) : OPEN.add(d.more); const on = OPEN.has(d.more); b.closest('.tk-rec').classList.toggle('mo', on); return b.setAttribute('aria-expanded', on); }
    if (d.nota) return openNota(rec(d.nota));
    if (d.claim) return ceditor(null, rec(d.claim));
    if (d.cf) { CF = d.cf; return renderKlaim(); }
    if (d.cedit) return ceditor(rec(d.cedit));
    if (d.cdone) { const c = rec(d.cdone); return c && persist({...c, status: 'selesai', doneAt: today()}).then(ok => ok && toast('Klaim ditandai selesai ✓')); }
    if (d.cwa2) return claimWa(rec(d.cwa2));
    if (d.cfind != null) { CQS = d.cfind.toLowerCase(); Q('#cq').value = d.cfind; CF = 'all'; renderKlaim(); return window.scrollTo(0, 0); }
    if (d.var) return insertVar(d.var);
    if (d.f) { FLT = d.f; return renderRekap(); }
    if (d.edit) return editor(rec(d.edit));
    if (d.dup) { const r = rec(d.dup); return r && editor(null, {app: r.app, pid: r.pid, email: '', buyer: '', wa: '', price: r.price, cost: r.cost, orderDate: today(), days: r.days, rm: [...(r.rm || [])], note: ''}); }
    if (d.cwa) return custWa(rec(d.cwa));
    if (d.renew) return renewer(rec(d.renew));
    if (d.wa) return sendWa(rec(d.wa));
    if (d.rf) return refundFrom(rec(d.rf));
    if (d.qrec) return qrisFromRecord(rec(d.qrec));
    if (d.qramt) { Q('#qrAmt').value = d.qramt; return updateQRCalcUI(); }
    if (d.qruse != null) {
      const pr = ((QCFG && QCFG.presets) || [])[+d.qruse];
      if (pr) { Q('#qrAmt').value = pr.amt; Q('#qrNote').value = pr.label || ''; updateQRCalcUI(); toast('Preset diterapkan ✓'); }
      return;
    }
    if (d.qrpdel != null) {
      if (!QCFG) return;
      const presets = [...(QCFG.presets || [])];
      presets.splice(+d.qrpdel, 1);
      return persist({...QCFG, presets}).then(ok => ok && toast('Preset dihapus'));
    }
    if (d.ack) { const r = rec(d.ack); return persist({...r, rmDone: bucket(left(r), r.rm || [])}); }
    if (d.pedit) return peditor(rec(d.pedit));
    if (d.xedit) return xeditor(rec(d.xedit));
    if (d.stk) return stockAdj(rec(d.stk), +d.q);
    if (d.dur) return setDur(b.closest('#em') ? 'e' : 'r', +d.dur);
    if (d.tier != null) { const m = b.closest('#em') ? 'e' : 'r', p = m == 'e' ? P.find(x => x.id == EPID) : P.find(x => x.id == RN.pid); return p && useTier(m, p.tiers[+d.tier]); }
    if (d.rm) { pick(b.closest('#em') ? ERM : RRM, +d.rm); return b.classList.toggle('on'); }
    if (d.tradd !== undefined) { const t = Q('#pTiers'); if (t.children.length >= 8) return toast('Maksimal 8 paket harga'); return t.insertAdjacentHTML('beforeend', trow()); }
    if (d.trdel !== undefined) { const t = Q('#pTiers'); return t.children.length > 1 ? b.closest('.tk-trow').remove() : b.closest('.tk-trow').querySelectorAll('input').forEach(i => i.value = ''); }
    switch (b.id) {
      case 'add': return editor(null);
      case 'addp': return peditor(null);
      case 'addx': return xeditor(null);
      case 'addc': return ceditor(null);
      case 'csave': return saveClaim();
      case 'cdel': if (confirm('Hapus klaim ini? Tidak bisa dikembalikan.')) { Q('#cm').hidden = true; remove(CE.id); toast('Klaim dihapus'); } return;
      case 'ntShare': return notaShare();
      case 'ntCopy': return notaCopy().then(ok => { if (!ok) { notaBlob().then(bl => saveBlob(bl, notaName())); toast('Browser belum bisa menyalin gambar, nota diunduh ⬇'); } });
      case 'ntDl': return notaBlob().then(bl => { saveBlob(bl, notaName()); toast('Nota diunduh ✓'); });
      case 'wpSave': return saveTpl();
      case 'wpReset': return resetTpl();
      case 'csv': return R.length ? csv() : toast('Belum ada data untuk diunduh');
      case 'lapcsv': return lapCsv();
      case 'pcopy': return priceList() ? copy(priceList()).then(ok => toast(ok ? 'Daftar harga disalin, tinggal tempel ke WA' : 'Gagal menyalin')) : toast('Isi paket harga produk dulu');
      case 'esave': return saveEd();
      case 'edel': if (confirm(`Hapus catatan ${EDIT.app}? Tidak bisa dikembalikan.`)) { Q('#em').hidden = true; remove(EDIT.id); toast('Catatan dihapus'); } return;
      case 'psave': return savePrd();
      case 'pdel': if (confirm(`Hapus produk ${PE.name}? Catatan penjualan lama tetap ada.`)) { Q('#pm').hidden = true; remove(PE.id); toast('Produk dihapus'); } return;
      case 'xsave': return saveX();
      case 'xdel': if (confirm('Hapus pengeluaran ini?')) { Q('#xm').hidden = true; remove(XE.id); toast('Pengeluaran dihapus'); } return;
      case 'rsave': return saveRn();
      case 'rfcopy': return RFRES ? copy(rfText()).then(ok => toast(ok ? 'Rincian refund disalin' : 'Gagal menyalin')) : toast('Isi harga & durasi dulu');
      case 'rfrec': return refundRecord();
      case 'rfreset': return refundReset();
      case 'lapcopy': return copy(lapText()).then(ok => toast(ok ? 'Ringkasan disalin' : 'Gagal menyalin'));
      case 'dueCopy': return copy(dueText()).then(ok => toast(ok ? 'Daftar jatuh tempo disalin' : 'Gagal menyalin'));
      case 'bkp': return backup();
      case 'rst': return Q('#rstF').click();
      case 'tkth': return flipTheme();
      case 'qrManualBtn': Q('#qrManualWrap').hidden = false; return;
      case 'qrRawCancel': Q('#qrManualWrap').hidden = true; return;
      case 'qrRawSave': return saveQRConfig(v('qrRawIn'));
      case 'qrDelCfg': if (QCFG && confirm('Hapus QRIS tersimpan dari akun ini?')) { remove(QCFG.id); toast('QRIS dihapus'); } return;
      case 'qrGenBtn': updateQRCalcUI(); return toast('Gambar QRIS diperbarui ✓');
      case 'qrCopyImg': return copyQRImage();
      case 'qrDlImg': downloadQRImage(); return toast('Gambar QRIS diunduh ✓');
      case 'qrSavePreset': {
        if (!QCFG) return;
        const amt = Math.round(num('qrAmt'));
        if (!(amt > 0)) return toast('Isi nominal dulu sebelum simpan preset');
        const label = v('qrNote').trim() || rp(amt);
        const presets = [...(QCFG.presets || [])];
        if (presets.length >= 12) return toast('Maksimal 12 preset QRIS');
        presets.push({label, amt});
        return persist({...QCFG, presets}).then(ok => ok && toast('Preset QRIS disimpan ✓'));
      }
    }
  });
  document.addEventListener('input', e => {
    const id = e.target.id;
    if (id == 'q') { QS = e.target.value.trim().toLowerCase(); return renderRekap(); }
    if (id == 'cq') { CQS = e.target.value.trim().toLowerCase(); return renderKlaim(); }
    if (['wpShop', 'wpFoot', 'wpRemind', 'wpNota', 'wpClaim'].includes(id)) { WPDIRTY = true; return wpPreview(); }
    if (id == 'eDays' || id == 'rDays') {
      const n = Math.min(3650, Math.floor(+e.target.value)), ok = n > 0, m = id[0];
      if (m == 'e') EDAYS = ok ? n : 0; else RDAYS = ok ? n : 0;
      document.querySelectorAll(`#${m}Dur button`).forEach(x => x.classList.remove('on')); return m == 'e' ? syncEnd() : rPrev();
    }
    if (id == 'eOrd') return syncEnd();
    if (id == 'rfU') RFMAN = e.target.value !== '';
    if (id == 'rfO' || id == 'rfT') { RFMAN = false; autoUsed(); }
    if (/^rf/.test(id)) { if (['rfF', 'rfG', 'rfFT'].includes(id)) saveSet(); calc(); }
    if (id === 'qrAmt' || id === 'qrNote' || id === 'qrFeeVal') updateQRCalcUI();
  });
  document.addEventListener('change', e => {
    const id = e.target.id; if (id == 'rFrom') rPrev(); if (id == 'eProd') pickProd(e.target.value);
    if (id == 'cSale') cPickSale(e.target.value); if (id == 'cKind') Q('#cSwap').hidden = e.target.value != 'ganti'; if (id == 'ntEm' || id == 'ntNote') paintNota();
    if (id == 'lapM') renderLap(); if (id == 'rfFT') { saveSet(); calc(); }
  });

  document.addEventListener('change', async e => {
    const id = e.target.id;
    if (id == 'srt') { SRT = e.target.value; renderRekap(); }
    if (id == 'rstF') { restore(e.target.files[0]); e.target.value = ''; }
    if (id == 'qrFeeType') updateQRCalcUI();
    if (id == 'qrFile' || id == 'qrFile2') {
      const f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      toast('Membaca kode QRIS…');
      try {
        const raw = await decodeQRFromFile(f);
        await saveQRConfig(raw);
      } catch (err) {
        toast(String(err));
      }
    }
  });
  document.addEventListener('focusin', e => { if (/^wp(Remind|Nota|Claim)$/.test(e.target.id)) WPLAST = e.target; });
  paintTheme();
  window.WM_ON_AUTH = () => { lockedNow = null; lockCheck(); };
  window.WM_ON_LOGOUT = () => { ALL = []; split(); OPEN.clear(); WPDIRTY = false; CQS = ''; CF = 'all'; NT = null; CE = null; ['#cm', '#nt'].forEach(x => Q(x).hidden = true); setView('kasir'); lockedNow = null; Q('#panel').hidden = true; Q('#lk').hidden = true; document.title = 'Kasir & Rekap Toko · ReyVion'; };
  setInterval(lockCheck, 10000);
  setInterval(() => { if (!Q('#panel').hidden && !modalOpen()) render(); }, 60000);   // ganti hari -> sisa durasi ikut berubah
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Auth.user() && !Q('#panel').hidden && !modalOpen()) load(); });
  /* jembatan untuk kasir.js (modul kasir) */
  window.TK = {get R() { return R; }, get P() { return P; }, get WT() { return WT; }, get LG() { return LG; }, get QCFG() { return QCFG; },
    persist, remove, rp, fd, today, addD, uid, fill, waNum, shopName, buildDynamicQRIS, drawRoundRect, saveBlob, setView, tplOf, toast, RMS};
})();
