'use strict';
/* Panel admin v21: tab bawah, ringkasan, aksi massal, log aktivitas, pengaturan web, rincian pemakaian member */
(() => {
  const Q = s => document.querySelector(s), QA = s => [...document.querySelectorAll(s)], E = Auth.esc, ADM = window.ADM, DAY = 864e5;
  const TABS = ['dash', 'mem', 'ann', 'fb', 'log', 'set'], U = () => ADM.users(), NOW = () => Auth.now();
  const abs = t => t ? new Date(t).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : '-';
  const OLD = 'Code.gs belum diperbarui ke v21. Tempel Code.gs terbaru di Apps Script lalu Deploy → Manage deployments → Edit → New version.';
  const err = r => r.code == 'unknown' ? OLD : r.error;
  let tab = 'dash', ready = false, LOGS = [], LF = 'all', CFGV = null;
  let FBS = [], FBF = 'all', FBC = 'all', FBQ = '', LQ = '', RG = 14, FBN = null, LOGN = null, lastLoad = 0, pre = false;
  const clock = t => new Date(t).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});
  const csvCell = v => { let x = String(v == null ? '' : v); if (/^[=+\-@]/.test(x)) x = "'" + x; return '"' + x.replace(/"/g, '""') + '"'; };
  function dl(name, head, rows) {
    const t = '\ufeff' + [head, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n'), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([t], {type: 'text/csv;charset=utf-8'})); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 600);
  }
  const stamp = () => new Date().toISOString().slice(0, 10);
  const dayLbl = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); const k = Math.round((new Date().setHours(0, 0, 0, 0) - d.getTime()) / DAY); return k == 0 ? 'Hari ini' : k == 1 ? 'Kemarin' : d.toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long'}); };
  function fbBadge() { const b = Q('#nbFb'); if (!b) return; const n = FBS.filter(x => x.status == 'baru').length; b.hidden = !n; b.textContent = n > 99 ? '99+' : n; }

  /* ---------- jendela isian kecil (pengganti prompt() yang jelek di HP) ---------- */
  let askRes = null;
  ADM.ask = o => new Promise(res => {
    askRes = res; const f = Q('#askf');
    f.innerHTML = `<button class="mx" type="button" data-askx aria-label="Tutup">${IC('x')}</button><h3>${E(o.title)}</h3>${o.sub ? `<small>${E(o.sub)}</small>` : ''}
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
    if (ready) { if (t == 'log') loadLog(); if (t == 'set') loadCfg(); if (t == 'ann' && ADM.loadAnn) ADM.loadAnn(); if (t == 'fb') loadFb(); }
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
    const al = Q('#alertbar'); al.hidden = true; // digantikan kartu "Perlu perhatian"
    if (false) al.innerHTML = `<span>⏰ <b>${soon.length}</b> premium habis ≤ 7 hari: ${soon.slice(0, 3).map(u => E(u.username) + ' (' + ADM.daysLeft(u) + ' hr)').join(', ')}${soon.length > 3 ? ' …' : ''}</span><button class="btn" data-goto="mem" data-f="soon" type="button">Lihat</button>`;
    const ds = [...Array(RG)].map((_, i) => { const d = new Date(n - (RG - 1 - i) * DAY); d.setHours(0, 0, 0, 0); return d.getTime(); }), cn = ds.map(t => us.filter(u => u.createdAt >= t && u.createdAt < t + DAY).length), mx = Math.max(1, ...cn);
    const act = us.filter(u => seen(u)).sort((a, b) => seen(b) - seen(a)).slice(0, 5), use = us.filter(u => (ADM.use[u.username.toLowerCase()] || {}).rec).sort((a, b) => ADM.use[b.username.toLowerCase()].rec - ADM.use[a.username.toLowerCase()].rec).slice(0, 5);
    const rec = Object.values(ADM.use).reduce((s, x) => s + x.rec, 0);
    const me = (Auth.user() || {}).username || 'admin', hr = new Date(n).getHours(), gr = hr < 11 ? 'Selamat pagi' : hr < 15 ? 'Selamat siang' : hr < 18 ? 'Selamat sore' : 'Selamat malam';
    Q('#dhero').innerHTML = `<div><b>${gr}, ${E(me)} 👋</b><small>${new Date(n).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</small></div><button class="btn" data-reload type="button" title="Muat ulang data">${IC('refresh')}<span>${lastLoad ? 'Diperbarui ' + clock(lastLoad) : 'Muat ulang'}</span></button>`;
    /* perlu perhatian */
    const expired = us.filter(u => u.expired && u.role != 'admin').length, susp = us.filter(u => u.status == 'suspended').length;
    const bad24 = (LOGN || []).filter(l => /^login_(fail|blocked)/.test(l.action) && l.time > n - DAY).length, fbNew = FBN == null ? 0 : FBN;
    const items = [
      soon.length && [IC('clock'), `${soon.length} premium habis ≤ 7 hari`, 'Perpanjang sebelum member kehilangan akses', 'mem', 'soon'],
      expired && [IC('hourglass'), `${expired} premium sudah habis`, 'Peluang untuk menawarkan perpanjangan', 'mem', 'ex'],
      fbNew && [IC('inbox'), `${fbNew} masukan baru`, 'Belum kamu tanggapi', 'fb'],
      bad24 && [IC('alert'), `${bad24} percobaan masuk gagal (24 jam)`, 'Cek apakah ada yang mencurigakan', 'log', '', 'bad'],
      susp && [IC('ban'), `${susp} akun nonaktif`, 'Tinjau ulang bila perlu', 'mem', 'sp']
    ].filter(Boolean);
    const td = Q('#todo'); td.hidden = false;
    td.innerHTML = `<h4>🎯 Perlu perhatian${items.length ? `<em>${items.length}</em>` : ''}</h4>` + (items.length ? `<div class="todo-l">${items.map(([ic, t, sub, g, f, lf]) => `<button type="button" class="todo-i" data-goto="${g}" ${f ? `data-f="${f}"` : ''} ${lf ? `data-lfx="${lf}"` : ''}><i>${ic}</i><span><b>${t}</b><small>${sub}</small></span><s>${IC('chevron')}</s></button>`).join('')}</div>` : '<p class="dnone">✅ Semua beres, tidak ada yang perlu ditindaklanjuti.</p>');
    const q = [[IC('plus'), 'Member baru', 'add'], [IC('megaphone'), 'Buat info', 'ann'], [IC('inbox'), 'Masukan', 'fb'], [IC('download'), 'Unduh member', 'csv'], [IC('save'), 'Backup', 'bk'], [IC('clipboard'), 'Salin laporan', 'rpt']];
    Q('#qa').innerHTML = q.map(([i, l, k]) => `<button type="button" class="qa-b" data-qa="${k}"><i>${i}</i><span>${l}</span></button>`).join('');
    const tot = us.length || 1, seg = [['Premium', us.filter(P).length, 'a'], ['Gratis', us.filter(u => u.role == 'free' && u.status == 'active').length, 'b'], ['Habis', expired, 'c'], ['Nonaktif', susp, 'd']];
    const rngs = `<div class="rgs">${[7, 14, 30].map(r => `<button type="button" data-rg="${r}" class="${r == RG ? 'on' : ''}">${r} hr</button>`).join('')}</div>`;
    Q('#dash').innerHTML = `
      <section class="dc"><h4>📈 Pendaftar baru <em>${cn.reduce((a, b) => a + b, 0)} akun</em></h4>${rngs}<div class="bars ${RG > 14 ? 'dense' : ''}" style="--n:${RG}">${cn.map((c, i) => `<i style="--h:${(c / mx).toFixed(2)}" title="${c} akun · ${new Date(ds[i]).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}"><b>${RG <= 14 && c ? c : ''}</b><s>${RG <= 14 || i % 5 == 0 || i == RG - 1 ? new Date(ds[i]).getDate() : ''}</s></i>`).join('')}</div></section>
      <section class="dc"><h4>🧩 Komposisi member <em>${us.length} akun</em></h4><div class="comp">${seg.map(([l, v, c]) => v ? `<i class="${c}" style="flex:${v}" title="${l}: ${v}"></i>` : '').join('')}</div><div class="comp-l">${seg.map(([l, v, c]) => `<span><i class="${c}"></i>${l} <b>${v}</b><em>${Math.round(v / tot * 100)}%</em></span>`).join('')}</div></section>
      <section class="dc"><h4>⏰ Segera habis</h4>${soon.slice(0, 5).map(u => mini(u, `${ADM.daysLeft(u)} hari lagi · ${ADM.fd(u.premiumUntil)}`, `<button class="btn pri" data-x30="${E(u.username)}" type="button">+30 hr</button>`)).join('') || '<p class="dnone">Tidak ada premium yang hampir habis 🎉</p>'}</section>
      <section class="dc"><h4>🟢 Aktif terbaru</h4>${act.map(u => mini(u, (seen(u) > n - 15 * 60 * 1000 ? '<b class="ok">online</b> · ' : '') + ADM.rel(seen(u)))).join('') || '<p class="dnone">Belum ada aktivitas.</p>'}</section>
      <section class="dc"><h4>🧾 Pemakai kasir terbanyak <em>${rec} catatan</em></h4>${use.map(u => mini(u, ADM.use[u.username.toLowerCase()].rec + ' catatan' + (ADM.use[u.username.toLowerCase()].tpl ? ' · ' + ADM.use[u.username.toLowerCase()].tpl + ' template' : ''))).join('') || '<p class="dnone">Belum ada data kasir.</p>'}</section>`;
  }
  async function prefetch() {
    if (pre) return; pre = true;
    const [f, l] = await Promise.all([ADM.api('admin_fb_list'), ADM.api('admin_log', {limit: 150})]);
    if (f && f.ok) { FBS = f.items || []; FBN = FBS.filter(x => x.status == 'baru').length; fbBadge(); }
    if (l && l.ok) { LOGN = l.logs || []; }
    dash();
  }
  function report() {
    const us = U(), n = NOW(), P = u => u.premium && u.role == 'premium', seen = u => u.lastSeen || u.lastLogin || 0;
    const soon = us.filter(u => P(u) && u.premiumUntil < n + 7 * DAY && u.premiumUntil < 4e12);
    return [`📊 Laporan ReyVion · ${new Date(n).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}`, '',
      `👥 Total member: ${us.length}`, `👑 Premium aktif: ${us.filter(P).length}`, `🌱 Gratis: ${us.filter(u => u.role == 'free' && u.status == 'active').length}`,
      `⏰ Premium habis ≤ 7 hari: ${soon.length}${soon.length ? ' (' + soon.slice(0, 5).map(u => u.username).join(', ') + ')' : ''}`,
      `✨ Daftar 24 jam: ${us.filter(u => u.createdAt > n - DAY).length}`, `📅 Aktif 24 jam: ${us.filter(u => seen(u) > n - DAY).length}`,
      `⛔ Nonaktif: ${us.filter(u => u.status == 'suspended').length}`, FBN != null ? `📮 Masukan baru: ${FBN}` : ''].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n');
  }
  document.addEventListener('adm:users', () => { lastLoad = Date.now(); dash(); prefetch(); bulk(); if (!ready) { ready = true; go(tab); } });

  /* ---------- aksi massal ---------- */
  function bulk() {
    const b = Q('#bulk'), n = ADM.sel.size; QA('[data-sel]').forEach(c => c.checked = ADM.sel.has(c.dataset.sel));
    b.hidden = !n; document.body.classList.toggle('hasbulk', !!n); if (!n) return;
    b.innerHTML = `<div class="bk-h"><b>${n} dipilih</b><button class="btn" data-bk="all" type="button">Pilih semua</button><button class="btn" data-bk="none" type="button">Batal</button></div>
      <div class="bk-a"><button class="btn pri" data-bk="extend" type="button">${IC('crown')} +Premium</button><button class="btn" data-bk="free" type="button">Jadikan gratis</button><button class="btn" data-bk="suspend" type="button">Nonaktifkan</button><button class="btn" data-bk="activate" type="button">Aktifkan</button></div>`;
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
  const LG = {login: ['🔑', 'Masuk'], login_fail: ['⚠️', 'Gagal masuk'], login_blocked: ['⛔', 'Masuk ditolak (nonaktif)'], register: ['✨', 'Daftar akun baru'], acct_update: ['🪪', 'Ubah akun'], admin_create: ['➕', 'membuat member'], admin_update: ['✏️', 'mengubah'], admin_reset: ['🔒', 'reset password'], admin_delete: ['🗑️', 'menghapus'], admin_kick: ['🚪', 'paksa keluar'], cfg: ['⚙️', 'mengubah pengaturan web'], admin_trash: ['🗑️', 'memindah ke sampah'], admin_restore: ['↩️', 'memulihkan'], admin_purge: ['❌', 'hapus permanen'], admin_kickall: ['🚨', 'keluarkan semua member'], backup: ['💾', 'backup data'], ann_save: ['📣', 'menerbitkan / mengubah pengumuman'], ann_delete: ['📣', 'menghapus pengumuman'], backup_fail: ['🔥', 'BACKUP GAGAL'], register_limit: ['🛑', 'pendaftaran dibatasi (terlalu ramai)']};
  const LFS = [['all', 'Semua', () => 1], ['in', 'Masuk', l => l.action == 'login'], ['bad', 'Gagal / ditolak', l => /^(login_(fail|blocked)|register_limit|backup_fail)/.test(l.action)], ['reg', 'Daftar', l => l.action == 'register'], ['adm', 'Aksi admin', l => /^(admin_|bulk_|cfg|backup|ann_)/.test(l.action)]];
  function logRows() {
    const f = LFS.find(x => x[0] == LF)[2], q = LQ.trim().toLowerCase();
    return LOGS.filter(f).filter(l => !q || [l.actor, l.target, l.detail, l.action, (LG[l.action] || [])[1]].join(' ').toLowerCase().includes(q));
  }
  function drawLog() {
    Q('#lflt').innerHTML = LFS.map(([k, l, f]) => `<button type="button" data-lf="${k}" class="${LF == k ? 'on' : ''}">${l}<em>${LOGS.filter(f).length}</em></button>`).join('') + '<button type="button" data-lf="rf" aria-label="Muat ulang">' + IC('refresh') + '</button>';
    const ls = logRows(); let last = '';
    Q('#loglist').innerHTML = ls.map(l => {
      const m = LG[l.action] || (l.action.startsWith('bulk_') ? ['📦', 'aksi massal ' + l.action.slice(5)] : ['•', l.action]), self = l.action == 'login' || l.action == 'register' || l.action == 'login_fail' || l.action == 'login_blocked' || l.action == 'acct_update';
      const dh = dayLbl(l.time), head = dh != last ? `<div class="lg-day">${E(dh)}</div>` : ''; last = dh;
      return `${head}<div class="lg ${/fail|blocked/.test(l.action) ? 'bad' : ''}"><span class="lgi">${m[0]}</span><div><b>${E(l.actor || '?')}</b> <span>${E(m[1])}</span>${!self && l.target ? ` <b>${E(l.target)}</b>` : ''}${l.detail ? `<small>${E(l.detail)}</small>` : ''}</div><time title="${abs(l.time)}">${new Date(l.time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</time></div>`;
    }).join('') || `<div class="empty">${LOGS.length ? 'Tidak ada yang cocok dengan pencarianmu.' : 'Belum ada catatan aktivitas.'}</div>`;
  }
  async function loadLog() {
    Q('#loglist').innerHTML = '<div class="gload"><span class="spin"></span>Memuat aktivitas…</div>';
    const r = await ADM.api('admin_log', {limit: 300}); if (!r.ok) return Q('#loglist').innerHTML = `<div class="empty">${E(err(r))}</div>`;
    LOGS = (r.logs || []).slice().sort((a, b) => b.time - a.time); LOGN = LOGS; drawLog();
  }

  /* ---------- pengaturan web ---------- */
  async function loadCfg() {
    const b = Q('#setbox'); b.innerHTML = '<div class="gload"><span class="spin"></span>Memuat…</div>';
    const r = await ADM.api('admin_cfg'); if (!r.ok) return b.innerHTML = `<div class="empty">${E(err(r))}</div>`;
    CFGV = r.cfg; const c = r.cfg;
    b.innerHTML = `<div class="sc"><h3>⚙️ Pengaturan web</h3><small>Berlaku langsung tanpa upload ulang (tersimpan di sheet Config).</small>
      <label class="f"><span>Nomor WhatsApp admin</span><input id="cwa" type="tel" inputmode="numeric" value="${E(c.waNumber || '')}" placeholder="62812xxxxxxx"></label>
      <label class="f"><span>Pesan WhatsApp awal</span><input id="cwt" type="text" maxlength="300" value="${E(c.waText || '')}"></label>
      <label class="chk"><span>Pendaftaran akun baru dibuka</span><input type="checkbox" id="creg" ${c.registerOpen !== false ? 'checked' : ''}></label>
      <label class="chk"><span>🛠️ Mode maintenance<small>Hanya admin yang bisa masuk</small></span><input type="checkbox" id="cmt" ${c.maintenance ? 'checked' : ''}></label>
      <button class="btn pri wide" id="csave" type="button">Simpan pengaturan</button></div>
      <div class="sc"><h3>🛡️ Keamanan &amp; data</h3><small>Backup otomatis jalan tiap hari jam 03.00 (pasang sekali lewat installTriggers, lihat SETUP.md). Salinan tersimpan di Google Drive, folder “ReyVion Backup”.</small>
      <div class="shortcuts"><button class="btn" id="cbackup" type="button">${IC('save')} Backup sekarang</button><button class="btn danger" id="ckick" type="button">${IC('alert')} Keluarkan semua member</button></div></div>
      <div class="sc"><h3>🔗 Pintasan</h3>
      <div class="shortcuts"><a class="btn" href="index.html">${IC('receipt')} Kasir</a><a class="btn" href="watermark.html">${IC('droplet')} Watermark</a><button class="btn" data-goto="mem" data-csv type="button">${IC('download')} Unduh member</button><button class="btn" id="creload" type="button">${IC('refresh')} Muat ulang data</button></div></div>
      <div class="sc"><h3>ℹ️ Info</h3><div class="usage"><span>Mode <b>${WM_API.DEMO ? 'DEMO (data di browser)' : 'LIVE (Google Sheets)'}</b></span><span>Member <b>${U().length}</b></span><span>Admin <b>${U().filter(u => u.role == 'admin').length}</b></span>${lastLoad ? `<span>Dimuat <b>${clock(lastLoad)}</b></span>` : ''}</div></div>`;
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
    if (b.id == 'cbackup') { b.disabled = true; toast('Membuat backup…'); const r = await ADM.api('admin_backup'); b.disabled = false; return toast(r.ok ? 'Backup tersimpan di Drive ✓' : (r.code == 'unknown' ? OLD : 'Backup gagal: ' + r.error)); }
    if (b.id == 'ckick') { if (!confirm('Keluarkan SEMUA member dari semua perangkat? Mereka harus masuk lagi. Akun adminmu tetap masuk.')) return; const r = await ADM.api('admin_kickall'); return toast(r.ok ? `${r.done} sesi dihentikan ✓` : err(r)); }
    if (b.id == 'csave') {
      const wa = Q('#cwa').value.trim(), r = await ADM.api('admin_cfg', {set: 1, waNumber: wa, waText: Q('#cwt').value.trim(), registerOpen: Q('#creg').checked, maintenance: Q('#cmt').checked});
      return toast(r.ok ? 'Pengaturan tersimpan ✓' : err(r));
    }
  });

  /* ---------- masukan & lapor masalah ---------- */
  async function loadFb() {
    Q('#fblist').innerHTML = '<div class="gload"><span class="spin"></span>Memuat masukan…</div>';
    const r = await ADM.api('admin_fb_list');
    if (!r.ok) return Q('#fblist').innerHTML = `<div class="empty">${E(err(r))}</div>`;
    FBS = r.items || []; FBN = FBS.filter(x => x.status == 'baru').length; fbBadge(); renderFb(); if (ready) dash();
  }
  const CAT = {bug: [IC('bug'), 'Masalah'], fitur: [IC('bulb'), 'Usul fitur'], tanya: [IC('help'), 'Pertanyaan']};
  const fbRows = (st = FBF, ct = FBC) => {
    const q = FBQ.trim().toLowerCase();
    return FBS.filter(x => (st == 'all' || x.status == st) && (ct == 'all' || x.category == ct) && (!q || [x.message, x.username, x.page].join(' ').toLowerCase().includes(q)));
  };
  function renderFb() {
    const sts = [['all', 'Semua'], ['baru', 'Baru'], ['diproses', 'Diproses'], ['selesai', 'Selesai']], cts = [['all', 'Semua jenis'], ...Object.entries(CAT).map(([k, v]) => [k, v[0] + ' ' + v[1]])];
    Q('#fbflt').innerHTML = sts.map(([k, l]) => `<button type="button" data-fbf="${k}" class="${FBF == k ? 'on' : ''}">${l}<em>${FBS.filter(x => (k == 'all' || x.status == k) && (FBC == 'all' || x.category == FBC)).length}</em></button>`).join('');
    Q('#fbcat').innerHTML = cts.map(([k, l]) => `<button type="button" data-fbc="${k}" class="${FBC == k ? 'on' : ''}">${l}</button>`).join('');
    const list = fbRows();
    Q('#fblist').innerHTML = list.length ? list.map(x => {
      const c = CAT[x.category] || [IC('chat'), x.category || 'Lainnya'], done = x.status == 'selesai';
      return `<div class="mrow mm fbc ${E(x.category || '')} ${E(x.status || '')}">
        <div class="mm-top"><span class="fbi">${c[0]}</span><div class="mi"><strong>${E(c[1])}<span class="badge ${done ? 'pr' : x.status == 'baru' ? 'ex' : ''}">${E(x.status)}</span></strong><small>@${E(x.username)} · ${E(x.role || '-')} · ${ADM.rel(x.createdAt)}</small></div></div>
        <p class="fbm">${E(x.message)}</p>
        <div class="mm-meta"><span>🕒 ${abs(x.createdAt)}</span><span>📄 ${E(x.page || '-')}</span></div>
        <div class="mm-act">
          ${done ? `<button type="button" class="btn" data-fbst="${x.id}:baru">${IC('undo')} Buka lagi</button>` : `<button type="button" class="btn" data-fbst="${x.id}:diproses" ${x.status == 'diproses' ? 'disabled' : ''}>${IC('hourglass')} Diproses</button><button type="button" class="btn pri" data-fbst="${x.id}:selesai">${IC('checkcircle')} Selesai</button>`}
          <button type="button" class="btn" data-open="${E(x.username)}" aria-label="Buka member ${E(x.username)}" title="Buka member">${IC('user')}</button>
        </div>
      </div>`;
    }).join('') : `<div class="empty">${FBS.length ? 'Tidak ada masukan yang cocok.' : 'Belum ada masukan dari member.'}</div>`;
  }
  document.addEventListener('click', async e => {
    const f = e.target.closest('[data-fbf]');
    if (f) { FBF = f.dataset.fbf; return renderFb(); }
    const c = e.target.closest('[data-fbc]');
    if (c) { FBC = c.dataset.fbc; return renderFb(); }
    const s = e.target.closest('[data-fbst]');
    if (s) {
      const [id, status] = s.dataset.fbst.split(':'); s.disabled = true;
      const r = await ADM.api('admin_fb_update', {id, status});
      if (r.ok) { toast('Status diperbarui ✓'); loadFb(); } else { s.disabled = false; toast(err(r)); }
    }
  });
  document.addEventListener('input', e => {
    if (e.target.id == 'fbq') { FBQ = e.target.value; renderFb(); }
    else if (e.target.id == 'lq') { LQ = e.target.value; drawLog(); }
  });

  /* ---------- aksi baru: reload, rentang grafik, aksi cepat, unduh CSV ---------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.reload !== undefined) { ADM.reload(); pre = false; return toast('Memuat ulang…'); }
    if (d.rg) { RG = +d.rg; return dash(); }
    if (d.lfx) { LF = d.lfx; LQ = ''; const lq = Q('#lq'); if (lq) lq.value = ''; }
    if (d.qa) {
      if (d.qa == 'add') { go('mem'); return Q('#add').click(); }
      if (d.qa == 'ann') { go('ann'); let k = 0; const t = setInterval(() => { const a = Q('#an_new'); if (a) { clearInterval(t); a.click(); } else if (++k > 25) clearInterval(t); }, 150); return; }
      if (d.qa == 'fb') return go('fb');
      if (d.qa == 'csv') { go('mem'); return Q('#xcsv').click(); }
      if (d.qa == 'bk') { b.disabled = true; toast('Membuat backup…'); const r = await ADM.api('admin_backup'); b.disabled = false; return toast(r.ok ? 'Backup tersimpan di Drive ✓' : (r.code == 'unknown' ? OLD : 'Backup gagal: ' + r.error)); }
      if (d.qa == 'rpt') { const t = report(); try { await navigator.clipboard.writeText(t); toast('Laporan disalin ✓ tinggal tempel ke WhatsApp'); } catch (x) { prompt('Salin laporan ini:', t); } return; }
    }
    if (b.id == 'fbrf') { pre = false; return loadFb(); }
    if (b.id == 'fbx') { const r = fbRows('all', 'all'); return r.length ? dl(`masukan-reyvion-${stamp()}.csv`, ['Waktu', 'Username', 'Role', 'Jenis', 'Status', 'Halaman', 'Pesan'], r.map(x => [new Date(x.createdAt).toLocaleString('id-ID'), x.username, x.role, x.category, x.status, x.page, x.message])) : toast('Belum ada masukan'); }
    if (b.id == 'lx') { const r = logRows(); return r.length ? dl(`aktivitas-reyvion-${stamp()}.csv`, ['Waktu', 'Pelaku', 'Aksi', 'Target', 'Detail'], r.map(l => [new Date(l.time).toLocaleString('id-ID'), l.actor, (LG[l.action] || [])[1] || l.action, l.target, l.detail])) : toast('Belum ada aktivitas'); }
  });

  window.addEventListener('hashchange', () => go(location.hash.slice(1)));
  tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'dash';
})();
