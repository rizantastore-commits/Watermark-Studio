'use strict';
/* Penghubung ke Google Sheets (Apps Script). Kalau API_URL kosong -> MODE DEMO (data di browser). */
window.WM_API = (() => {
  const C = window.WM_CONFIG, DEMO = !C.API_URL, DAY = 864e5, LIFETIME = 4102444800000;

  async function remote(body) {
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 25000);
    try {
      const r = await fetch(C.API_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(body), signal: ac.signal});
      return await r.json();
    } catch (e) { return {ok: false, code: 'net', error: 'Tidak bisa terhubung ke server. Cek internet lalu coba lagi.'}; }
    finally { clearTimeout(to); }
  }

  /* ---------- MODE DEMO (meniru server di localStorage) ---------- */
  const DK = 'wm_demo_db';
  const load = () => {
    try { const d = JSON.parse(localStorage.getItem(DK)); if (d && d.users) return d; } catch (e) {}
    const d = {users: [{username: 'admin', pass: 'admin123', role: 'admin', premiumUntil: 0, status: 'active', createdAt: Date.now(), lastLogin: 0, token: '', note: ''}], cfg: {}};
    store(d); return d;
  };
  const store = d => { try { localStorage.setItem(DK, JSON.stringify(d)); } catch (e) {} };
  const prem = (u, n) => u.role === 'admin' || (u.role === 'premium' && u.premiumUntil > n);
  const pub = (u, n) => ({
    username: u.username, premium: prem(u, n), role: u.role === 'premium' && !prem(u, n) ? 'free' : u.role,
    premiumUntil: u.premiumUntil || 0, expired: u.role !== 'admin' && !prem(u, n) && u.premiumUntil > 0,
    status: u.status, createdAt: u.createdAt, lastLogin: u.lastLogin, lastSeen: u.lastSeen || u.lastLogin || 0, note: u.note || '', theme: u.theme || '', profile: u.profile || ''
  });
  let DCFG = null; const cfgOf = () => ({waNumber: C.WA_NUMBER, waText: C.WA_TEXT, registerOpen: true, ...(DCFG || {})});
  const tok = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const find = (d, name) => d.users.find(u => u.username.toLowerCase() == String(name || '').trim().toLowerCase());
  const OK = (x = {}) => ({ok: true, now: Date.now(), cfg: cfgOf(), ...x});
  const ER = (error, code) => ({ok: false, error, code});
  const valid = (n, p) => !/^[A-Za-z0-9_.]{3,20}$/.test(n) ? 'Username 3-20 karakter: huruf, angka, titik, atau underscore.' : String(p).length < 6 ? 'Password minimal 6 karakter.' : '';

  /* pengumuman (meniru Code.gs v28) */
  const ANN_T = ['info', 'promo', 'update', 'maint'], ANN_A = ['all', 'free', 'premium'];
  const annFor = (d, n, p) => (d.ann || []).filter(x => x.active && x.start <= n && !(x.aud == 'free' && p) && !(x.aud == 'premium' && !p) && !(x.end && x.end <= n && x.type != 'update'))
    .sort((x, y) => y.start - x.start).slice(0, 30).map(x => ({id: x.id, title: x.title, body: x.body, type: x.type, start: x.start, end: x.end, pin: x.pin, cta: x.cta, ctaLabel: x.ctaLabel}));
  function annClean(r, n) {
    const title = String(r.title || '').replace(/[<>]/g, '').trim().slice(0, 80), body = String(r.body || '').replace(/[<>]/g, '').trim().slice(0, 500);
    if (!title) return {err: 'Judul pengumuman belum diisi.'};
    const type = String(r.type || 'info'), aud = String(r.aud || 'all'); if (!ANN_T.includes(type)) return {err: 'Jenis pengumuman tidak valid.'}; if (!ANN_A.includes(aud)) return {err: 'Tujuan pengumuman tidak valid.'};
    const cta = String(r.cta || '').trim(); let label = String(r.ctaLabel || '').replace(/[<>]/g, '').trim().slice(0, 24);
    if (cta && cta != 'plans' && cta != 'wa' && !/^https:\/\/[^\s<>"']{4,300}$/i.test(cta) && !/^[a-z0-9-]{1,30}\.html$/i.test(cta)) return {err: 'Link tombol harus diawali https:// (atau pilih Lihat paket / Chat WhatsApp).'};
    if (!cta) label = ''; else if (!label) label = cta == 'plans' ? 'Lihat paket' : cta == 'wa' ? 'Chat admin' : 'Buka';
    let start = +r.start || n, end = +r.end || 0; start = Math.min(Math.max(start, 1), n + 365 * DAY);
    if (end && end <= start) return {err: 'Waktu berakhir harus setelah waktu mulai.'};
    return {row: {title, body, type, aud, start, end: end ? Math.min(end, start + 3650 * DAY) : 0, pin: r.pin === true, cta, ctaLabel: label, active: r.active !== false}};
  }

  function demo(r) {
    const d = load(); DCFG = d.cfg && d.cfg.waNumber ? d.cfg : null; const n = Date.now(), act = r.action;
    const L = (who, a, tg, det) => { (d.log = d.log || []).push({time: n, actor: who, action: a, target: tg || '', detail: det || ''}); if (d.log.length > 500) d.log.shift(); };
    const me = () => d.users.find(u => u.token && u.token === r.token && u.status == 'active');
    if (act == 'config') return OK();
    if (act == 'register') {
      const e = valid(r.username, r.password); if (e) return ER(e);
      if (find(d, r.username)) return ER('Username sudah dipakai, coba yang lain.');
      const u = {username: r.username.trim(), pass: r.password, role: 'free', premiumUntil: 0, status: 'active', createdAt: n, lastLogin: n, token: tok(), note: ''};
      d.users.push(u); L(u.username, 'register', u.username); store(d); return OK({token: u.token, user: pub(u, n)});
    }
    if (act == 'login') {
      const u = find(d, r.username);
      if (!u || u.pass !== r.password) { L(String(r.username || ''), 'login_fail', String(r.username || '')); store(d); return ER('Username atau password salah.'); }
      if (u.status != 'active') return ER('Akun kamu dinonaktifkan. Hubungi admin ReyVion.');
      u.token = tok(); u.lastLogin = n; u.lastSeen = n; L(u.username, 'login', u.username); store(d); return OK({token: u.token, user: pub(u, n)});
    }
    if (act == 'me') { const u = me(); if (u) { u.lastSeen = n; store(d); } return u ? OK({user: pub(u, n)}) : ER('Sesi berakhir, silakan masuk lagi.', 'session'); }
    if (act == 'logout') { const u = me(); if (u) { u.token = ''; store(d); } return OK(); }
    const a = me(); if (!a) return ER('Sesi berakhir, silakan masuk lagi.', 'session');
    if (act == 'tpl_list') return OK({templates: a.tpls || []});
    if (act == 'tpl_save') {
      if (!prem(a, n)) return ER('Simpan template khusus akun premium.', 'premium');
      const nm = String(r.name || '').trim().slice(0, 40); if (!nm) return ER('Nama template kosong.');
      a.tpls = a.tpls || []; const i = a.tpls.findIndex(t => t.n == nm), it = {n: nm, s: JSON.parse(r.data)};
      if (i < 0 && a.tpls.length >= 20) return ER('Maksimal 20 template per akun.');
      i >= 0 ? a.tpls[i] = it : a.tpls.push(it); store(d); return OK();
    }
    if (act == 'rec_list') return OK({records: a.recs || []});
    if (act == 'rec_save') {
      if (C.STORE && C.STORE.PREMIUM_ONLY !== false && !prem(a, n)) return ER('Kasir & rekap toko khusus akun premium.', 'premium');
      let o; try { o = JSON.parse(r.data); } catch (e) { return ER('Data catatan tidak valid.'); }
      a.recs = a.recs || []; const i = a.recs.findIndex(x => x.id == r.id); o.id = r.id;
      if (i < 0 && a.recs.length >= 2000) return ER('Maksimal 2000 catatan per akun. Hapus yang lama dulu.');
      i >= 0 ? a.recs[i] = o : a.recs.push(o); store(d); return OK();
    }
    if (act == 'rec_delete') { a.recs = (a.recs || []).filter(x => x.id != r.id); store(d); return OK(); }
    if (act == 'acct_theme') {
      let o; try { o = JSON.parse(r.data); } catch (e) { return ER('Data tema tidak valid.'); }
      if (!o || typeof o.p != 'string' || typeof o.f != 'string') return ER('Data tema tidak valid.');
      a.theme = JSON.stringify({p: o.p, c: o.p == 'custom' ? o.c : null, f: o.f}); store(d); return OK();
    }
    if (act == 'acct_profile') {
      let o; try { o = JSON.parse(r.data); } catch (e) { return ER('Data profil tidak valid.'); }
      if (!o || typeof o != 'object') return ER('Data profil tidak valid.');
      const av = String(o.av || ''); if (av && (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(av) || av.length > 9000)) return ER('Foto profil tidak valid atau terlalu besar.');
      const cl = s => String(s || '').replace(/[<>]/g, '').trim();
      a.profile = JSON.stringify({dn: cl(o.dn).slice(0, 30), bio: cl(o.bio).slice(0, 120), st: cl(o.st).slice(0, 24), cv: /^(#[0-9a-f]{6}|[a-z]{1,12})$/i.test(o.cv || '') ? o.cv : '', av, ig: String(o.ig || '').replace(/[^A-Za-z0-9_.]/g, '').slice(0, 30)});
      store(d); return OK({user: pub(a, n)});
    }
    if (act == 'acct_update') {
      if (a.pass !== r.password) return ER('Password saat ini salah.', 'wrongpass');
      let nn = String(r.newUsername || '').trim(); const np = String(r.newPassword || '');
      if (nn === a.username) nn = '';
      if (!nn && !np) return ER('Belum ada yang diubah.');
      if (nn) { const e = valid(nn, 'xxxxxx'); if (e) return ER(e); const o = find(d, nn); if (o && o !== a) return ER('Nama pengguna sudah dipakai, coba yang lain.'); }
      if (np) { if (np.length < 6) return ER('Password baru minimal 6 karakter.'); if (np === r.password) return ER('Password baru harus beda dari password saat ini.'); }
      if (nn) a.username = nn;
      if (np) { a.pass = np; a.token = tok(); }
      store(d); return OK({token: a.token, user: pub(a, n)});
    }
    if (act == 'tpl_delete') { a.tpls = (a.tpls || []).filter(t => t.n != r.name); store(d); return OK(); }
    if (act == 'ann_list') return OK({anns: annFor(d, n, prem(a, n))});
    if (act == 'fb_send') {
      const msg = String(r.message || '').trim();
      if (msg.length < 6) return ER('Tuliskan kendala atau usulanmu minimal 6 karakter ya.');
      d.fb = d.fb || [];
      const item = {
        id: 'fb_' + tok().slice(0, 8), username: a.username, role: prem(a, n) ? 'premium' : a.role,
        category: r.category || 'fitur', page: r.page || '', message: msg.slice(0, 800),
        status: 'baru', createdAt: n, adminNote: ''
      };
      d.fb.unshift(item); store(d); return OK({id: item.id});
    }
    if (act == 'admin_fb_list') {
      if (a.role != 'admin') return ER('Khusus admin.');
      return OK({items: d.fb || []});
    }
    if (act == 'admin_fb_update') {
      if (a.role != 'admin') return ER('Khusus admin.');
      const it = (d.fb || []).find(x => x.id == r.id);
      if (!it) return ER('Masukan tidak ditemukan.');
      it.status = r.status || it.status;
      if (r.adminNote !== undefined) it.adminNote = String(r.adminNote).slice(0, 200);
      store(d); return OK();
    }
    if (a.role != 'admin') return ER('Khusus admin.', 'forbidden');
    if (act == 'admin_list') return OK({users: d.users.map(u => pub(u, n))});
    if (act == 'admin_ann_list') return OK({anns: (d.ann || []).map(x => ({...x})).sort((x, y) => y.start - x.start)});
    if (act == 'admin_ann_save') {
      const c = annClean(r, n); if (c.err) return ER(c.err);
      d.ann = d.ann || []; let it = r.id ? d.ann.find(x => x.id == r.id) : null;
      if (r.id && !it) return ER('Pengumuman tidak ditemukan (mungkin sudah dihapus).');
      const isNew = !it;
      if (isNew) { if (d.ann.length >= 100) return ER('Maksimal 100 pengumuman. Hapus yang lama dulu.'); it = {id: 'n' + n.toString(36) + Math.random().toString(36).slice(2, 6), createdAt: n}; d.ann.push(it); }
      Object.assign(it, c.row, {updatedAt: n, by: a.username}); L(a.username, 'ann_save', c.row.title.slice(0, 40), (isNew ? 'baru' : 'diubah') + ' · ' + c.row.type + ' · ' + c.row.aud); store(d); return OK({id: it.id});
    }
    if (act == 'admin_ann_delete') {
      const it = (d.ann || []).find(x => x.id == r.id); if (!it) return ER('Pengumuman tidak ditemukan (mungkin sudah dihapus).');
      d.ann = d.ann.filter(x => x !== it); L(a.username, 'ann_delete', it.title.slice(0, 40), ''); store(d); return OK({});
    }
    if (act == 'admin_log') return OK({logs: (d.log || []).slice(-(+r.limit || 200)).reverse()});
    if (act == 'admin_usage') { const o = {}; d.users.forEach(u => { o[u.username.toLowerCase()] = {rec: (u.recs || []).length, last: 0, tpl: (u.tpls || []).length}; }); return OK({usage: o}); }
    if (act == 'admin_member') { const u = find(d, r.username), t = {}; (u && u.recs || []).forEach(x => { const k = x.t || 'penjualan'; t[k] = (t[k] || 0) + 1; }); return OK({data: {types: t, total: (u && u.recs || []).length, last: 0, tpls: (u && u.tpls || []).map(x => x.n)}}); }
    if (act == 'admin_cfg') {
      if (r.set) { d.cfg = {waNumber: String(r.waNumber || '').replace(/\D/g, ''), waText: String(r.waText || ''), registerOpen: r.registerOpen !== false}; if (d.cfg.waNumber.length < 8) return ER('Nomor WhatsApp tidak valid (contoh 62812xxxx).'); L(a.username, 'cfg', '', 'pendaftaran ' + (d.cfg.registerOpen ? 'dibuka' : 'ditutup')); store(d); }
      return OK({cfg: {...cfgOf(), ...(d.cfg || {})}});
    }
    if (act == 'admin_bulk') {
      const op = r.op, days = Math.min(Math.max(Math.floor(+r.days) || 0, 0), 3650); let done = 0;
      if (!['extend', 'free', 'suspend', 'activate'].includes(op)) return ER('Aksi massal tidak valid.');
      if (op == 'extend' && !days) return ER('Jumlah hari belum diisi.');
      (r.usernames || []).forEach(nm => { const x = find(d, nm); if (!x || x.role == 'admin' || x == a) return;
        if (op == 'extend') { const b = x.role == 'premium' && x.premiumUntil > n ? x.premiumUntil : n; if (b >= LIFETIME) return; x.role = 'premium'; x.premiumUntil = Math.min(b + days * DAY, LIFETIME); }
        else if (op == 'free') { x.role = 'free'; x.premiumUntil = 0; } else if (op == 'suspend') { x.status = 'suspended'; x.token = ''; } else x.status = 'active'; done++; });
      L(a.username, 'bulk_' + op, (r.usernames || []).length + ' member', 'berhasil ' + done); store(d); return OK({done});
    }
    if (act == 'admin_create') {
      const e = valid(r.username, r.password); if (e) return ER(e);
      if (find(d, r.username)) return ER('Username sudah dipakai.');
      d.users.push({username: r.username.trim(), pass: r.password, role: 'free', premiumUntil: 0, status: 'active', createdAt: n, lastLogin: 0, token: '', note: ''}); store(d); return OK();
    }
    const u = find(d, r.username); if (!u) return ER('Member tidak ditemukan.');
    if (act == 'admin_update') {
      const self = u.username == a.username;
      if (self && (r.role != 'admin' || r.status != 'active')) return ER('Akun admin yang sedang dipakai tidak bisa diturunkan / dinonaktifkan.');
      if (!['free', 'premium', 'admin'].includes(r.role)) return ER('Role tidak valid.');
      if (r.role == 'premium' && !(r.premiumUntil > n)) return ER('Durasi premium belum diisi.');
      u.role = r.role; u.premiumUntil = r.role == 'premium' ? +r.premiumUntil : (r.role == 'free' ? 0 : u.premiumUntil);
      u.status = r.status == 'suspended' ? 'suspended' : 'active'; u.note = String(r.note || '').slice(0, 200);
      if (u.status != 'active') u.token = ''; L(a.username, 'admin_update', u.username, u.role + ' · ' + u.status); store(d); return OK({user: pub(u, n)});
    }
    if (act == 'admin_kick') { if (u == a) return ER('Tidak bisa mengeluarkan akun sendiri.'); u.token = ''; L(a.username, 'admin_kick', u.username); store(d); return OK(); }
    if (act == 'admin_reset') { if (String(r.password).length < 6) return ER('Password minimal 6 karakter.'); u.pass = r.password; u.token = ''; L(a.username, 'admin_reset', u.username); store(d); return OK(); }
    if (act == 'admin_delete') { if (u.username == a.username) return ER('Tidak bisa menghapus akun sendiri.'); d.users = d.users.filter(x => x !== u); L(a.username, 'admin_delete', u.username); store(d); return OK(); }
    return ER('Aksi tidak dikenal.');
  }

  const call = async body => DEMO ? (await new Promise(r => setTimeout(r, 250)), demo(body)) : remote(body);
  return {
    DEMO, LIFETIME, DAY, call,
    config: () => call({action: 'config'}),
    login: (username, password) => call({action: 'login', username, password}),
    register: (username, password) => call({action: 'register', username, password}),
    me: token => call({action: 'me', token}),
    logout: token => call({action: 'logout', token})
  };
})();
