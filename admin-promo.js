'use strict';
/* Panel admin v32: tab Promosi — poster siap sebar, teks siap kirim, kirim ke orang + catatan.
   Semua jalan di browser (tanpa ubah Code.gs). Pengaturan & riwayat disimpan di browser admin ini. */
(() => {
  const Q = s => document.querySelector(s), QA = s => [...document.querySelectorAll(s)], E = Auth.esc, ADM = window.ADM;
  const CFG = window.WM_CONFIG || {}, PC = CFG.PROMO || {}, BRAND = (CFG.CREDITS || {}).brand || 'ReyVion';
  const NOW = () => (Auth.now ? Auth.now() : Date.now());

  /* ================= poster (gambar) ================= */
  /*POSTER_START*/
  const FM = {story: [1080, 1920, 'Story / Status', '9:16'], feed: [1080, 1350, 'Feed IG', '4:5'], kotak: [1080, 1080, 'Kotak', '1:1']};
  const TH = {
    pink:  {n: 'Pink',   g: ['#ff4f9a', '#ff8fc0'], acc: '#ff4f9a', ink: '#ffffff', card: '#ffffff', cink: '#5c2740', soft: '#ffe3ef'},
    mint:  {n: 'Mint',   g: ['#0ca678', '#38d9a9'], acc: '#0ca678', ink: '#ffffff', card: '#ffffff', cink: '#0b3b2e', soft: '#d3f9e8'},
    ungu:  {n: 'Ungu',   g: ['#6741d9', '#9775fa'], acc: '#6741d9', ink: '#ffffff', card: '#ffffff', cink: '#2b1b66', soft: '#ece5ff'},
    biru:  {n: 'Biru',   g: ['#1864ab', '#4dabf7'], acc: '#1971c2', ink: '#ffffff', card: '#ffffff', cink: '#0b2f57', soft: '#dbeeff'},
    jingga:{n: 'Jingga', g: ['#e8590c', '#ffa94d'], acc: '#e8590c', ink: '#ffffff', card: '#ffffff', cink: '#5a2305', soft: '#ffe8cc'},
    gelap: {n: 'Gelap',  g: ['#170d2b', '#3b1d63'], acc: '#ff6bb0', ink: '#ffffff', card: '#2b1a49', cink: '#ffffff', soft: '#3b2562', dark: 1}
  };
  const F1 = s => `700 ${Math.round(s)}px Fredoka, Nunito, "Segoe UI", Arial, sans-serif`;
  const F2 = s => `800 ${Math.round(s)}px Nunito, "Segoe UI", Arial, sans-serif`;
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function wrap(c, text, maxW) {
    const out = [];
    String(text || '').split('\n').forEach(par => {
      let line = ''; const ws = par.split(/\s+/).filter(Boolean);
      if (!ws.length) return out.push('');
      ws.forEach(w => { const t = line ? line + ' ' + w : w; if (line && c.measureText(t).width > maxW) { out.push(line); line = w; } else line = t; });
      out.push(line);
    });
    return out;
  }
  function fit(c, text, fontFn, size, maxW, min) { let s = size; c.font = fontFn(s); while (s > (min || 18) && c.measureText(text).width > maxW) { s -= 2; c.font = fontFn(s); } return s; }
  function bow(c, cx, cy, s, col) { // pita
    c.save(); c.fillStyle = col;
    [-1, 1].forEach(d => { c.beginPath(); c.moveTo(cx, cy); c.bezierCurveTo(cx + d * s * .35, cy - s * .95, cx + d * s * 1.25, cy - s * .75, cx + d * s * 1.1, cy + s * .05); c.bezierCurveTo(cx + d * s * .95, cy + s * .8, cx + d * s * .3, cy + s * .55, cx, cy); c.fill(); });
    [-1, 1].forEach(d => { c.beginPath(); c.moveTo(cx + d * s * .08, cy + s * .1); c.lineTo(cx + d * s * .62, cy + s * 1.02); c.lineTo(cx + d * s * .3, cy + s * .98); c.lineTo(cx, cy + s * .42); c.closePath(); c.fill(); });
    c.beginPath(); c.arc(cx, cy, s * .24, 0, 7); c.fill(); c.restore();
  }
  function spark(c, x, y, r, a) { c.save(); c.globalAlpha = a; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore(); }
  function qrDraw(c, text, x, y, size, col) {
    let q; try { q = qrcode(0, 'M'); q.addData(text); q.make(); } catch (e) { return false; }
    const n = q.getModuleCount(), cs = Math.max(1, Math.floor(size / n)), ox = x + (size - cs * n) / 2, oy = y + (size - cs * n) / 2;
    c.fillStyle = col || '#1a1a1a';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) c.fillRect(ox + k * cs, oy + r * cs, cs, cs);
    return true;
  }
  const fmtWA = v => { let d = String(v || '').replace(/\D/g, ''); if (!d) return ''; d = d.replace(/^62/, '0'); return d.replace(/^(\d{4})(\d{4})(\d{2,})$/, '$1-$2-$3'); };
  const showUrl = u => String(u || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');

  function poster(c, o) {
    const W = o.w, H = o.h, T = TH[o.th] || TH.pink, PAD = 72, IW = W - PAD * 2, ratio = H / W;
    const feats = (o.feats || []).slice(0, 6), link = o.url ? showUrl(o.url) : '', wa = fmtWA(o.wa);
    c.save(); c.clearRect(0, 0, W, H); c.textBaseline = 'top'; c.textAlign = 'left';
    const g = c.createLinearGradient(0, 0, W * .55, H); g.addColorStop(0, T.g[0]); g.addColorStop(1, T.g[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    /* hiasan latar */
    c.fillStyle = 'rgba(255,255,255,.12)';
    [[W * .96, H * .04, W * .42], [-W * .06, H * .58, W * .32], [W * 1.02, H * .8, W * .26]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.3)'; /* titik-titik di sisi kanan kepala, sparkle hanya di margin supaya tidak menimpa teks */
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(W - PAD - 108 + i * 27, 78 + 14 + j * 27, 4, 0, 7); c.fill(); }
    spark(c, W - 36, H * .46, 20, .65); spark(c, 36, H * .62, 16, .55); spark(c, W / 2, H - 39, 16, .55);

    const hb = ratio > 1.6 ? 104 : ratio > 1.2 ? 94 : 82;
    function flow(k, d, gx, y0) {
      let y = y0; const G = v => v * k + gx;
      /* kepala */
      const ls = 92 * k;
      if (d) {
        c.save(); c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 22 * k; c.shadowOffsetY = 8 * k; c.fillStyle = '#fff'; rr(c, PAD, y, ls, ls, 28 * k); c.fill(); c.restore();
        bow(c, PAD + ls / 2, y + ls * .42, ls * .27, T.acc);
        c.fillStyle = T.ink; c.font = F1(46 * k); c.fillText(o.brand || 'ReyVion', PAD + ls + 22 * k, y + 8 * k);
        const ts = fit(c, o.tag || '', F2, 27 * k, IW - ls - 30 * k, 16); c.font = F2(ts); c.globalAlpha = .9; c.fillText(o.tag || '', PAD + ls + 22 * k, y + 8 * k + 54 * k); c.globalAlpha = 1;
      }
      y += ls + G(46);
      /* judul */
      const hs = hb * k, hlh = hs * 1.08; c.font = F1(hs); const hl = wrap(c, o.head, IW).slice(0, 5);
      if (d) { c.save(); c.shadowColor = 'rgba(0,0,0,.16)'; c.shadowBlur = 14 * k; c.shadowOffsetY = 4 * k; c.fillStyle = T.ink; c.font = F1(hs); hl.forEach((t, i) => c.fillText(t, PAD, y + i * hlh)); c.restore(); }
      y += hl.length * hlh + G(30);
      /* kalimat pendukung */
      if (o.sub) {
        const ss = 36 * k, slh = ss * 1.34; c.font = F2(ss); const sl = wrap(c, o.sub, IW - 40).slice(0, 4);
        if (d) { c.fillStyle = T.ink; c.globalAlpha = .93; c.font = F2(ss); sl.forEach((t, i) => c.fillText(t, PAD, y + i * slh)); c.globalAlpha = 1; }
        y += sl.length * slh + G(40);
      } else y += G(10);
      /* kartu fitur */
      if (feats.length) {
        const pad = 38 * k, rowH = 62 * k, gapR = 16 * k, ch = pad * 2 + feats.length * rowH + (feats.length - 1) * gapR;
        if (d) {
          c.save(); c.shadowColor = 'rgba(0,0,0,.22)'; c.shadowBlur = 34 * k; c.shadowOffsetY = 14 * k; c.fillStyle = T.card; rr(c, PAD, y, IW, ch, 38 * k); c.fill(); c.restore();
          feats.forEach((f, i) => {
            const ry = y + pad + i * (rowH + gapR), cy = ry + rowH / 2, cx = PAD + pad + 22 * k;
            c.fillStyle = T.acc; c.beginPath(); c.arc(cx, cy, 22 * k, 0, 7); c.fill();
            c.strokeStyle = '#fff'; c.lineWidth = 5 * k; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(cx - 9 * k, cy + 1 * k); c.lineTo(cx - 2 * k, cy + 8 * k); c.lineTo(cx + 10 * k, cy - 7 * k); c.stroke();
            const tx = PAD + pad + 62 * k, fs = fit(c, f, F2, 35 * k, IW - pad * 2 - 62 * k, 20);
            c.fillStyle = T.cink; c.font = F2(fs); c.textBaseline = 'middle'; c.fillText(f, tx, cy + 1); c.textBaseline = 'top';
          });
        }
        y += ch + G(34);
      }
      /* harga */
      if (o.price) {
        const ph = 84 * k;
        if (d) {
          c.fillStyle = 'rgba(255,255,255,.2)'; rr(c, PAD, y, IW, ph, ph / 2); c.fill(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.stroke();
          c.font = F1(34 * k); const bw = c.measureText('GRATIS').width + 70 * k; c.fillStyle = '#fff'; rr(c, PAD + 9 * k, y + 9 * k, bw, ph - 18 * k, (ph - 18 * k) / 2); c.fill();
          c.fillStyle = T.dark ? '#ff6bb0' : T.acc; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GRATIS', PAD + 9 * k + bw / 2, y + ph / 2 + 2);
          const room = IW - bw - 40 * k, ps = fit(c, o.price, F2, 31 * k, room, 18); c.font = F2(ps); c.fillStyle = T.ink; c.fillText(o.price, PAD + 9 * k + bw + 14 * k + room / 2 - 6 * k, y + ph / 2 + 2); c.textAlign = 'left'; c.textBaseline = 'top';
        }
        y += ph + G(34);
      }
      /* ajakan + QR */
      const showQR = o.qr && link, ch2 = (showQR ? 250 : 206) * k, p2 = 32 * k;
      if (d) {
        c.save(); c.shadowColor = 'rgba(0,0,0,.22)'; c.shadowBlur = 34 * k; c.shadowOffsetY = 14 * k; c.fillStyle = T.card; rr(c, PAD, y, IW, ch2, 40 * k); c.fill(); c.restore();
        const qs = ch2 - p2 * 2, tw = IW - p2 * 2 - (showQR ? qs + 28 * k : 0), tx = PAD + p2;
        if (showQR) { c.fillStyle = '#fff'; rr(c, PAD + IW - p2 - qs, y + p2, qs, qs, 20 * k); c.fill(); if (T.dark) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.stroke(); } qrDraw(c, o.url, PAD + IW - p2 - qs + 12 * k, y + p2 + 12 * k, qs - 24 * k, '#1a1a1a'); }
        const lines = [];
        lines.push(['Coba gratis sekarang', F1, 42 * k, T.acc, 18, 0]);
        lines.push([link || '(isi link web dulu)', F1, 36 * k, T.cink, 18, 0]);
        if (wa) lines.push(['WhatsApp ' + wa, F2, 31 * k, T.cink, 16, .8]);
        if (o.from) lines.push(['Info: ' + o.from, F2, 29 * k, T.cink, 16, .8]);
        const gapL = 10 * k, hs2 = lines.map(l => l[2] * 1.15), tot = hs2.reduce((a, b) => a + b, 0) + gapL * (lines.length - 1);
        let ty = y + (ch2 - tot) / 2;
        lines.forEach((l, i) => { const s = fit(c, l[0], l[1], l[2], tw, l[4]); c.font = l[1](s); c.fillStyle = l[3]; c.globalAlpha = l[5] || 1; c.fillText(l[0], tx, ty); c.globalAlpha = 1; ty += hs2[i] + gapL; });
      }
      y += ch2;
      return y;
    }
    const top = 78, bot = 78, avail = H - top - bot; let k = 1.25;
    while (k > .5 && flow(k, false, 0, top) - top > avail) k -= .03;
    const used = flow(k, false, 0, top) - top, extra = Math.max(0, avail - used), ng = 4 + (feats.length ? 1 : 0) + (o.price ? 1 : 0), gx = Math.min(extra / ng, 70 * k);
    flow(k, true, gx, top + Math.max(0, (extra - gx * ng) / 2));
    c.restore();
  }
  /*POSTER_END*/

  /* ================= data & pengaturan ================= */
  const FEATS = PC.FEATS || [
    ['kasir', 'Kasir & nota PNG siap kirim'], ['qris', 'QRIS sesuai nominal otomatis'], ['stok', 'Stok akun & produk rapi'],
    ['laba', 'Laporan laba & produk terlaris'], ['ingat', 'Pengingat perpanjang pelanggan'], ['klaim', 'Klaim & garansi tercatat'],
    ['wa', 'Template pesan WhatsApp'], ['wm', 'Watermark foto & testimoni'], ['simpan', 'Akun simpanan & rekap profil'], ['aman', 'Data per akun, aman & terpisah']
  ];
  const MSG = {
    wa: ['WhatsApp pribadi', PC.MSG_WA || 'Halo kak {nama} 👋\n\nLagi cari cara gampang ngatur jualan akun / langganan digital? Aku mau kenalin *{brand}* — web kasir & rekap toko yang bisa:\n• catat penjualan + nota PNG siap kirim\n• stok akun & pengingat perpanjang pelanggan\n• QRIS sesuai nominal, laporan laba\n\nGratis dipakai (Premium mulai {harga} kalau mau fitur lengkap). Coba dulu aja ya:\n{link}\n\nKalau bingung cara pakainya, chat aku aja 😊'],
    status: ['Status WA', PC.MSG_STATUS || 'Jualan akun premium masih dicatat manual? 😵\n\nPindah ke *{brand}* aja ✨\nKasir, stok akun, nota PNG, QRIS sesuai nominal, sampai laporan laba — semua dari HP.\n\nGratis dipakai! Link ada di sini 👉 {link}\nInfo / bantuan: wa.me/{wa}'],
    ig: ['Caption IG', PC.MSG_IG || '✨ Capek ngerekap jualan di catatan HP?\n\n{brand} bikin urusan toko digital jadi rapi:\n✅ Kasir & nota PNG\n✅ Stok akun & pengingat perpanjang\n✅ QRIS sesuai nominal\n✅ Laporan laba otomatis\n\nGratis dipakai, Premium mulai {harga}.\nLink di bio 👉 {link}\n\n#jualanonline #akunpremium #kasironline #resellerdigital #umkm'],
    grup: ['Grup / komunitas', PC.MSG_GRUP || 'Info buat yang jualan akun / langganan digital 📢\n\n*{brand}* — web kasir & rekap toko gratis: catat penjualan, stok akun, nota PNG, QRIS sesuai nominal, dan laporan laba. Bisa dipakai langsung dari HP.\n\nCoba di sini: {link}\nTanya-tanya boleh chat: wa.me/{wa}']
  };
  const KEY = 'rv_promo_v1';
  const DEF = {fmt: 'story', th: 'pink', head: PC.HEAD || 'Jualan akun premium jadi rapi & gampang', sub: PC.SUB || 'Kasir, stok akun, nota PNG, dan laporan laba — semua dari HP. Gratis dipakai!', tag: PC.TAG || 'Kasir & Rekap Toko Online',
    feats: ['kasir', 'qris', 'stok', 'laba', 'ingat'], price: true, qr: true, url: PC.URL || '', wa: '', from: '', mt: 'wa', msgs: {}, log: []};
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const S = Object.assign({}, DEF, read());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  let CFGWA = CFG.WA_NUMBER || '', built = false, raf = 0, cfgDone = false;

  const guess = () => { try { if (/^https?:$/.test(location.protocol)) return location.origin + location.pathname.replace(/[^/]*$/, ''); } catch (e) {} return ''; };
  const link = () => (S.url || guess()).trim();
  const waNum = () => (S.wa || CFGWA || '').replace(/\D/g, '');
  const cheap = () => { const ps = (CFG.PLANS || []).map(p => [parseInt(String(p.price).replace(/\D/g, ''), 10) || 0, p.price]).filter(x => x[0]).sort((a, b) => a[0] - b[0]); return ps.length ? ps[0][1] : ''; };
  const norm = v => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '62' + d.slice(1); else if (d.startsWith('8')) d = '62' + d; return d.length >= 10 && d.length <= 15 ? d : ''; };
  const msg = k => S.msgs[k] != null ? S.msgs[k] : MSG[k][1];
  const fill = (t, nama) => String(t).replace(/ ?\{nama\}/g, nama ? ' ' + nama : '').replace(/\{link\}/g, link() || '(isi link dulu)').replace(/\{brand\}/g, BRAND).replace(/\{harga\}/g, cheap() || 'harga bersahabat').replace(/\{wa\}/g, waNum() || '-');
  const waUrl = (num, text) => 'https://wa.me/' + (num || '') + '?text=' + encodeURIComponent(text);
  const rel = t => { try { return ADM.rel(t); } catch (e) { return new Date(t).toLocaleDateString('id-ID'); } };
  const stamp = () => new Date().toISOString().slice(0, 10);

  async function copy(text, ok) {
    try { await navigator.clipboard.writeText(text); } catch (e) { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (x) {} t.remove(); }
    toast(ok || 'Tersalin ✓');
  }
  function saveBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
  const opts = () => { const [w, h] = FM[S.fmt] || FM.story, map = Object.fromEntries(FEATS); return {w, h, th: S.th, head: S.head, sub: S.sub, tag: S.tag, feats: S.feats.map(id => map[id]).filter(Boolean), price: S.price && cheap() ? 'Premium mulai ' + cheap() : '', qr: S.qr, url: link(), wa: waNum(), from: S.from, brand: BRAND}; };
  function paint() {
    const cv = Q('#pmcv'); if (!cv) return; const o = opts();
    if (cv.width != o.w) cv.width = o.w; if (cv.height != o.h) cv.height = o.h;
    try { poster(cv.getContext('2d'), o); } catch (e) { console.error(e); }
  }
  const draw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); };
  const blobOf = cv => new Promise(res => cv.toBlob(res, 'image/png'));
  function qrCanvas(px, margin) {
    const c = document.createElement('canvas'); c.width = c.height = px; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, px, px);
    if (link()) qrDraw(x, link(), margin, margin, px - margin * 2, '#1a1a1a'); return c;
  }
  const paintQR = () => { const cv = Q('#pmqr'); if (!cv) return; const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(qrCanvas(cv.width, 14), 0, 0); cv.style.opacity = link() ? 1 : .25; };

  /* ================= tampilan ================= */
  const chips = (attr, items, on) => items.map(([k, l, extra]) => `<button type="button" ${attr}="${E(k)}" class="${on(k) ? 'on' : ''}">${extra || ''}${E(l)}</button>`).join('');
  function build() {
    const sw = T => `<span class="pm-sw" style="background:linear-gradient(135deg,${T.g[0]},${T.g[1]})"></span>`;
    Q('#promobox').innerHTML = `<div class="pm">
      <section class="sc"><h3>${IC('send')} Bagikan cepat</h3><small>Link web yang kamu sebar ke teman / calon pengguna. Perubahan tersimpan otomatis di browser ini.</small>
        <div class="pm-top"><div class="pm-lk">
          <label class="f"><span>Link web</span><input id="pmurl" type="text" inputmode="url" autocapitalize="none" spellcheck="false" placeholder="https://namaweb.com/" value="${E(S.url)}"></label>
          <div class="pm-hint" id="pmhint"></div>
          <div class="pm-acts"><button class="btn pri" type="button" data-pm="clink">${IC('copy')} Salin link</button><button class="btn" type="button" data-pm="walink">${IC('message')} Kirim ke WhatsApp</button><button class="btn" type="button" data-pm="slink" id="pmslink">${IC('send')} Bagikan…</button></div></div>
          <div class="pm-qrb"><canvas id="pmqr" width="240" height="240" aria-label="QR link web"></canvas><button class="btn" type="button" data-pm="qrdl">${IC('download')} Unduh QR</button></div></div>
      </section>
      <section class="sc"><h3>${IC('palette')} Poster promosi</h3><small>Atur teks & warna, lalu unduh atau bagikan langsung. Gambar dibuat di HP/laptopmu, tidak diunggah ke mana pun.</small>
        <div class="pm-poster"><div class="pm-ctrl">
          <div class="pm-sec"><h4>Ukuran</h4><div class="chips" id="pmfmt">${chips('data-fmt', Object.entries(FM).map(([k, v]) => [k, v[2] + ' · ' + v[3]]), k => S.fmt == k)}</div></div>
          <div class="pm-sec"><h4>Warna</h4><div class="chips" id="pmth">${chips('data-th', Object.entries(TH).map(([k, v]) => [k, v.n, sw(v)]), k => S.th == k)}</div></div>
          <label class="f"><span>Judul</span><input id="pmhead" type="text" maxlength="90" value="${E(S.head)}"></label>
          <label class="f"><span>Kalimat pendukung</span><textarea id="pmsub" rows="2" maxlength="160">${E(S.sub)}</textarea></label>
          <label class="f"><span>Label di bawah nama</span><input id="pmtag" type="text" maxlength="40" value="${E(S.tag)}"></label>
          <div class="pm-sec"><h4>Fitur yang ditampilkan <em id="pmfc"></em></h4><div class="chips" id="pmft"></div></div>
          <div class="pm-r2"><label class="f"><span>Nomor WhatsApp</span><input id="pmwa" type="tel" inputmode="numeric" placeholder="" value="${E(S.wa)}"></label><label class="f"><span>Nama pengirim (opsional)</span><input id="pmfrom" type="text" maxlength="30" placeholder="mis. Kak Rina" value="${E(S.from)}"></label></div>
          <label class="chk"><span>Tampilkan harga Premium<small id="pmps"></small></span><input type="checkbox" id="pmprice" ${S.price ? 'checked' : ''}></label>
          <label class="chk"><span>Tampilkan QR link<small>Calon pengguna tinggal scan</small></span><input type="checkbox" id="pmqrt" ${S.qr ? 'checked' : ''}></label>
        </div>
        <div class="pm-prev"><canvas id="pmcv" width="1080" height="1920"></canvas>
          <div class="pm-acts"><button class="btn pri" type="button" data-pm="png">${IC('download')} Unduh PNG</button><button class="btn" type="button" data-pm="cimg">${IC('copy')} Salin gambar</button><button class="btn" type="button" data-pm="simg" id="pmsimg">${IC('send')} Bagikan poster</button></div></div></div>
      </section>
      <section class="sc"><h3>${IC('users')} Kirim ke teman / calon pengguna</h3><small>Pilih teks, isi nama & nomor (boleh kosong, nanti pilih kontak sendiri di WhatsApp), lalu kirim. Catatan di bawah membantumu menagih jawaban.</small>
        <div class="chips" id="pmmt">${chips('data-mt', Object.entries(MSG).map(([k, v]) => [k, v[0]]), k => S.mt == k)}</div>
        <label class="f"><span>Isi pesan <em class="pm-code">{nama} {link} {brand} {harga} {wa}</em> terisi otomatis</span><textarea id="pmmsg" rows="9"></textarea></label>
        <div class="pm-bubw"><span>Pratinjau</span><div class="pm-bub" id="pmbub"></div></div>
        <div class="pm-r2"><label class="f"><span>Nama penerima</span><input id="pmnm" type="text" maxlength="40" placeholder="mis. Rina" autocomplete="off"></label><label class="f"><span>Nomor WhatsApp</span><input id="pmnn" type="tel" inputmode="numeric" placeholder="0812xxxxxxx" autocomplete="off"></label></div>
        <div class="pm-acts"><button class="btn pri" type="button" data-pm="send">${IC('message')} Kirim lewat WhatsApp</button><button class="btn" type="button" data-pm="mcopy">${IC('copy')} Salin teks</button><button class="btn" type="button" data-pm="mimg" id="pmmimg">${IC('send')} Poster + teks</button><button class="btn" type="button" data-pm="mreset">${IC('undo')} Teks bawaan</button></div>
        <div class="pm-stat" id="pmst"></div><div class="pm-log" id="pmlog"></div>
      </section></div>`;
    Q('#pmmsg').value = msg(S.mt);
    const can = !!(navigator.share); ['#pmslink'].forEach(s => { Q(s).hidden = !can; });
    sync(); drawLog(); bub(); paintQR(); draw();
  }
  function sync() { // segarkan bagian yang bergantung pada pilihan / pengaturan
    QA('#pmfmt button').forEach(b => b.classList.toggle('on', b.dataset.fmt == S.fmt));
    QA('#pmth button').forEach(b => b.classList.toggle('on', b.dataset.th == S.th));
    QA('#pmmt button').forEach(b => b.classList.toggle('on', b.dataset.mt == S.mt));
    Q('#pmft').innerHTML = FEATS.map(([k, l]) => `<button type="button" data-ft="${E(k)}" class="${S.feats.includes(k) ? 'on' : ''}">${E(l)}</button>`).join('');
    Q('#pmfc').textContent = `(${S.feats.length}/6)`;
    const wa = Q('#pmwa'); wa.placeholder = CFGWA ? 'Bawaan: ' + CFGWA : '62812xxxxxxx';
    const p = cheap(); Q('#pmps').textContent = p ? 'Tertulis “Premium mulai ' + p + '” (dari config.js → PLANS)' : 'Belum ada harga paket di config.js → PLANS';
    const h = Q('#pmhint'); h.className = 'pm-hint' + (link() ? '' : ' bad'); h.textContent = link() ? 'Yang dibagikan: ' + link() + (S.url ? '' : ' (otomatis dari alamat web ini)') : 'Isi link web dulu supaya poster & pesan punya tautan.';
  }
  function bub() { const b = Q('#pmbub'); if (b) b.textContent = fill(msg(S.mt), (Q('#pmnm') || {}).value ? Q('#pmnm').value.trim() : ''); }

  /* ================= riwayat kirim ================= */
  const ST = {sent: 'Terkirim', reg: 'Sudah daftar'};
  function drawLog() {
    const L = S.log, n = L.length, r = L.filter(x => x.st == 'reg').length;
    Q('#pmst').innerHTML = n ? `<span>${IC('send')} Terkirim <b>${n}</b></span><span>${IC('checkcircle')} Sudah daftar <b>${r}</b></span><span>${IC('chart')} Berhasil <b>${Math.round(r / n * 100)}%</b></span>` : '';
    Q('#pmlog').innerHTML = n ? L.slice(0, 30).map(x => `<div class="pm-it ${x.st}"><div><b>${E(x.nm || 'Tanpa nama')}</b><small>${x.num ? '+' + E(x.num) + ' · ' : ''}${rel(x.t)} · ${ST[x.st] || ST.sent}</small></div><div class="pm-ia"><button type="button" class="btn sm" data-pm="again:${x.id}">Kirim lagi</button><button type="button" class="btn sm ${x.st == 'reg' ? 'pri' : ''}" data-pm="reg:${x.id}" title="Tandai sudah daftar" aria-label="Tandai sudah daftar">${IC('check')}</button><button type="button" class="btn sm" data-pm="del:${x.id}" aria-label="Hapus catatan">${IC('trash')}</button></div></div>`).join('') + (n > 30 ? `<small class="pm-more">${n - 30} catatan lama disembunyikan</small>` : '') : '<div class="pm-empty">Belum ada yang dikirimi. Setiap pesan yang kamu kirim dari sini akan dicatat, jadi kamu ingat siapa saja yang sudah diajak.</div>';
  }
  const open = u => { const w = window.open(u, '_blank', 'noopener'); if (!w) location.href = u; };
  function sendTo(nm, num, rec) {
    if (!link()) return toast('Isi link web dulu');
    const text = fill(msg(S.mt), nm); open(waUrl(num, text));
    if (rec) { rec.t = NOW(); } else { S.log.unshift({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), nm, num, t: NOW(), st: 'sent'}); S.log = S.log.slice(0, 200); }
    save(); drawLog();
  }
  async function shareImage(text) {
    const cv = Q('#pmcv'); paint(); const blob = await blobOf(cv), file = new File([blob], `promo-${BRAND.toLowerCase()}-${S.fmt}.png`, {type: 'image/png'});
    if (navigator.canShare && navigator.canShare({files: [file]})) {
      try { await navigator.share({files: [file], text, title: BRAND}); } catch (e) { if (e && e.name != 'AbortError') toast('Gagal membagikan, coba unduh dulu'); }
    } else { saveBlob(blob, file.name); toast('Poster diunduh. Lampirkan ke chat lalu tempel teksnya'); try { await navigator.clipboard.writeText(text); } catch (e) {} }
  }

  /* ================= aksi ================= */
  document.addEventListener('click', async e => {
    const root = e.target.closest('#promobox'); if (!root) return;
    let b;
    if ((b = e.target.closest('[data-fmt]'))) { S.fmt = b.dataset.fmt; save(); sync(); return draw(); }
    if ((b = e.target.closest('[data-th]'))) { S.th = b.dataset.th; save(); sync(); return draw(); }
    if ((b = e.target.closest('[data-ft]'))) { const k = b.dataset.ft, i = S.feats.indexOf(k); if (i >= 0) S.feats.splice(i, 1); else if (S.feats.length >= 6) return toast('Maksimal 6 fitur supaya poster tetap rapi'); else S.feats.push(k); S.feats.sort((a, c) => FEATS.findIndex(f => f[0] == a) - FEATS.findIndex(f => f[0] == c)); save(); sync(); return draw(); }
    if ((b = e.target.closest('[data-mt]'))) { S.mt = b.dataset.mt; save(); Q('#pmmsg').value = msg(S.mt); sync(); return bub(); }
    b = e.target.closest('[data-pm]'); if (!b) return;
    const [a, id] = b.dataset.pm.split(':');
    if (a == 'clink') return link() ? copy(link(), 'Link tersalin ✓') : toast('Isi link web dulu');
    if (a == 'walink') { if (!link()) return toast('Isi link web dulu'); return open(waUrl('', fill(msg('wa'), ''))); }
    if (a == 'slink') { if (!link()) return toast('Isi link web dulu'); try { await navigator.share({title: BRAND, text: fill(msg('wa'), ''), url: link()}); } catch (x) {} return; }
    if (a == 'qrdl') { if (!link()) return toast('Isi link web dulu'); return saveBlob(await blobOf(qrCanvas(1000, 60)), `qr-${BRAND.toLowerCase()}.png`); }
    if (a == 'png') { paint(); return saveBlob(await blobOf(Q('#pmcv')), `promo-${BRAND.toLowerCase()}-${S.fmt}-${stamp()}.png`); }
    if (a == 'cimg') {
      paint(); const blob = await blobOf(Q('#pmcv'));
      try { await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]); return toast('Gambar tersalin ✓ tinggal tempel'); } catch (x) { return toast('Browser ini tidak bisa menyalin gambar, pakai Unduh PNG'); }
    }
    if (a == 'simg') return shareImage(fill(msg('status'), ''));
    if (a == 'mimg') return shareImage(fill(msg(S.mt), Q('#pmnm').value.trim()));
    if (a == 'mcopy') return copy(fill(msg(S.mt), Q('#pmnm').value.trim()), 'Teks tersalin ✓');
    if (a == 'mreset') { delete S.msgs[S.mt]; save(); Q('#pmmsg').value = msg(S.mt); return bub(); }
    if (a == 'send') {
      const nm = Q('#pmnm').value.trim(), raw = Q('#pmnn').value.trim(), num = norm(raw);
      if (raw && !num) return toast('Nomor WhatsApp belum benar (contoh 0812xxxxxxx)');
      sendTo(nm, num); Q('#pmnm').value = ''; Q('#pmnn').value = ''; return bub();
    }
    const x = S.log.find(v => v.id == id);
    if (a == 'again' && x) return sendTo(x.nm, x.num, x);
    if (a == 'reg' && x) { x.st = x.st == 'reg' ? 'sent' : 'reg'; save(); return drawLog(); }
    if (a == 'del' && x) { S.log = S.log.filter(v => v !== x); save(); return drawLog(); }
  });
  document.addEventListener('input', e => {
    const t = e.target, id = t.id; if (!t.closest || !t.closest('#promobox')) return;
    const M = {pmurl: ['url', 1], pmhead: ['head'], pmsub: ['sub'], pmtag: ['tag'], pmwa: ['wa'], pmfrom: ['from']};
    if (M[id]) { S[M[id][0]] = t.value; save(); sync(); if (id == 'pmurl' || id == 'pmwa') { paintQR(); bub(); } return draw(); }
    if (id == 'pmmsg') { S.msgs[S.mt] = t.value; save(); return bub(); }
    if (id == 'pmnm') return bub();
  });
  document.addEventListener('change', e => {
    const id = e.target.id; if (!e.target.closest || !e.target.closest('#promobox')) return;
    if (id == 'pmprice') { S.price = e.target.checked; save(); draw(); }
    if (id == 'pmqrt') { S.qr = e.target.checked; save(); draw(); }
  });

  /* ================= dipanggil panel ================= */
  function load() {
    if (!built) { built = true; build(); try { if (document.fonts && document.fonts.load) Promise.all([document.fonts.load(F1(40)), document.fonts.load(F2(30))]).then(draw, () => {}); } catch (e) {} } else { sync(); draw(); }
    if (!cfgDone && ADM && ADM.api) { cfgDone = true; ADM.api('admin_cfg').then(r => { if (r && r.ok && r.cfg && r.cfg.waNumber) { CFGWA = String(r.cfg.waNumber); if (built) { sync(); bub(); draw(); } } }).catch(() => {}); }
  }
  ADM.loadPromo = load;
  ADM.promoCopy = () => link() ? copy(link(), 'Link tersalin ✓ tinggal tempel ke chat') : toast('Isi link web dulu di tab Promosi');
})();
