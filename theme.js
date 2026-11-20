'use strict';
/* Tema: template, warna sendiri, dan font. Dimuat di <head> supaya tidak berkedip.
   Tampilan menu pengaturan ada di settings.js. Pilihan disimpan per perangkat (localStorage "wm_theme"). */
window.WM_THEME = (() => {
  const KEY = 'wm_theme', OLD = 'wm_th', DOC = document.documentElement;

  /* raw = pakai warna asli di style.css (tanpa hitung ulang). mode: null = ikut HP, 'light', 'dark' */
  const PRESETS = [
    {id: 'auto', n: 'Otomatis', raw: true, mode: null, ink: '#5c2740', bg: '#fff0f6', ac: '#ff4f9a'},
    {id: 'pink', n: 'Pink Manis', raw: true, mode: 'light', ink: '#5c2740', bg: '#fff0f6', ac: '#ff4f9a'},
    {id: 'night', n: 'Pink Malam', raw: true, mode: 'dark', ink: '#ffe4ee', bg: '#2a1019', ac: '#ff4f9a'},
    {id: 'mint', n: 'Mint Segar', ink: '#1f4a3d', bg: '#eefaf5', ac: '#0e9f6e'},
    {id: 'sky', n: 'Langit Biru', ink: '#1c3557', bg: '#eef6ff', ac: '#3b82f6'},
    {id: 'lav', n: 'Lavender', ink: '#3b2a66', bg: '#f5f0ff', ac: '#8b5cf6'},
    {id: 'peach', n: 'Persik', ink: '#5a2e1b', bg: '#fff4ec', ac: '#f4622a'},
    {id: 'coffee', n: 'Kopi Susu', ink: '#3e2c1f', bg: '#f6efe6', ac: '#a0643a'},
    {id: 'mono', n: 'Hitam Putih', ink: '#18181b', bg: '#f4f4f5', ac: '#3f3f46'},
    {id: 'ocean', n: 'Malam Biru', ink: '#e2e8f0', bg: '#0f172a', ac: '#60a5fa'},
    {id: 'forest', n: 'Hutan Malam', ink: '#dff5ea', bg: '#0e1a15', ac: '#34d399'},
    {id: 'plum', n: 'Plum Malam', ink: '#f3e8ff', bg: '#1b1226', ac: '#c084fc'}
  ];

  const FONTS = [
    {id: 'def', n: 'Bawaan'},
    {id: 'sys', n: 'Sistem HP', css: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"},
    {id: 'fredoka', n: 'Fredoka (imut)', g: 'Fredoka:wght@400;600;700', css: "'Fredoka',sans-serif"},
    {id: 'baloo', n: 'Baloo 2 (bulat)', g: 'Baloo+2:wght@500;600;700', css: "'Baloo 2',sans-serif"},
    {id: 'quick', n: 'Quicksand (lembut)', g: 'Quicksand:wght@500;600;700', css: "'Quicksand',sans-serif"},
    {id: 'poppins', n: 'Poppins (modern)', g: 'Poppins:wght@500;600;700', css: "'Poppins',sans-serif"},
    {id: 'inter', n: 'Inter (bersih)', g: 'Inter:wght@500;600;700', css: "'Inter',sans-serif"},
    {id: 'space', n: 'Space Grotesk (tegas)', g: 'Space+Grotesk:wght@500;600;700', css: "'Space Grotesk',sans-serif"},
    {id: 'lora', n: 'Lora (klasik)', g: 'Lora:wght@500;600;700', css: "'Lora',serif"},
    {id: 'mono', n: 'JetBrains Mono (kode)', g: 'JetBrains+Mono:wght@500;700', css: "'JetBrains Mono',monospace"}
  ];

  /* ---------- util warna ---------- */
  const HEX = /^#[0-9a-f]{6}$/i;
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v * (1 - t) + y[i] * t)); };
  const rgba = (h, a) => `rgba(${rgb(h).join(',')},${a})`;
  const lum = h => { const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const norm = h => { h = String(h || '').trim(); if (/^#[0-9a-f]{3}$/i.test(h)) h = '#' + [...h.slice(1)].map(c => c + c).join(''); return HEX.test(h) ? h.toLowerCase() : ''; };
  function fit(c, against, min, toward) { // geser warna sampai cukup kontras dengan latar
    for (let i = 0; i < 20 && contrast(c, against) < min; i++) c = mix(c, toward, .08);
    return c;
  }

  /* hitung semua variabel CSS dari 3 warna pilihan */
  function derive(ink, bg, ac) {
    const dark = lum(bg) < lum(ink), W = '#ffffff', K = '#000000';
    const solid = dark ? mix(bg, W, .08) : mix(bg, W, .65);
    const pd = fit(dark ? mix(ac, W, .3) : mix(ac, K, .18), solid, 3.2, dark ? W : K);
    const p2 = mix(ac, W, .38), line = mix(bg, ac, dark ? .4 : .3);
    const svg = (body, col) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'${body}`.replace('{c}', col))}")`;
    const heart = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
    return {
      dark,
      vars: {
        '--bg': bg, '--solid': solid, '--panel': rgba(solid, .84), '--ink': ink, '--mut': mix(ink, bg, .4),
        '--p': ac, '--p2': p2, '--pd': pd, '--soft': mix(bg, ac, dark ? .2 : .12), '--line': line,
        '--dot': rgba(ac, dark ? .1 : .14), '--shadow': `0 14px 34px -16px ${rgba(ac, dark ? .35 : .55)}`,
        '--chunk': dark ? `0 3px 0 ${mix(bg, K, .45)}` : `0 3px 0 ${line}`, '--chunkp': `0 3px 0 ${mix(ac, K, .22)}`,
        '--pdk': mix(ac, K, .22), '--onp': contrast(W, ac) >= 2.8 ? '#ffffff' : '#241a1f', '--ring': rgba(ac, .4),
        '--b1': mix(ac, bg, .55), '--b2': mix(ac, bg, .75),
        '--heart': svg(`><path d='${heart}' fill='{c}' stroke='#fff' stroke-width='2.2' stroke-linejoin='round' paint-order='stroke'/></svg>`, ac),
        '--heart-s': svg(`><path d='${heart}' fill='{c}'/></svg>`, ac),
        '--arrow': svg(` fill='none' stroke='{c}' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>`, ac)
      }
    };
  }

  /* ---------- simpan & muat ---------- */
  const DEF = () => ({p: 'auto', c: null, f: 'def'});
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s == 'object') return {p: s.p || 'auto', c: s.c || null, f: s.f || 'def'};
    } catch (e) {}
    try { const o = localStorage.getItem(OLD); if (o == 'light' || o == 'dark') return {p: o == 'dark' ? 'night' : 'pink', c: null, f: 'def'}; } catch (e) {}
    return DEF();
  }
  let ST = load(), setVars = [], LOCK = false; // LOCK = warna sendiri terkunci (akun gratis); pilihan tersimpan tidak dihapus
  const preset = id => PRESETS.find(p => p.id == id) || PRESETS[0];
  const font = id => FONTS.find(f => f.id == id) || FONTS[0];
  const fonts = new Set();
  function loadFont(f) {
    if (!f.g || fonts.has(f.id)) return; fonts.add(f.id);
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${f.g}&display=swap`;
    document.head.appendChild(l);
  }
  /* warna yang sedang dipakai (untuk mengisi kolom warna sendiri) */
  function colors(st) {
    st = st || ST; if (st.p == 'custom' && st.c && !LOCK) return {ink: st.c.ink, bg: st.c.bg, ac: st.c.ac};
    const p = preset(st.p == 'custom' ? 'auto' : st.p); return {ink: p.ink, bg: p.bg, ac: p.ac};
  }
  function check(c) { // kontras teks vs latar
    const r = contrast(c.ink, c.bg);
    return {ratio: r, level: r >= 4.5 ? 'ok' : r >= 3 ? 'warn' : 'bad'};
  }
  let origMeta = null;
  function apply(st) {
    ST = st || ST; const sty = DOC.style;
    setVars.forEach(v => sty.removeProperty(v)); setVars = [];
    let mode = null, accent = '';
    if (ST.p == 'custom' && !LOCK && ST.c && norm(ST.c.ink) && norm(ST.c.bg) && norm(ST.c.ac)) {
      const d = derive(ST.c.ink, ST.c.bg, ST.c.ac); mode = d.dark ? 'dark' : 'light'; accent = ST.c.ac;
      for (const k in d.vars) { sty.setProperty(k, d.vars[k]); setVars.push(k); }
    } else {
      const p = preset(ST.p == 'custom' ? 'auto' : ST.p);
      if (!p.raw) {
        const d = derive(p.ink, p.bg, p.ac); mode = d.dark ? 'dark' : 'light'; accent = p.ac;
        for (const k in d.vars) { sty.setProperty(k, d.vars[k]); setVars.push(k); }
      } else mode = p.mode;
    }
    if (mode) DOC.dataset.theme = mode; else delete DOC.dataset.theme;
    const f = font(ST.f);
    if (f.css) { loadFont(f); sty.setProperty('--ff', f.css); DOC.dataset.font = f.id; if (!setVars.includes('--ff')) setVars.push('--ff'); }
    else delete DOC.dataset.font;
    const m = document.querySelector('meta[name=theme-color]');
    if (m) { if (origMeta === null) origMeta = m.content; m.content = accent || origMeta; }
  }
  const keep = n => { try { localStorage.setItem(KEY, JSON.stringify(n)); } catch (e) {} };
  const api = {onSave: null, onLock: null}; // auth.js memasang ini untuk menyimpan tema ke akun (Google Sheets)
  function set(patch) {
    const n = {...ST, ...patch}; ST = n; keep(n); apply(n);
    if (api.onSave) api.onSave(n);
    return n;
  }
  const reset = () => set(DEF());
  /* tema dari server: dipakai di perangkat ini tanpa dikirim balik */
  function adopt(s) {
    if (!s || typeof s != 'object') return;
    const okC = s.c && norm(s.c.ink) && norm(s.c.bg) && norm(s.c.ac);
    const p = s.p == 'custom' ? (okC ? 'custom' : 'auto') : (PRESETS.some(x => x.id == s.p) ? s.p : 'auto');
    const n = {p, c: p == 'custom' ? {ink: norm(s.c.ink), bg: norm(s.c.bg), ac: norm(s.c.ac)} : null, f: FONTS.some(x => x.id == s.f) ? s.f : 'def'};
    ST = n; keep(n); apply(n);
  }
  function lockCustom(v) { v = !!v; if (v === LOCK) return; LOCK = v; apply(); if (api.onLock) api.onLock(v); }
  const isDefault = () => ST.p == 'auto' && ST.f == 'def';
  function clearLocal() { // dipakai saat keluar akun, supaya tema tidak terbawa ke akun lain di perangkat yang sama
    try { localStorage.removeItem(KEY); localStorage.removeItem(OLD); } catch (e) {}
    ST = DEF(); apply(ST);
  }
  apply(ST);

  Object.assign(api, {lockCustom, get locked() { return LOCK; }, PRESETS, FONTS, get state() { return ST; }, set, reset, adopt, isDefault, clearLocal, apply, colors, check, norm, preset});
  return api;
})();
