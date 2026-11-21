'use strict';
/* Akun Simpanan (tim FH): catat akun yang disimpan — email, password, masa aktif (tgl mulai + durasi → tgl berakhir otomatis),
   profil + PIN per profil, dan siapa yang memakai tiap profil beserta masa pakainya. Pengingat H-N untuk minta laporan ke marker.
   Tiap akun = 1 catatan (t:'a') di sheet milik member (Rec_<username>), jadi ikut backup/pulihkan dan tidak tercampur antar member. */
(() => {
  const Q = s => document.querySelector(s), T = () => window.TK;
  const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const v = id => (Q('#' + id) || {value: ''}).value;
  const key = s => String(s || '').trim().toLowerCase();
  const toast = m => T().toast(m), rp = n => T().rp(n), fd = s => T().fd(s);
  const ST = {ready: ['ok', 'Tersedia'], part: ['soon', 'Sebagian terpakai'], used: ['soon', 'Penuh / terpakai'], issue: ['ex', 'Bermasalah'], dead: ['rf', 'Mati / habis']};
  const FILTERS = [['all', 'Semua'], ['ready', 'Tersedia'], ['part', 'Sebagian'], ['used', 'Penuh'], ['issue', 'Bermasalah'], ['dead', 'Mati / habis'], ['soon', 'Segera habis']];
  const CFG = (window.WM_CONFIG && window.WM_CONFIG.AKUN) || {};
  const DURS = CFG.DURATIONS || [[7, '7 hari'], [14, '14 hari'], [30, '1 bulan'], [60, '2 bulan'], [90, '3 bulan'], [180, '6 bulan'], [365, '1 tahun']];
  const RMS = CFG.REMIND_DAYS || [1, 3, 5, 7], DEF_RM = CFG.DEFAULT_REMIND == null ? 3 : +CFG.DEFAULT_REMIND;
  const WA_ASK = CFG.WA_MARKER || 'Halo kak {marker}, akun {app} ({email}) {status}. Mohon kirim laporan pemakaian profilnya ya (siapa yang pakai & sisa masa aktif) 🙏';
  let AF = 'all', AQ = '', ASRT = 'new', EA = null, PS = 'cat', ED = 0, ERM = DEF_RM, ES = null, SD = 0; const SHOW = new Set();

  const A = () => (T() && T().AK) || [];
  const slots = a => (a.profs || []).length, filled = a => (a.profs || []).filter(p => p.u).length;
  /* status akun dihitung dari slot: kosong semua = tersedia, sebagian = sebagian terpakai, semua = penuh. Bermasalah / mati ditentukan manual. */
  const eff = a => { if (a.status == 'issue' || a.status == 'dead') return a.status; const n = slots(a); if (!n) return a.status == 'used' ? 'used' : 'ready'; const f = filled(a); return f == 0 ? 'ready' : f >= n ? 'used' : 'part'; };
  const free = a => { const e = eff(a); if (e == 'issue' || e == 'dead') return 0; return slots(a) ? slots(a) - filled(a) : (e == 'ready' ? 1 : 0); };
  const pd = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const dl = s => s ? Math.round((pd(s) - pd(T().today())) / 864e5) : null;
  const dleft = a => dl(a.exp);
  const span = (st, en) => Math.round((pd(en) - pd(st)) / 864e5);
  const pend = p => p.e || (p.s && +p.d > 0 ? T().addD(p.s, +p.d) : '');
  const rmOf = a => a.rm == null ? DEF_RM : Math.max(0, +a.rm || 0);
  const ltxt = d => d == null ? '' : d < 0 ? `lewat ${-d} hr` : d == 0 ? 'hari ini' : `${d} hr`;
  const sstate = (a, p) => { if (!p.u) return 'free'; const d = dl(pend(p)); return d == null ? 'on' : d < 0 ? 'ex' : d <= Math.max(1, rmOf(a)) ? 'soon' : 'on'; };
  const dlab = n => { const f = DURS.find(x => x[0] == n); return f ? f[1] : n + ' hari'; };
  const soonSlot = a => (a.profs || []).some(p => p.u && dl(pend(p)) != null && dl(pend(p)) <= 7);
  const match = (a, f = AF) => f == 'all' || (f == 'soon' ? eff(a) != 'dead' && ((dleft(a) != null && dleft(a) <= 7) || soonSlot(a)) : eff(a) == f);
  const ofProd = p => A().filter(a => a.pid == p.id || (!a.pid && key(a.app) == key(p.name)));
  /* pengingat: akun yang masa aktifnya tinggal <= N hari (N = pengaturan akun, bawaan 3) dan belum ditandai "sudah" */
  const adue = a => eff(a) != 'dead' && a.exp && rmOf(a) > 0 && dleft(a) <= rmOf(a) && a.rmDone != a.exp;
  const sdue = () => { const o = []; A().forEach(a => eff(a) != 'dead' && (a.profs || []).forEach((p, i) => { const e = pend(p), d = dl(e); if (p.u && e && rmOf(a) > 0 && d <= rmOf(a)) o.push({a, p, i, d}); })); return o.sort((x, y) => x.d - y.d); };

  async function copy(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      try { const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, t.length); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (_) { return false; }
    }
  }
  const say = (ok, m) => toast(ok ? m : 'Gagal menyalin, salin manual ya');

  /* ---------- teks salinan & laporan ---------- */
  const slotLine = (p, i, pin) => {
    const e = pend(p), d = dl(e), per = p.u ? (p.s || e ? ` · ${fd(p.s)}${e ? ' – ' + fd(e) : ''}${d != null ? ` (${ltxt(d)})` : ''}` : '') : '';
    return `${p.n || 'Profil ' + (i + 1)}${pin && p.p ? ' PIN ' + p.p : ''} → ${p.u ? p.u + per : '(kosong)'}`;
  };
  function acctText(a) {
    const L = [a.app, `📧 ${a.email || '-'}`, `🔑 ${a.pass || '-'}`];
    if (slots(a)) { L.push('👤 Profil:'); a.profs.forEach((p, i) => L.push(`${i + 1}. ${slotLine(p, i, true)}`)); }
    if (a.st || a.exp) L.push(`📅 Aktif: ${fd(a.st)} → ${fd(a.exp)}`); if (a.note) L.push(`📝 ${a.note}`);
    return L.join('\n');
  }
  function report(full) {
    const ls = A().slice().sort((a, b) => key(a.app).localeCompare(key(b.app)) || key(a.email).localeCompare(key(b.email))), by = {};
    ls.forEach(a => (by[a.app] = by[a.app] || []).push(a));
    const c = s => ls.filter(a => eff(a) == s).length, L = ['📋 *Laporan Akun Simpanan*', `${T().shopName()} · ${fd(T().today())}`,
      `Total ${ls.length} akun · Tersedia ${c('ready')} · Sebagian ${c('part')} · Penuh ${c('used')} · Bermasalah ${c('issue')} · Mati ${c('dead')}`, `Siap jual: ${ls.reduce((t, a) => t + free(a), 0)} slot/akun`, ''];
    Object.keys(by).forEach(app => {
      const g = by[app]; L.push(`*${app}* — ${g.length} akun, ${g.reduce((t, a) => t + free(a), 0)} siap jual`);
      g.forEach((a, i) => {
        const d = dleft(a);
        L.push(`${i + 1}. ${a.email || '(tanpa email)'} · ${ST[eff(a)][1]}${slots(a) ? ` · profil ${filled(a)}/${slots(a)}` : ''}${a.exp ? ` · ${a.st ? fd(a.st) + ' → ' : 'exp '}${fd(a.exp)}${d != null && d <= 7 ? (d < 0 ? ' (lewat)' : ` (${d} hr)`) : ''}` : ''}${a.holder ? ` · ${a.holder}` : ''}`);
        if (full && a.pass) L.push(`   🔑 ${a.pass}`);
        (a.profs || []).forEach((p, i2) => L.push(`   • ${slotLine(p, i2, full)}`));
      }); L.push('');
    });
    return L.join('\n').trim();
  }
  function csv() {
    const q = x => '"' + String(x ?? '').replace(/"/g, '""') + '"';
    const rows = [['Produk', 'Email', 'Password', 'Status', 'Pemegang / marker', 'WA marker', 'Tgl aktif', 'Durasi (hari)', 'Berakhir', 'Sisa hari', 'Ingatkan (H-)', 'Modal', 'Profil (nama | PIN | dipakai oleh | mulai | berakhir)', 'Slot kosong', 'Catatan']].concat(A().slice().sort((a, b) => key(a.app).localeCompare(key(b.app))).map(a =>
      [a.app, a.email, a.pass, ST[eff(a)][1], a.holder, a.hw, a.st, a.days || '', a.exp, dleft(a) ?? '', rmOf(a) || 'off', a.cost || '', (a.profs || []).map(p => `${p.n}:${p.p}:${p.u}:${p.s || ''}:${pend(p)}`).join(' | '), free(a), a.note]));
    const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\n')], {type: 'text/csv;charset=utf-8'}));
    el.download = `akun-simpanan-${T().today()}.csv`; document.body.appendChild(el); el.click(); setTimeout(() => { URL.revokeObjectURL(el.href); el.remove(); }, 500);
  }
  /* pesan minta laporan ke marker */
  function askMsg(a) {
    const d = dleft(a), stt = d == null ? 'perlu dicek' : d < 0 ? `sudah lewat ${-d} hari (${fd(a.exp)})` : d == 0 ? `berakhir hari ini (${fd(a.exp)})` : `akan berakhir ${d} hari lagi (${fd(a.exp)})`;
    return WA_ASK.replace(/\{(\w+)\}/g, (m, k) => ({marker: a.holder || '', app: a.app, email: a.email || '-', status: stt, tgl: fd(a.exp), sisa: d == null ? '-' : ltxt(d)})[k] ?? m).replace(/kak\s+,/g, 'kak,').replace(/[ \t]{2,}/g, ' ').trim();
  }
  async function ask(a) {
    const msg = askMsg(a), n = T().waNum(a.hw);
    if (n) return window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    say(await copy(msg), 'Pesan disalin, tempel ke chat marker ✓');
  }

  /* ---------- tampilan ---------- */
  function slotRow(a, p, i, sh) {
    const st = sstate(a, p), e = pend(p), d = dl(e), aid = E(a.id);
    const sub = p.u ? (p.s || e ? `📅 ${fd(p.s)}${e ? ' → ' + fd(e) : ' · tanpa batas'}${d != null ? ' · ' + (d < 0 ? 'lewat ' + -d + ' hr' : 'sisa ' + d + ' hr') : ''}` : 'Masa pakai belum diisi') : 'Ketuk untuk isi pemakai & durasi';
    return `<li><button type="button" class="ak-pf ${p.u ? 'on ' : ''}${st}" data-ax="slot" data-aid="${aid}" data-i="${i}" aria-label="Atur profil ${E(p.n || i + 1)}"><span class="ak-pn">${E(p.n || 'Profil ' + (i + 1))}</span><code>${p.p ? (sh ? E(p.p) : '••••') : '—'}</code><em>${p.u ? E(p.u) : 'kosong'}</em><small>${sub}</small></button></li>`;
  }
  function card(a) {
    const e = eff(a), [cls, lbl] = ST[e] || ST.ready, sh = SHOW.has(a.id), d = dleft(a), n = slots(a), f = filled(a), id = E(a.id), rm = rmOf(a);
    const profs = (a.profs || []).map((p, i) => slotRow(a, p, i, sh)).join('');
    const warn = adue(a) ? `<small class="ak-warn">🔔 Waktunya minta laporan ke ${E(a.holder || 'marker')} · ${d < 0 ? 'masa akun sudah lewat' : 'sisa ' + ltxt(d)}</small>` : '';
    return `<article class="tk-rec ak ${cls}"><div class="tk-h"><strong>${E(a.app)}</strong><span class="badge ${cls}">${lbl}</span></div>${warn}
      <div class="ak-cred">
        <div><span>📧</span><b>${E(a.email) || '—'}</b><button class="ak-i" type="button" data-ax="cm" data-aid="${id}" aria-label="Salin email">⧉</button></div>
        <div><span>🔑</span><b class="ak-pw">${a.pass ? (sh ? E(a.pass) : '••••••••') : '—'}</b><button class="ak-i" type="button" data-ax="eye" data-aid="${id}" aria-label="${sh ? 'Sembunyikan' : 'Lihat'} password &amp; PIN">${sh ? '🙈' : '👁'}</button><button class="ak-i" type="button" data-ax="cp" data-aid="${id}" aria-label="Salin password">⧉</button></div>
      </div>
      ${n ? `<div class="ak-sl"><small>👤 Profil ${f}/${n} terisi · ${n - f} kosong · ketuk profil untuk atur pemakai &amp; durasi</small><ul class="ak-pfs">${profs}</ul></div>` : ''}
      <div class="tk-grid"><span>Pemegang<b>${E(a.holder) || '-'}</b></span><span>Aktif sejak<b>${a.st ? fd(a.st) + (a.days ? ' · ' + E(dlab(a.days)) : '') : '-'}</b></span><span>Berakhir<b>${a.exp ? fd(a.exp) + (d != null ? (d < 0 ? ' · lewat' : ' · ' + d + ' hr') : '') : '-'}</b></span><span>Modal<b>${a.cost ? rp(a.cost) : '-'}</b></span></div>
      <small>${rm > 0 && a.exp ? '🔔 Ingatkan H-' + rm + ' untuk minta laporan' : '🔕 Tanpa pengingat'}${a.note ? ' · 📝 ' + E(a.note) : ''}</small>
      <div class="tk-act"><button class="btn pri" type="button" data-ax="copy" data-aid="${id}">📋 Salin data</button><button class="btn" type="button" data-ax="ask" data-aid="${id}">📣 Minta laporan</button>${n ? '' : `<button class="btn" type="button" data-ax="tog" data-aid="${id}">${a.status == 'ready' ? '✓ Terpakai' : '↺ Tersedia'}</button>`}<button class="btn" type="button" data-ax="edit" data-aid="${id}">Edit</button></div></article>`;
  }
  const SORTS = {
    new: (a, b) => (b.created || 0) - (a.created || 0),
    app: (a, b) => key(a.app).localeCompare(key(b.app)) || key(a.email).localeCompare(key(b.email)),
    due: (a, b) => (dleft(a) ?? 1e9) - (dleft(b) ?? 1e9),
    holder: (a, b) => key(a.holder || '~').localeCompare(key(b.holder || '~')) || key(a.app).localeCompare(key(b.app))
  };
  function alertHtml(inRekap) {
    const ad = A().filter(adue).sort((x, y) => dleft(x) - dleft(y)), sd = sdue();
    if (!ad.length && !sd.length) return '';
    if (inRekap) return `<b>🔐 Akun simpanan</b><small>${ad.length ? ad.length + ' akun perlu minta laporan ke marker' : ''}${ad.length && sd.length ? ' · ' : ''}${sd.length ? sd.length + ' profil segera habis' : ''}</small><button class="btn" type="button" data-akgo="1">Buka Akun Simpanan</button>`;
    let h = '';
    if (ad.length) h += `<b>🔔 ${ad.length} akun perlu minta laporan ke marker</b>` + ad.slice(0, 6).map(a => `<div class="tk-rmr"><span><strong>${E(a.app)}</strong> · ${E(a.holder || 'tanpa marker')}<small>${E(a.email || '')} · ${dleft(a) < 0 ? 'lewat ' + -dleft(a) + ' hr' : 'sisa ' + ltxt(dleft(a))} · ${fd(a.exp)}</small></span><button class="btn" data-ax="ask" data-aid="${E(a.id)}" type="button">${a.hw ? 'WA' : 'Salin'}</button><button class="btn" data-ax="ack" data-aid="${E(a.id)}" type="button">Sudah</button></div>`).join('') + (ad.length > 6 ? `<small>+${ad.length - 6} akun lainnya</small>` : '');
    if (sd.length) h += `<b>⏳ ${sd.length} profil segera habis</b>` + sd.slice(0, 6).map(({a, p, i, d}) => `<div class="tk-rmr"><span><strong>${E(a.app)}</strong> · ${E(p.n || 'Profil ' + (i + 1))} → ${E(p.u)}<small>${d < 0 ? 'lewat ' + -d + ' hr' : 'sisa ' + ltxt(d)} · ${fd(pend(p))}</small></span><button class="btn" data-ax="slot" data-aid="${E(a.id)}" data-i="${i}" type="button">Atur</button>${p.w && T().waNum(p.w) ? `<button class="btn" data-ax="swa" data-aid="${E(a.id)}" data-i="${i}" type="button">WA</button>` : '<span></span>'}</div>`).join('') + (sd.length > 6 ? `<small>+${sd.length - 6} profil lainnya</small>` : '');
    return h;
  }
  function render() {
    const list = Q('#akList'); if (!list) return; const ls = A();
    Q('#akSum').innerHTML = [['🔐', ls.length, 'Total akun'], ['✅', ls.filter(a => eff(a) == 'ready').length, 'Tersedia'], ['🧩', ls.reduce((t, a) => t + free(a), 0), 'Siap jual (slot)'], ['🛒', ls.reduce((t, a) => t + (eff(a) == 'issue' || eff(a) == 'dead' ? 0 : slots(a) ? filled(a) : (eff(a) == 'used' ? 1 : 0)), 0), 'Slot terpakai'], ['⚠️', ls.filter(a => eff(a) == 'issue').length, 'Bermasalah']]
      .map(([i, n, l]) => `<div class="st"><i>${i}</i><b>${n}</b><span>${l}</span></div>`).join('');
    Q('#akFlt').innerHTML = FILTERS.map(([k, l]) => `<button type="button" data-akf="${k}" class="${AF == k ? 'on' : ''}">${l}<em>${ls.filter(a => match(a, k)).length}</em></button>`).join('');
    const shown = ls.filter(a => match(a) && [a.app, a.email, a.holder, a.note, (a.profs || []).map(p => p.n + ' ' + p.u).join(' ')].join(' ').toLowerCase().includes(AQ)).sort(SORTS[ASRT] || SORTS.new);
    list.innerHTML = shown.map(card).join('') || `<div class="empty">${ls.length ? 'Tidak ada akun yang cocok.' : 'Belum ada akun simpanan. Klik “+ Akun” untuk mencatat email, password, dan profil akun yang kamu pegang.'}</div>`;
    const hl = Q('#akHl'); if (hl) hl.innerHTML = [...new Set(ls.map(a => a.holder).filter(Boolean))].map(h => `<option value="${E(h)}">`).join('');
    const rm = Q('#akRemind'); if (rm) { const h = alertHtml(false); rm.innerHTML = h; rm.hidden = !h; }
    const top = Q('#akAlert'), vr = Q('#v-rekap'); if (top) { const h = vr && !vr.hidden ? alertHtml(true) : ''; top.innerHTML = h; top.hidden = !h; }
    const nb = ls.filter(adue).length + sdue().length, sw = Q('#psw [data-ps="acc"]'); if (sw) sw.innerHTML = '🔐 Akun Simpanan' + (nb ? ` <em class="ak-bd">${nb}</em>` : '');
    document.querySelectorAll('#psw button').forEach(b => b.classList.toggle('on', b.dataset.ps == PS));
    Q('#p-cat').hidden = PS != 'cat'; Q('#p-acc').hidden = PS != 'acc';
  }
  const setPS = k => { PS = k; render(); };
  /* ringkasan akun untuk kartu produk (dipanggil toko.js) */
  function line(p) {
    const ak = ofProd(p); if (!ak.length) return '';
    return `<small>🔐 ${ak.length} akun simpanan · ${ak.reduce((t, a) => t + free(a), 0)} siap jual</small><div class="tk-act"><button class="btn" type="button" data-ax="sync" data-aid="${E(p.id)}">↻ Sinkron stok dari akun</button></div>`;
  }

  /* ---------- pemilih durasi (dipakai editor akun & editor profil) ---------- */
  const dchips = (cur, attr) => DURS.map(([n, l]) => `<button type="button" ${attr}="${n}" class="${cur == n ? 'on' : ''}">${l}</button>`).join('');
  const rchips = cur => `<button type="button" data-arm="0" class="${cur == 0 ? 'on' : ''}">Tanpa</button>` + RMS.map(n => `<button type="button" data-arm="${n}" class="${cur == n ? 'on' : ''}">H-${n}</button>`).join('');
  const mark = (box, attr, val) => document.querySelectorAll(box + ' button').forEach(b => b.classList.toggle('on', b.getAttribute(attr) == val));
  function prevAcc() { // tgl berakhir akun mengikuti tgl aktif + durasi
    const st = v('akSt'); if (st && ED > 0) Q('#akExp').value = T().addD(st, ED);
    const ex = v('akExp'), pv = Q('#akPrev'); if (pv) pv.textContent = st && ex ? `Aktif ${fd(st)} → berakhir ${fd(ex)}${ED > 0 ? ' (' + dlab(ED) + ')' : ''}` : 'Isi tanggal aktif dan pilih durasi, tanggal berakhir terisi otomatis.';
  }
  function prevSlot() {
    const st = v('slSt'); if (st && SD > 0) Q('#slEnd').value = T().addD(st, SD);
    const ex = v('slEnd'), pv = Q('#slPrev'), a = EA; let t = st && ex ? `Dipakai ${fd(st)} → ${fd(ex)}${SD > 0 ? ' (' + dlab(SD) + ')' : ''}` : (st ? 'Tanpa batas waktu (tidak ada tgl berakhir)' : 'Pilih tanggal mulai');
    if (a && a.exp && ex && ex > a.exp) t += ` ⚠ melewati masa akun (${fd(a.exp)})`;
    if (pv) pv.textContent = t;
  }

  /* ---------- editor akun ---------- */
  const prow = (p = {}) => `<div class="ak-prow" data-u0="${E(p.u || '')}" data-s="${E(p.s || '')}" data-d="${E(p.d || '')}" data-e="${E(p.e || '')}" data-w="${E(p.w || '')}"><input type="text" class="pn" maxlength="20" placeholder="Nama profil" aria-label="Nama profil" value="${E(p.n || '')}"><input type="text" class="pp" maxlength="8" inputmode="numeric" pattern="[0-9]*" placeholder="PIN" aria-label="PIN profil" value="${E(p.p || '')}"><button class="btn" type="button" data-ax="pdel" aria-label="Hapus profil">✕</button><input type="text" class="pu" maxlength="30" placeholder="Dipakai oleh (kosong = siap jual)" aria-label="Dipakai oleh" value="${E(p.u || '')}"></div>`;
  function editor(a) {
    EA = a || null; const d = a || {app: '', pid: '', email: '', pass: '', status: 'ready', holder: '', hw: '', st: T().today(), days: 30, exp: '', cost: '', note: '', profs: [], rm: DEF_RM}, P = T().P;
    ED = +d.days || (d.st && d.exp ? span(d.st, d.exp) : 0); ERM = d.rm == null ? DEF_RM : +d.rm;
    const sts = Object.entries(ST).filter(([k]) => k != 'part' && (k != 'used' || !slots(d))).map(([k, [, l]]) => `<option value="${k}" ${eff(d) == k || (d.status == k) ? 'selected' : ''}>${l}</option>`).join('');
    Q('#am .ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">✕</button><h3>${a ? 'Edit akun simpanan' : 'Tambah akun simpanan'}</h3>
    ${P.length ? `<label class="f"><span>Pilih dari produk (opsional)</span><select id="akProd"><option value="">— ketik manual —</option>${P.map(p => `<option value="${E(p.id)}" ${d.pid == p.id ? 'selected' : ''}>${E(p.name)}</option>`).join('')}</select></label>` : ''}
    <label class="f"><span>Nama aplikasi / produk</span><input type="text" id="akApp" list="appl" maxlength="60" placeholder="mis. Netflix Premium" value="${E(d.app)}"></label>
    <label class="f"><span>Email akun</span><input type="text" id="akEmail" maxlength="80" inputmode="email" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="mis. akun01@gmail.com" value="${E(d.email)}"></label>
    <label class="f"><span>Password akun</span><input type="text" id="akPass" maxlength="80" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="password login akun" value="${E(d.pass)}"></label>
    <div class="row2"><label class="f"><span>Pemegang / marker</span><input type="text" id="akHolder" list="akHl" maxlength="40" placeholder="mis. nama marker" value="${E(d.holder || '')}"></label>
    <label class="f"><span>WA marker (opsional)</span><input type="tel" id="akHw" maxlength="20" inputmode="tel" placeholder="08xxxxxxxxxx" value="${E(d.hw || '')}"></label></div>
    <label class="f"><span>Status</span><select id="akStat">${sts}</select></label>
    <div class="sec2"><h4>Masa aktif akun</h4>
      <label class="f"><span>Tanggal aktif (mulai)</span><input type="date" id="akSt" value="${E(d.st || '')}"></label>
      <div class="chips" id="akDur">${dchips(ED, 'data-adur')}</div>
      <label class="f"><span>Atau isi durasi sendiri (hari)</span><input type="number" id="akDays" min="1" max="3650" inputmode="numeric" placeholder="mis. 45" value="${DURS.some(x => x[0] == ED) || !ED ? '' : ED}"></label>
      <label class="f"><span>Tanggal berakhir (otomatis, bisa diubah)</span><input type="date" id="akExp" value="${E(d.exp || '')}"></label>
      <div class="prev" id="akPrev"></div></div>
    <div class="sec2"><h4>Ingatkan minta laporan ke marker</h4><small>Pengingat muncul saat masa akun tinggal sekian hari.</small>
      <div class="chips" id="akRm">${rchips(ERM)}</div>
      <label class="f"><span>Atau hari lain (sebelum habis)</span><input type="number" id="akRmN" min="1" max="60" inputmode="numeric" placeholder="mis. 10" value="${ERM > 0 && !RMS.includes(ERM) ? ERM : ''}"></label></div>
    <label class="f"><span>Modal akun (Rp)</span><input type="number" id="akCost" min="0" inputmode="numeric" value="${d.cost || ''}"></label>
    <div class="sec2"><h4>Profil &amp; PIN</h4><small>Satu baris per profil. Isi “dipakai oleh” kalau profil sudah dijual atau dipegang seseorang. Masa pakai &amp; durasi tiap profil diatur dengan mengetuk profil itu di kartu akun, setelah akun disimpan.</small>
    <div id="akProfs" class="sec2">${(d.profs || []).map(prow).join('')}</div>
    <div class="ak-padd"><button class="btn" type="button" data-ax="padd">+ Profil</button><button class="btn" type="button" data-ax="p5">+ 5 profil sekaligus</button></div></div>
    <label class="f"><span>Catatan</span><input type="text" id="akNote" maxlength="200" placeholder="mis. login hanya dari 1 perangkat" value="${E(d.note || '')}"></label>
    <button class="btn pri wide" id="akSave" type="button">Simpan akun</button>
    ${a ? '<button class="btn danger wide" id="akDel" type="button">Hapus akun</button>' : ''}`;
    prevAcc(); Q('#am').hidden = false;
  }
  function addProfs(n) {
    const box = Q('#akProfs'), cur = box.children.length; if (cur >= 10) return toast('Maksimal 10 profil per akun');
    const add = Math.min(n, 10 - cur); for (let i = 0; i < add; i++) box.insertAdjacentHTML('beforeend', prow({n: 'Profil ' + (cur + i + 1)}));
    const last = box.lastElementChild; if (n == 1 && last) last.querySelector('.pn').focus();
  }
  function save() {
    const app = v('akApp').trim(), email = v('akEmail').trim(); if (!app) return toast('Nama aplikasi wajib diisi'); if (!email) return toast('Email akun wajib diisi');
    if (A().some(x => (!EA || x.id != EA.id) && key(x.email) == key(email) && key(x.app) == key(app))) return toast('Akun itu sudah tercatat');
    const st = v('akSt'), exp = v('akExp'); if (st && exp && exp < st) return toast('Tanggal berakhir tidak boleh sebelum tanggal aktif');
    const t0 = T().today();
    const profs = [...document.querySelectorAll('#akProfs .ak-prow')].map(r => {
      const o = {n: r.querySelector('.pn').value.trim().slice(0, 20), p: r.querySelector('.pp').value.replace(/\s/g, '').slice(0, 8), u: r.querySelector('.pu').value.trim().slice(0, 30)};
      if (o.u) { const same = r.dataset.u0 == o.u; o.s = same && r.dataset.s ? r.dataset.s : t0; if (same) { if (+r.dataset.d > 0) o.d = +r.dataset.d; if (r.dataset.e) o.e = r.dataset.e; if (r.dataset.w) o.w = r.dataset.w; } } // ganti pemakai = masa pakai baru // pemakai dihapus = masa pakainya ikut dikosongkan
      return o;
    }).filter(p => p.n || p.p || p.u).slice(0, 10);
    profs.forEach((p, i) => { if (!p.n) p.n = 'Profil ' + (i + 1); });
    const rec = {...(EA || {t: 'a', id: T().uid(), created: Date.now()}), app, pid: v('akProd') || undefined, email, pass: v('akPass').trim().slice(0, 80), holder: v('akHolder').trim(), hw: v('akHw').trim().slice(0, 20), st, days: ED > 0 ? ED : undefined, exp, rm: ERM, rmDone: null,
      cost: Math.max(0, Math.round(+v('akCost') || 0)), status: v('akStat') || 'ready', note: v('akNote').trim(), profs};
    if (rec.status == 'used' && profs.length) rec.status = 'ready'; // dengan profil, status terpakai dihitung dari slot
    Q('#am').hidden = true; T().persist(rec).then(ok => ok && toast('Akun tersimpan ✓'));
  }

  /* ---------- editor profil: siapa yang pakai + masa pakainya ---------- */
  function slotEditor(a, i) {
    const p = (a.profs || [])[i]; if (!p) return; EA = a; ES = {aid: a.id, i};
    const e0 = pend(p); SD = +p.d || (p.s && e0 ? span(p.s, e0) : (p.u ? 0 : 30));
    Q('#am .ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">✕</button><h3>${E(p.n || 'Profil ' + (i + 1))} · ${E(a.app)}</h3>
    <small>${E(a.email || '')}${p.p ? ' · PIN ' + E(p.p) : ''}${a.exp ? ' · akun berakhir ' + fd(a.exp) : ''}</small>
    <label class="f"><span>Dipakai oleh</span><input type="text" id="slU" maxlength="30" placeholder="nama pembeli / pemakai" value="${E(p.u || '')}"></label>
    <label class="f"><span>WA pemakai (opsional, untuk ingatkan perpanjang)</span><input type="tel" id="slW" maxlength="20" inputmode="tel" placeholder="08xxxxxxxxxx" value="${E(p.w || '')}"></label>
    <div class="sec2"><h4>Masa pakai profil</h4>
      <label class="f"><span>Tanggal mulai</span><input type="date" id="slSt" value="${E(p.s || T().today())}"></label>
      <div class="chips" id="slDur">${dchips(SD, 'data-sdur')}</div>
      <label class="f"><span>Atau isi durasi sendiri (hari)</span><input type="number" id="slDays" min="1" max="3650" inputmode="numeric" placeholder="mis. 45" value="${DURS.some(x => x[0] == SD) || !SD ? '' : SD}"></label>
      <label class="f"><span>Tanggal berakhir (otomatis, bisa diubah)</span><input type="date" id="slEnd" value="${E(e0)}"></label>
      <div class="prev" id="slPrev"></div></div>
    <button class="btn pri wide" id="slSave" type="button">Simpan profil</button>
    ${p.u && e0 ? '<button class="btn wide" id="slRenew" type="button">🔁 Perpanjang: sambung dari tgl berakhir</button>' : ''}
    ${p.u ? '<button class="btn danger wide" id="slClear" type="button">Kosongkan profil (siap jual lagi)</button>' : ''}`;
    prevSlot(); Q('#am').hidden = false;
  }
  function slotPut(fn) { // ubah satu profil lalu simpan akunnya
    const a = A().find(x => x.id == ES.aid); if (!a) return; const ps = (a.profs || []).map(q => ({...q})); fn(ps[ES.i]);
    Q('#am').hidden = true; T().persist({...a, profs: ps}).then(ok => ok && toast('Profil tersimpan ✓'));
  }
  function slotSave() {
    const u = v('slU').trim().slice(0, 30), st = v('slSt'), end = v('slEnd'); if (!u) return toast('Isi nama pemakai, atau pilih “Kosongkan profil”');
    if (!st) return toast('Tanggal mulai wajib diisi'); if (end && end < st) return toast('Tanggal berakhir tidak boleh sebelum tanggal mulai');
    slotPut(p => { p.u = u; p.w = v('slW').trim().slice(0, 20) || undefined; p.s = st; p.e = end || undefined; p.d = end ? span(st, end) : undefined; if (!p.w) delete p.w; if (!p.e) delete p.e; if (!p.d) delete p.d; });
  }
  function slotRenew() { // mulai dari tgl berakhir lama, durasi sama
    const a = A().find(x => x.id == ES.aid), p = a && a.profs[ES.i]; if (!p) return; const old = pend(p), n = +p.d || (p.s ? span(p.s, old) : 30) || 30;
    const from = old < T().today() ? T().today() : old; slotPut(q => { q.s = from; q.d = n; q.e = T().addD(from, n); });
  }

  /* ---------- aksi ---------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset, acc = () => A().find(x => x.id == d.aid);
    if (d.ps) return setPS(d.ps);
    if (d.akgo) { T().setView('prod'); setPS('acc'); return window.scrollTo(0, 0); }
    if (d.akf) { AF = d.akf; return render(); }
    if (d.adur != null && d.adur !== '') { ED = +d.adur; mark('#akDur', 'data-adur', ED); Q('#akDays').value = ''; return prevAcc(); }
    if (d.sdur != null && d.sdur !== '') { SD = +d.sdur; mark('#slDur', 'data-sdur', SD); Q('#slDays').value = ''; return prevSlot(); }
    if (d.arm != null && d.arm !== '') { ERM = +d.arm; mark('#akRm', 'data-arm', ERM); Q('#akRmN').value = ''; return; }
    switch (d.ax) {
      case 'eye': SHOW.has(d.aid) ? SHOW.delete(d.aid) : SHOW.add(d.aid); return render();
      case 'cm': { const a = acc(); return a && say(await copy(a.email || ''), 'Email disalin ✓'); }
      case 'cp': { const a = acc(); return a && (a.pass ? say(await copy(a.pass), 'Password disalin ✓') : toast('Password belum diisi')); }
      case 'copy': { const a = acc(); return a && say(await copy(acctText(a)), 'Data akun disalin ✓'); }
      case 'ask': { const a = acc(); return a && ask(a); }
      case 'ack': { const a = acc(); return a && T().persist({...a, rmDone: a.exp}).then(ok => ok && toast('Pengingat ditandai sudah ✓')); }
      case 'tog': { const a = acc(); return a && T().persist({...a, status: a.status == 'ready' ? 'used' : 'ready'}).then(ok => ok && toast(a.status == 'ready' ? 'Ditandai terpakai' : 'Ditandai tersedia')); }
      case 'edit': return editor(acc());
      case 'slot': { const a = acc(); return a && slotEditor(a, +d.i); }
      case 'swa': { const a = acc(), p = a && a.profs[+d.i]; if (!p) return; const n = T().waNum(p.w), t = pend(p);
        return n && window.open(`https://wa.me/${n}?text=${encodeURIComponent(`Halo kak ${p.u}, masa pakai ${a.app} (${p.n}) kakak berakhir ${fd(t)}. Mau diperpanjang kak? 😊`)}`, '_blank', 'noopener'); }
      case 'padd': return addProfs(1);
      case 'p5': return addProfs(5);
      case 'pdel': return b.closest('.ak-prow').remove();
      case 'sync': {
        const p = T().P.find(x => x.id == d.aid); if (!p) return; const n = ofProd(p).reduce((t, a) => t + free(a), 0);
        if (!confirm(`Ubah stok ${p.name} dari ${+p.stock || 0} menjadi ${n} (sesuai slot/akun siap jual)?`)) return;
        return T().persist({...p, stock: n}).then(ok => ok && toast('Stok disinkronkan ✓'));
      }
    }
    switch (b.id) {
      case 'akAdd': return editor(null);
      case 'akSave': return save();
      case 'slSave': return slotSave();
      case 'slRenew': return slotRenew();
      case 'slClear': if (confirm('Kosongkan profil ini? Nama pemakai dan masa pakainya dihapus.')) slotPut(p => { p.u = ''; ['s', 'd', 'e', 'w'].forEach(k => delete p[k]); }); return;
      case 'akDel': if (EA && confirm(`Hapus akun ${EA.email || EA.app}? Tidak bisa dikembalikan.`)) { Q('#am').hidden = true; T().remove(EA.id); toast('Akun dihapus'); } return;
      case 'akCsv': return A().length ? (confirm('File CSV berisi password akun. Simpan dengan aman. Lanjut unduh?') && csv()) : toast('Belum ada akun untuk diunduh');
      case 'akRep': return A().length ? say(await copy(report(false)), 'Laporan disalin, tinggal tempel ke WA ✓') : toast('Belum ada akun');
      case 'akRepFull': return A().length ? (confirm('Laporan lengkap berisi password & PIN. Kirim hanya ke orang yang dipercaya. Lanjut salin?') && say(await copy(report(true)), 'Laporan lengkap disalin ✓')) : toast('Belum ada akun');
    }
  });
  document.addEventListener('input', e => {
    const id = e.target.id;
    if (id == 'akQ') { AQ = e.target.value.trim().toLowerCase(); render(); }
    if (id == 'akDays') { ED = Math.max(0, Math.min(3650, Math.floor(+e.target.value) || 0)); mark('#akDur', 'data-adur', ED); prevAcc(); }
    if (id == 'slDays') { SD = Math.max(0, Math.min(3650, Math.floor(+e.target.value) || 0)); mark('#slDur', 'data-sdur', SD); prevSlot(); }
    if (id == 'akRmN') { ERM = Math.max(0, Math.min(60, Math.floor(+e.target.value) || 0)); mark('#akRm', 'data-arm', ERM); }
  });
  document.addEventListener('change', e => {
    const id = e.target.id;
    if (id == 'akSrt') { ASRT = e.target.value; render(); }
    if (id == 'akProd') { const p = T().P.find(x => x.id == e.target.value); if (p) { Q('#akApp').value = p.name; if (p.cost && !+v('akCost')) Q('#akCost').value = p.cost; } }
    if (id == 'akSt') prevAcc();
    if (id == 'akExp') { ED = v('akSt') && v('akExp') ? Math.max(0, span(v('akSt'), v('akExp'))) : ED; mark('#akDur', 'data-adur', ED); prevAcc(); }
    if (id == 'slSt') prevSlot();
    if (id == 'slEnd') { SD = v('slSt') && v('slEnd') ? Math.max(0, span(v('slSt'), v('slEnd'))) : SD; mark('#slDur', 'data-sdur', SD); prevSlot(); }
  });
  window.Akun = {render, line, free, eff};
  render();
})();
