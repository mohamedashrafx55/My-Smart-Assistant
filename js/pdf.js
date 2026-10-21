/* Direct PDF export (A4) — no libraries: HTML → SVG foreignObject → canvas → JPEG pages → hand-written PDF */
(function(){
const MSA = window.MSA, U = MSA.u, T = (a, e) => MSA.T(a, e);
const PX = 96 / 72, A4 = [595.28, 841.89];
const dims = land => land ? { w: 1123, h: 794, pw: A4[1], ph: A4[0] } : { w: 794, h: 1123, pw: A4[0], ph: A4[1] };
const BASE = "*{box-sizing:border-box}.pdfpage{background:#fff;color:#1d1d1c;line-height:1.6;font-family:'Segoe UI','Noto Sans Arabic','Noto Naskh Arabic',Tahoma,Arial,sans-serif;overflow:hidden;position:relative}.pdfpage img{max-width:100%}.pdfin{height:100%}.pdfno{position:absolute;bottom:18px;inset-inline:0;text-align:center;font-size:11px;color:#999;direction:ltr}";
const dataUrl = blob => new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = no; fr.readAsDataURL(blob); });
const fontCache = {};
async function fontCss(families){
  let out = '';
  for (const fam of families) {
    if (fontCache[fam] == null) {
      fontCache[fam] = '';
      try {
        const css = await (await fetch('https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fam).replace(/%20/g, '+') + '&display=swap')).text();
        const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g; let m, keep = '';
        while ((m = re.exec(css))) {
          if (!/^(arabic|latin)$/.test(m[1])) continue;
          const u = /url\(([^)]+)\)/.exec(m[2]); if (!u) continue;
          const d = await dataUrl(await (await fetch(u[1].replace(/['"]/g, ''))).blob());
          keep += m[2].replace(/url\([^)]+\)/, 'url(' + d + ')').replace(/format\([^)]*\)/, '');
        }
        fontCache[fam] = keep;
      } catch (e) { /* offline → system fonts */ }
    }
    out += fontCache[fam];
  }
  return out;
}
/* turn remote <img> into data URIs (SVG images can't load remote files) */
async function inlineImgs(root){
  for (const im of Array.from(root.querySelectorAll('img'))) {
    const s = im.getAttribute('src') || '';
    if (/^data:/.test(s)) continue;
    try { const d = await dataUrl(await (await fetch(s)).blob()); im.setAttribute('src', d); } catch (e) { im.remove(); }
  }
}
function stage(d){ const s = document.createElement('div'); s.style.cssText = 'position:fixed;left:-20000px;top:0;width:' + d.w + 'px;visibility:hidden;pointer-events:none'; document.body.appendChild(s); return s; }
function pageEl(d, css, dir, fontsCss, inner, no){
  const el = document.createElement('div'); el.className = 'pdfpage'; el.setAttribute('dir', dir); el.style.cssText = 'width:' + d.w + 'px;height:' + d.h + 'px';
  const st = document.createElement('style'); st.textContent = BASE + (css || '') + fontsCss; el.appendChild(st);
  const c = document.createElement('div'); c.className = 'pdfin'; c.innerHTML = inner; el.appendChild(c);
  if (no) { const n = document.createElement('div'); n.className = 'pdfno'; n.textContent = no; el.appendChild(n); }
  return el;
}
async function toJpeg(el, d){
  const xml = new XMLSerializer().serializeToString(el);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + d.w + '" height="' + d.h + '"><foreignObject x="0" y="0" width="100%" height="100%">' + xml + '</foreignObject></svg>';
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('render')); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  const sc = 2, c = document.createElement('canvas'); c.width = d.w * sc; c.height = d.h * sc;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
  const b64 = c.toDataURL('image/jpeg', .9).split(',')[1], bin = atob(b64), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return { u8, w: c.width, h: c.height };
}
function buildPdf(pages, d){
  const enc = s => new TextEncoder().encode(s), parts = [], offs = []; let len = 0;
  const push = b => { parts.push(b); len += b.length; };
  const obj = (n, body) => { offs[n] = len; push(enc(n + ' 0 obj\n')); push(typeof body === 'string' ? enc(body) : body); push(enc('\nendobj\n')); };
  push(enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
  const N = pages.length; obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Count ' + N + ' /Kids [' + pages.map((_, i) => (3 + i * 3) + ' 0 R').join(' ') + '] >>');
  pages.forEach((p, i) => {
    const pn = 3 + i * 3, cn = pn + 1, im = pn + 2;
    obj(pn, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + d.pw.toFixed(2) + ' ' + d.ph.toFixed(2) + '] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + cn + ' 0 R >>');
    const cs = 'q ' + d.pw.toFixed(2) + ' 0 0 ' + d.ph.toFixed(2) + ' 0 0 cm /Im0 Do Q';
    obj(cn, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
    const head = enc('<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.u8.length + ' >>\nstream\n');
    const body = new Uint8Array(head.length + p.u8.length + 10); body.set(head, 0); body.set(p.u8, head.length); body.set(enc('\nendstream'), head.length + p.u8.length);
    obj(im, body);
  });
  const xr = len, total = 3 + N * 3; let x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
  for (let i = 1; i < total; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  push(enc(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF'));
  const out = new Uint8Array(len); let o = 0; parts.forEach(b => { out.set(b, o); o += b.length; }); return out;
}
async function deliver(name, bytes){
  const FS = MSA.native && MSA.native('Filesystem'), SH = MSA.native && MSA.native('Share');
  if (FS && SH) {
    try {
      let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      const r = await FS.writeFile({ path: name, data: btoa(bin), directory: 'CACHE' });
      await SH.share({ title: name, url: r.uri, dialogTitle: name }); return;
    } catch (e) { if (e && /cancel/i.test(String(e.message || e))) return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
}
async function render(name, o, makePages){
  const land = !!o.landscape, d = dims(land), dir = o.dir || 'rtl', st = stage(d);
  MSA.toast(T('جاري إنشاء ملف PDF…', 'Creating the PDF…'), '', 2500);
  try {
    const fonts = await fontCss(o.fonts || []);
    const htmls = await makePages(st, d);
    const imgs = [];
    for (let i = 0; i < htmls.length; i++) {
      const el = pageEl(d, o.css, dir, fonts, htmls[i], o.numbers === false ? '' : (i + 1) + ' / ' + htmls.length);
      st.appendChild(el); await inlineImgs(el);
      imgs.push(await toJpeg(el, d)); el.remove();
      await new Promise(r => setTimeout(r, 0));
    }
    await deliver(name, buildPdf(imgs, d));
    MSA.toast(T('تم إنشاء ملف PDF ✓', 'PDF created ✓'), 'ok');
  } catch (e) { console.warn(e); MSA.toast(T('تعذّر إنشاء PDF على هذا الجهاز', 'Could not create the PDF on this device'), 'err'); }
  finally { st.remove(); }
}
/* flowing document: top-level children of `.pg` are packed into pages (h2 stays with what follows, big tables split by rows) */
MSA.pdf = {
  flow(name, bodyHtml, o){
    o = o || {};
    return render(name, o, async (st, d) => {
      const padX = 48, padY = 52, inW = d.w - padX * 2, inH = d.h - padY * 2 - 8;
      /* measure in an isolated frame so the app's own CSS can't change the sizes */
      const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-20000px;top:0;border:0;width:' + inW + 'px;height:2000px'; st.appendChild(fr);
      const fdoc = fr.contentDocument; fdoc.open(); fdoc.write('<!doctype html><html dir="' + (o.dir || 'rtl') + '"><head><meta charset="utf-8"><style>html,body{margin:0}' + BASE + (o.css || '') + '.pg{padding:0!important;max-width:none!important;margin:0!important}</style></head><body><div class="pdfpage" id="pr" style="width:' + inW + 'px;overflow:visible">' + bodyHtml + '</div></body></html>'); fdoc.close();
      const pr = fdoc.getElementById('pr'); await inlineImgs(pr); await Promise.all(Array.from(pr.querySelectorAll('img')).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      const pg = pr.querySelector('.pg') || pr, blocks = Array.from(pg.children), win = fdoc.defaultView;
      const hOf = el => { const cs = win.getComputedStyle(el), r = el.getBoundingClientRect(); return r.height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0); };
      const pages = [[]]; let used = 0;
      const place = (html, h, keep) => { if (used + h > inH && pages[pages.length - 1].length) { pages.push([]); used = 0; } pages[pages.length - 1].push({ html, h, keep }); used += h; };
      blocks.forEach(b => {
        const h = hOf(b);
        if (b.tagName === 'TABLE' && h > inH * .6) {
          const head = b.querySelector('thead'), rows = Array.from(b.querySelectorAll('tbody tr'));
          let chunk = []; let ch = head ? head.getBoundingClientRect().height : 0;
          const flush = () => { if (!chunk.length) return; const t = b.cloneNode(false); if (head) t.appendChild(head.cloneNode(true)); const tb = fdoc.createElement('tbody'); chunk.forEach(r => tb.appendChild(r.cloneNode(true))); t.appendChild(tb); place(t.outerHTML, ch, false); chunk = []; ch = head ? head.getBoundingClientRect().height : 0; };
          rows.forEach(r => { const rh = r.getBoundingClientRect().height; if (used + ch + rh > inH && chunk.length) { flush(); } chunk.push(r); ch += rh; }); flush();
        } else place(b.outerHTML, h, b.tagName === 'H2');
      });
      for (let i = 0; i < pages.length - 1; i++) { const l = pages[i][pages[i].length - 1]; if (l && l.keep && pages[i].length > 1) { pages[i + 1].unshift(pages[i].pop()); } }
      /* verify real heights and push overflowing blocks to the next page */
      const real = list => { pr.innerHTML = '<div class="pg">' + list.map(x => x.html).join('') + '</div>'; return pr.querySelector('.pg').getBoundingClientRect().height; };
      for (let i = 0; i < pages.length; i++) while (pages[i].length > 1 && real(pages[i]) > inH) { const x = pages[i].pop(); if (!pages[i + 1]) pages.push([]); pages[i + 1].unshift(x); }
      fr.remove();
      return pages.filter(p => p.length).map(p => '<div class="pg" style="padding:' + padY + 'px ' + padX + 'px;max-width:none;margin:0">' + p.map(x => x.html).join('') + '</div>');
    });
  },
  pages(name, htmls, o){ return render(name, o || {}, async () => htmls); }
};
})();

