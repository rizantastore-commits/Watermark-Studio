'use strict';
/* Panel admin: kelola member & premium (data di Google Sheets lewat Apps Script) */
(() => {
  const Q = s => document.querySelector(s), A = window.WM_API, E = Auth.esc, DAY = 864e5, LIFE = A.LIFETIME;
  let USERS = [], FLT = 'all', QS = '', EDIT = null, DUR = null; // DUR: durasi terpilih (hari | 'life' | null)
  let tt; window.toast = m => { const t = Q('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); };
  const tok = () => { try { return localStorage.getItem('wm_tok') || ''; } catch (e) { return ''; } };
  const api = (action, o = {}) => A.call({action, token: tok(), ...o});
  const fd = t => Auth.fmtDate(t);
  const daysLeft = u => Math.max(1, Math.ceil((u.premiumUntil - Auth.now()) / DAY));
  const stat = u => u.status == 'suspended' ? 'sp' : u.role == 'admin' ? 'ad' : u.premium ? 'pr' : u.expired ? 'ex' : 'fr';
  const FILTERS = [['all', 'Semua'], ['pr', 'Premium'], ['fr', 'Gratis'], ['ex', 'Habis'], ['soon', 'Segera habis'], ['sp', 'Nonaktif'], ['ad', 'Admin']];
  const match = u => FLT == 'all' || (FLT == 'soon' ? u.premium && u.role == 'premium' && u.premiumUntil < Auth.now() + 7 * DAY : stat(u) == FLT);

  const pfLine = u => { const f = Auth.profOf(u), t = [Auth.dispName(u) != u.username ? '✏️ ' + Auth.dispName(u) : '', f.st, f.bio].filter(Boolean).join(' · '); return t ? `<small class="mpf">${E(t)}</small>` : ''; };
  function render() {
    const n = Auth.now(), pr = USERS.filter(u => u.premium && u.role == 'premium').length;
    Q('#stats').innerHTML = [[USERS.length, 'Total member'], [pr, 'Premium aktif'], [USERS.filter(u => u.role == 'free' && u.status == 'active').length, 'Gratis'],
      [USERS.filter(u => u.role == 'premium' && u.premium && u.premiumUntil < n + 7 * DAY).length, 'Habis ≤ 7 hari'], [USERS.filter(u => u.createdAt > n - DAY).length, 'Daftar 24 jam']]
      .map(([v, l]) => `<div class="st"><b>${v}</b><span>${l}</span></div>`).join('');
    Q('#flt').innerHTML = FILTERS.map(([k, l]) => `<button data-f="${k}" class="${FLT == k ? 'on' : ''}">${l}</button>`).join('');
    const ls = USERS.filter(u => match(u) && (u.username + ' ' + Auth.dispName(u)).toLowerCase().includes(QS)).sort((a, b) => b.createdAt - a.createdAt);
    Q('#list').innerHTML = ls.map(u => {
      const s = stat(u), lb = {sp: 'Nonaktif', ad: 'Admin', pr: 'Premium', ex: 'Habis', fr: 'Gratis'}[s];
      const info = u.role == 'admin' ? 'Akses penuh' : u.premium ? (u.premiumUntil >= 4e12 ? 'Seumur hidup' : `Sampai ${fd(u.premiumUntil)} · ${daysLeft(u)} hari lagi`) : u.expired ? `Habis ${fd(u.premiumUntil)}` : 'Fitur dasar';
      return `<div class="mrow">${Auth.avatar(u)}<div class="mi"><strong>${E(u.username)}<span class="badge ${s}">${lb}</span></strong><small>${info}</small>${pfLine(u)}<small>Daftar ${fd(u.createdAt)}${u.lastLogin ? ' · masuk ' + fd(u.lastLogin) : ''}${u.note ? ' · ' + E(u.note) : ''}</small></div><button class="btn" data-ed="${E(u.username)}">Atur</button></div>`;
    }).join('') || '<div class="empty">Belum ada member yang cocok.</div>';
  }

  async function load(quiet) {
    if (!quiet) Q('#list').innerHTML = '<div class="gload"><span class="spin"></span>Memuat member…</div>';
    const r = await api('admin_list');
    if (!r.ok) { if (r.code == 'session') return Auth.logout(r.error); toast(r.error); return Q('#list').innerHTML = `<div class="empty">${E(r.error)}</div>`; }
    USERS = r.users; render();
  }

  /* ---------- jendela atur member ---------- */
  const QUICK = [[7, '7 hari'], [14, '14 hari'], [30, '30 hari'], [90, '3 bulan'], [180, '6 bulan'], [365, '1 tahun'], ['life', 'Seumur hidup']];
  function until() { // hitung tanggal akhir premium dari pilihan durasi
    const u = EDIT, add = Q('#emode') && Q('#emode').value == 'add', base = add && u.premium && u.role == 'premium' ? u.premiumUntil : Auth.now();
    if (DUR == null) return null; if (DUR == 'life') return LIFE; return base + DUR * DAY;
  }
  function editor(u) {
    EDIT = u; DUR = null; const self = u.username == Auth.user().username;
    Q('.ed').innerHTML = `<button class="mx" data-close aria-label="Tutup">✕</button><h3>Profil member</h3>${Auth.profCard(u)}
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
    <div class="row2"><button class="btn" id="ereset" type="button">Reset password</button><button class="btn danger" id="edel" type="button" ${self ? 'disabled' : ''}>Hapus akun</button></div>`;
    Q('#em').hidden = false; pv();
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
    if (d.f) { FLT = d.f; return render(); }
    if (d.ed) return editor(USERS.find(u => u.username == d.ed));
    if (d.role) { document.querySelectorAll('#erole button').forEach(x => x.classList.toggle('on', x == b)); return pv(); }
    if (d.st) return document.querySelectorAll('#estat button').forEach(x => x.classList.toggle('on', x == b));
    if (d.dur) { DUR = d.dur == 'life' ? 'life' : +d.dur; Q('#ecust').value = ''; document.querySelectorAll('[data-dur]').forEach(x => x.classList.toggle('on', x == b)); return pv(); }
    if (b.id == 'esave') return save();
    if (b.id == 'ereset') { const p = prompt(`Password baru untuk ${EDIT.username} (min. 6 karakter):`); if (!p) return; const r = await api('admin_reset', {username: EDIT.username, password: p}); return toast(r.ok ? 'Password direset, kirim ke member ya' : r.error); }
    if (b.id == 'edel') { if (!confirm(`Hapus akun ${EDIT.username} permanen?`)) return; const r = await api('admin_delete', {username: EDIT.username}); if (!r.ok) return toast(r.error); Q('#em').hidden = true; toast('Akun dihapus'); return load(true); }
    if (b.id == 'rf') { load(); return toast('Diperbarui'); }
    if (b.id == 'out' || b.id == 'out2') return Auth.logout();
    if (b.id == 'add') {
      const n = prompt('Username member baru (3-20 karakter):'); if (!n) return; const p = prompt('Password awal (min. 6 karakter):'); if (!p) return;
      const r = await api('admin_create', {username: n.trim(), password: p}); toast(r.ok ? 'Member dibuat' : r.error); if (r.ok) load(true);
    }
  });
  document.addEventListener('input', e => {
    if (e.target.id == 'q') { QS = e.target.value.trim().toLowerCase(); render(); }
    if (e.target.id == 'ecust') { const v = Math.floor(+e.target.value); DUR = v > 0 ? Math.min(v, 3650) : null; document.querySelectorAll('[data-dur]').forEach(x => x.classList.remove('on')); pv(); }
  });
  document.addEventListener('change', e => { if (e.target.id == 'emode') pv(); });

  window.WM_ON_AUTH = u => {
    const ok = u.role == 'admin'; Q('#panel').hidden = !ok; Q('#denied').hidden = ok;
    if (ok) load();
  };
})();
