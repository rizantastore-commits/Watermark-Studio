'use strict';
/* Panel admin: kelola pengumuman & "Apa yang baru" (tab Info) — v29. Member melihatnya sebagai banner + riwayat 🔔 (announce.js). */
(() => {
  const Q = s => document.querySelector(s), E = Auth.esc, ADM = window.ADM, DAY = 864e5, HOUR = 36e5, NOW = () => Auth.now(), T = WM_ANN.TYPES;
  const OLD = 'Code.gs belum diperbarui ke v28. Tempel Code.gs terbaru di Apps Script lalu Deploy → Manage deployments → Edit → New version.';
  const err = r => r.code == 'unknown' ? OLD : r.error;
  const FLT = [['all', 'Semua'], ['live', 'Tayang'], ['soon', 'Terjadwal'], ['end', 'Selesai'], ['draft', 'Draf']], SL = {live: 'Tayang', soon: 'Terjadwal', end: 'Selesai', draft: 'Draf'};
  const AUD = {all: IC('users') + ' Semua member', free: IC('sprout') + ' Akun gratis', premium: IC('crown') + ' Premium'};
  const DUR = [[1, '1 hari'], [3, '3 hari'], [7, '7 hari'], [30, '30 hari'], [0, 'Tanpa batas']];
  const CTA = [['none', 'Tanpa tombol'], ['plans', IC('crown') + ' Lihat paket'], ['wa', IC('message') + ' Chat WhatsApp'], ['link', IC('link') + ' Link lain']];
  const HINT = {info: 'Kabar umum', promo: 'Penawaran & diskon', update: 'Fitur / perbaikan baru', maint: 'Gangguan terjadwal'};
  const EMO = ['🎉', '🔥', '✨', '💖', '🎁', '⚠️', '✅', '📢', '🛠️', '⏰'];
  const TPL = [
    ['update', IC('sparkles') + ' Update fitur', {type: 'update', title: 'Fitur baru sudah hadir ✨', body: 'Kami baru menambahkan … di ReyVion. Yang baru:\n- …\n- …\nCoba sekarang, dan kabari kami kalau ada masukan ya 💖', days: 7}],
    ['promo', IC('gift') + ' Promo paket', {type: 'promo', title: 'Promo paket Premium 🎁', body: 'Ada penawaran spesial untuk paket Premium sampai …. Buka semua fitur Kasir & Watermark tanpa batas.', cta: 'plans', ctaLabel: 'Lihat paket', days: 7}],
    ['maint', IC('wrench') + ' Maintenance', {type: 'maint', title: 'Maintenance terjadwal', body: 'Web akan maintenance pada **… pukul … WIB**. Selama itu akun belum bisa dipakai masuk. Data kamu tetap aman.', days: 1, pin: true}],
    ['info', 'ℹ️ Info umum', {type: 'info', title: '', body: '', days: 7}]
  ];
  let LIST = [], FL = 'all', SQ = '', ED = null, busy = false, PV = 'banner';

  const pad = n => String(n).padStart(2, '0');
  const toInp = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fromInp = v => v ? (new Date(v).getTime() || 0) : 0;
  const abs = t => new Date(t).toLocaleString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});
  const span = ms => { const m = Math.max(1, Math.round(ms / 6e4)); return m < 60 ? m + ' menit' : m < 1440 ? Math.round(m / 60) + ' jam' : Math.round(m / 1440) + ' hari'; };
  const stateOf = x => { const n = NOW(); return !x.active ? 'draft' : x.start > n ? 'soon' : (x.end && x.end <= n) ? 'end' : 'live'; };
  const ORD = {live: 0, soon: 1, draft: 2, end: 3};
  const chips = (attr, items, cur) => `<div class="chips">${items.map(([k, l]) => `<button type="button" ${attr}="${k}" class="${String(cur) == String(k) ? 'on' : ''}">${l}</button>`).join('')}</div>`;

  /* ---------- daftar ---------- */
  function row(x) {
    const st = stateOf(x), t = T[x.type] || T.info, n = NOW();
    const life = st == 'soon' ? `<em>Tayang ${span(x.start - n)} lagi</em>` : st == 'live' ? (x.end ? `<em>Sisa ${span(x.end - n)}</em>` : '<em>Tanpa batas waktu</em>') : '';
    return `<article class="an-row t-${E(x.type)} is-${st}"><div class="an-rh"><span class="an-tag ${st}">${SL[st]}</span><span class="an-tag">${IC(t.ico) || t.ic} ${t.lb}</span><span class="an-tag">${AUD[x.aud] || AUD.all}</span>${x.pin ? '<span class="an-tag">' + IC('pin') + ' Disematkan</span>' : ''}</div>
      <b>${E(x.title)}</b>${x.body ? `<p>${E(x.body)}</p>` : ''}
      <div class="an-rm"><span>🗓️ Mulai ${abs(x.start)}</span><span>${x.end ? '⏳ Banner sampai ' + abs(x.end) : '♾️ Tanpa batas'}</span>${x.by ? `<span>✍️ ${E(x.by)}</span>` : ''}${life ? `<span>${life}</span>` : ''}</div>
      <div class="an-ra"><button class="btn pri" type="button" data-ane="${E(x.id)}">Edit</button><button class="btn" type="button" data-anc="${E(x.id)}" title="Buat salinan sebagai draf">${IC('copy')} Gandakan</button><button class="btn" type="button" data-ant="${E(x.id)}">${x.active ? IC('eyeoff') + ' Sembunyikan' : IC('eye') + ' Tayangkan'}</button><button class="btn dg" type="button" data-and="${E(x.id)}">${IC('trash')} Hapus</button></div></article>`;
  }
  function drawList() {
    const q = SQ.trim().toLowerCase();
    const ls = LIST.filter(x => (FL == 'all' || stateOf(x) == FL) && (!q || (x.title + ' ' + x.body).toLowerCase().includes(q)))
      .sort((a, b) => (ORD[stateOf(a)] - ORD[stateOf(b)]) || (b.pin - a.pin) || (stateOf(a) == 'soon' ? a.start - b.start : b.start - a.start));
    Q('#annlist').innerHTML = ls.map(row).join('') || `<div class="empty">${!LIST.length ? 'Belum ada pengumuman. Klik “+ Pengumuman” untuk membuat yang pertama.' : q ? 'Tidak ada yang cocok dengan pencarianmu.' : 'Tidak ada pengumuman di kategori ini.'}</div>`;
  }
  function draw() {
    const box = Q('#annbox'), n = k => k == 'all' ? LIST.length : LIST.filter(x => stateOf(x) == k).length;
    box.innerHTML = `<div class="an-head"><h3>📣 Pengumuman & Apa yang baru</h3><button class="btn pri" id="an_new" type="button">${IC('plus')} Pengumuman</button></div>
      <p class="an-hint">Tulis sekali, tampil sebagai banner di atas halaman semua member. Riwayatnya tersimpan di tombol 🔔 mereka. Banner baru muncul paling lambat 5 menit setelah terbit (atau saat member membuka ulang halaman).</p>
      <input type="search" class="an-sr" id="an_q" placeholder="🔍 Cari judul atau isi pengumuman…" value="${E(SQ)}" autocomplete="off" aria-label="Cari pengumuman">
      <div class="chips">${FLT.map(([k, l]) => `<button type="button" data-anf="${k}" class="${FL == k ? 'on' : ''}">${l}<em>${n(k)}</em></button>`).join('')}<button type="button" id="an_rf" aria-label="Muat ulang">${IC('refresh')}</button></div>`;
    drawList();
  }
  async function load(quiet) {
    if (!quiet) Q('#annlist').innerHTML = '<div class="gload"><span class="spin"></span>Memuat pengumuman…</div>';
    const r = await ADM.api('admin_ann_list');
    if (!r.ok) { if (r.code == 'session') return Auth.logout(r.error); Q('#annbox').innerHTML = ''; return Q('#annlist').innerHTML = `<div class="empty">${E(err(r))}</div>`; }
    LIST = r.anns || []; draw();
  }

  /* ---------- form ---------- */
  function form(x) {
    ED = {id: x.id || '', type: x.type || 'info', aud: x.aud || 'all', cta: !x.cta ? 'none' : (x.cta == 'plans' || x.cta == 'wa') ? x.cta : 'link', dur: x.id ? 'keep' : (x.days == null ? 7 : x.days), pin: !!x.pin, active: x.active !== false, start: x.start || 0, end: x.end || 0};
    const keep = x.id ? [['keep', `Seperti sekarang (${x.end ? 's/d ' + abs(x.end) : 'tanpa batas'})`]] : [];
    Q('#anned').innerHTML = `<button class="mx" data-close type="button" aria-label="Tutup">${IC('x')}</button><h3>${x.id ? 'Edit pengumuman' : '📣 Pengumuman baru'}</h3>
      ${x.id ? '' : `<div class="sec2"><h4>Mulai cepat</h4><div class="chips">${TPL.map(([k, l]) => `<button type="button" data-antp="${k}">${l}</button>`).join('')}</div></div>`}
      <div class="sec2"><h4>Jenis</h4><div class="an-types">${Object.entries(T).map(([k, v]) => `<button type="button" class="an-tb ${k}${ED.type == k ? ' on' : ''}" data-anty="${k}"><i>${IC(v.ico) || v.ic}</i><span>${v.lb}<small>${HINT[k]}</small></span></button>`).join('')}</div></div>
      <label class="f"><span>Judul <em id="an_tc"></em></span><input type="text" id="an_title" maxlength="80" value="${E(x.title || '')}" placeholder="mis. Fitur baru: laporan laba bersih" autocomplete="off"></label>
      <div class="f"><span>Isi pengumuman</span>
        <div class="an-tl" role="toolbar" aria-label="Format teks"><button type="button" data-anfm="b" title="Tebal (**teks**)"><b>B</b></button><button type="button" data-anfm="l" title="Daftar (- teks)">• Daftar</button><span class="sp"></span>${EMO.map(e => `<button type="button" data-anem="${e}" aria-label="Sisipkan ${e}">${e}</button>`).join('')}</div>
        <textarea id="an_body" maxlength="500" placeholder="Ceritakan singkat dan jelas. Pakai **tebal** untuk menekankan, dan awali baris dengan “- ” untuk membuat daftar.">${E(x.body || '')}</textarea><small class="an-cnt" id="an_cnt"></small></div>
      <div class="sec2"><h4>Untuk siapa</h4>${chips('data-anau', Object.entries(AUD), ED.aud)}</div>
      <div class="sec2"><h4>Tombol (opsional)</h4>${chips('data-anct', CTA, ED.cta)}
        <div class="row2" id="an_ctaw"><label class="f"><span>Tulisan tombol</span><input type="text" id="an_clabel" maxlength="24" value="${E(x.ctaLabel || '')}" placeholder="mis. Lihat paket"></label>
        <label class="f" id="an_linkw"><span>Alamat link</span><input type="text" id="an_link" maxlength="300" value="${ED.cta == 'link' ? E(x.cta) : ''}" placeholder="https://…" autocapitalize="none" spellcheck="false"></label></div></div>
      <div class="sec2"><h4>Mulai tayang <small>kosongkan = sekarang</small></h4>
        <div class="chips"><button type="button" data-anst="now">Sekarang</button><button type="button" data-anst="1h">+1 jam</button><button type="button" data-anst="tom">Besok 08.00</button><button type="button" data-anst="wk">Minggu depan</button></div>
        <input type="datetime-local" id="an_start" value="${x.start ? toInp(x.start) : ''}" aria-label="Mulai tayang"></div>
      <div class="sec2"><h4>Banner tampil selama</h4>${chips('data-andu', keep.concat(DUR), ED.dur)}<small>Setelah itu bannernya hilang. Pengumuman jenis Update tetap tersimpan di riwayat 🔔.</small></div>
      <label class="chk"><span>📌 Sematkan (member tidak bisa menutup bannernya)</span><input type="checkbox" id="an_pin" ${ED.pin ? 'checked' : ''}></label>
      <label class="chk"><span>Tayangkan ke member <em>matikan = simpan sebagai draf</em></span><input type="checkbox" id="an_on" ${ED.active ? 'checked' : ''}></label>
      <div class="an-pv"><div class="an-pvh"><small>👀 Pratinjau di layar member</small>${chips('data-anpv', [['banner', 'Banner'], ['feed', 'Riwayat 🔔']], PV)}</div><div id="an_pv"></div></div>
      <div class="row2 an-act"><button class="btn" type="button" data-close>Batal</button><button class="btn pri" id="an_save" type="button">Terbitkan</button></div>`;
    Q('#annm2').hidden = false; pv();
  }
  function collect() {
    const v = id => Q('#' + id).value.trim(); let start = fromInp(Q('#an_start').value);
    if (!start && ED.id && ED.start) start = ED.start;
    const s0 = start || NOW(), end = ED.dur === 'keep' ? ED.end : ED.dur ? s0 + ED.dur * DAY : 0, cta = ED.cta == 'none' ? '' : ED.cta == 'link' ? v('an_link') : ED.cta;
    return {id: ED.id, title: v('an_title'), body: Q('#an_body').value.trim(), type: ED.type, aud: ED.aud, start, end, pin: Q('#an_pin').checked, active: Q('#an_on').checked, cta, ctaLabel: cta ? v('an_clabel') : ''};
  }
  function pv() {
    if (!Q('#an_pv')) return; const c = collect(), bl = c.body.length;
    Q('#an_ctaw').hidden = ED.cta == 'none'; Q('#an_linkw').hidden = ED.cta != 'link';
    const ct = Q('#an_cnt'); ct.textContent = `${bl}/500`; ct.classList.toggle('warn', bl > 450);
    Q('#an_tc').textContent = `${c.title.length}/80`;
    const lb = c.cta && !c.ctaLabel ? (c.cta == 'plans' ? 'Lihat paket' : c.cta == 'wa' ? 'Chat admin' : 'Buka') : c.ctaLabel;
    const x = {...c, id: 'pv', title: c.title || 'Judul pengumuman', ctaLabel: lb, start: NOW(), end: c.end && c.end > NOW() ? c.end : (c.end ? NOW() + HOUR * 5 : 0)};
    Q('#an_pv').innerHTML = WM_ANN.card(x, PV == 'feed' ? {feed: true, fresh: true} : {close: !c.pin}); WM_ANN.fit(Q('#an_pv'));
    Q('#an_save').textContent = ED.id ? 'Simpan perubahan' : c.active ? 'Terbitkan' : 'Simpan sebagai draf';
  }
  const pick = b => { b.closest('.chips,.an-types').querySelectorAll('button').forEach(x => x.classList.toggle('on', x == b)); pv(); };
  function applyTpl(k) {
    const t = TPL.find(x => x[0] == k)[2], c = collect();
    if ((c.title || c.body) && !confirm('Isi yang sudah kamu ketik akan diganti dengan template ini. Lanjut?')) return;
    const keepAud = ED.aud; form({...t, aud: keepAud});
  }
  /* sisipkan teks di posisi kursor / bungkus teks terpilih */
  function fmt(kind) {
    const ta = Q('#an_body'), s = ta.selectionStart, e = ta.selectionEnd, v = ta.value, sel = v.slice(s, e); let ins, a, b;
    if (kind == 'b') { ins = '**' + (sel || 'teks tebal') + '**'; a = s + 2; b = a + (sel || 'teks tebal').length; }
    else { const ls = v.lastIndexOf('\n', s - 1) + 1, pre = v.slice(0, ls), rest = v.slice(ls, e).split('\n').map(l => /^\s*-\s/.test(l) ? l : '- ' + l).join('\n'); ta.value = (pre + rest + v.slice(e)).slice(0, 500); ta.focus(); ta.setSelectionRange(ls, ls + rest.length); return pv(); }
    ta.value = (v.slice(0, s) + ins + v.slice(e)).slice(0, 500); ta.focus(); ta.setSelectionRange(a, b); pv();
  }
  function emoji(em) { const ta = Q('#an_body'), s = ta.selectionStart; ta.value = (ta.value.slice(0, s) + em + ta.value.slice(ta.selectionEnd)).slice(0, 500); ta.focus(); ta.setSelectionRange(s + em.length, s + em.length); pv(); }
  function setStart(k) {
    const n = new Date(NOW()); let t = 0;
    if (k == '1h') t = NOW() + HOUR;
    else if (k == 'tom') { n.setDate(n.getDate() + 1); n.setHours(8, 0, 0, 0); t = n.getTime(); }
    else if (k == 'wk') { n.setDate(n.getDate() + 7); n.setHours(8, 0, 0, 0); t = n.getTime(); }
    Q('#an_start').value = t ? toInp(t) : ''; pv();
  }
  async function save(b) {
    if (busy) return; const c = collect();
    if (!c.title) { Q('#an_title').focus(); return toast('Judul belum diisi'); }
    if (/…/.test(c.title + c.body) && !confirm('Masih ada tanda “…” yang belum kamu isi. Tetap simpan?')) return;
    if (ED.cta == 'link') { if (!/^(https:\/\/[^\s<>"']{4,300}|[a-z0-9-]{1,30}\.html)$/i.test(c.cta)) return toast('Link tombol harus diawali https://'); }
    busy = true; b.disabled = true; const r = await ADM.api('admin_ann_save', c); busy = false; b.disabled = false;
    if (!r.ok) return toast(err(r));
    Q('#annm2').hidden = true; toast(ED.id ? 'Perubahan tersimpan ✓' : c.active ? 'Pengumuman terbit ✓' : 'Draf tersimpan ✓'); load(true);
  }
  async function toggle(id, b) {
    const x = LIST.find(i => i.id == id); if (!x) return; b.disabled = true;
    const r = await ADM.api('admin_ann_save', {...x, active: !x.active}); b.disabled = false;
    if (!r.ok) return toast(err(r)); toast(x.active ? 'Disembunyikan dari member' : 'Ditayangkan ke member ✓'); load(true);
  }
  function clone(id) { // salinan jadi draf baru; judul diberi tanda supaya tidak tertukar
    const x = LIST.find(i => i.id == id); if (!x) return;
    const d = x.end && x.start ? Math.max(1, Math.round((x.end - x.start) / DAY)) : 0, days = d ? DUR.filter(o => o[0]).reduce((p, o) => Math.abs(o[0] - d) < Math.abs(p - d) ? o[0] : p, 7) : 0;
    form({...x, id: '', title: (x.title + ' (salinan)').slice(0, 80), start: 0, end: 0, active: false, days}); toast('Salinan dibuat sebagai draf, silakan ubah lalu simpan');
  }
  async function del(id) {
    const x = LIST.find(i => i.id == id); if (!x) return;
    if (!confirm(`Hapus pengumuman “${x.title}”? Member tidak akan melihatnya lagi dan ini tidak bisa dikembalikan.\n\nKalau cuma mau menyembunyikan sementara, pakai tombol Sembunyikan.`)) return;
    const r = await ADM.api('admin_ann_delete', {id}); if (!r.ok) return toast(err(r)); toast('Pengumuman dihapus'); load(true);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (b.id == 'an_new') return form({});
    if (b.id == 'an_rf') { load(); return toast('Diperbarui'); }
    if (b.id == 'an_save') return save(b);
    if (d.anf != null) { FL = d.anf; return draw(); }
    if (d.ane) return form(LIST.find(x => x.id == d.ane) || {});
    if (d.anc) return clone(d.anc);
    if (d.ant) return toggle(d.ant, b);
    if (d.and) return del(d.and);
    if (d.antp) return applyTpl(d.antp);
    if (d.anty) { ED.type = d.anty; return pick(b); }
    if (d.anau) { ED.aud = d.anau; return pick(b); }
    if (d.anct) { ED.cta = d.anct; return pick(b); }
    if (d.andu != null) { ED.dur = d.andu == 'keep' ? 'keep' : +d.andu; return pick(b); }
    if (d.anpv) { PV = d.anpv; return pick(b); }
    if (d.anfm) return fmt(d.anfm);
    if (d.anem) return emoji(d.anem);
    if (d.anst) return setStart(d.anst);
  });
  document.addEventListener('input', e => {
    if (e.target.id == 'an_q') { SQ = e.target.value; return drawList(); }
    if (e.target.closest && e.target.closest('#anned')) pv();
  });
  document.addEventListener('change', e => { if (e.target.closest && e.target.closest('#anned')) pv(); });
  document.addEventListener('keydown', e => {
    const m = Q('#annm2'); if (!m || m.hidden) return;
    if (e.key == 'Escape') m.hidden = true;
    if (e.key == 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); const s = Q('#an_save'); if (s) save(s); }
  });
  setInterval(() => { if (Q('#t-ann') && !Q('#t-ann').hidden && Q('#annm2') && Q('#annm2').hidden && Q('#annlist')) drawList(); }, 60000); // status Tayang/Selesai ikut waktu
  ADM.loadAnn = load;
})();
