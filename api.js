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
    status: u.status, createdAt: u.createdAt, lastLogin: u.lastLogin, note: u.note || ''
  });
  const cfgOf = () => ({waNumber: C.WA_NUMBER, waText: C.WA_TEXT, registerOpen: true});
  const tok = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const find = (d, name) => d.users.find(u => u.username.toLowerCase() == String(name || '').trim().toLowerCase());
  const OK = (x = {}) => ({ok: true, now: Date.now(), cfg: cfgOf(), ...x});
  const ER = (error, code) => ({ok: false, error, code});
  const valid = (n, p) => !/^[A-Za-z0-9_.]{3,20}$/.test(n) ? 'Username 3-20 karakter: huruf, angka, titik, atau underscore.' : String(p).length < 6 ? 'Password minimal 6 karakter.' : '';

  function demo(r) {
    const d = load(), n = Date.now(), act = r.action;
    const me = () => d.users.find(u => u.token && u.token === r.token && u.status == 'active');
    if (act == 'config') return OK();
    if (act == 'register') {
      const e = valid(r.username, r.password); if (e) return ER(e);
      if (find(d, r.username)) return ER('Username sudah dipakai, coba yang lain.');
      const u = {username: r.username.trim(), pass: r.password, role: 'free', premiumUntil: 0, status: 'active', createdAt: n, lastLogin: n, token: tok(), note: ''};
      d.users.push(u); store(d); return OK({token: u.token, user: pub(u, n)});
    }
    if (act == 'login') {
      const u = find(d, r.username);
      if (!u || u.pass !== r.password) return ER('Username atau password salah.');
      if (u.status != 'active') return ER('Akun kamu dinonaktifkan. Hubungi admin Rizanta Studio.');
      u.token = tok(); u.lastLogin = n; store(d); return OK({token: u.token, user: pub(u, n)});
    }
    if (act == 'me') { const u = me(); return u ? OK({user: pub(u, n)}) : ER('Sesi berakhir, silakan masuk lagi.', 'session'); }
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
    if (act == 'tpl_delete') { a.tpls = (a.tpls || []).filter(t => t.n != r.name); store(d); return OK(); }
    if (a.role != 'admin') return ER('Khusus admin.', 'forbidden');
    if (act == 'admin_list') return OK({users: d.users.map(u => pub(u, n))});
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
      if (u.status != 'active') u.token = ''; store(d); return OK({user: pub(u, n)});
    }
    if (act == 'admin_reset') { if (String(r.password).length < 6) return ER('Password minimal 6 karakter.'); u.pass = r.password; u.token = ''; store(d); return OK(); }
    if (act == 'admin_delete') { if (u.username == a.username) return ER('Tidak bisa menghapus akun sendiri.'); d.users = d.users.filter(x => x !== u); store(d); return OK(); }
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
