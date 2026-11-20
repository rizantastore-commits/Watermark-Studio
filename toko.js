'use strict';
/* Kasir & Rekap Toko: rekap jualan, produk & stok, pengeluaran, laporan, refund.
   Semua data per akun (Google Sheets via Apps Script, sheet "Records"). Jenis catatan: tanpa t = penjualan, t:'p' = produk, t:'x' = pengeluaran. */
(() => {
  const Q = s => document.querySelector(s), A = window.WM_API, C = window.WM_CONFIG, S = C.STORE || {}, E = Auth.esc, DAY = 864e5;
  const RMS = S.REMIND_DAYS || [1, 3, 7], DURS = S.DURATIONS || [7, 14, 30, 60, 90, 180, 365], XCAT = ['Iklan', 'Operasional', 'Fee / Admin', 'Lainnya'];
  const DL = {30: '1 bulan', 60: '2 bulan', 90: '3 bulan', 180: '6 bulan', 365: '1 tahun'};
  let ALL = [], R = [], P = [], X = [];            // semua catatan | penjualan | produk | pengeluaran
  let FLT = 'all', QS = '', EDIT = null, EPID = '', EDAYS = 30, ERM = [], RN = null, RDAYS = 30, RRM = [], PE = null, XE = null;
  let RFREC = null, RFRES = null, RFMAN = false, lockedNow = null, VIEW = 'rekap', SRT = 'due';

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
  const modalOpen = () => ['#em', '#rn', '#pm', '#xm'].some(s => !Q(s).hidden);

  /* ---------- status penjualan ---------- */
  const left = r => diff(today(), r.end);
  const state = r => r.ref ? 'ref' : left(r) < 0 ? 'ex' : left(r) <= 7 ? 'soon' : 'ok';
  const leftTxt = dl => dl < 0 ? `Lewat ${-dl} hari` : dl == 0 ? 'Berakhir hari ini' : `Sisa ${dl} hari`;
  const bucket = (dl, sel) => { if (dl < 0) return -1; for (const x of [...sel].sort((a, b) => a - b)) if (dl <= x) return x; return null; };
  const due = r => { if (r.ref || !r.rm || !r.rm.length) return false; const b = bucket(left(r), r.rm); return b !== null && b !== (r.rmDone == null ? null : r.rmDone); };
  const rmTxt = r => r.rm && r.rm.length ? '🔔 Ingatkan ' + [...r.rm].sort((a, b) => b - a).map(x => 'H-' + x).join(', ') : '🔕 Tanpa pengingat';
  const low = p => (+p.stock || 0) <= (p.min == null ? 3 : +p.min);

  /* ---------- simpan / muat ---------- */
  const split = () => { R = ALL.filter(x => !x.t); P = ALL.filter(x => x.t == 'p'); X = ALL.filter(x => x.t == 'x'); };
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
  function stats() { Q('#stats').innerHTML = statsHtml(R, P, X); }
  function remind() {
    const ls = R.filter(due).sort((a, b) => left(a) - left(b)), el = Q('#remind');
    document.title = (ls.length ? `(${ls.length}) ` : '') + 'Kasir & Rekap Toko · ReyVion';
    el.hidden = !ls.length; if (!ls.length) return;
    el.innerHTML = remindHtml(ls);
  }
  function remindHtml(ls) {
    return `<b>🔔 ${ls.length} akun perlu diingatkan</b>` + ls.slice(0, 6).map(r =>
      `<div class="tk-rmr"><span><strong>${E(r.app)}</strong>${r.buyer ? ' · ' + E(r.buyer) : ''}<small>${leftTxt(left(r))} · ${fd(r.end)}</small></span><button class="btn" data-wa="${r.id}" type="button">WA</button><button class="btn" data-ack="${r.id}" type="button">Sudah</button></div>`).join('')
      + (ls.length > 6 ? `<small>+${ls.length - 6} lainnya, lihat di filter "Perlu diingatkan"</small>` : '');
  }
  function lowstk() {
    const ls = P.filter(low).sort((a, b) => a.stock - b.stock), el = Q('#lowstk'); el.hidden = !ls.length; if (!ls.length) return;
    el.innerHTML = `<b>📦 Stok menipis</b><small>${ls.map(p => `${E(p.name)} (${+p.stock <= 0 ? 'habis' : p.stock})`).join(' · ')}</small>` + (VIEW != 'prod' ? '<button class="btn" data-v="prod" type="button">Lihat produk</button>' : '');
  }

  /* ---------- daftar penjualan ---------- */
  const FILTERS = [['all', 'Semua'], ['ok', 'Aktif'], ['soon', 'Segera habis'], ['ex', 'Lewat'], ['due', 'Perlu diingatkan'], ['ref', 'Refund']];
  const match = (r, f = FLT) => f == 'all' || (f == 'due' ? due(r) : state(r) == f);
  const order = r => (r.ref ? 1e6 : 0) + left(r);
  function card(r) {
    const dl = left(r), s = state(r), tot = Math.max(1, +r.days || 1), pct = r.ref ? 100 : Math.min(100, Math.max(0, (tot - dl) / tot * 100));
    const bd = s == 'ref' ? ['rf', 'Refund'] : [s, leftTxt(dl)];
    const acts = r.ref ? `<button class="btn" data-edit="${r.id}" type="button">Edit</button>`
      : `<button class="btn pri" data-renew="${r.id}" type="button">🔁 Perpanjang</button><button class="btn" data-wa="${r.id}" type="button">WA</button><button class="btn" data-rf="${r.id}" type="button">Refund</button><button class="btn" data-dup="${r.id}" type="button" title="Jual lagi ke pembeli lain">⧉ Duplikat</button><button class="btn" data-edit="${r.id}" type="button">Edit</button>`;
    const laba = (+r.price || 0) - (+r.cost || 0);
    return `<article class="tk-rec ${s}"><div class="tk-h"><strong>${E(r.app)}</strong><span class="badge ${bd[0]}">${E(bd[1])}</span></div>
      ${r.email ? `<small>📧 ${E(r.email)}</small>` : ''}${r.buyer || r.wa ? `<small>👤 ${E(r.buyer || '')}${r.wa ? ' · ' + E(r.wa) : ''}</small>` : ''}
      <div class="tk-grid"><span>Tgl order<b>${fd(r.orderDate)}</b></span><span>Durasi<b>${dlab(r.days)}</b></span><span>${r.ref ? 'Refund' : 'Perpanjangan'}<b>${r.ref ? rp(r.ref.amount) + ' · ' + fd(r.ref.date) : fd(r.end)}</b></span><span>Harga${r.cost ? ' · laba' : ''}<b>${rp(r.price)}${r.cost ? ` · <i class="${laba < 0 ? 'neg' : 'plus'}" style="font-style:normal">${rp(laba)}</i>` : ''}</b></span></div>
      <div class="tk-pg"><i style="width:${pct}%"></i></div>
      <small>${r.ref ? 'Sudah di-refund' : rmTxt(r)}${r.renewals ? ` · ${r.renewals}× diperpanjang` : ''}${r.note ? ' · ' + E(r.note) : ''}</small>
      <div class="tk-act">${acts}</div></article>`;
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
  function waMsg(r) {
    const dl = left(r), st = dl < 0 ? `sudah berakhir ${-dl} hari lalu (${fd(r.end)})` : dl == 0 ? `berakhir hari ini (${fd(r.end)})` : `akan berakhir ${dl} hari lagi (${fd(r.end)})`;
    return (S.WA_REMIND || 'Halo kak {nama}, {app} kakak {status}. Mau diperpanjang kak? 😊').replace('{nama}', r.buyer || '').replace('{app}', r.app).replace('{status}', st).replace(/kak\s+,/g, 'kak,').replace(/  +/g, ' ');
  }
  function copy(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(() => true, () => false);
    const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} a.remove(); return Promise.resolve(ok);
  }
  async function sendWa(r) {
    const msg = waMsg(r); let n = String(r.wa || '').replace(/\D/g, ''); if (n.startsWith('0')) n = '62' + n.slice(1);
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
    Q('#alCust').innerHTML = cs.map((c, i) => `<div class="tk-line c3"><span>${i + 1}. ${E(c.name)}<br><small>${c.n} transaksi · terakhir ${fd(c.last)}</small></span><b>${rp(c.total)}</b><button class="btn" data-cwa="${c.rec.id}" type="button">WA</button></div>`).join('') || '<small>Belum ada pembeli bernama. Isi “Nama pembeli” saat mencatat penjualan.</small>';
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
    if (x.t == 'x') return x.label && D1(x.date) ? {t: 'x', id, label: T1(x.label, 80), amount: N0(x.amount), date: D1(x.date), cat: T1(x.cat, 30)} : null;
    if (!x.app || !D1(x.orderDate) || !D1(x.end)) return null;
    return {id, pid: x.pid ? T1(x.pid, 40) : undefined, app: T1(x.app, 60), email: T1(x.email, 80), buyer: T1(x.buyer, 40), wa: T1(x.wa, 20), orderDate: D1(x.orderDate), end: D1(x.end), days: Math.floor(N0(x.days)) || 30,
      price: N0(x.price), cost: N0(x.cost), note: T1(x.note, 200), rm: A1(x.rm).map(Number).filter(n => n > 0 && n <= 365).slice(0, 5), rmDone: x.rmDone == null ? null : N0(x.rmDone),
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
  const dx = h => h.replace(/ data-(renew|wa|rf|edit|dup|ack|stk|pedit|xedit)="[^"]*"( data-q="[^"]*")?/g, ' data-dx="$1"');
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
      pedit: 'Edit produk, modal & paket harga', xedit: 'Edit pengeluaran', xadd: 'Catat biaya iklan, fee, dll. untuk laba bersih', csv: 'Unduh rekap ke CSV / Excel', padd: 'Isi katalog produk sekali, dipakai terus', pcopy: 'Salin daftar harga siap tempel ke WA'};
    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); const d = b.dataset;
      if (d.dv) { box.querySelectorAll('[data-dv]').forEach(x => x.classList.toggle('on', x == b)); ['rekap', 'prod', 'lap', 'refund'].forEach(k => Q('#dv-' + k).hidden = k != d.dv); return; }
      if (d.dflt) { DF = d.dflt; return dmRekap(); }
      if (d.dx) { toast((HINT[d.dx] || 'Ini contoh tampilan') + ' ✨'); if (++DCLICK % 4 == 0) Auth.upsell('Kasir & Rekap Toko'); }
    });
    box.addEventListener('input', e => { if (e.target.id == 'dQ') { DQ = e.target.value.trim().toLowerCase(); dmRekap(); } else if (/^d[PDUF]$/.test(e.target.id)) dmRefund(); });
  }

  /* ---------- umum ---------- */
  function render() { stats(); remind(); lowstk(); renderRekap(); renderProd(); renderLap(); renderAlat(); }
  function setView(k) {
    VIEW = k; ['rekap', 'prod', 'lap', 'refund', 'alat'].forEach(x => Q('#v-' + x).hidden = x != k);
    document.querySelectorAll('#vt button').forEach(b => b.classList.toggle('on', b.dataset.v == k));
    if (k == 'refund') calc(); lowstk();
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
    if (d.v) return setView(d.v);
    if (d.f) { FLT = d.f; return renderRekap(); }
    if (d.edit) return editor(rec(d.edit));
    if (d.dup) { const r = rec(d.dup); return r && editor(null, {app: r.app, pid: r.pid, email: '', buyer: '', wa: '', price: r.price, cost: r.cost, orderDate: today(), days: r.days, rm: [...(r.rm || [])], note: ''}); }
    if (d.cwa) return custWa(rec(d.cwa));
    if (d.renew) return renewer(rec(d.renew));
    if (d.wa) return sendWa(rec(d.wa));
    if (d.rf) return refundFrom(rec(d.rf));
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
    }
  });
  document.addEventListener('input', e => {
    const id = e.target.id;
    if (id == 'q') { QS = e.target.value.trim().toLowerCase(); return renderRekap(); }
    if (id == 'eDays' || id == 'rDays') {
      const n = Math.min(3650, Math.floor(+e.target.value)), ok = n > 0, m = id[0];
      if (m == 'e') EDAYS = ok ? n : 0; else RDAYS = ok ? n : 0;
      document.querySelectorAll(`#${m}Dur button`).forEach(x => x.classList.remove('on')); return m == 'e' ? syncEnd() : rPrev();
    }
    if (id == 'eOrd') return syncEnd();
    if (id == 'rfU') RFMAN = e.target.value !== '';
    if (id == 'rfO' || id == 'rfT') { RFMAN = false; autoUsed(); }
    if (/^rf/.test(id)) { if (['rfF', 'rfG', 'rfFT'].includes(id)) saveSet(); calc(); }
  });
  document.addEventListener('change', e => {
    const id = e.target.id; if (id == 'rFrom') rPrev(); if (id == 'eProd') pickProd(e.target.value);
    if (id == 'lapM') renderLap(); if (id == 'rfFT') { saveSet(); calc(); }
  });

  document.addEventListener('change', e => { if (e.target.id == 'srt') { SRT = e.target.value; renderRekap(); } if (e.target.id == 'rstF') { restore(e.target.files[0]); e.target.value = ''; } });
  paintTheme();
  window.WM_ON_AUTH = () => { lockedNow = null; lockCheck(); };
  window.WM_ON_LOGOUT = () => { ALL = []; split(); lockedNow = null; Q('#panel').hidden = true; Q('#lk').hidden = true; document.title = 'Kasir & Rekap Toko · ReyVion'; };
  setInterval(lockCheck, 10000);
  setInterval(() => { if (!Q('#panel').hidden && !modalOpen()) render(); }, 60000);   // ganti hari -> sisa durasi ikut berubah
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Auth.user() && !Q('#panel').hidden && !modalOpen()) load(); });
})();
