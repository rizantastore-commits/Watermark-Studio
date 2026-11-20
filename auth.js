'use strict';
/* Login / daftar, status premium, dan penguncian fitur. Dipakai oleh index.html (kasir), watermark.html, dan admin.html */
const Auth = (() => {
  const C = window.WM_CONFIG, A = window.WM_API, Q = s => document.querySelector(s);
  const ADMIN_PAGE = window.WM_PAGE == 'admin', KASIR = window.WM_PAGE == 'toko', TK = 'wm_tok';
  let U = null, CFG = {waNumber: C.WA_NUMBER, waText: C.WA_TEXT}, off = 0, mode = 'login', lastP = null, busy = false;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const now = () => Date.now() + off;
  const getTok = () => { try { return localStorage.getItem(TK) || ''; } catch (e) { return ''; } };
  const setTok = t => { try { t ? localStorage.setItem(TK, t) : localStorage.removeItem(TK); } catch (e) {} };
  const isPremium = () => !!U && (U.role == 'admin' || (U.role == 'premium' && U.premiumUntil > now()));
  const isAdmin = () => !!U && U.role == 'admin';
  const locked = k => !isPremium() && C.PREMIUM_TABS.includes(k);
  const fmtDate = t => new Date(t).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
  const left = () => !U ? '' : U.role == 'admin' ? 'Admin' : !isPremium() ? 'Gratis' : U.premiumUntil >= 4e12 ? 'Premium seumur hidup' : `Premium · ${Math.max(1, Math.ceil((U.premiumUntil - now()) / 864e5))} hari lagi`;
  function wa(text) {
    let n = String(CFG.waNumber || C.WA_NUMBER).replace(/\D/g, ''); if (n.startsWith('0')) n = '62' + n.slice(1);
    return `https://wa.me/${n}?text=${encodeURIComponent(text || CFG.waText || '')}`;
  }
  const waTxt = extra => `${CFG.waText || C.WA_TEXT}${U ? ' Username: ' + U.username + '.' : ''}${extra ? ' ' + extra : ''}`;

  /* ---------- tampilan ---------- */
  const CR = C.CREDITS || {};
  const credits = `Dibuat dengan 💖 oleh <b>${esc(CR.brand || 'Rizanta Studio')}</b>${CR.dev ? ` · Dev <a href="${esc(CR.link || '#')}" target="_blank" rel="noopener">${esc(CR.dev)}</a>` : ''}`;
  const mockRows = Array.from({length: 9}, () => '<span>Rizanta Studio</span><span>Rizanta Studio</span><span>Rizanta Studio</span>').join('');
  document.body.insertAdjacentHTML('beforeend', `
  <div id="gate" class="gate">
    <i class="fl f1">♡</i><i class="fl f2">✦</i><i class="fl f3">✿</i><i class="fl f4">♡</i>
    <div class="gwrap">
      <aside class="ghero">
        <div class="gbrand"><span class="gmark">🎀</span><div><b>Watermark Studio</b><small>by ${esc(CR.brand || 'Rizanta Studio')}</small></div></div>
        <h2>${KASIR ? 'Rekap jualan jadi <em>rapi, jelas, dan tidak tertukar</em>' : 'Foto jualan & testimoni jadi <em>rapi, aman, dan siap posting</em>'}</h2>
        <p>${KASIR ? 'Catat order, stok, harga, dan refund. Pengingat perpanjangan langsung ke pembeli. Tiap akun punya rekap sendiri, datanya tidak pernah tercampur.' : 'Pasang watermark anti maling, bikin frame testimoni cantik, dan simpan template sendiri. Semua dari browser.'}</p>
        ${KASIR ? '' : `<div class="gshow" aria-hidden="true">
          <div class="mock m2"><div class="mph"><div class="mtile">${mockRows}</div></div><div class="mcap">PROMO 50%</div></div>
          <div class="mock m1"><div class="mph"><div class="msun"></div><div class="mtile">${mockRows}</div></div><div class="mcap">TESTIMONI ★★★★★</div></div>
          <i class="spark s1">✦</i><i class="spark s2">♡</i>
        </div>`}
        <ul class="gfeat">${KASIR ? '<li>🧾 Rekap jualan</li><li>📦 Stok & harga</li><li>⏰ Pengingat perpanjangan</li><li>💸 Hitung refund</li>' : '<li>🛡️ Anti maling</li><li>🖼️ Frame testimoni</li><li>📦 Banyak foto + ZIP</li><li>☁️ Template tersimpan di akun</li>'}</ul>
      </aside>
      <section class="gcard">
        <div class="gmark sm2">🎀</div>
        <h2 id="gh">Selamat datang</h2><p class="gsub" id="gsub2">Masuk untuk mulai bikin watermark</p>
        <div id="gload" class="gload"><span class="spin"></span><span id="gloadT">Memeriksa akun…</span></div>
        <form id="gform" hidden autocomplete="on">
          <div class="seg"><button type="button" data-gm="login" class="on">Masuk</button><button type="button" data-gm="reg">Daftar</button></div>
          <label class="f"><span>👤 Username</span><input id="gu" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" placeholder="mis. kak_rina"></label>
          <label class="f"><span>🔒 Password</span><div class="pw"><input id="gp" type="password" autocomplete="current-password" placeholder="minimal 6 karakter"><button type="button" class="eye" id="geye" aria-label="Lihat password">👁</button></div></label>
          <div class="str" id="gstr" hidden><i></i><i></i><i></i><em></em></div>
          <label class="f" id="gp2w" hidden><span>🔁 Ulangi password</span><input id="gp2" type="password" autocomplete="new-password" placeholder="ketik lagi"></label>
          <div id="gerr" class="gerr" role="alert"></div>
          <button class="btn pri wide big" id="gsub" type="submit">Masuk</button>
          <div class="gperk"><b>Gratis</b> bisa langsung pakai fitur dasar. <b>Premium</b> buka semua fitur, chat WhatsApp ya ✨</div>
        </form>
        <div id="gretry" hidden><div class="gerr on" id="gretryT"></div><button class="btn pri wide" id="gretryB" type="button">Coba lagi</button></div>
        <div class="demo" id="gdemo" hidden>MODE DEMO · data di browser ini saja<br>Admin demo: <b>admin</b> / <b>admin123</b></div>
      </section>
    </div>
    <footer class="gcred">${credits}</footer>
  </div>
  <div class="mdl" id="up" hidden><div class="mcard">
    <button class="mx" data-close aria-label="Tutup">✕</button><div class="mico">🔒</div><h3>Fitur Premium</h3><p id="upT"></p>
    <ul class="pl">${C.PREMIUM_LIST.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <button class="btn pri wide" data-plans type="button">👑 Lihat paket & harga</button>
    <a class="btn wide" id="upWa" target="_blank" rel="noopener">Tanya admin di WhatsApp</a>
  </div></div>
  <div class="mdl" id="plans" hidden><div class="mcard pcard">
    <button class="mx" data-close aria-label="Tutup">✕</button><div class="mico">👑</div><h3>Upgrade Premium</h3>
    <p class="pill" id="plSt"></p>
    <div class="cmp"><div class="ch"><span></span><b>Gratis</b><b class="pr">Premium</b></div>${(C.COMPARE || []).map(r => `<div class="cr"><span>${esc(r[0])}</span>${[r[1], r[2]].map((v, i) => `<em class="${i ? 'pr' : ''}">${v === true ? '✓' : v === false ? '—' : esc(v)}</em>`).join('')}</div>`).join('')}</div>
    <h4 class="plh">Pilih paket</h4><div class="pgrid" id="plGrid"></div>
    <small class="plnote">Klik paket → chat WhatsApp admin. Setelah bayar, admin mengaktifkan premium di akunmu dan fitur langsung terbuka di sini.</small>
    <div class="mcred">${credits}</div>
  </div></div>
  <div class="mdl" id="acc" hidden><div class="mcard">
    <button class="mx" data-close aria-label="Tutup">✕</button><div class="av big" id="accAv"></div><h3 id="accN"></h3><p id="accS" class="pill"></p><p id="accD" class="gsub"></p>
    <button class="btn pri wide" data-plans type="button" id="accUp">👑 Lihat paket Premium</button>
    <a class="btn wide" id="accWa" target="_blank" rel="noopener"></a>
    <a class="btn wide" id="accTk" href="index.html">🧾 Kasir & Rekap Toko</a>
    <a class="btn wide" id="accWm" href="watermark.html">🎀 Watermark Studio</a>
    <a class="btn wide" id="accAdm" href="admin.html" hidden>Buka Panel Admin</a>
    <div class="accrow"><button class="btn" id="accSet" type="button">⚙️ Pengaturan</button><button class="btn" id="accOut" type="button">Keluar</button></div>
    <div class="mcred">${credits}</div>
  </div></div>`);
  const hb = Q('.hb');
  if (hb && !ADMIN_PAGE) hb.insertAdjacentHTML('beforeend', '<button class="upg" id="upg" data-plans aria-label="Premium" hidden>👑<em>Premium</em></button><button class="ib um" id="um" aria-label="Akun saya" hidden></button>');
  if (!ADMIN_PAGE) document.querySelectorAll('.sec').forEach(s => {
    if (C.PREMIUM_TABS.includes(s.id.slice(2))) s.insertAdjacentHTML('afterbegin', '<div class="lockbar"><span>🔒 Fitur premium</span><button type="button" data-up="Fitur ini">Unlock</button></div>');
  });
  Q('#gdemo').hidden = !A.DEMO;
  const show = (el, on) => { Q(el).hidden = !on; };
  const err = m => { const e = Q('#gerr'); e.textContent = m || ''; e.classList.toggle('on', !!m); };
  const setMode = m => {
    mode = m; err('');
    document.querySelectorAll('[data-gm]').forEach(b => b.classList.toggle('on', b.dataset.gm == m));
    show('#gp2w', m == 'reg'); show('#gstr', m == 'reg'); Q('#gsub').textContent = m == 'reg' ? 'Buat akun gratis' : 'Masuk';
    Q('#gh').textContent = m == 'reg' ? 'Buat akun baru' : 'Selamat datang'; Q('#gsub2').textContent = m == 'reg' ? 'Gratis, tanpa kartu. Langsung bisa pakai.' : (KASIR ? 'Masuk untuk membuka kasir & rekap tokomu' : 'Masuk untuk mulai bikin watermark');
    Q('#gp').autocomplete = m == 'reg' ? 'new-password' : 'current-password';
  };
  function gate(state, msg) { // 'load' | 'form' | 'retry' | 'off'
    document.body.classList.toggle('gated', state != 'off'); show('#gate', state != 'off');
    show('#gload', state == 'load'); show('#gform', state == 'form'); show('#gretry', state == 'retry');
    if (state == 'retry') Q('#gretryT').textContent = msg || ''; if (state == 'form' && msg) err(msg);
  }

  /* ---------- status akun ---------- */
  function paint() {
    const p = isPremium(), um = Q('#um');
    const ug = Q('#upg'); if (ug) { ug.hidden = !U; ug.classList.toggle('on', p); ug.querySelector('em').textContent = p ? 'Perpanjang' : 'Premium'; }
    if (um) { um.hidden = !U; if (U) um.innerHTML = `<span class="av">${esc(U.username[0].toUpperCase())}</span>${p ? '<i class="pro">PRO</i>' : ''}`; }
    document.querySelectorAll('.sec').forEach(s => s.classList.toggle('lockd', locked(s.id.slice(2))));
    onTab();
    if (lastP !== null && lastP !== p) if (typeof toast == 'function') toast(p ? 'Premium aktif, semua fitur terbuka 🎀' : 'Premium kamu sudah habis, fitur premium terkunci lagi');
    lastP = p;
    if (typeof draw == 'function') try { draw(); } catch (e) {}
  }
  function onTab() {
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('lk', locked(b.dataset.tab)));
    document.querySelectorAll('[data-g]').forEach(b => { const g = GR.find(x => x[0] == b.dataset.g); b.classList.toggle('lk', !!g && g[3].every(locked)); });
  }

  /* ---------- tema tersimpan di akun (sheet Users, kolom theme) ---------- */
  let thTimer = 0;
  const thJson = s => JSON.stringify({p: s.p, c: s.p == 'custom' ? s.c : null, f: s.f});
  function saveTheme(st) { // ditunda 0,7 dtk supaya menggeser warna tidak mengirim ratusan permintaan
    clearTimeout(thTimer);
    thTimer = setTimeout(async () => {
      thTimer = 0; if (!U) return;
      const d = thJson(st), r = await call('acct_theme', {data: d});
      if (r.ok && U) U.theme = d;
    }, 700);
  }
  function syncTheme() { // tema akun dipakai di perangkat ini; kalau akun belum punya, kirim tema perangkat ini
    const T = window.WM_THEME; if (!T || !U || thTimer) return;
    let srv = null; try { srv = U.theme ? JSON.parse(U.theme) : null; } catch (e) {}
    if (srv) { if (thJson(srv) !== thJson(T.state)) T.adopt(srv); }
    else if (!T.isDefault()) saveTheme(T.state);
  }
  if (window.WM_THEME) WM_THEME.onSave = st => { if (U) saveTheme(st); };

  function setUser(u, extra) {
    U = u; if (extra && extra.now) off = extra.now - Date.now(); if (extra && extra.cfg) CFG = {...CFG, ...extra.cfg};
    syncTheme(); paint();
  }
  function enter(r) {
    setUser(r.user, r); if (r.token) setTok(r.token); gate('off');
    if (typeof window.WM_ON_AUTH == 'function') window.WM_ON_AUTH(U);
  }
  async function check() {
    gate('load'); const t = getTok();
    A.config().then(r => { if (r.ok) CFG = {...CFG, ...r.cfg}; });
    if (!t) return gate('form');
    const r = await A.me(t);
    if (r.ok) return enter(r);
    if (r.code == 'net') return gate('retry', r.error);
    setTok(''); gate('form', r.error);
  }
  async function submit(e) {
    e.preventDefault(); if (busy) return;
    const u = Q('#gu').value.trim(), p = Q('#gp').value;
    if (!u || !p) return err('Isi username dan password dulu ya.');
    if (mode == 'reg' && p !== Q('#gp2').value) return err('Password dan ulangi password belum sama.');
    busy = true; err(''); const b = Q('#gsub'), t0 = b.textContent; b.disabled = true; b.textContent = 'Memproses…';
    const r = await (mode == 'reg' ? A.register(u, p) : A.login(u, p));
    busy = false; b.disabled = false; b.textContent = t0;
    if (!r.ok) return err(r.error);
    Q('#gp').value = ''; Q('#gp2').value = ''; enter(r);
  }
  async function logout(msg) {
    const t = getTok(); setTok(''); if (t) A.logout(t); clearTimeout(thTimer); thTimer = 0; if (window.WM_THEME) WM_THEME.clearLocal(); U = null; lastP = null; Q('#acc').hidden = true; Q('#plans').hidden = true; if (window.WM_SETTINGS) WM_SETTINGS.close(); if (typeof window.WM_ON_LOGOUT == 'function') window.WM_ON_LOGOUT(); paint(); setMode('login'); gate('form', msg || '');
  }
  async function refresh() {
    const t = getTok(); if (!t || !U) return;
    const r = await A.me(t);
    if (r.ok) setUser(r.user, r); else if (r.code == 'session') logout(r.error);
  }

  /* ---------- jendela unlock & akun ---------- */
  function upsell(name) {
    Q('#upT').innerHTML = `<b>${esc(name || 'Fitur ini')}</b> khusus member premium. Chat admin di WhatsApp untuk unlock semua fitur.`;
    Q('#upWa').href = wa(waTxt(name ? `Fitur: ${name}.` : '')); Q('#up').hidden = false;
  }
  function account() {
    const p = isPremium();
    Q('#accAv').textContent = U.username[0].toUpperCase(); Q('#accN').textContent = U.username;
    Q('#accS').textContent = left(); Q('#accS').classList.toggle('on', p);
    Q('#accD').textContent = U.role == 'premium' && p && U.premiumUntil < 4e12 ? `Aktif sampai ${fmtDate(U.premiumUntil)}` : U.expired ? `Premium habis sejak ${fmtDate(U.premiumUntil)}` : p ? 'Semua fitur terbuka' : 'Fitur dasar aktif';
    Q('#accUp').textContent = p ? '👑 Perpanjang premium' : '👑 Lihat paket Premium'; Q('#accUp').hidden = U.role == 'admin';
    const w = Q('#accWa'); w.textContent = 'Chat admin WhatsApp'; w.href = wa(waTxt(p ? 'Mau perpanjang premium.' : ''));
    Q('#accAdm').hidden = !isAdmin(); Q('#accTk').hidden = KASIR; Q('#accWm').hidden = !KASIR; Q('#acc').hidden = false;
  }

  function plans() {
    const p = isPremium(); Q('#plSt').textContent = left(); Q('#plSt').classList.toggle('on', p);
    Q('#plGrid').innerHTML = C.PLANS.map(pl => `<a class="plan${pl.hot ? ' hot' : ''}" target="_blank" rel="noopener" href="${wa(waTxt(`Mau ${p ? 'perpanjang' : 'beli'} Premium ${pl.name} (${pl.price}).`))}">${pl.hot ? '<i class="hotb">Paling laris</i>' : ''}<b>${esc(pl.name)}</b><strong>${esc(pl.price)}</strong><small>${pl.days ? pl.days + ' hari' : 'Selamanya'}${pl.note ? ' · ' + esc(pl.note) : ''}</small><span>Pilih →</span></a>`).join('');
    Q('#up').hidden = true; Q('#acc').hidden = true; Q('#plans').hidden = false;
  }
  async function call(action, data) { // panggil server dengan token akun ini
    const r = await A.call({action, token: getTok(), ...(data || {})});
    if (!r.ok && r.code == 'session') logout(r.error);
    // server lama (belum deploy Code.gs v7) menjawab aksi template dengan 'Member tidak ditemukan.'
    if (!r.ok && /^(tpl|rec|acct)_/.test(action) && (r.code == 'unknown' || r.error == 'Member tidak ditemukan.' || r.error == 'Khusus admin.'))
      return {ok: false, code: 'outdated', error: 'Server belum diperbarui ke versi terbaru. Admin: tempel Code.gs terbaru di Apps Script lalu Deploy → Manage deployments → Edit → New version.'};
    return r;
  }
  async function updateAccount(d) { // ganti nama dan/atau password (wajib password lama)
    const old = U ? U.username : '';
    const r = await call('acct_update', d);
    if (!r.ok) return r;
    if (r.token) setTok(r.token); // password diganti: perangkat ini tetap masuk, perangkat lain keluar
    if (r.user && r.user.username !== old) ['wm_rec_', 'wm_rfset_', 'wm_t_'].forEach(k => { // pindahkan cache lokal ke nama baru
      try { const v = localStorage.getItem(k + old); if (v !== null) { localStorage.setItem(k + r.user.username, v); localStorage.removeItem(k + old); } } catch (e) {}
    });
    setUser(r.user, r); return r;
  }
  function strength(p) {
    let n = 0; if (p.length >= 6) n++; if (p.length >= 9 && /[A-Za-z]/.test(p) && /\d/.test(p)) n++; if (p.length >= 11 && /[^A-Za-z0-9]/.test(p) || p.length >= 14) n++;
    const b = Q('#gstr'); b.dataset.n = p ? n : 0; b.querySelector('em').textContent = !p ? '' : ['Terlalu pendek', 'Cukup', 'Bagus', 'Kuat'][n];
  }

  /* ---------- kunci fitur ---------- */
  const NAMES = {zipAll: 'Download semua (ZIP)', eachAll: 'Download banyak foto', shAll: 'Bagikan banyak foto', dup: 'Banyak testimoni sekaligus', bulkGo: 'Isi teks massal', ts: 'Simpan template sendiri'};
  const TABNAME = {tile: 'Watermark Penuh', frame: 'Frame testimoni', cfr: 'Bingkai upload', ph: 'Atur foto di frame', filter: 'Filter foto', mascot: 'Maskot'};
  const stop = e => { e.preventDefault(); e.stopImmediatePropagation(); };
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-close]') || t.classList.contains('mdl')) { t.closest('.mdl').hidden = true; return; }
    const up = t.closest('[data-up]'); if (up) { stop(e); return upsell(TABNAME[curTab()] || up.dataset.up); }
    if (t.closest('[data-plans]')) return plans();
    if (t.closest('#geye')) { const h = Q('#gp').type == 'password'; Q('#gp').type = Q('#gp2').type = h ? 'text' : 'password'; return; }
    if (t.closest('#um')) return account();
    if (t.closest('#accOut')) return logout();
    if (t.closest('[data-gm]')) return setMode(t.closest('[data-gm]').dataset.gm);
    if (t.closest('#gretryB')) return check();
    if (ADMIN_PAGE || isPremium() || !U) return;
    const b = t.closest('button'), sec = t.closest('.sec.lockd');
    if (sec) { stop(e); return upsell(TABNAME[sec.id.slice(2)]); }
    if (b && NAMES[b.id]) { stop(e); return upsell(NAMES[b.id]); }
    if (b && b.dataset.pre != null) {
      const s = PRE[+b.dataset.pre].s;
      if ((s.tile && s.tile.on) || (s.frame && s.frame.on) || (s.mascot && s.mascot.on)) { stop(e); upsell('Template ' + PRE[+b.dataset.pre].n); }
    }
  }, true);
  const curTab = () => (document.querySelector('.sec.on') || {id: ''}).id.slice(2);
  ['input', 'change'].forEach(n => document.addEventListener(n, e => {
    if (ADMIN_PAGE || isPremium() || !U) return;
    if (e.target.closest && e.target.closest('.sec.lockd')) { stop(e); if (typeof sync == 'function') sync(); upsell(TABNAME[curTab()]); }
  }, true));
  Q('#gform').addEventListener('submit', submit);
  Q('#gp').addEventListener('input', e => { if (mode == 'reg') strength(e.target.value); });

  /* ---------- mulai ---------- */
  setMode('login');
  setInterval(() => { if (U && isPremium() !== lastP) paint(); }, 20000);          // durasi habis -> langsung terkunci
  setInterval(refresh, 5 * 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('load', check);
  return {isPremium, isAdmin, locked, onTab, upsell, call, updateAccount, plans, user: () => U, fmtDate, wa, now, logout, esc, get cfg() { return CFG; }};
})();
