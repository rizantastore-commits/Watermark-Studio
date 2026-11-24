'use strict';
/* Pusat pengumuman & "Apa yang baru" (v29).
   Member: banner di atas halaman (carousel kalau lebih dari satu) + tombol 🔔 berisi riwayat pengumuman (dikelompokkan per hari, bisa difilter).
   Admin: halaman admin hanya memakai WM_ANN.card() untuk pratinjau (pengelolaan ada di admin-ann.js). Perlu auth.js. */
window.WM_ANN = (() => {
  const Q = s => document.querySelector(s), ADMIN = window.WM_PAGE == 'admin';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const TYPES = {info: {ic: 'ℹ️', ico: 'info', lb: 'Info'}, promo: {ic: '🎁', ico: 'gift', lb: 'Promo'}, update: {ic: '✨', ico: 'sparkles', lb: 'Update'}, maint: {ic: '🛠️', ico: 'wrench', lb: 'Maintenance'}};
  const DAY = 864e5, POLL = 5, ROT = 7000; // muat ulang dari server tiap 5 menit; banner berganti tiap 7 detik kalau lebih dari satu
  let LIST = [], tick = 0, timer = 0, rot = 0, cur = 0, hold = 0, sig = '', FIL = 'all', openBase = 0, lastN = -1;

  const now = () => Auth.now(), me = () => Auth.user();
  const uk = s => 'wm_ann_' + s + '_' + (me() ? me().username.toLowerCase() : '');
  const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const dismissed = () => { const d = rd(uk('x'), []); return Array.isArray(d) ? d : []; };
  const dismiss = id => { const d = dismissed(); if (!d.includes(id)) { d.push(id); wr(uk('x'), d.slice(-100)); } };
  const isLive = x => !x.end || x.end > now();
  const dd = t => Math.round((new Date(now()).setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / DAY); // selisih hari kalender
  const clock = t => new Date(t).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace(':', '.');
  const when = t => { const d = dd(t); return d <= 0 ? 'Hari ini, ' + clock(t) : d == 1 ? 'Kemarin, ' + clock(t) : d < 7 ? d + ' hari lalu' : Auth.fmtDate(t); };
  const grp = t => { const d = dd(t); return d <= 0 ? 'Hari ini' : d == 1 ? 'Kemarin' : d < 7 ? 'Minggu ini' : 'Lebih lama'; };
  const base = () => Math.max(rd(uk('seen'), 0), (me() && me().createdAt) || 0); // yang lebih baru dari ini = belum dibaca

  /* ---------- teks: **tebal** dan daftar dengan awalan "- " (aman: di-escape dulu) ---------- */
  const inl = s => esc(s).replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  function rich(s) {
    const out = []; let ul = false;
    String(s).split(/\r?\n/).forEach(line => {
      const m = /^\s*(?:[-•*]\s+)(.+)$/.exec(line);
      if (m) { if (!ul) { out.push('<ul>'); ul = true; } out.push('<li>' + inl(m[1]) + '</li>'); return; }
      if (ul) { out.push('</ul>'); ul = false; }
      out.push(line.trim() ? '<span class="an-ln">' + inl(line) + '</span>' : '<span class="an-gap"></span>');
    });
    if (ul) out.push('</ul>');
    return out.join('');
  }

  /* ---------- hitung mundur ---------- */
  const left = t => {
    const ms = t - now(); if (ms <= 0) return 'segera berakhir';
    const m = Math.ceil(ms / 6e4), h = Math.ceil(ms / 36e5), d = Math.ceil(ms / DAY);
    return m < 60 ? m + ' menit lagi' : h < 24 ? h + ' jam lagi' : d + ' hari lagi';
  };
  const cdText = x => x.type == 'maint' ? '🛠️ Sampai ' + new Date(x.end).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}).replace(':', '.') : '⏳ Berakhir ' + left(x.end);
  const chip = x => (x.end && (x.type == 'promo' || x.type == 'maint') && x.end > now())
    ? `<span class="an-cd${x.end - now() < DAY ? ' hot' : ''}" data-end="${x.end}" data-ty="${x.type}">${cdText(x)}</span>` : '';
  const refreshCd = () => document.querySelectorAll('.an-cd[data-end]').forEach(e => { e.textContent = cdText({type: e.dataset.ty, end: +e.dataset.end}); });

  /* ---------- tombol ajakan (CTA) ---------- */
  function cta(x) {
    const c = String(x.cta || ''); if (!c) return '';
    const lb = esc(x.ctaLabel || 'Buka');
    if (c == 'plans') return `<button type="button" class="an-cta" data-plans>${lb}</button>`;
    if (c == 'wa') return `<a class="an-cta" target="_blank" rel="noopener" href="${esc(Auth.wa('Halo kak ReyVion, soal info "' + x.title + '".' + (me() ? ' Username: ' + me().username + '.' : '')))}">${lb}</a>`;
    if (/^https:\/\/[^\s<>"']+$/i.test(c)) return `<a class="an-cta" target="_blank" rel="noopener noreferrer" href="${esc(c)}">${lb}</a>`;
    if (/^[a-z0-9-]{1,30}\.html$/i.test(c)) return `<a class="an-cta" href="${esc(c)}">${lb}</a>`;
    return '';
  }

  /* ---------- kartu pengumuman (dipakai banner, riwayat, dan pratinjau admin) ---------- */
  function card(x, o = {}) {
    const ty = TYPES[x.type] ? x.type : 'info', t = TYPES[ty];
    const meta = `<span class="an-ty">${t.lb}</span>${o.feed ? `<span class="an-wh">${when(x.start)}</span>` : ''}${o.fresh ? '<em class="an-new">Baru</em>' : ''}${x.pin ? '<em class="an-pin" title="Disematkan">📌</em>' : ''}`;
    return `<article class="an ${ty}${x.pin ? ' pinned' : ''}${o.fresh ? ' fresh' : ''}" data-an="${esc(x.id)}"><i class="an-ic" aria-hidden="true">${t.ic}</i>
      <div class="an-b"><div class="an-d">${meta}</div><strong class="an-h">${esc(x.title)}</strong>
      ${x.body ? `<div class="an-t">${rich(x.body)}</div><button type="button" class="an-tg" hidden>Selengkapnya</button>` : ''}
      ${chip(x)}${cta(x)}</div>
      ${o.close ? `<button class="an-x" type="button" data-anx="${esc(x.id)}" aria-label="Tutup pengumuman">${IC('x')}</button>` : ''}</article>`;
  }
  /* tombol "Selengkapnya" hanya muncul kalau isinya benar-benar terpotong */
  function fit(root) {
    requestAnimationFrame(() => (root || document).querySelectorAll('.an .an-t').forEach(t => {
      const a = t.closest('.an'), b = a.querySelector('.an-tg'); if (!b || a.classList.contains('open')) return;
      b.hidden = !(t.scrollHeight > t.clientHeight + 2);
    }));
  }

  /* ---------- banner di atas halaman ---------- */
  function liveList() {
    const gone = dismissed();
    const live = me() ? LIST.filter(x => isLive(x) && (x.pin || !gone.includes(x.id))) : [];
    return live.sort((a, b) => (b.pin - a.pin) || ((b.type == 'maint') - (a.type == 'maint')) || b.start - a.start);
  }
  function paintBar(force) {
    const bar = Q('#annbar'); if (!bar) return;
    const slot = bar.classList.contains('slot'), live = liveList(), n = live.length;
    if (cur >= n) cur = 0;
    const s = [slot, cur, live.map(x => x.id + ':' + x.title + ':' + x.body + ':' + x.cta + ':' + x.pin).join('|')].join('#');
    if (!force && s == sig) { refreshCd(); return; } // tidak ada yang berubah: jangan gambar ulang (animasi tidak mengulang)
    sig = s;
    if (slot) { // halaman watermark (layar tetap): 1 banner + tombol "+N"
      const more = n - 1;
      bar.innerHTML = n ? card(live[0], {close: !live[0].pin}) + (more > 0 ? `<button type="button" class="an-more" data-anopen>${IC('bell')} +${more}</button>` : '') : '';
    } else {
      bar.innerHTML = n ? card(live[cur], {close: !live[cur].pin}) + (n > 1 ? `<div class="an-nav" role="tablist" aria-label="Pengumuman">${live.map((x, i) => `<button type="button" class="an-dotb${i == cur ? ' on' : ''}" data-ani="${i}" role="tab" aria-selected="${i == cur}" aria-label="Pengumuman ${i + 1}"></button>`).join('')}<button type="button" class="an-all" data-anopen>Lihat semua</button></div>` : '') : '';
    }
    bar.hidden = !n; bar.dataset.n = n;
    const app = Q('.app'); if (app && slot) app.classList.toggle('has-ann', !bar.hidden);
    fit(bar);
  }
  function spin() { // putar banner otomatis, berhenti saat disentuh / dibuka
    clearInterval(rot); rot = setInterval(() => {
      const bar = Q('#annbar'); if (!bar || bar.hidden || bar.classList.contains('slot') || document.hidden || Date.now() < hold) return;
      const n = liveList().length; if (n < 2 || bar.querySelector('.an.open')) return;
      cur = (cur + 1) % n; paintBar();
    }, ROT);
  }
  function paintBell() {
    const b = Q('#annb'); if (!b) return;
    const n = me() ? feed().filter(x => x.start > base()).length : 0, dot = b.querySelector('.an-dot');
    b.hidden = !me(); dot.hidden = !n; dot.textContent = n > 9 ? '9+' : n; b.title = n ? `Apa yang baru (${n} baru)` : 'Apa yang baru';
    if (n && n != lastN) { b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); } // bergoyang sebentar kalau ada yang baru
    lastN = n;
    const hm = Q('#hbm'); if (hm) hm.classList.toggle('hasann', n > 0);
  }
  const paintAll = () => { paintBar(); paintBell(); };
  const feed = () => LIST.filter(x => x.type == 'update' || isLive(x)).sort((a, b) => b.start - a.start); // update tetap tersimpan sebagai riwayat; promo/maintenance hilang saat berakhir

  /* ---------- jendela "Apa yang baru" ---------- */
  function paintFeed() {
    const all = feed(), box = Q('#annList'), fl = Q('#annFl'); if (!box) return;
    const kinds = Object.keys(TYPES).filter(k => all.some(x => x.type == k));
    if (FIL != 'all' && !kinds.includes(FIL)) FIL = 'all';
    fl.innerHTML = all.length > 3 && kinds.length > 1 ? [['all', 'Semua', all.length]].concat(kinds.map(k => [k, TYPES[k].ic + ' ' + TYPES[k].lb, all.filter(x => x.type == k).length]))
      .map(([k, l, n]) => `<button type="button" data-anf="${k}" class="${FIL == k ? 'on' : ''}">${l}<em>${n}</em></button>`).join('') : '';
    fl.hidden = !fl.innerHTML;
    const ls = all.filter(x => FIL == 'all' || x.type == FIL);
    if (!ls.length) { box.innerHTML = '<div class="an-empty"><i>📭</i><b>Belum ada pengumuman</b><span>Kabar terbaru dari ReyVion akan muncul di sini ✨</span></div>'; return; }
    let g = '', html = '';
    ls.forEach(x => { const k = grp(x.start); if (k != g) { g = k; html += `<h5 class="an-gh">${k}</h5>`; } html += card(x, {feed: true, fresh: x.start > openBase}); });
    box.innerHTML = html; fit(box);
  }
  function open() {
    openBase = base(); const n = feed().filter(x => x.start > openBase).length; FIL = 'all';
    Q('#annSub').textContent = n ? `${n} pengumuman baru untukmu 🎉` : 'Info update, promo, dan kabar terbaru dari ReyVion.';
    paintFeed();
    Q('#annWa').href = Auth.wa('Halo kak ReyVion, aku mau tanya soal info terbaru.' + (me() ? ' Username: ' + me().username + '.' : ''));
    Q('#annm').hidden = false; Q('#annList').scrollTop = 0; wr(uk('seen'), now()); paintBell();
  }

  /* ---------- muat dari server ---------- */
  async function load() {
    if (!me()) return;
    const r = await Auth.call('ann_list'); // server lama (belum Code.gs v28) menjawab error -> diabaikan, banner tidak tampil
    if (!r.ok || !Array.isArray(r.anns) || !me()) return;
    LIST = r.anns; wr(uk('cache'), LIST);
    wr(uk('x'), dismissed().filter(id => LIST.some(x => x.id == id))); // buang catatan "ditutup" untuk pengumuman yang sudah tidak ada
    paintAll();
  }
  function build() {
    if (Q('#annm')) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="mdl" id="annm" hidden><div class="mcard annc" role="dialog" aria-modal="true" aria-labelledby="annT">
      <button class="mx" data-close type="button" aria-label="Tutup">${IC('x')}</button><div class="mico">📣</div><h3 id="annT">Apa yang baru</h3>
      <p class="gsub" id="annSub">Info update, promo, dan kabar terbaru dari ReyVion.</p>
      <div class="chips an-fl" id="annFl" hidden></div>
      <div class="an-list" id="annList"></div><a class="btn wide" id="annWa" target="_blank" rel="noopener">${IC('message')} Tanya admin di WhatsApp</a></div></div>`);
    const h = Q('header.atop, header.top');
    if (h) {
      const bar = document.createElement('div'); bar.id = 'annbar'; bar.className = 'an-bar' + (h.classList.contains('top') ? ' slot' : ''); bar.hidden = true; bar.setAttribute('aria-live', 'polite'); h.insertAdjacentElement('afterend', bar);
      const pause = () => { hold = Date.now() + 15000; };
      bar.addEventListener('mouseenter', pause); bar.addEventListener('focusin', pause); bar.addEventListener('touchstart', pause, {passive: true});
      let x0 = null; // geser kiri/kanan untuk ganti banner
      bar.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, {passive: true});
      bar.addEventListener('touchend', e => {
        if (x0 == null || bar.classList.contains('slot')) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
        const n = liveList().length; if (n < 2 || Math.abs(dx) < 50) return; cur = (cur + (dx < 0 ? 1 : n - 1)) % n; paintBar();
      }, {passive: true});
    }
    const host = Q('#hmenu') || Q('.hb');
    if (host) host.insertAdjacentHTML('afterbegin', '<button class="ib" id="annb" type="button" aria-label="Apa yang baru" title="Apa yang baru" hidden>' + IC('bell') + '<i class="an-dot" hidden></i></button>');
  }

  if (!ADMIN) {
    document.addEventListener('wm:auth', () => {
      build(); const c = rd(uk('cache'), null); LIST = Array.isArray(c) ? c : []; cur = 0; lastN = -1; paintAll(); load();
      clearInterval(timer); timer = setInterval(() => { paintAll(); if (++tick % POLL == 0) load(); }, 60000); spin();
    });
    document.addEventListener('wm:logout', () => { clearInterval(timer); clearInterval(rot); LIST = []; sig = ''; const m = Q('#annm'); if (m) m.hidden = true; paintAll(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && me()) load(); });
    document.addEventListener('keydown', e => { const m = Q('#annm'); if (e.key == 'Escape' && m && !m.hidden) m.hidden = true; });
    document.addEventListener('click', e => {
      const t = e.target, x = t.closest('[data-anx]');
      if (x) { // tutup dengan animasi singkat
        const a = x.closest('.an'); dismiss(x.dataset.anx);
        if (a && !matchMedia('(prefers-reduced-motion:reduce)').matches) { a.classList.add('out'); return void setTimeout(() => paintBar(), 200); }
        return paintBar();
      }
      const dot = t.closest('[data-ani]'); if (dot) { cur = +dot.dataset.ani; hold = Date.now() + 20000; return paintBar(); }
      const f = t.closest('[data-anf]'); if (f) { FIL = f.dataset.anf; return paintFeed(); }
      const tg = t.closest('.an-tg'); if (tg) { const a = tg.closest('.an'), o = a.classList.toggle('open'); tg.textContent = o ? 'Ringkas' : 'Selengkapnya'; return; }
      if (t.closest('#annb, [data-anopen]')) return open();
      if (t.closest('#annm .an-cta')) Q('#annm').hidden = true; // tombol "Lihat paket" membuka jendela lain, tutup yang ini
    });
  } else {
    document.addEventListener('click', e => { const tg = e.target.closest('.an-tg'); if (tg) { const o = tg.closest('.an').classList.toggle('open'); tg.textContent = o ? 'Ringkas' : 'Selengkapnya'; } });
  }
  return {card, TYPES, load, fit, rich};
})();
