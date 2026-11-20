'use strict';
/* Menu Pengaturan: tab Tema (template, warna sendiri, font) dan tab Akun (ganti nama & password).
   Dibuka dari tombol 🎨 di header atau dari jendela akun. Perlu theme.js dan auth.js. */
window.WM_SETTINGS = (() => {
  const T = window.WM_THEME, Q = s => document.querySelector(s), esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const COLORS = [['ink', 'Warna teks'], ['bg', 'Warna latar belakang'], ['ac', 'Warna aksen (tombol)']];
  let tab = 'tema', busy = false;
  const me = () => (typeof Auth != 'undefined' ? Auth.user() : null);

  document.body.insertAdjacentHTML('beforeend', `
  <div class="mdl" id="set" hidden><div class="mcard wset" role="dialog" aria-modal="true" aria-labelledby="stT">
    <div class="sth">
      <button class="mx" data-close type="button" aria-label="Tutup">✕</button>
      <h3 id="stT">⚙️ Pengaturan</h3>
      <div class="seg" id="stTabs"><button type="button" data-st="tema" class="on">🎨 Tema</button><button type="button" data-st="akun">👤 Akun</button></div>
    </div>
    <div class="stb">
      <section id="stTema">
        <div class="sgrp"><h4>Template</h4><div class="tp" id="tpGrid">${T.PRESETS.map(p => `<button type="button" class="tpb" data-p="${p.id}" aria-pressed="false"><i style="background:linear-gradient(135deg,${p.bg} 50%,${p.ac} 50%)"></i><span>${esc(p.n)}</span></button>`).join('')}</div></div>
        <div class="sgrp"><h4>Atur sendiri</h4>
          ${COLORS.map(([k, l]) => `<label class="tcr"><span>${l}</span><input type="color" data-c="${k}" aria-label="${l}"><input class="hx" type="text" data-h="${k}" maxlength="7" spellcheck="false" autocapitalize="none" autocomplete="off" aria-label="Kode ${l}"></label>`).join('')}
          <div class="tcn" id="tcN" role="status"></div>
        </div>
        <label class="f"><span>Font</span><select id="tFont">${T.FONTS.map(f => `<option value="${f.id}">${esc(f.n)}</option>`).join('')}</select></label>
        <button class="btn wide" id="tReset" type="button">↺ Kembalikan ke bawaan</button>
      </section>
      <section id="stAkun" hidden>
        <div class="sac"><div class="av" id="sAv"></div><div><b id="sName"></b><small id="sRole"></small></div></div>
        <form id="sForm" autocomplete="off" novalidate>
          <label class="f"><span>👤 Nama pengguna</span><input id="sNm" type="text" maxlength="20" autocapitalize="none" spellcheck="false" autocomplete="off"></label>
          <small>Dipakai untuk masuk. 3-20 karakter: huruf, angka, titik, atau _ . Data kamu ikut pindah ke nama baru.</small>
          <label class="f"><span>🔑 Password baru <em>kosongkan kalau tidak diganti</em></span><div class="pw"><input id="sNp" type="password" autocomplete="new-password" placeholder="minimal 6 karakter"><button type="button" class="eye" id="sEye" aria-label="Lihat password">👁</button></div></label>
          <div class="str" id="sStr" hidden><i></i><i></i><i></i><em></em></div>
          <label class="f" id="sNp2w" hidden><span>🔁 Ulangi password baru</span><input id="sNp2" type="password" autocomplete="new-password" placeholder="ketik lagi"></label>
          <div class="sdiv"></div>
          <label class="f"><span>🔒 Password saat ini <b>wajib</b></span><input id="sOp" type="password" autocomplete="current-password" placeholder="untuk konfirmasi perubahan"></label>
          <div class="gerr" id="sErr" role="alert"></div>
          <button class="btn pri wide big" id="sSave" type="submit">Simpan perubahan</button>
          <small>Kalau password diganti, perangkat lain yang sedang masuk otomatis keluar.</small>
        </form>
      </section>
    </div>
  </div></div>`);

  const set = Q('#set'), hexOk = v => !!T.norm(v);

  /* ---------- tab ---------- */
  function showTab(t) {
    const U = me();
    if (t == 'akun' && !U) t = 'tema';
    tab = t; Q('#stTabs').hidden = !U;
    document.querySelectorAll('[data-st]').forEach(b => b.classList.toggle('on', b.dataset.st == t));
    Q('#stTema').hidden = t != 'tema'; Q('#stAkun').hidden = t != 'akun';
    Q('.stb').scrollTop = 0;
    t == 'tema' ? paintTema() : paintAkun();
  }
  function open(t) {
    const acc = Q('#acc'); if (acc) acc.hidden = true;
    set.hidden = false; showTab(t || 'tema');
  }
  const close = () => { set.hidden = true; };

  /* ---------- tema ---------- */
  function note(c) {
    const r = T.check(c), el = Q('#tcN');
    el.className = 'tcn ' + r.level;
    el.textContent = r.level == 'ok' ? '✓ Teks mudah dibaca' : r.level == 'warn' ? '⚠️ Teks agak sulit dibaca, coba beda warna dengan latar' : '⛔ Teks terlalu sulit dibaca, warna ini belum diterapkan';
  }
  function paintTema() {
    const st = T.state, c = T.colors();
    document.querySelectorAll('.tpb').forEach(b => b.setAttribute('aria-pressed', String(st.p == b.dataset.p)));
    COLORS.forEach(([k]) => { Q(`[data-c="${k}"]`).value = c[k]; Q(`[data-h="${k}"]`).value = c[k]; });
    Q('#tFont').value = st.f; note(c);
  }
  function fromFields(src) { // baca 3 warna dari kolom, terapkan kalau valid dan terbaca
    const c = {};
    for (const [k] of COLORS) { const v = T.norm(src && src.dataset.h == k ? src.value : Q(`[data-h="${k}"]`).value); if (!v) { return; } c[k] = v; }
    COLORS.forEach(([k]) => { Q(`[data-c="${k}"]`).value = c[k]; if (!src || src.dataset.h != k) Q(`[data-h="${k}"]`).value = c[k]; });
    note(c); if (T.check(c).level == 'bad') return;
    T.set({p: 'custom', c});
    document.querySelectorAll('.tpb').forEach(b => b.setAttribute('aria-pressed', 'false'));
  }

  /* ---------- akun ---------- */
  const err = m => { const e = Q('#sErr'); e.textContent = m || ''; e.classList.toggle('on', !!m); };
  function paintAkun() {
    const U = me(); if (!U) return;
    Q('#sAv').textContent = U.username[0].toUpperCase(); Q('#sName').textContent = U.username;
    Q('#sRole').textContent = U.role == 'admin' ? 'Admin' : Auth.isPremium() ? 'Premium' : 'Akun gratis';
    Q('#sNm').value = U.username; ['#sNp', '#sNp2', '#sOp'].forEach(s => { Q(s).value = ''; Q(s).type = 'password'; });
    Q('#sStr').hidden = true; Q('#sNp2w').hidden = true; err('');
  }
  function strength(p) {
    let n = 0; if (p.length >= 6) n++; if (p.length >= 9 && /[A-Za-z]/.test(p) && /\d/.test(p)) n++; if (p.length >= 11 && /[^A-Za-z0-9]/.test(p) || p.length >= 14) n++;
    const b = Q('#sStr'); b.hidden = !p; b.dataset.n = p ? n : 0; b.querySelector('em').textContent = !p ? '' : ['Terlalu pendek', 'Cukup', 'Bagus', 'Kuat'][n];
  }
  async function save(e) {
    e.preventDefault(); if (busy) return;
    const U = me(); if (!U) return;
    const nm = Q('#sNm').value.trim(), np = Q('#sNp').value, np2 = Q('#sNp2').value, op = Q('#sOp').value;
    const rename = nm !== U.username, repass = !!np;
    if (!rename && !repass) return err('Belum ada yang diubah.');
    if (rename && !/^[A-Za-z0-9_.]{3,20}$/.test(nm)) return err('Nama pengguna 3-20 karakter: huruf, angka, titik, atau underscore.');
    if (repass) {
      if (np.length < 6) return err('Password baru minimal 6 karakter.');
      if (np !== np2) return err('Ulangi password baru belum sama.');
      if (np === op) return err('Password baru harus beda dari password saat ini.');
    }
    if (!op) return err('Isi password saat ini dulu untuk konfirmasi.');
    busy = true; err(''); const b = Q('#sSave'), t0 = b.textContent; b.disabled = true; b.textContent = 'Menyimpan…';
    const r = await Auth.updateAccount({password: op, newUsername: rename ? nm : '', newPassword: repass ? np : ''});
    busy = false; b.disabled = false; b.textContent = t0;
    if (!r.ok) { if (r.code != 'session') err(r.error); return; }
    paintAkun();
    const msg = rename && repass ? 'Nama & password berhasil diganti ✓' : rename ? 'Nama berhasil diganti ✓' : 'Password berhasil diganti ✓';
    if (typeof toast == 'function') toast(msg);
  }

  /* ---------- event ---------- */
  document.addEventListener('click', e => {
    const t = e.target;
    const o = t.closest('[data-set]'); if (o) { e.preventDefault(); return open(o.dataset.set || 'tema'); }
    if (t.closest('#accSet')) return open('tema');
    if (!set.contains(t)) return;
    const s = t.closest('[data-st]'); if (s) return showTab(s.dataset.st);
    const p = t.closest('.tpb'); if (p) { T.set({p: p.dataset.p, c: null}); return paintTema(); }
    if (t.closest('#tReset')) { T.reset(); return paintTema(); }
    if (t.closest('#sEye')) { const h = Q('#sNp').type == 'password'; ['#sNp', '#sNp2', '#sOp'].forEach(x => { Q(x).type = h ? 'text' : 'password'; }); }
  });
  set.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.c) { Q(`[data-h="${t.dataset.c}"]`).value = t.value; return fromFields(); }
    if (t.dataset.h) { if (hexOk(t.value) || /^#?[0-9a-f]{0,6}$/i.test(t.value)) { if (hexOk(t.value)) fromFields(t); } return; }
    if (t.id == 'tFont') { T.set({f: t.value}); return; }
    if (t.id == 'sNp') { strength(t.value); Q('#sNp2w').hidden = !t.value; }
  });
  set.addEventListener('change', e => { const t = e.target; if (t.dataset.h && !hexOk(t.value)) t.value = Q(`[data-c="${t.dataset.h}"]`).value; }); // kode hex rusak -> kembali ke warna terakhir yang valid
  Q('#sForm').addEventListener('submit', save);
  document.addEventListener('keydown', e => { if (e.key == 'Escape' && !set.hidden) close(); });

  return {open, close};
})();
