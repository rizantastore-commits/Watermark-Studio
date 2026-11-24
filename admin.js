'use strict';
/* Panel admin: kelola member & premium (data di Google Sheets lewat Apps Script) */
(() => {
  const Q = s => document.querySelector(s), A = window.WM_API, E = Auth.esc, DAY = 864e5, LIFE = A.LIFETIME;
  const SEL = new Set(), USE = {}; let USERS = [], TRASH = [], FLT = 'all', QS = '', SORT = 'new', LIM = 30, EDIT = null, DUR = null; // DUR: durasi terpilih (hari | 'life' | null)
  let tt; window.toast = m => { const t = Q('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); };
  const tok = () => { try { return localStorage.getItem('wm_tok') || ''; } catch (e) { return ''; } };
  const api = (action, o = {}) => A.call({action, token: tok(), ...o});
  const fd = t => Auth.fmtDate(t);
  const daysLeft = u => Math.max(1, Math.ceil((u.premiumUntil - Auth.now()) / DAY));
  const stat = u => u.status == 'suspended' ? 'sp' : u.role == 'admin' ? 'ad' : u.premium ? 'pr' : u.expired ? 'ex' : 'fr';
  const FILTERS = [['all', 'Semua'], ['pr', 'Premium'], ['fr', 'Gratis'], ['ex', 'Habis'], ['soon', 'Segera habis'], ['sp', 'Nonaktif'], ['ad', 'Admin'], ['tr', 'Sampah']];
  const match = (u, f = FLT) => f == 'all' || f == 'tr' || (f == 'soon' ? u.premium && u.role == 'premium' && u.premiumUntil < Auth.now() + 7 * DAY : stat(u) == f);
  const SORTS = {
    new: (a, b) => b.createdAt - a.createdAt,
    seen: (a, b) => (b.lastSeen || b.lastLogin || 0) - (a.lastSeen || a.lastLogin || 0),
    login: (a, b) => (b.lastLogin || 0) - (a.lastLogin || 0),
    due: (a, b) => { const f = u => u.role == 'premium' && u.premium ? u.premiumUntil : Infinity; return (f(a) - f(b)) || b.createdAt - a.createdAt; },
    name: (a, b) => a.username.localeCompare(b.username)
  };
  const rel = t => { if (!t) return 'belum pernah'; const s = (Auth.now() - t) / 1000; if (s < 90) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' mnt lalu'; if (s < DAY / 1000) return Math.floor(s / 3600) + ' jam lalu'; if (s < 30 * DAY / 1000) return Math.floor(s / (DAY / 1000)) + ' hari lalu'; return fd(t); };

  const pfLine = u => { const f = Auth.profOf(u), t = [Auth.dispName(u) != u.username ? '✏️ ' + Auth.dispName(u) : '', f.st, f.bio].filter(Boolean).join(' · '); return t ? `<small class="mpf">${E(t)}</small>` : ''; };
  function row(u) {
    const s = stat(u), lb = {sp: 'Nonaktif', ad: 'Admin', pr: 'Premium', ex: 'Habis', fr: 'Gratis'}[s], isP = u.role == 'premium' && u.premium;
    const info = u.role == 'admin' ? 'Akses penuh' : u.premium ? (u.premiumUntil >= 4e12 ? 'Seumur hidup' : `Sampai ${fd(u.premiumUntil)} · ${daysLeft(u)} hari lagi`) : u.expired ? `Habis ${fd(u.premiumUntil)}` : 'Fitur dasar';
    let bar = '';
    if (isP) { if (u.premiumUntil >= 4e12) bar = '<div class="mm-bar life"><i style="width:100%"></i></div>'; else { const d = daysLeft(u); bar = `<div class="mm-bar ${d <= 3 ? 'bad' : d <= 7 ? 'warn' : 'ok'}"><i style="width:${Math.max(6, Math.min(100, d / 30 * 100))}%"></i></div>`; } }
    const on = (u.lastSeen || u.lastLogin) && Auth.now() - (u.lastSeen || u.lastLogin) < 15 * 60 * 1000, ext = u.role == 'admin' ? '' : `<button class="btn pri" data-ext="${E(u.username)}" type="button">${isP ? '+30 hari' : IC('crown') + ' Premium 30 hari'}</button>`;
    const us = USE[u.username.toLowerCase()], seen = u.lastSeen || u.lastLogin;
    return `<article class="mrow mm ${s}"><label class="mm-ck" title="Pilih"><input type="checkbox" data-sel="${E(u.username)}" aria-label="Pilih ${E(u.username)}" ${SEL.has(u.username) ? 'checked' : ''} ${u.role == 'admin' ? 'disabled' : ''}></label><div class="mm-top"><div class="mm-av${on ? ' on' : ''}" title="${on ? 'Sedang aktif (15 menit terakhir)' : ''}">${Auth.avatar(u)}</div><div class="mi"><strong>${E(u.username)}<span class="badge ${s}">${lb}</span></strong><small>${info}</small></div></div>
      ${bar}${pfLine(u)}
      <div class="mm-meta"><span>📅 Daftar ${fd(u.createdAt)}</span><span>🕒 ${seen ? 'Aktif ' + rel(seen) : 'Belum pernah masuk'}</span>${us ? `<span>🧾 ${us.rec} catatan${us.tpl ? ' · 🎀 ' + us.tpl + ' template' : ''}</span>` : ''}${u.note ? `<span class="mm-note">📝 ${E(u.note)}</span>` : ''}</div>
      <div class="mm-act">${ext}<button class="btn" data-ed="${E(u.username)}" type="button">Atur</button></div></article>`;
  }
  function trow(u) { // akun di Sampah: bisa dipulihkan atau dihapus permanen
    const left = Math.max(0, Math.ceil((u.deletedAt + 30 * DAY - Auth.now()) / DAY));
    return `<article class="mrow mm sp"><div class="mm-top"><div class="mm-av">${Auth.avatar(u)}</div><div class="mi"><strong>${E(u.username)}<span class="badge sp">Sampah</span></strong><small>Dihapus ${fd(u.deletedAt)} · hilang permanen ${left} hari lagi</small></div></div>
      <div class="mm-act"><button class="btn pri" data-restore="${E(u.username)}" type="button">${IC('undo')} Pulihkan</button><button class="btn" data-purge="${E(u.username)}" type="button">Hapus permanen</button></div></article>`;
  }
  function render() {
    const n = Auth.now(), soon = USERS.filter(u => u.premium && u.role == 'premium' && u.premiumUntil < n + 7 * DAY);
    document.dispatchEvent(new CustomEvent('adm:users'));
    Q('#flt').innerHTML = FILTERS.map(([k, l]) => `<button data-f="${k}" class="${FLT == k ? 'on' : ''}">${l}<em>${k == 'tr' ? TRASH.length : USERS.filter(u => match(u, k)).length}</em></button>`).join('');
    Q('#asrt').value = SORT;
    const ls = (FLT == 'tr' ? TRASH : USERS).filter(u => match(u) && (u.username + ' ' + Auth.dispName(u) + ' ' + (u.note || '')).toLowerCase().includes(QS)).sort(SORTS[SORT] || SORTS.new), shown = ls.slice(0, LIM), draw = FLT == 'tr' ? trow : row;
    Q('#acount').textContent = ls.length ? `Menampilkan ${shown.length} dari ${ls.length} member${ls.length != USERS.length ? ' (total ' + USERS.length + ')' : ''}` : '';
    Q('#list').innerHTML = shown.map(draw).join('') || `<div class="empty">${FLT == 'tr' ? 'Sampah kosong. Akun yang dihapus muncul di sini selama 30 hari.' : 'Belum ada member yang cocok.'}</div>`;
    const mo = Q('#more'); mo.hidden = ls.length <= LIM; mo.textContent = `Tampilkan lebih banyak (${ls.length - LIM} lagi)`;
  }
  function csv() {
    const q = x => '"' + String(x ?? '').replace(/"/g, '""') + '"', pu = u => u.role == 'premium' && u.premium ? (u.premiumUntil >= 4e12 ? 'Seumur hidup' : fd(u.premiumUntil)) : '';
    const rows = [['Username', 'Nama tampil', 'Role', 'Status', 'Premium sampai', 'Sisa hari', 'Daftar', 'Terakhir masuk', 'Catatan']].concat(USERS.map(u => [u.username, Auth.dispName(u), u.role, u.status, pu(u), u.role == 'premium' && u.premium && u.premiumUntil < 4e12 ? daysLeft(u) : '', fd(u.createdAt), u.lastLogin ? fd(u.lastLogin) : '', u.note || '']));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\n')], {type: 'text/csv;charset=utf-8'}));
    a.download = 'member-' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  async function extend(b, name) {
    const u = USERS.find(x => x.username == name); if (!u || u.role == 'admin') return;
    if (u.premium && u.role == 'premium' && u.premiumUntil >= 4e12) return toast('Sudah premium seumur hidup');
    if (!confirm(`Tambah 30 hari premium untuk ${u.username}?`)) return;
    const base = u.premium && u.role == 'premium' ? u.premiumUntil : Auth.now(); b.disabled = true;
    const r = await api('admin_update', {username: u.username, role: 'premium', premiumUntil: base + 30 * DAY, status: u.status == 'suspended' ? 'suspended' : 'active', note: u.note || ''});
    b.disabled = false; if (!r.ok) return toast(r.error); toast(`Premium ${u.username} +30 hari ✓`); load(true);
  }

  async function load(quiet) {
    if (!quiet) Q('#list').innerHTML = '<div class="gload"><span class="spin"></span>Memuat member…</div>';
    const r = await api('admin_list');
    if (!r.ok) { if (r.code == 'session') return Auth.logout(r.error); toast(r.error); return Q('#list').innerHTML = `<div class="empty">${E(r.error)}</div>`; }
    USERS = r.users.filter(u => u.status != 'trashed'); TRASH = r.users.filter(u => u.status == 'trashed'); render(); api('admin_usage').then(x => { if (x.ok) { Object.keys(USE).forEach(k => delete USE[k]); Object.assign(USE, x.usage); render(); } });
  }

  /* ---------- jendela atur member ---------- */
  const QUICK = [[7, '7 hari'], [14, '14 hari'], [30, '30 hari'], [90, '3 bulan'], [180, '6 bulan'], [365, '1 tahun'], ['life', 'Seumur hidup']];
  function until() { // hitung tanggal akhir premium dari pilihan durasi
    const u = EDIT, add = Q('#emode') && Q('#emode').value == 'add', base = add && u.premium && u.role == 'premium' ? u.premiumUntil : Auth.now();
    if (DUR == null) return null; if (DUR == 'life') return LIFE; return base + DUR * DAY;
  }
  function editor(u) {
    EDIT = u; DUR = null; const self = u.username == Auth.user().username;
    Q('.ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">${IC('x')}</button><h3>Profil member</h3>${Auth.profCard(u)}
    <small>Daftar ${fd(u.createdAt)} · ${u.premium && u.role == 'premium' ? 'Premium sampai ' + (u.premiumUntil >= 4e12 ? 'selamanya' : fd(u.premiumUntil)) : u.role == 'admin' ? 'Admin' : 'Gratis'}</small>
    <div class="sec2"><h4>Role</h4><div class="chips" id="erole">${[['free', 'Gratis'], ['premium', 'Premium'], ['admin', 'Admin']].map(([k, l]) => `<button data-role="${k}" class="${(u.role == k ? 'on' : '')}">${l}</button>`).join('')}</div></div>
    <div class="sec2" id="edur"><h4>Durasi premium</h4>
      <div class="chips">${QUICK.map(([k, l]) => `<button data-dur="${k}">${l}</button>`).join('')}</div>
      <div class="row2"><label class="f"><span>Atau isi hari</span><input type="number" min="1" max="3650" id="ecust" placeholder="mis. 45"></label>
      <label class="f"><span>Cara hitung</span><select id="emode"><option value="set">Mulai dari hari ini</option><option value="add">Tambah ke sisa durasi</option></select></label></div>
      <div class="prev" id="eprev"></div></div>
    <div class="sec2"><h4>Status akun</h4><div class="chips" id="estat">${[['active', 'Aktif'], ['suspended', 'Nonaktifkan']].map(([k, l]) => `<button data-st="${k}" class="${u.status == k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <label class="f"><span>Catatan (mis. beli via WA 20 Nov)</span><input type="text" id="enote" maxlength="200" value="${E(u.note || '')}"></label>
    <button class="btn pri wide" id="esave" type="button">Simpan</button>
    <div class="sec2"><h4>Pemakaian & akses</h4><div class="usage" id="eusage"><span class="spin"></span></div></div>
    <div class="row2"><button class="btn" id="ereset" type="button">Reset password</button><button class="btn" id="ekick" type="button" ${self ? 'disabled' : ''}>Paksa keluar</button></div>
    <button class="btn danger wide" id="edel" type="button" ${self ? 'disabled' : ''}>Hapus akun</button>`;
    Q('#em').hidden = false; pv(); if (window.ADM.afterEdit) window.ADM.afterEdit(u);
  }
  const role = () => (Q('#erole .on') || {dataset: {role: EDIT.role}}).dataset.role;
  function pv() {
    Q('#edur').hidden = role() != 'premium';
    const t = until(), p = Q('#eprev'); if (!p) return;
    p.textContent = DUR == null ? (EDIT.premium && EDIT.role == 'premium' ? 'Durasi tidak diubah (pilih durasi untuk mengganti)' : 'Pilih durasi dulu') : t >= 4e12 ? 'Premium seumur hidup' : `Premium sampai ${fd(t)}`;
  }
  async function save() {
    const u = EDIT, r = role(); let pu = u.premiumUntil;
    if (r == 'premium') { const t = until(); if (t != null) pu = t; else if (!(u.role == 'premium' && u.premium)) return toast('Pilih durasi premium dulu'); }
    const res = await api('admin_update', {username: u.username, role: r, premiumUntil: r == 'premium' ? pu : 0, status: (Q('#estat .on') || {dataset: {st: 'active'}}).dataset.st, note: Q('#enote').value});
    if (!res.ok) return toast(res.error);
    Q('#em').hidden = true; toast('Tersimpan'); load(true);
  }

  document.addEventListener('click', async e => {
    const t = e.target, b = t.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.f) { FLT = d.f; LIM = 30; return render(); }
    if (d.ext) return extend(b, d.ext);
    if (d.ed) return editor(USERS.find(u => u.username == d.ed));
    if (d.role) { document.querySelectorAll('#erole button').forEach(x => x.classList.toggle('on', x == b)); return pv(); }
    if (d.st) return document.querySelectorAll('#estat button').forEach(x => x.classList.toggle('on', x == b));
    if (d.dur) { DUR = d.dur == 'life' ? 'life' : +d.dur; Q('#ecust').value = ''; document.querySelectorAll('[data-dur]').forEach(x => x.classList.toggle('on', x == b)); return pv(); }
    if (b.id == 'esave') return save();
    if (b.id == 'ereset') { const v = await ADM.ask({title: 'Reset password', sub: `Password baru untuk ${EDIT.username}. Kirim ke member setelah ini.`, ok: 'Reset', fields: [{id: 'p', label: 'Password baru (min. 8 karakter)', type: 'text', ph: 'mis. Rey2026!'}]}); if (!v) return; const r = await api('admin_reset', {username: EDIT.username, password: v.p}); return toast(r.ok ? 'Password direset' : r.error); }
    if (b.id == 'ekick') { if (!confirm(`Keluarkan ${EDIT.username} dari semua perangkat?`)) return; const r = await api('admin_kick', {username: EDIT.username}); return toast(r.ok ? 'Member dikeluarkan dari semua perangkat' : r.error); }
    if (b.id == 'edel') { // hapus = pindah ke Sampah (bisa dipulihkan 30 hari); wajib ketik ulang username
      const nm = EDIT.username, v = await ADM.ask({title: 'Pindahkan ke Sampah?', sub: `Akun ${nm} tidak bisa masuk lagi, datanya disimpan 30 hari dan bisa dipulihkan dari filter Sampah.`, ok: 'Pindahkan', fields: [{id: 'n', label: `Ketik "${nm}" untuk konfirmasi`, ph: nm}]});
      if (!v) return; if (v.n.trim().toLowerCase() != nm.toLowerCase()) return toast('Nama tidak cocok, dibatalkan');
      const r = await api('admin_delete', {username: nm}); if (!r.ok) return toast(r.error); Q('#em').hidden = true; toast('Dipindah ke Sampah ✓'); return load(true);
    }
    if (b.dataset.restore) { const r = await api('admin_restore', {username: b.dataset.restore}); toast(r.ok ? 'Akun dipulihkan ✓' : r.error); return r.ok && load(true); }
    if (b.dataset.purge) {
      const nm = b.dataset.purge, v = await ADM.ask({title: 'Hapus PERMANEN?', sub: `Semua data ${nm} (kasir, template, akun simpanan) hilang dan TIDAK bisa dikembalikan.`, ok: 'Hapus permanen', fields: [{id: 'n', label: `Ketik "${nm}" untuk konfirmasi`, ph: nm}]});
      if (!v) return; if (v.n.trim().toLowerCase() != nm.toLowerCase()) return toast('Nama tidak cocok, dibatalkan');
      const r = await api('admin_purge', {username: nm}); toast(r.ok ? 'Dihapus permanen' : r.error); return r.ok && load(true);
    }
    if (b.id == 'rf') { load(); return toast('Diperbarui'); }
    if (b.id == 'xcsv') return USERS.length ? csv() : toast('Belum ada data');
    if (b.id == 'more') { LIM += 30; return render(); }
    if (b.id == 'out' || b.id == 'out2') return Auth.logout();
    if (b.id == 'add') {
      const v = await ADM.ask({title: 'Member baru', ok: 'Buat akun', fields: [{id: 'n', label: 'Username (3-20 karakter)', ph: 'mis. kak_rina'}, {id: 'p', label: 'Password awal (min. 8 karakter)', ph: 'min. 8 karakter'}]}); if (!v) return;
      const r = await api('admin_create', {username: v.n.trim(), password: v.p}); toast(r.ok ? 'Member dibuat' : r.error); if (r.ok) load(true);
    }
  });
  document.addEventListener('change', e => { const c = e.target.dataset && e.target.dataset.sel; if (c) { e.target.checked ? SEL.add(c) : SEL.delete(c); document.dispatchEvent(new CustomEvent('adm:sel')); } });
  document.addEventListener('input', e => {
    if (e.target.id == 'q') { QS = e.target.value.trim().toLowerCase(); LIM = 30; render(); }
    if (e.target.id == 'ecust') { const v = Math.floor(+e.target.value); DUR = v > 0 ? Math.min(v, 3650) : null; document.querySelectorAll('[data-dur]').forEach(x => x.classList.remove('on')); pv(); }
  });
  document.addEventListener('change', e => { if (e.target.id == 'emode') pv(); if (e.target.id == 'asrt') { SORT = e.target.value; LIM = 30; render(); } });

  window.ADM = Object.assign(window.ADM || {}, {api, users: () => USERS, reload: load, render, daysLeft, rel, fd, stat, sel: SEL, use: USE, setFilter: f => { FLT = f; LIM = 30; render(); }, openEdit: n => { const u = USERS.find(x => x.username == n); if (u) editor(u); }, extend30: n => extend(document.createElement('button'), n)});
  window.WM_ON_AUTH = u => {
    const ok = u.role == 'admin'; Q('#panel').hidden = !ok; Q('#denied').hidden = ok;
    if (ok) load();
  };
})();
