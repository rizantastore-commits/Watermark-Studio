'use strict';
/* Pusat Bantuan, Checklist Member Baru, FAQ & Feedback ke Google Sheets (v30) */
window.WM_HELP = (() => {
  const Q = s => document.querySelector(s), A = window.WM_API, E = Auth.esc;
  const PAGE = window.WM_PAGE || 'watermark';
  const STEPS = [
    {
      id: 'prod',
      title: 'Buat produk pertama',
      desc: 'Isi nama produk, modal, dan harga jual agar kasir otomatis menghitung laba & stok.',
      cta: 'Buka Produk',
      go: () => goTab('prod', '#addp')
    },
    {
      id: 'sale',
      title: 'Catat penjualan pertama',
      desc: 'Pilih produk di tab Kasir atau tambah manual di Rekap untuk mulai mencatat order.',
      cta: 'Ke Kasir',
      go: () => goTab('kasir')
    },
    {
      id: 'nota',
      title: 'Coba nota pembelian',
      desc: 'Buat gambar nota PNG siap kirim ke WhatsApp pembeli dari menu Riwayat atau Rekap.',
      cta: 'Lihat Riwayat',
      go: () => { goTab('kasir'); setTimeout(() => { const b = Q('[data-kstab="his"]'); b && b.click(); }, 80); }
    }
  ];

  const FAQS = [
    {
      q: 'Bagaimana cara mulai mencatat penjualan?',
      a: 'Buka tab Produk untuk menambahkan daftar jualanmu (opsional), lalu masuk ke tab Kasir, pilih produk, masukkan nama/WA pembeli, dan klik Selesaikan Transaksi. Kamu juga bisa langsung ketik manual di Kasir tanpa buat produk dulu.'
    },
    {
      q: 'Bagaimana cara membuat & mengirim nota ke pembeli?',
      a: 'Setelah transaksi dicatat, buka Kasir → Riwayat (atau tab Rekap), lalu ketuk tombol 🧾 Nota pada transaksi tersebut. Gambar nota PNG akan langsung dibuat dan bisa disalin atau dikirim ke WhatsApp pembeli.'
    },
    {
      q: 'Apakah data toko saya aman dan terpisah dari member lain?',
      a: 'Ya. Setiap akun memiliki sheet penyimpanan tersendiri di database, sehingga data penjualan, produk, stok, pelanggan, maupun QRIS statis milikmu tidak pernah tercampur dengan akun lain.'
    },
    {
      q: 'Apa perbedaan akun Gratis dan Premium?',
      a: 'Akun Gratis bisa memakai Kasir hingga 30 transaksi/bulan, 10 produk, dan Watermark dasar. Upgrade ke Premium membuka transaksi & produk tanpa batas, QRIS dinamis otomatis, laporan laba 6 bulan, pengingat H-3/H-7, serta 40 foto watermark sekaligus.'
    },
    {
      q: 'Bagaimana cara mengubah tampilan warna atau profil toko?',
      a: 'Ketuk ikon 🎨 di pojok kanan atas halaman untuk mengganti tema warna, font, nama toko, foto profil, dan bio.'
    }
  ];

  let tab = 'guide', cat = 'fitur', busy = false, sentOk = false, draft = '';

  const uKey = k => 'wm_hlp_' + k + '_' + ((Auth.user() && Auth.user().username) || 'guest').toLowerCase();
  const readSt = () => { try { return JSON.parse(localStorage.getItem(uKey('st'))) || {}; } catch (e) { return {}; } };
  const writeSt = o => { try { localStorage.setItem(uKey('st'), JSON.stringify(o)); } catch (e) {} };

  function goTab(v, clickSel) {
    close();
    if (PAGE !== 'toko') {
      location.href = 'index.html#' + v;
      return;
    }
    const btn = Q(`#vt button[data-v="${v}"]`);
    if (btn) btn.click();
    if (clickSel) setTimeout(() => { const el = Q(clickSel); el && el.click(); }, 120);
  }

  function syncAutoProgress() {
    const st = readSt();
    let changed = false;
    if (!st.prod && (Q('#plist .tk-rec') || (window.TK && Array.isArray(window.TK.P) && window.TK.P.length > 0))) { st.prod = true; changed = true; }
    if (!st.sale && (Q('#list .tk-rec') || (window.TK && Array.isArray(window.TK.R) && window.TK.R.length > 0))) { st.sale = true; changed = true; }
    if (changed) writeSt(st);
    return st;
  }

  function doneCount(st) {
    return STEPS.filter(s => !!st[s.id]).length;
  }

  document.body.insertAdjacentHTML('beforeend', `
    <button type="button" class="hlp-fab" id="hlpFab" aria-label="Bantuan & Masukan" hidden>
      <span class="hlp-ic" aria-hidden="true">${IC('message')}</span>
      <span class="hlp-tx">Bantuan</span>
      <span class="hlp-pg" id="hlpPg">0/3</span>
    </button>
    <div class="mdl hlp-mdl" id="hlpMdl" hidden>
      <div class="mcard hlp-card" role="dialog" aria-modal="true" aria-labelledby="hlpTitle">
        <div class="hlp-head">
          <h3 id="hlpTitle">💬 Bantuan &amp; Masukan</h3>
          <button class="mx" data-close type="button" aria-label="Tutup">${IC('x')}</button>
        </div>
        <div class="seg hlp-tabs" id="hlpTabs">
          <button type="button" data-htab="guide" class="on">${IC('compass')} Panduan</button>
          <button type="button" data-htab="fb">${IC('inbox')} Lapor / Usul</button>
        </div>
        <div class="hlp-body" id="hlpBody"></div>
      </div>
    </div>
  `);

  function updateBadge() {
    const fab = Q('#hlpFab'), pg = Q('#hlpPg');
    const u = Auth.user();
    if (!u) { if (fab) fab.hidden = true; return; }
    if (fab) fab.hidden = false;
    const st = syncAutoProgress();
    const d = doneCount(st);
    if (pg) pg.textContent = `${d}/${STEPS.length}`;
    if (fab) fab.classList.toggle('done', d >= STEPS.length);
    renderTopBanner(st);
  }

  function renderTopBanner(st) {
    if (PAGE !== 'toko') return;
    const panel = Q('#panel');
    if (!panel || panel.hidden) return;
    const d = doneCount(st);
    const dismissed = localStorage.getItem(uKey('hide_banner')) === '1';
    let box = Q('#hlpTopBanner');
    if (d >= STEPS.length || dismissed) {
      if (box) box.remove();
      return;
    }
    const next = STEPS.find(s => !st[s.id]) || STEPS[0];
    if (!box) {
      box = document.createElement('div');
      box.id = 'hlpTopBanner';
      box.className = 'hlp-banner';
      const vt = Q('#vt');
      if (vt && vt.parentNode) vt.parentNode.insertBefore(box, vt.nextSibling);
    }
    box.innerHTML = `
      <div class="hlp-banner-l">
        <span aria-hidden="true">🚀</span>
        <div>
          <b>Mulai cepat (${d}/${STEPS.length} selesai)</b>
          <small>Langkah berikutnya: ${E(next.title)}</small>
        </div>
      </div>
      <div class="hlp-banner-acts">
        <button type="button" class="btn pri" id="hlpBanGo">Checklist</button>
        <button type="button" class="btn hlp-ban-x" id="hlpBanX" title="Sembunyikan" aria-label="Sembunyikan">${IC('x')}</button>
      </div>
    `;
  }

  function renderBody() {
    const body = Q('#hlpBody');
    document.querySelectorAll('#hlpTabs button').forEach(b => b.classList.toggle('on', b.dataset.htab === tab));

    if (tab === 'guide') {
      const st = syncAutoProgress();
      const d = doneCount(st);
      const pct = Math.round((d / STEPS.length) * 100);
      body.innerHTML = `
        <div class="hlp-onb">
          <div class="hlp-onb-top">
            <b>🚀 Checklist Member Baru</b>
            <span class="badge ok">${d}/${STEPS.length} selesai</span>
          </div>
          <div class="hlp-bar"><i style="width:${pct}%"></i></div>
          <div class="hlp-steps">
            ${STEPS.map(s => {
              const ok = !!st[s.id];
              return `
                <div class="hlp-step ${ok ? 'ok' : ''}">
                  <button type="button" class="hlp-chk" data-hchk="${s.id}" aria-label="Tandai ${E(s.title)}">${ok ? '' + IC('check') + '' : ''}</button>
                  <div class="hlp-st-t">
                    <b>${E(s.title)}</b>
                    <small>${E(s.desc)}</small>
                  </div>
                  ${ok ? '<span class="hlp-done">✓ Selesai</span>' : `<button type="button" class="btn pri hlp-go" data-hgo="${s.id}">${E(s.cta)}</button>`}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div style="display:grid;gap:8px">
          <b class="hlp-sub">❓ Pertanyaan yang Sering Ditanyakan</b>
          <div class="hlp-faq">
            ${FAQS.map((f, idx) => `
              <details class="hlp-q" ${idx === 0 ? 'open' : ''}>
                <summary>${E(f.q)}</summary>
                <p>${E(f.a)}</p>
              </details>
            `).join('')}
          </div>
        </div>

        <button type="button" class="btn wide" data-htab="fb">${IC('bulb')} Ada kendala atau ide fitur baru? Kirim masukan ${IC('arrowright')}</button>
      `;
      return;
    }

    body.innerHTML = `
      <form id="hlpFbForm" class="hlp-form">
        <small>Masukanmu langsung masuk ke Google Sheets ReyVion untuk menentukan perbaikan &amp; fitur berikutnya.</small>
        <div class="hlp-cats">
          <button type="button" class="hlp-cat ${cat === 'bug' ? 'on' : ''}" data-hcat="bug"><span class="hlp-ce">${IC('bug')}</span>Lapor Masalah</button>
          <button type="button" class="hlp-cat ${cat === 'fitur' ? 'on' : ''}" data-hcat="fitur"><span class="hlp-ce">${IC('bulb')}</span>Usul Fitur</button>
          <button type="button" class="hlp-cat ${cat === 'tanya' ? 'on' : ''}" data-hcat="tanya"><span class="hlp-ce">${IC('help')}</span>Tanya Bantuan</button>
        </div>
        <label class="f">
          <span>${cat === 'bug' ? 'Ceritakan masalah yang kamu alami' : cat === 'fitur' ? 'Fitur apa yang ingin kamu tambahkan?' : 'Apa yang bikin kamu bingung?'}</span>
          <textarea id="hlpMsg" rows="4" maxlength="800" placeholder="${cat === 'bug' ? 'Contoh: Saat klik simpan produk di HP, tombolnya tidak merespons…' : cat === 'fitur' ? 'Contoh: Tolong tambahkan rekap pengiriman / cetak label otomatis…' : 'Contoh: Cara setting QRIS dinamis di mana ya?'}" required>${E(draft)}</textarea>
        </label>
        <div class="gerr" id="hlpErr"></div>
        ${sentOk ? '<div class="hlp-fb-ok">✅ Terima kasih! Masukanmu sudah tercatat di Google Sheets ReyVion.</div>' : ''}
        <div class="hlp-acts">
          <button type="submit" class="btn pri" id="hlpSendBtn">${busy ? 'Mengirim…' : '' + IC('send') + ' Kirim Masukan'}</button>
          <a class="btn" href="${Auth.wa('Halo kak ReyVion, aku butuh bantuan di web.')}" target="_blank" rel="noopener">${IC('message')} Chat WA</a>
        </div>
      </form>
    `;
  }

  function open(initialTab = 'guide') {
    tab = initialTab;
    sentOk = false;
    renderBody();
    Q('#hlpMdl').hidden = false;
  }

  function close() {
    Q('#hlpMdl').hidden = true;
  }

  async function submitFb(e) {
    e.preventDefault();
    if (busy) return;
    const msg = (Q('#hlpMsg').value || '').trim();
    const errEl = Q('#hlpErr');
    errEl.classList.remove('on');
    if (msg.length < 6) {
      errEl.textContent = 'Tuliskan pesan minimal 6 karakter ya.';
      errEl.classList.add('on');
      return;
    }
    busy = true;
    const btn = Q('#hlpSendBtn');
    if (btn) btn.textContent = 'Mengirim…';
    const tok = localStorage.getItem('wm_tok') || '';
    const res = await A.call({action: 'fb_send', token: tok, category: cat, page: PAGE, message: msg});
    busy = false;
    if (!res || !res.ok) {
      errEl.textContent = (res && res.error) || 'Gagal mengirim masukan.';
      errEl.classList.add('on');
      if (btn) btn.innerHTML = IC('send') + ' Kirim Masukan';
      return;
    }
    sentOk = true;
    draft = '';
    renderBody();
    if (window.toast) window.toast('Masukan terkirim ✓');
  }

  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('#hlpFab') || t.closest('#hlpBanGo')) return open('guide');
    if (t.closest('#hlpBanX')) {
      localStorage.setItem(uKey('hide_banner'), '1');
      updateBadge();
      return;
    }
    if (t.closest('[data-htab]')) {
      tab = t.closest('[data-htab]').dataset.htab;
      sentOk = false;
      return renderBody();
    }
    if (t.closest('[data-hcat]')) {
      const m = Q('#hlpMsg'); if (m) draft = m.value;
      cat = t.closest('[data-hcat]').dataset.hcat;
      return renderBody();
    }
    if (t.closest('[data-hchk]')) {
      const id = t.closest('[data-hchk]').dataset.hchk;
      const st = readSt();
      st[id] = !st[id];
      writeSt(st);
      updateBadge();
      renderBody();
      return;
    }
    if (t.closest('[data-hgo]')) {
      const id = t.closest('[data-hgo]').dataset.hgo;
      const step = STEPS.find(x => x.id === id);
      if (step && step.go) step.go();
    }
  });

  document.addEventListener('submit', e => {
    if (e.target && e.target.id === 'hlpFbForm') submitFb(e);
  });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-nota], [data-ksrc], [data-ksinv], [data-ksdone], #ntShare, #ntDl, #ntCopy')) {
      const st = readSt();
      if (!st.nota) {
        st.nota = true;
        writeSt(st);
        updateBadge();
      }
    }
  }, true);

  document.addEventListener('wm:auth', () => setTimeout(updateBadge, 200));
  document.addEventListener('wm:logout', updateBadge);
  setTimeout(updateBadge, 900);
  setInterval(updateBadge, 5000);

  return {open, close, updateBadge};
})();
