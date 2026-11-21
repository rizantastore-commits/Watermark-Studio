'use strict';
/* Panel admin v21: tab bawah, ringkasan, aksi massal, log aktivitas, pengaturan web, rincian pemakaian member */
(() => {
  const Q = s => document.querySelector(s), QA = s => [...document.querySelectorAll(s)], E = Auth.esc, ADM = window.ADM, DAY = 864e5;
  const TABS = ['dash', 'mem', 'log', 'set'], U = () => ADM.users(), NOW = () => Auth.now();
  const abs = t => t ? new Date(t).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : '-';
  const OLD = 'Code.gs belum diperbarui ke v21. Tempel Code.gs terbaru di Apps Script lalu Deploy → Manage deployments → Edit → New version.';
  const err = r => r.code == 'unknown' ? OLD : r.error;
  let tab = 'dash', ready = false, LOGS = [], LF = 'all', CFGV = null;

  /* ---------- jendela isian kecil (pengganti prompt() yang jelek di HP) ---------- */
  let askRes = null;
  ADM.ask = o => new Promise(res => {
    askRes = res; const f = Q('#askf');
    f.innerHTML = `<button class="mx" type="button" data-askx aria-label="Tutup">✕</button><h3>${E(o.title)}</h3>${o.sub ? `<small>${E(o.sub)}</small>` : ''}
      ${o.fields.map(x => `<label class="f"><span>${E(x.label)}</span><input id="ask_${x.id}" type="${x.type || 'text'}" ${x.num ? 'inputmode="numeric"' : ''} placeholder="${E(x.ph || '')}" value="${E(x.v || '')}" autocapitalize="none" spellcheck="false"></label>`).join('')}
      <div class="row2"><button class="btn" type="button" data-askx>Batal</button><button class="btn pri" type="submit">${E(o.ok || 'Simpan')}</button></div>`;
    f._f = o.fields; Q('#ask').hidden = false; setTimeout(() => { const i = f.querySelector('input'); i && i.focus(); }, 60);
  });
  const askDone = v => { Q('#ask').hidden = true; if (askRes) askRes(v); askRes = null; };
  Q('#askf').addEventListener('submit', e => { e.preventDefault(); const v = {}; Q('#askf')._f.forEach(x => v[x.id] = Q('#ask_' + x.id).value); if (Object.values(v).some(x => !String(x).trim())) return toast('Isi semua kolom dulu ya'); askDone(v); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-askx]') || e.target.id == 'ask') askDone(null);
    else if (e.target.id == 'em') Q('#em').hidden = true; // ketuk area gelap = tutup
  });
  document.addEventListener('keydown', e => { if (e.key == 'Escape') { if (!Q('#ask').hidden) askDone(null); else Q('#em').hidden = true; } });

  /* ---------- tab ---------- */
  function go(t) {
    if (!TABS.includes(t)) t = 'dash'; tab = t;
    QA('.tab').forEach(x => x.hidden = x.id != 't-' + t);
    QA('#bnav button').forEach(b => b.classList.toggle('on', b.dataset.tab == t));
    try { history.replaceState(null, '', '#' + t); } catch (e) {}
    if (ready) { if (t == 'log') loadLog(); if (t == 'set') loadCfg(); }
    window.scrollTo(0, 0);
  }

  /* ---------- ringkasan ---------- */
  const mini = (u, info, btn) => `<div class="mini-r"><span class="mav">${Auth.avatar(u)}</span><div><b>${E(u.username)}</b><small>${info}</small></div>${btn || `<button class="btn" data-open="${E(u.username)}" type="button">Atur</button>`}</div>`;
  function dash() {
    const us = U(), n = NOW(), P = u => u.premium && u.role == 'premium', soon = us.filter(u => P(u) && u.premiumUntil < n + 7 * DAY && u.premiumUntil < 4e12).sort((a, b) => a.premiumUntil - b.premiumUntil);
    const seen = u => u.lastSeen || u.lastLogin || 0, on15 = us.filter(u => seen(u) > n - 15 * 60 * 1000).length;
    Q('#stats').innerHTML = [['👥', us.length, 'Total member'], ['👑', us.filter(P).length, 'Premium aktif'], ['🌱', us.filter(u => u.role == 'free' && u.status == 'active').length, 'Gratis'], ['⏰', soon.length, 'Habis ≤ 7 hari'],
      ['🟢', on15, 'Online sekarang'], ['📅', us.filter(u => seen(u) > n - DAY).length, 'Aktif 24 jam'], ['✨', us.filter(u => u.createdAt > n - DAY).length, 'Daftar 24 jam'], ['⛔', us.filter(u => u.status == 'suspended').length, 'Nonaktif']]
      .map(([i, v, l]) => `<div class="st"><i>${i}</i><b>${v}</b><span>${l}</span></div>`).join('');
    const nb = Q('#nbMem'); nb.hidden = !soon.length; nb.textContent = soon.length;
    const al = Q('#alertbar'); al.hidden = !soon.length;
    if (soon.length) al.innerHTML = `<span>⏰ <b>${soon.length}</b> premium habis ≤ 7 hari: ${soon.slice(0, 3).map(u => E(u.username) + ' (' + ADM.daysLeft(u) + ' hr)').join(', ')}${soon.length > 3 ? ' …' : ''}</span><button class="btn" data-goto="mem" data-f="soon" type="button">Lihat</button>`;
    const ds = [...Array(14)].map((_, i) => { const d = new Date(n - (13 - i) * DAY); d.setHours(0, 0, 0, 0); return d.getTime(); }), cn = ds.map(t => us.filter(u => u.createdAt >= t && u.createdAt < t + DAY).length), mx = Math.max(1, ...cn);
    const act = us.filter(u => seen(u)).sort((a, b) => seen(b) - seen(a)).slice(0, 5), use = us.filter(u => (ADM.use[u.username.toLowerCase()] || {}).rec).sort((a, b) => ADM.use[b.username.toLowerCase()].rec - ADM.use[a.username.toLowerCase()].rec).slice(0, 5);
    const rec = Object.values(ADM.use).reduce((s, x) => s + x.rec, 0);
    Q('#dash').innerHTML = `
      <section class="dc"><h4>📈 Pendaftar 14 hari terakhir <em>${cn.reduce((a, b) => a + b, 0)} akun</em></h4><div class="bars">${cn.map((c, i) => `<i style="--h:${(c / mx).toFixed(2)}" title="${c} akun"><b>${c || ''}</b><s>${new Date(ds[i]).getDate()}</s></i>`).join('')}</div></section>
      <section class="dc"><h4>⏰ Segera habis</h4>${soon.slice(0, 5).map(u => mini(u, `${ADM.daysLeft(u)} hari lagi · ${ADM.fd(u.premiumUntil)}`, `<button class="btn pri" data-x30="${E(u.username)}" type="button">+30 hr</button>`)).join('') || '<p class="dnone">Tidak ada premium yang hampir habis 🎉</p>'}</section>
      <section class="dc"><h4>🟢 Aktif terbaru</h4>${act.map(u => mini(u, (seen(u) > n - 15 * 60 * 1000 ? '<b class="ok">online</b> · ' : '') + ADM.rel(seen(u)))).join('') || '<p class="dnone">Belum ada aktivitas.</p>'}</section>
      <section class="dc"><h4>🧾 Pemakai kasir terbanyak <em>${rec} catatan</em></h4>${use.map(u => mini(u, ADM.use[u.username.toLowerCase()].rec + ' catatan' + (ADM.use[u.username.toLowerCase()].tpl ? ' · ' + ADM.use[u.username.toLowerCase()].tpl + ' template' : ''))).join('') || '<p class="dnone">Belum ada data kasir.</p>'}</section>`;
  }
  document.addEventListener('adm:users', () => { dash(); bulk(); if (!ready) { ready = true; go(tab); } });

  /* ---------- aksi massal ---------- */
  function bulk() {
    const b = Q('#bulk'), n = ADM.sel.size; QA('[data-sel]').forEach(c => c.checked = ADM.sel.has(c.dataset.sel));
    b.hidden = !n; document.body.classList.toggle('hasbulk', !!n); if (!n) return;
    b.innerHTML = `<div class="bk-h"><b>${n} dipilih</b><button class="btn" data-bk="all" type="button">Pilih semua</button><button class="btn" data-bk="none" type="button">Batal</button></div>
      <div class="bk-a"><button class="btn pri" data-bk="extend" type="button">👑 +Premium</button><button class="btn" data-bk="free" type="button">Jadikan gratis</button><button class="btn" data-bk="suspend" type="button">Nonaktifkan</button><button class="btn" data-bk="activate" type="button">Aktifkan</button></div>`;
  }
  document.addEventListener('adm:sel', bulk);
  async function doBulk(op) {
    const names = [...ADM.sel]; let days = 0, lb = {free: 'dijadikan gratis', suspend: 'dinonaktifkan', activate: 'diaktifkan'}[op];
    if (op == 'extend') { const v = await ADM.ask({title: 'Tambah premium', sub: `${names.length} member dipilih. Dihitung dari sisa durasi masing-masing.`, ok: 'Tambahkan', fields: [{id: 'd', label: 'Jumlah hari (mis. 30)', v: '30', num: 1}]}); if (!v) return; days = Math.floor(+v.d); if (!(days > 0)) return toast('Jumlah hari tidak valid'); lb = `ditambah ${days} hari`; }
    else if (!confirm(`${names.length} member akan ${lb}. Lanjutkan?`)) return;
    const r = await ADM.api('admin_bulk', {op, days, usernames: names}); if (!r.ok) return toast(err(r));
    ADM.sel.clear(); toast(`${r.done} member ${lb} ✓`); ADM.reload(true);
  }

  /* ---------- log aktivitas ---------- */
  const LG = {login: ['🔑', 'Masuk'], login_fail: ['⚠️', 'Gagal masuk'], login_blocked: ['⛔', 'Masuk ditolak (nonaktif)'], register: ['✨', 'Daftar akun baru'], acct_update: ['🪪', 'Ubah akun'], admin_create: ['➕', 'membuat member'], admin_update: ['✏️', 'mengubah'], admin_reset: ['🔒', 'reset password'], admin_delete: ['🗑️', 'menghapus'], admin_kick: ['🚪', 'paksa keluar'], cfg: ['⚙️', 'mengubah pengaturan web']};
  const LFS = [['all', 'Semua', () => 1], ['in', 'Masuk', l => l.action == 'login'], ['bad', 'Gagal / ditolak', l => /^login_(fail|blocked)/.test(l.action)], ['reg', 'Daftar', l => l.action == 'register'], ['adm', 'Aksi admin', l => /^(admin_|bulk_|cfg)/.test(l.action)]];
  function drawLog() {
    Q('#lflt').innerHTML = LFS.map(([k, l, f]) => `<button data-lf="${k}" class="${LF == k ? 'on' : ''}">${l}<em>${LOGS.filter(f).length}</em></button>`).join('') + '<button data-lf="rf" type="button">↻</button>';
    const f = LFS.find(x => x[0] == LF)[2], ls = LOGS.filter(f);
    Q('#loglist').innerHTML = ls.map(l => { const m = LG[l.action] || (l.action.startsWith('bulk_') ? ['📦', 'aksi massal ' + l.action.slice(5)] : ['•', l.action]), self = l.action == 'login' || l.action == 'register' || l.action == 'login_fail' || l.action == 'login_blocked' || l.action == 'acct_update';
      return `<div class="lg ${/fail|blocked/.test(l.action) ? 'bad' : ''}"><span class="lgi">${m[0]}</span><div><b>${E(l.actor || '?')}</b> ${self ? '' : ''}<span>${E(m[1])}</span>${!self && l.target ? ` <b>${E(l.target)}</b>` : ''}${l.detail ? `<small>${E(l.detail)}</small>` : ''}</div><time title="${abs(l.time)}">${ADM.rel(l.time)}</time></div>`; }).join('') || '<div class="empty">Belum ada catatan aktivitas.</div>';
  }
  async function loadLog() {
    Q('#loglist').innerHTML = '<div class="gload"><span class="spin"></span>Memuat aktivitas…</div>';
    const r = await ADM.api('admin_log', {limit: 300}); if (!r.ok) return Q('#loglist').innerHTML = `<div class="empty">${E(err(r))}</div>`;
    LOGS = r.logs; drawLog();
  }

  /* ---------- pengaturan web ---------- */
  async function loadCfg() {
    const b = Q('#setbox'); b.innerHTML = '<div class="gload"><span class="spin"></span>Memuat…</div>';
    const r = await ADM.api('admin_cfg'); if (!r.ok) return b.innerHTML = `<div class="empty">${E(err(r))}</div>`;
    CFGV = r.cfg; const c = r.cfg;
    b.innerHTML = `<h3>⚙️ Pengaturan web</h3><small>Berlaku langsung tanpa upload ulang (tersimpan di sheet Config).</small>
      <label class="f"><span>Nomor WhatsApp admin</span><input id="cwa" type="tel" inputmode="numeric" value="${E(c.waNumber || '')}" placeholder="62812xxxxxxx"></label>
      <label class="f"><span>Pesan WhatsApp awal</span><input id="cwt" type="text" maxlength="300" value="${E(c.waText || '')}"></label>
      <label class="chk"><span>Pendaftaran akun baru dibuka</span><input type="checkbox" id="creg" ${c.registerOpen !== false ? 'checked' : ''}></label>
      <button class="btn pri wide" id="csave" type="button">Simpan pengaturan</button>
      <h3>🔗 Pintasan</h3>
      <div class="shortcuts"><a class="btn" href="index.html">🧾 Kasir</a><a class="btn" href="watermark.html">🎀 Watermark</a><button class="btn" data-goto="mem" data-csv type="button">⬇ Unduh member</button><button class="btn" id="creload" type="button">↻ Muat ulang data</button></div>
      <h3>ℹ️ Info</h3><div class="usage"><span>Mode <b>${WM_API.DEMO ? 'DEMO (data di browser)' : 'LIVE (Google Sheets)'}</b></span><span>Member <b>${U().length}</b></span><span>Admin <b>${U().filter(u => u.role == 'admin').length}</b></span></div>`;
  }

  /* ---------- rincian pemakaian di jendela Atur ---------- */
  const TL = {penjualan: '🛒 Penjualan', produk: '📦 Produk', pengeluaran: '💸 Pengeluaran', akun: '🔐 Akun simpanan', klaim: '🛟 Klaim', qris: 'QRIS', template: 'Pesan', logo: 'Logo', kasir: '🧾 Kasir'};
  ADM.afterEdit = async u => {
    const r = await ADM.api('admin_member', {username: u.username}), b = Q('#eusage'); if (!b) return;
    const seen = u.lastSeen || u.lastLogin;
    if (!r.ok) return b.innerHTML = `<small>${E(err(r))}</small>`;
    const d = r.data, t = Object.entries(d.types).map(([k, v]) => `<span>${TL[k] || E(k)} <b>${v}</b></span>`).join('');
    b.innerHTML = `<span>🕒 Aktif <b>${seen ? ADM.rel(seen) : 'belum pernah'}</b></span><span>🔑 Masuk <b>${u.lastLogin ? abs(u.lastLogin) : '-'}</b></span><span>🧾 Total catatan <b>${d.total}</b></span>${t}<span>🎀 Template <b>${d.tpls.length}</b>${d.tpls.length ? ' · ' + E(d.tpls.slice(0, 3).join(', ')) : ''}</span>${d.last ? `<span>✏️ Data terakhir <b>${abs(d.last)}</b></span>` : ''}`;
  };

  /* ---------- klik ---------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('button, a'); if (!b) return; const d = b.dataset;
    if (b.closest('#bnav')) return go(d.tab);
    if (d.goto) { go(d.goto); if (d.csv) Q('#xcsv').click(); if (d.f) ADM.setFilter(d.f); return; } // admin.js juga menangani data-f
    if (d.open) { go('mem'); return ADM.openEdit(d.open); }
    if (d.x30) return ADM.extend30(d.x30);
    if (d.lf) { if (d.lf == 'rf') return loadLog(); LF = d.lf; return drawLog(); }
    if (d.bk) { if (d.bk == 'none') ADM.sel.clear(); else if (d.bk == 'all') QA('[data-sel]:not(:disabled)').forEach(c => ADM.sel.add(c.dataset.sel)); else return doBulk(d.bk); return bulk(); }
    if (b.id == 'creload') { ADM.reload(); return toast('Memuat ulang…'); }
    if (b.id == 'csave') {
      const wa = Q('#cwa').value.trim(), r = await ADM.api('admin_cfg', {set: 1, waNumber: wa, waText: Q('#cwt').value.trim(), registerOpen: Q('#creg').checked});
      return toast(r.ok ? 'Pengaturan tersimpan ✓' : err(r));
    }
  });
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));
  tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'dash';
})();
