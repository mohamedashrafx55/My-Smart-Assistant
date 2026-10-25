/* Studio tools: project tabs (identity kit, time & pricing, publishing calendar, revisions, delivery) and learning tabs (references, trends, learning plan) */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const S = () => MSA.state, esc = U.esc;
const T = (a, e) => MSA.T(a, e);
const en = () => S().settings.lang === 'en';
const K = () => MSA.know;
const today = () => U.dateKey(new Date());
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
const money = n => (Math.round(n * 100) / 100).toLocaleString(en() ? 'en-US' : 'ar-EG', { maximumFractionDigits: 2 });
const fmtDur = s => { s = Math.max(0, Math.floor(s)); return U.pad(Math.floor(s / 3600)) + ':' + U.pad(Math.floor(s / 60) % 60) + ':' + U.pad(s % 60); };
const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const cmyk = h => { const [r, g, b] = hex2rgb(h).map(x => x / 255), k = 1 - Math.max(r, g, b); if (k >= 1) return [0, 0, 0, 100]; return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map(x => Math.round(x * 100)); };
const lum = h => { const [r, g, b] = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
const ink = h => lum(h) > .42 ? '#111' : '#fff';
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

/* ---------- downloads / documents ---------- */
function saveFile(name, text, mime){
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/html' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  MSA.toast(T('تم إنشاء الملف — افتحه واطبعه PDF من المتصفح', 'File created — open it and print to PDF from the browser'), 'ok', 4200);
}
const slug = s => String(s || 'file').replace(/[^\w؀-ۿ]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
function shell(title, body, o){
  o = o || {}; const rtl = !en(), acc = o.accent || '#5b8def';
  return '<!doctype html><html lang="' + (rtl ? 'ar' : 'en') + '" dir="' + (rtl ? 'rtl' : 'ltr') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title>' + (o.head || '') +
    '<style>*{box-sizing:border-box}body{margin:0;font-family:' + (o.font || "'Segoe UI','Noto Sans Arabic',Tahoma,Arial,sans-serif") + ';color:#1d1d1c;background:#fff;line-height:1.6}.pg{max-width:880px;margin:0 auto;padding:36px 28px}h1{font-size:30px;margin:0 0 4px}h2{font-size:18px;margin:30px 0 10px;border-bottom:2px solid ' + acc + ';padding-bottom:6px}.muted{color:#777;font-size:13px}table{width:100%;border-collapse:collapse}th,td{padding:9px 8px;border-bottom:1px solid #e5e5e2;text-align:start;font-size:14px}th{background:#f6f5f2;font-size:12.5px}.tot td{font-weight:700;font-size:16px;border-top:2px solid #1d1d1c}.sw{display:inline-block;width:150px;margin:0 0 14px;margin-inline-end:14px;vertical-align:top;font-size:12px}.sw i{display:block;height:84px;border-radius:10px;border:1px solid #0001;margin-bottom:6px}.sw code{display:block;direction:ltr;text-align:start;color:#555}.box{border:1px solid #e5e5e2;border-radius:12px;padding:14px;margin:10px 0}.do{border-inline-start:4px solid #2fa66d}.dont{border-inline-start:4px solid #d94b4b}img{max-width:100%}.hd{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:flex-start}@media print{.pg{padding:0}.noprint{display:none}h2{break-after:avoid}.box,.sw,tr{break-inside:avoid}}' + (o.css || '') + '</style></head><body>' + body + '</body></html>';
}
const cssOf = html => { const m = /<style>([\s\S]*?)<\/style>/.exec(html); return m ? m[1] : ''; };
const blobData = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
async function imgData(att, max){
  const rec = await MSA.files.get(att.id); if (!rec) return null;
  if (rec.mime === 'image/svg+xml' || rec.size < 350000 && /png|jpe?g|webp/.test(rec.mime)) return blobData(rec.blob);
  const url = URL.createObjectURL(rec.blob);
  try {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const sc = Math.min(1, (max || 1600) / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .86);
  } catch (e) { return blobData(rec.blob); } finally { URL.revokeObjectURL(url); }
}
const P = () => MSA.proj;
const imgAtts = (p, key) => { const out = []; P().walk(p.steps, s => { if (!key || s.key === key) s.atts.filter(a => a.kind === 'image').forEach(a => out.push(a)); }); return out; };
const brandName = p => (p.brand || p.name);
const idOf = p => { const id = p.identity = p.identity || { colors: [], fonts: [], icons: [], notes: [], images: [] }; ['colors', 'fonts', 'icons', 'notes', 'images'].forEach(k => id[k] = id[k] || []); return id; };
const mount = (box) => document.body.contains(box);

/* =====================================================================
   PROJECT TABS
   ===================================================================== */
const PTABS = [
  ['plan', 'layers', 'الخطة', 'Plan'], ['identity', 'palette', 'الهوية', 'Identity'], ['time', 'clock', 'الوقت والتسعير', 'Time & pricing'],
  ['posts', 'calendar', 'جدول النشر', 'Publishing'], ['revs', 'copy', 'التعديلات', 'Revisions'], ['delivery', 'check-c', 'التسليم', 'Delivery']
];
MSA.studio = { PTABS };
MSA.studio.tabBar = function(cur, p){
  const badge = k => {
    if (k === 'identity') { const i = p.identity; const n = i ? i.colors.length + i.fonts.length + i.icons.length + i.notes.length + (i.images || []).length : 0; return n ? '<span class="cnt">' + n + '</span>' : ''; }
    if (k === 'posts') { const n = (p.posts || []).filter(x => x.status !== 'posted').length; return n ? '<span class="cnt">' + n + '</span>' : ''; }
    if (k === 'delivery' && p.delivery) { const d = p.delivery.items; const n = d.filter(x => x.done).length; return '<span class="cnt">' + n + '/' + d.length + '</span>'; }
    return '';
  };
  return '<div class="tabs-scroll stab">' + PTABS.map(x => '<button class="ttab ' + (x[0] === cur ? 'on' : '') + '" data-act="ptab" data-t="' + x[0] + '">' + I(x[1], 'sm') + esc(T(x[2], x[3])) + badge(x[0]) + '</button>').join('') + '</div>';
};
MSA.studio.render = function(tab, p, box){
  const fn = { identity: tIdentity, time: tTime, posts: tPosts, revs: tRevs, delivery: tDelivery }[tab];
  if (fn) fn(p, box);
};

/* ---------- identity ---------- */
function tIdentity(p, box){
  const id = idOf(p), n = id.colors.length + id.fonts.length + id.icons.length + id.notes.length + id.images.length;
  const logos = imgAtts(p, 'logo');
  box.innerHTML = '<div class="card st-card"><div class="st-h">' + I('palette', 'sm') + '<b>' + esc(T('الهوية البصرية للمشروع', 'Project visual identity')) + '</b></div>' +
    (n ? '<div class="sw-row">' + id.colors.map(c => '<div class="sw-card"><div class="sw-c" style="background:' + c + ';color:' + ink(c) + ';cursor:default">' + c.toUpperCase() + '</div></div>').join('') + '</div>' +
      (id.fonts.length ? '<div class="hint" style="margin-top:8px">' + esc(T('الخطوط: ', 'Fonts: ')) + id.fonts.map(f => esc(f.ah === f.h ? f.h : f.ah + ' + ' + f.h)).join(' · ') + '</div>' : '') +
      '<div class="hint">' + esc(T('أيقونات: ', 'Icons: ')) + id.icons.length + ' · ' + esc(T('ملاحظات: ', 'Notes: ')) + id.notes.length + ' · ' + esc(T('صور: ', 'Images: ')) + id.images.length + ' · ' + esc(T('شعارات مرفقة: ', 'Logo files: ')) + logos.length + '</div>'
      : '<div class="hint">' + esc(T('لسه فاضية. افتح زر ✨ الاقتراحات في أي خطوة، واضغط 📌 على الألوان والخطوط والأيقونات اللي عجبتك وهتتجمع هنا.', 'Empty for now. Open ✨ Suggestions on any step and pin the colours, fonts and icons you like — they collect here.')) + '</div>') +
    '<div class="row" style="margin-top:12px"><button class="btn primary" data-a="explore">' + I('search', 'sm') + esc(T('استكشاف وإضافة (صور · ألوان · أيقونات · خطوط)', 'Explore & add (images · colours · icons · fonts)')) + '</button><button class="btn" data-a="board">' + I('palette', 'sm') + esc(T('فتح لوحة الهوية', 'Open identity board')) + '</button>' +
    '<button class="btn primary" data-a="kit" ' + (n ? '' : 'disabled') + '>' + I('download', 'sm') + esc(T('تصدير كتيب الهوية', 'Export brand kit')) + '</button></div></div>';
  $('[data-a=explore]', box).onclick = () => MSA.explore && MSA.explore.open(p, {});
  $('[data-a=board]', box).onclick = () => MSA.suggest && MSA.suggest.openIdentity(p);
  $('[data-a=kit]', box).onclick = () => brandKit(p);
}
async function brandKit(p){
  const id = idOf(p), brand = brandName(p), prim = id.colors[0] || '#5b8def', prof = S().profile;
  const logos = []; for (const a of imgAtts(p, 'logo').slice(0, 6)) { const d = await imgData(a, 900); if (d) logos.push(d); }
  const fonts = []; id.fonts.forEach(f => [f.h, f.b, f.ah, f.ab].forEach(x => x && !fonts.includes(x) && fonts.push(x)));
  const head = fonts.length ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + fonts.map(f => 'family=' + encodeURIComponent(f).replace(/%20/g, '+')).join('&') + '&display=swap">' : '';
  const body = '<div class="pg"><div class="hd"><div><div class="muted">' + esc(T('كتيب الهوية البصرية', 'Brand identity kit')) + '</div><h1 style="color:' + prim + '">' + esc(brand) + '</h1><div class="muted">' + esc(p.name) + ' · ' + new Date().toLocaleDateString(en() ? 'en-GB' : 'ar-EG') + '</div></div><div class="muted" style="text-align:end">' + esc(prof.name || '') + '<br>' + esc(prof.title || '') + '<br>' + esc(prof.email || '') + '</div></div>' +
    (logos.length ? '<h2>' + esc(T('الشعار', 'Logo')) + '</h2><div>' + logos.map(d => '<div class="box" style="display:inline-block;margin-inline-end:10px"><img src="' + d + '" style="max-height:120px"></div>').join('') + '</div>' : '') +
    (id.colors.length ? '<h2>' + esc(T('الألوان', 'Colours')) + '</h2><div>' + id.colors.map((c, i) => { const r = hex2rgb(c), k = cmyk(c); return '<div class="sw"><i style="background:' + c + '"></i><b>' + esc(i === 0 ? T('الأساسي', 'Primary') : T('لون ', 'Colour ') + (i + 1)) + '</b><code>HEX ' + c.toUpperCase() + '</code><code>RGB ' + r.join(' ') + '</code><code>CMYK ' + k.join(' ') + '</code></div>'; }).join('') + '</div>' +
      '<div class="box"><b>' + esc(T('فحص التباين', 'Contrast check')) + '</b><table>' + id.colors.slice(0, 5).map(c => { const w = ratio(c, '#ffffff'), b = ratio(c, '#111111'); return '<tr><td><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:' + c + ';vertical-align:-2px"></span> ' + c.toUpperCase() + '</td><td dir="ltr">' + esc(T('على أبيض', 'on white')) + ' ' + w.toFixed(1) + ':1</td><td dir="ltr">' + esc(T('على أسود', 'on black')) + ' ' + b.toFixed(1) + ':1</td></tr>'; }).join('') + '</table><div class="muted">' + esc(T('القيم التقريبية لـ CMYK للتوجيه فقط؛ طابق دائمًا مع بروفة الطباعة.', 'CMYK values are approximate; always match against a print proof.')) + '</div></div>' : '') +
    (id.fonts.length ? '<h2>' + esc(T('الخطوط', 'Typography')) + '</h2>' + id.fonts.map(f => '<div class="box"><div style="font-family:\'' + esc(f.ah) + '\',serif;font-size:30px" dir="rtl">' + esc(brand) + ' — ' + esc(f.ah) + '</div><div style="font-family:\'' + esc(f.ab) + '\',serif" dir="rtl">نص تجريبي لفقرة قصيرة يوضح شكل الخط في القراءة.</div><div style="font-family:\'' + esc(f.h) + '\',serif;font-size:28px;margin-top:8px" dir="ltr">' + esc(f.h) + '</div><div style="font-family:\'' + esc(f.b) + '\',sans-serif" dir="ltr">A short paragraph showing how the body typeface reads.</div></div>').join('') : '') +
    (id.icons.length ? '<h2>' + esc(T('الأيقونات', 'Icons')) + '</h2><div>' + id.icons.map(x => { const [pf, nm] = x.split(':'); return '<img src="https://api.iconify.design/' + pf + '/' + nm + '.svg?color=' + encodeURIComponent(prim) + '&height=40" height="40" style="margin:6px 10px" alt="' + esc(nm) + '">'; }).join('') + '</div>' : '') +
    (id.notes.length ? '<h2>' + esc(T('اتجاهات وملاحظات', 'Direction & notes')) + '</h2>' + id.notes.map(x => '<div class="box">' + esc(x) + '</div>').join('') : '') +
    '<h2>' + esc(T('إرشادات الاستخدام', 'Usage guidelines')) + '</h2>' +
    ['استخدم اللون الأساسي لنحو 30% من المساحة والخلفية 60% والتمييز 10%.|Use the primary for ~30% of the area, background 60%, accent 10%.', 'احتفظ بمساحة فارغة حول الشعار بقدر ارتفاع حرف منه.|Keep clear space around the logo equal to one letter height.'].map(x => '<div class="box do"><b>' + esc(T('افعل', 'Do')) + '</b> — ' + esc(T(x.split('|')[0], x.split('|')[1])) + '</div>').join('') +
    ['لا تمدّ الشعار ولا تغيّر ألوانه خارج اللوحة المعتمدة.|Do not stretch the logo or recolour it outside the approved palette.', 'لا تضع نصًا فاتحًا على خلفية فاتحة (تحقق من التباين).|Do not set light text on a light background (check contrast).'].map(x => '<div class="box dont"><b>' + esc(T('لا تفعل', "Don't")) + '</b> — ' + esc(T(x.split('|')[0], x.split('|')[1])) + '</div>').join('') + '</div>';
  MSA.pdf.flow('brand-kit-' + slug(brand) + '.pdf', body, { css: cssOf(shell('', '', { accent: prim })), fonts, dir: en() ? 'ltr' : 'rtl' });
}

/* ---------- time & pricing ---------- */
const CURS = ['EGP', 'USD', 'SAR', 'AED', 'EUR', 'GBP'];
let tick = null;
function tTime(p, box){
  const tm = p.time = Object.assign({ rate: 0, cur: 'EGP', client: '', fixed: 0, notes: '', run: null, entries: [], extras: [], seq: 0 }, p.time || {});
  const secs = () => tm.entries.reduce((a, e) => a + e.min * 60, 0);
  const hrs = () => secs() / 3600;
  const extra = () => tm.extras.reduce((a, e) => a + e.amt, 0);
  const total = () => (tm.fixed > 0 ? tm.fixed : hrs() * tm.rate) + extra();
  const draw = () => {
    box.innerHTML = '<div class="card st-card"><div class="st-h">' + I('clock', 'sm') + '<b>' + esc(T('مؤقّت الشغل', 'Work timer')) + '</b></div>' +
      '<div class="timer"><div class="tdisp" id="tmDisp">' + fmtDur(tm.run ? (Date.now() - tm.run.start) / 1000 : 0) + '</div>' +
      '<input type="text" id="tmNote" dir="auto" placeholder="' + esc(T('بتشتغل على إيه؟ (اختياري)', 'What are you working on? (optional)')) + '" value="' + esc(tm.run ? tm.run.note : '') + '">' +
      '<button class="btn ' + (tm.run ? 'danger' : 'primary') + '" data-a="toggle">' + I(tm.run ? 'x' : 'play', 'sm') + esc(tm.run ? T('إيقاف وحفظ', 'Stop & save') : T('ابدأ', 'Start')) + '</button></div>' +
      '<div class="row" style="margin-top:10px"><input type="number" id="tmMin" min="1" placeholder="' + esc(T('دقائق', 'Minutes')) + '" style="width:110px"><input type="text" id="tmMNote" dir="auto" class="grow" placeholder="' + esc(T('إضافة وقت يدويًا — وصف', 'Add time manually — note')) + '"><button class="btn sm" data-a="addmin">' + I('plus', 'sm') + esc(T('إضافة', 'Add')) + '</button></div>' +
      (tm.entries.length ? '<table class="st-tbl"><tbody>' + tm.entries.slice().reverse().map(e => '<tr><td>' + esc(e.date) + '</td><td dir="auto">' + esc(e.note || '—') + '</td><td dir="ltr">' + Math.floor(e.min / 60) + 'h ' + (e.min % 60) + 'm</td><td><button class="icon-btn sm danger" data-del="' + e.id + '" aria-label="delete">' + I('x', 'sm') + '</button></td></tr>').join('') + '</tbody></table>' : '') + '</div>' +
      '<div class="card st-card"><div class="st-h">' + I('file', 'sm') + '<b>' + esc(T('التسعير', 'Pricing')) + '</b></div>' +
      '<div class="st-grid"><div class="field"><label class="f">' + esc(T('العميل', 'Client')) + '</label><input type="text" id="prClient" dir="auto" list="prClL" autocomplete="off" value="' + esc(MSA.clients.of(p)) + '"><datalist id="prClL">' + MSA.clients.names().map(n => '<option value="' + esc(n) + '">').join('') + '</datalist></div>' +
      '<div class="field"><label class="f">' + esc(T('سعر الساعة', 'Hourly rate')) + '</label><input type="number" id="prRate" min="0" value="' + (tm.rate || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('سعر ثابت (اختياري)', 'Fixed price (optional)')) + '</label><input type="number" id="prFixed" min="0" value="' + (tm.fixed || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('العملة', 'Currency')) + '</label><select id="prCur">' + MSA.rates.pricing([tm.cur]).map(c => '<option ' + (c === tm.cur ? 'selected' : '') + '>' + c + '</option>').join('') + '</select></div></div>' +
      '<label class="f">' + esc(T('بنود إضافية (صور ستوك، طباعة…)', 'Extra items (stock, printing…)')) + '</label>' +
      tm.extras.map(e => '<div class="row" style="margin-bottom:6px"><span class="grow" dir="auto">' + esc(e.name) + '</span><b dir="ltr">' + money(e.amt) + ' ' + tm.cur + '</b><button class="icon-btn sm danger" data-xdel="' + e.id + '">' + I('x', 'sm') + '</button></div>').join('') +
      '<div class="row" style="margin-bottom:12px"><input type="text" id="exName" dir="auto" class="grow" placeholder="' + esc(T('اسم البند', 'Item name')) + '"><input type="number" id="exAmt" min="0" placeholder="' + esc(T('المبلغ', 'Amount')) + '" style="width:110px"><button class="btn sm" data-a="addex">' + I('plus', 'sm') + '</button></div>' +
      '<div class="field"><label class="f">' + esc(T('شروط وملاحظات (تظهر في الملف)', 'Terms & notes (shown on the document)')) + '</label><textarea id="prNotes" dir="auto" rows="2">' + esc(tm.notes) + '</textarea></div>' +
      '<div class="st-total"><span>' + esc(T('الساعات', 'Hours')) + ': <b>' + hrs().toFixed(2) + '</b></span><span>' + esc(T('الإجمالي', 'Total')) + ': <b dir="ltr" id="prTotal">' + money(total()) + ' ' + tm.cur + '</b></span></div>' +
      '<div class="fxnote" id="prFx"></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary" data-a="quote">' + I('download', 'sm') + esc(T('عرض سعر', 'Quote')) + '</button><button class="btn" data-a="invoice">' + I('download', 'sm') + esc(T('فاتورة', 'Invoice')) + '</button></div></div><div id="payHost"></div>';
    wire();
    if (MSA.plus && MSA.plus.payCard) MSA.plus.payCard(p, $('#payHost', box));
  };
  const wire = () => {
    const sv = () => MSA.save();
    $('[data-a=toggle]', box).onclick = () => {
      if (tm.run) { const min = Math.max(1, Math.round((Date.now() - tm.run.start) / 60000)); tm.entries.push({ id: U.uid('e'), date: today(), min, note: $('#tmNote', box).value.trim() || tm.run.note || '' }); tm.run = null; }
      else tm.run = { start: Date.now(), note: $('#tmNote', box).value.trim() };
      sv(); draw();
    };
    $('#tmNote', box).onchange = e => { if (tm.run) { tm.run.note = e.target.value.trim(); sv(); } };
    $('[data-a=addmin]', box).onclick = () => { const m = Math.round(num($('#tmMin', box).value)); if (m < 1) { $('#tmMin', box).focus(); return; } tm.entries.push({ id: U.uid('e'), date: today(), min: m, note: $('#tmMNote', box).value.trim() }); sv(); draw(); };
    $$('[data-del]', box).forEach(b => b.onclick = () => { tm.entries = tm.entries.filter(x => x.id !== b.dataset.del); sv(); draw(); });
    $$('[data-xdel]', box).forEach(b => b.onclick = () => { tm.extras = tm.extras.filter(x => x.id !== b.dataset.xdel); sv(); draw(); });
    $('[data-a=addex]', box).onclick = () => { const n = $('#exName', box).value.trim(), a = num($('#exAmt', box).value); if (!n || !a) return; tm.extras.push({ id: U.uid('x'), name: n, amt: a }); sv(); draw(); };
    const fxLine = () => {
      const el = $('#prFx', box); if (!el) return; const R = MSA.rates;
      if (tm.cur === 'EGP') { el.innerHTML = I('info', 'sm') + '<span>' + esc(T('بالجنيه المصري. اختر عملة أخرى لتحويل المبالغ تلقائيًا بسعر الصرف.', 'In Egyptian pounds. Pick another currency to convert amounts at the current rate.')) + '</span> <button class="btn sm" data-a="fxset">' + esc(T('أسعار العملات', 'Currency rates')) + '</button>'; }
      else if (!R.has(tm.cur)) { el.innerHTML = '<span>' + esc(T('لا يوجد سعر صرف لهذه العملة — أضفه من الإعدادات.', 'No rate for this currency — add one in Settings.')) + '</span> <button class="btn sm" data-a="fxset">' + esc(T('أسعار العملات', 'Currency rates')) + '</button>'; }
      else el.innerHTML = I('info', 'sm') + '<span>≈ <b>' + money(R.toEGP(total(), tm.cur)) + ' EGP</b></span><span>· 1 ' + tm.cur + ' = <b>' + R.fmt(R.perUnit(tm.cur), 4) + ' EGP</b> · ' + esc(R.when()) + '</span><button class="btn sm" data-a="fxset">' + esc(T('أسعار العملات', 'Currency rates')) + '</button>';
      const b = $('[data-a=fxset]', el); if (b) b.onclick = () => { MSA.openSettings(); setTimeout(() => { const f = document.querySelector('[data-sec=fx]'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350); };
    };
    const upd = () => { $('#prTotal', box).textContent = money(total()) + ' ' + tm.cur; fxLine(); if (MSA.plus && MSA.plus.payCard) MSA.plus.payCard(p, $('#payHost', box)); };
    fxLine(); if (MSA.rates.state().auto && MSA.rates.stale()) MSA.rates.ensure().then(() => { if (document.body.contains(box)) fxLine(); });
    $('#prClient', box).oninput = e => { tm.client = e.target.value; p.client = e.target.value.trim(); sv(); };
    $('#prClient', box).onchange = e => { const v = e.target.value.trim(); if (v) { MSA.clients.ensure(v); if (MSA.plus && MSA.plus.autoIdent) MSA.plus.autoIdent(p); } };
    $('#prRate', box).oninput = e => { tm.rate = num(e.target.value); sv(); upd(); };
    $('#prFixed', box).oninput = e => { tm.fixed = num(e.target.value); sv(); upd(); };
    $('#prCur', box).onchange = async e => {
      const from = tm.cur, to = e.target.value, R = MSA.rates, any = tm.rate > 0 || tm.fixed > 0 || tm.extras.length;
      if (any && R.has(from) && R.has(to) && from !== to && await MSA.confirm(T('تحويل سعر الساعة والسعر الثابت والبنود الإضافية من ' + from + ' إلى ' + to + ' بسعر الصرف الحالي؟', 'Convert the hourly rate, fixed price and extra items from ' + from + ' to ' + to + ' at the current rate?'), { okLabel: T('حوّل المبالغ', 'Convert amounts'), cancelLabel: T('غيّر العملة فقط', 'Only change currency') })) {
        const c = v => Math.round(R.convert(v, from, to) * 100) / 100;
        tm.rate = c(tm.rate); tm.fixed = c(tm.fixed); tm.extras.forEach(x => { x.amt = c(x.amt); }); if (MSA.plus) MSA.plus.convertPay(p, c);
      }
      tm.cur = to; sv(); draw();
    };
    $('#prNotes', box).oninput = e => { tm.notes = e.target.value; sv(); };
    $('[data-a=quote]', box).onclick = () => priceDoc(p, 'quote');
    $('[data-a=invoice]', box).onclick = () => priceDoc(p, 'invoice');
  };
  draw();
  clearInterval(tick);
  tick = setInterval(() => { if (!mount(box)) { clearInterval(tick); return; } const d = $('#tmDisp', box); if (d && tm.run) d.textContent = fmtDur((Date.now() - tm.run.start) / 1000); }, 1000);
}
function priceDoc(p, kind){
  const tm = p.time, prof = S().profile, hrs = tm.entries.reduce((a, e) => a + e.min, 0) / 60;
  const rows = []; if (tm.fixed > 0) rows.push([T('رسوم المشروع (سعر ثابت)', 'Project fee (fixed)'), '', '', tm.fixed]); else if (hrs > 0 && tm.rate > 0) rows.push([T('ساعات التصميم / المونتاج', 'Design / editing hours'), hrs.toFixed(2), money(tm.rate), hrs * tm.rate]);
  tm.extras.forEach(e => rows.push([e.name, '', '', e.amt]));
  if (!rows.length) { MSA.toast(T('سجّل وقتًا وسعر ساعة، أو اكتب سعرًا ثابتًا أولًا', 'Log some time and a rate, or enter a fixed price first'), 'err'); return; }
  const total = rows.reduce((a, r) => a + r[3], 0); tm.seq = (tm.seq || 0) + 1; MSA.save();
  const no = (kind === 'quote' ? 'Q-' : 'INV-') + today().replace(/-/g, '') + '-' + tm.seq;
  const acc = (idOf(p).colors[0]) || '#5b8def';
  const body = '<div class="pg"><div class="hd"><div><h1 style="color:' + acc + '">' + esc(kind === 'quote' ? T('عرض سعر', 'Quotation') : T('فاتورة', 'Invoice')) + '</h1><div class="muted" dir="ltr">' + no + ' · ' + today() + '</div></div><div style="text-align:end"><b>' + esc(prof.name || '') + '</b><br><span class="muted">' + esc(prof.title || '') + '<br>' + esc([prof.email, prof.phone].filter(Boolean).join(' · ')) + '</span></div></div>' +
    '<div class="box"><b>' + esc(T('العميل', 'Client')) + ':</b> ' + esc(tm.client || '—') + '<br><b>' + esc(T('المشروع', 'Project')) + ':</b> ' + esc(p.name) + '</div>' +
    '<table><thead><tr><th>' + esc(T('البند', 'Item')) + '</th><th>' + esc(T('الكمية', 'Qty')) + '</th><th>' + esc(T('السعر', 'Rate')) + '</th><th>' + esc(T('المبلغ', 'Amount')) + '</th></tr></thead><tbody>' +
    rows.map(r => '<tr><td>' + esc(r[0]) + '</td><td dir="ltr">' + esc(r[1]) + '</td><td dir="ltr">' + esc(r[2]) + '</td><td dir="ltr">' + money(r[3]) + '</td></tr>').join('') +
    '<tr class="tot"><td colspan="3">' + esc(T('الإجمالي', 'Total')) + '</td><td dir="ltr">' + money(total) + ' ' + tm.cur + '</td></tr>' +
    (tm.cur !== 'EGP' && MSA.rates.has(tm.cur) ? '<tr><td colspan="3">' + esc(T('المعادل بالجنيه المصري', 'Equivalent in Egyptian pounds')) + ' (1 ' + tm.cur + ' = ' + MSA.rates.fmt(MSA.rates.perUnit(tm.cur), 4) + ' EGP · ' + today() + ')</td><td dir="ltr">≈ ' + money(MSA.rates.toEGP(total, tm.cur)) + ' EGP</td></tr>' : '') + '</tbody></table>' +
    (tm.notes ? '<h2>' + esc(T('شروط وملاحظات', 'Terms & notes')) + '</h2><div style="white-space:pre-wrap">' + esc(tm.notes) + '</div>' : '') +
    (kind === 'quote' ? '<p class="muted">' + esc(T('هذا العرض ساري لمدة 14 يومًا من تاريخه.', 'This quotation is valid for 14 days from its date.')) + '</p>' : '') + '</div>';
  MSA.pdf.flow(kind + '-' + slug(p.name) + '-' + tm.seq + '.pdf', body, { css: cssOf(shell('', '', { accent: acc })), dir: en() ? 'ltr' : 'rtl' });
}

/* ---------- publishing calendar ---------- */
const PLATS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'X', 'YouTube', 'Behance', T('أخرى', 'Other')];
const STAT = ['planned', 'ready', 'posted'];
function tPosts(p, box){
  const list = p.posts = p.posts || [];
  const lbl = s => ({ planned: T('مخطَّط', 'Planned'), ready: T('جاهز', 'Ready'), posted: T('اتنشر', 'Posted') })[s];
  const draw = () => {
    const sorted = list.slice().sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    let html = '<div class="card st-card"><div class="st-h">' + I('calendar', 'sm') + '<b>' + esc(T('جدول النشر', 'Publishing schedule')) + '</b></div>' +
      '<div class="st-grid"><div class="field"><label class="f">' + esc(T('التصميم / المنشور', 'Post')) + '</label><input type="text" id="poTitle" dir="auto" list="poList"><datalist id="poList">' + K().posts.map(x => '<option value="' + esc(x[en() ? 1 : 0]) + '">').join('') + '</datalist></div>' +
      '<div class="field"><label class="f">' + esc(T('التاريخ', 'Date')) + '</label><input type="date" id="poDate" value="' + today() + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('الوقت', 'Time')) + '</label><input type="time" id="poTime" value="19:00"></div>' +
      '<div class="field"><label class="f">' + esc(T('المنصة', 'Platform')) + '</label><select id="poPlat">' + PLATS.map(x => '<option>' + esc(x) + '</option>').join('') + '</select></div></div>' +
      '<div class="row"><button class="btn primary" data-a="add">' + I('plus', 'sm') + esc(T('إضافة للجدول', 'Add to schedule')) + '</button><button class="btn" data-a="auto">' + I('sparkles', 'sm') + esc(T('جدولة الـ8 تصاميم تلقائيًا', 'Auto-schedule the 8 designs')) + '</button></div></div>';
    if (!sorted.length) html += MSA.empty('calendar', T('مفيش منشورات مجدولة', 'Nothing scheduled'), T('أضف أول منشور أو خلّي البرنامج يوزّع الـ8 تصاميم على أيام.', 'Add a post, or let the app spread the 8 designs over days.'));
    else { let mon = ''; sorted.forEach(x => { const m = x.date.slice(0, 7); if (m !== mon) { mon = m; html += '<h3 class="st-mon">' + esc(new Date(x.date + 'T12:00').toLocaleDateString(en() ? 'en-GB' : 'ar-EG', { month: 'long', year: 'numeric' })) + '</h3>'; }
      const late = x.status !== 'posted' && (x.date + 'T' + (x.time || '23:59')) < new Date().toISOString().slice(0, 16);
      html += '<div class="card st-row ' + (x.status === 'posted' ? 'dn' : '') + '"><div class="st-date ' + (late ? 'late' : '') + '"><b>' + x.date.slice(8) + '</b><span>' + esc(new Date(x.date + 'T12:00').toLocaleDateString(en() ? 'en-GB' : 'ar-EG', { weekday: 'short' })) + '</span></div>' +
        '<div class="grow"><div dir="auto"><b>' + esc(x.title) + '</b></div><div class="hint"><span class="tag">' + esc(x.platform) + '</span> ' + esc(x.time || '') + (late ? ' · <span style="color:var(--danger)">' + esc(T('فات الميعاد', 'overdue')) + '</span>' : '') + '</div></div>' +
        '<button class="btn sm st-' + x.status + '" data-st="' + x.id + '">' + esc(lbl(x.status)) + '</button>' +
        (x.task ? '' : '<button class="icon-btn sm" data-tk="' + x.id + '" title="' + esc(T('أضف تذكير في المهام', 'Add reminder to Tasks')) + '">' + I('bell', 'sm') + '</button>') +
        '<button class="icon-btn sm danger" data-del="' + x.id + '">' + I('x', 'sm') + '</button></div>'; }); }
    box.innerHTML = html; wire();
  };
  const wire = () => {
    const sv = () => { MSA.save(); draw(); MSA.studio.refreshTabs && MSA.studio.refreshTabs(); };
    $('[data-a=add]', box).onclick = () => { const t = $('#poTitle', box).value.trim(), d = $('#poDate', box).value; if (!t || !d) { $('#poTitle', box).focus(); return; } list.push({ id: U.uid('o'), title: t, date: d, time: $('#poTime', box).value, platform: $('#poPlat', box).value, status: 'planned' }); sv(); };
    $('[data-a=auto]', box).onclick = () => {
      MSA.modal({ title: T('جدولة تلقائية', 'Auto-schedule'), body: '<div class="field"><label class="f">' + esc(T('أول يوم نشر', 'First day')) + '</label><input type="date" id="auD" value="' + today() + '"></div><div class="field"><label class="f">' + esc(T('كل كام يوم؟', 'Every how many days?')) + '</label><input type="number" id="auG" min="1" value="2"></div><div class="field"><label class="f">' + esc(T('المنصة', 'Platform')) + '</label><select id="auP">' + PLATS.map(x => '<option>' + esc(x) + '</option>').join('') + '</select></div>',
        buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('جدولة', 'Schedule'), cls: 'primary', onClick: a => {
          const d0 = $('#auD', a.el).value, gap = Math.max(1, Math.round(num($('#auG', a.el).value))), pl = $('#auP', a.el).value; if (!d0) return;
          K().posts.forEach((x, i) => { const d = new Date(d0 + 'T12:00'); d.setDate(d.getDate() + i * gap); list.push({ id: U.uid('o'), title: x[en() ? 1 : 0], date: U.dateKey(d), time: '19:00', platform: pl, status: 'planned' }); });
          a.close(); sv(); } }] });
    };
    $$('[data-st]', box).forEach(b => b.onclick = () => { const x = list.find(y => y.id === b.dataset.st); x.status = STAT[(STAT.indexOf(x.status) + 1) % 3]; sv(); });
    $$('[data-del]', box).forEach(b => b.onclick = () => { const i = list.findIndex(y => y.id === b.dataset.del); list.splice(i, 1); sv(); });
    $$('[data-tk]', box).forEach(b => b.onclick = () => {
      const x = list.find(y => y.id === b.dataset.tk), when = x.date + 'T' + (x.time || '09:00');
      S().tasks.unshift({ id: U.uid('t'), type: 'task', title: T('نشر: ', 'Publish: ') + x.title + ' (' + x.platform + ')', desc: p.name, status: 'todo', priority: 'normal', start: '', due: when, remind: '60', remindAt: '', repeat: '', tags: [], checklist: [], atts: [], color: '', pinned: false, created: Date.now(), updated: Date.now(), notified: false });
      x.task = true; MSA.updateCounts(); MSA.toast(T('اتضاف تذكير في «مهام وملاحظات» قبل الميعاد بساعة', 'Reminder added to Tasks, one hour before'), 'ok'); sv();
    });
  };
  draw();
}

/* ---------- revisions ---------- */
function tRevs(p, box){
  const revs = p.revs = p.revs || [];
  const allAtts = () => revs.flatMap(r => r.rounds.flatMap(x => x.atts));
  const findList = id => { for (const r of revs) for (const x of r.rounds) if (x.atts.some(a => a.id === id)) return x.atts; return null; };
  const draw = () => {
    let html = '<div class="row" style="margin-bottom:12px"><button class="btn primary" data-a="new">' + I('plus', 'sm') + esc(T('تصميم جديد للمراجعة', 'New design to track')) + '</button><span class="hint">' + esc(T('سجّل ملاحظات العميل لكل نسخة واقفل البنود لما تنفّذها.', 'Log the client’s notes per version and tick them off as you apply them.')) + '</span></div>';
    if (!revs.length) html += MSA.empty('copy', T('لا توجد تعديلات بعد', 'No revisions yet'), T('ضيف تصميم، وبعدين سجّل جولات العميل عليه.', 'Add a design, then log the client’s rounds on it.'));
    revs.forEach(r => {
      const open = r.rounds.filter(x => !x.done).length;
      html += '<div class="card st-card" data-r="' + r.id + '"><div class="st-h"><b dir="auto">' + esc(r.name) + '</b><span class="tag">' + (open ? open + ' ' + esc(T('مفتوحة', 'open')) : esc(T('كله منفّذ', 'all done'))) + '</span><span class="grow"></span>' +
        (r.rounds.filter(x => x.atts.length).length > 1 ? '<button class="btn sm" data-cmp="' + r.id + '">' + I('layers', 'sm') + esc(T('مقارنة', 'Compare')) + '</button>' : '') +
        '<button class="btn sm" data-round="' + r.id + '">' + I('plus', 'sm') + esc(T('جولة جديدة', 'New round')) + '</button><button class="icon-btn sm danger" data-rdel="' + r.id + '">' + I('trash', 'sm') + '</button></div>' +
        r.rounds.map((x, i) => '<div class="round ' + (x.done ? 'dn' : '') + '" data-x="' + x.id + '"><div class="row"><b>V' + (i + 1) + '</b><span class="hint">' + esc(x.date) + '</span><span class="grow"></span><label class="row" style="cursor:pointer"><input type="checkbox" class="cb" data-rd ' + (x.done ? 'checked' : '') + '><span class="hint">' + esc(T('تم التنفيذ', 'Applied')) + '</span></label><button class="icon-btn sm" data-ratt aria-label="attach">' + I('image', 'sm') + '</button><button class="icon-btn sm danger" data-rxd>' + I('x', 'sm') + '</button></div>' +
          '<textarea data-rn dir="auto" rows="2" placeholder="' + esc(T('ملاحظات العميل على هذه النسخة…', 'Client notes on this version…')) + '">' + esc(x.note) + '</textarea>' +
          (x.atts.length ? '<div class="atts">' + x.atts.map(a => MSA.attHTML(a, true)).join('') + '</div>' : '') + '</div>').join('') + '</div>';
    });
    box.innerHTML = html; MSA.hydrateAtts(box); wire();
  };
  const sv = () => { MSA.save(); draw(); };
  const wire = () => {
    $('[data-a=new]', box).onclick = async () => { const n = await MSA.ask({ title: T('اسم التصميم', 'Design name'), placeholder: T('مثال: إعلان الافتتاح', 'e.g. Opening ad') }); if (n) { revs.push({ id: U.uid('r'), name: n, rounds: [{ id: U.uid('x'), date: today(), note: '', done: false, atts: [] }] }); sv(); } };
    $$('[data-round]', box).forEach(b => b.onclick = () => { revs.find(r => r.id === b.dataset.round).rounds.push({ id: U.uid('x'), date: today(), note: '', done: false, atts: [] }); sv(); });
    $$('[data-rdel]', box).forEach(b => b.onclick = async () => { const r = revs.find(x => x.id === b.dataset.rdel); if (!await MSA.confirm(T('حذف «' + r.name + '» وكل جولاته؟', 'Delete “' + r.name + '” and all its rounds?'), { danger: true, okLabel: T('حذف', 'Delete') })) return; await MSA.files.delMany(r.rounds.flatMap(x => x.atts)); revs.splice(revs.indexOf(r), 1); sv(); });
    const roundOf = el => { const rd = el.closest('[data-x]'), rc = el.closest('[data-r]'); const r = revs.find(x => x.id === rc.dataset.r); return { r, x: r.rounds.find(y => y.id === rd.dataset.x) }; };
    $$('[data-rd]', box).forEach(c => c.onchange = () => { roundOf(c).x.done = c.checked; sv(); });
    $$('[data-rn]', box).forEach(t => t.oninput = () => { roundOf(t).x.note = t.value; MSA.save(); });
    $$('[data-ratt]', box).forEach(b => b.onclick = async () => { const { x } = roundOf(b); const a = await MSA.addFiles('image'); if (a.length) { x.atts.push(...a); sv(); } });
    $$('[data-rxd]', box).forEach(b => b.onclick = async () => { const { r, x } = roundOf(b); if (!await MSA.confirm(T('حذف هذه الجولة؟', 'Delete this round?'), { danger: true, okLabel: T('حذف', 'Delete') })) return; await MSA.files.delMany(x.atts); r.rounds.splice(r.rounds.indexOf(x), 1); sv(); });
    $$('[data-cmp]', box).forEach(b => b.onclick = () => compare(revs.find(r => r.id === b.dataset.cmp)));
    if (!box._attBound) { box._attBound = true; MSA.bindAtts(box, findList, async id => { if (!await MSA.confirm(T('حذف الملف؟', 'Delete this file?'), { danger: true, okLabel: T('حذف', 'Delete') })) return; const l = findList(id); if (l) { l.splice(l.findIndex(a => a.id === id), 1); await MSA.files.del(id); sv(); } }); }
  };
  draw();
}
async function compare(r){
  const rounds = r.rounds.map((x, i) => ({ i, a: x.atts.find(a => a.kind === 'image') })).filter(x => x.a);
  const m = MSA.modal({ title: T('مقارنة النسخ — ', 'Compare versions — ') + r.name, size: 'wide', footer: false, body: '<div class="row" style="margin-bottom:10px"><select id="cmA" style="width:auto">' + rounds.map(x => '<option value="' + x.i + '">V' + (x.i + 1) + '</option>').join('') + '</select><span>⇄</span><select id="cmB" style="width:auto">' + rounds.map(x => '<option value="' + x.i + '">V' + (x.i + 1) + '</option>').join('') + '</select></div><div class="cmp" id="cmBox"></div><input type="range" id="cmR" min="0" max="100" value="50" style="width:100%;margin-top:10px">' });
  $('#cmB', m.el).selectedIndex = rounds.length - 1;
  const show = async () => {
    const a = rounds.find(x => x.i == $('#cmA', m.el).value).a, b = rounds.find(x => x.i == $('#cmB', m.el).value).a;
    const ua = await MSA.files.url(a.id), ub = await MSA.files.url(b.id);
    $('#cmBox', m.el).innerHTML = '<img src="' + ua + '" alt=""><img class="top" id="cmTop" src="' + ub + '" alt="">'; set();
  };
  const set = () => { const t = $('#cmTop', m.el); if (t) t.style.clipPath = 'inset(0 0 0 ' + $('#cmR', m.el).value + '%)'; };
  $('#cmA', m.el).onchange = show; $('#cmB', m.el).onchange = show; $('#cmR', m.el).oninput = set; show();
}

/* ---------- delivery ---------- */
const CHECKS = [
  ['الأبعاد مطابقة لكل منصة (1080×1350 / 1080×1920 …)', 'Sizes match each platform (1080×1350 / 1080×1920 …)'], ['وضع الألوان صحيح: RGB للشاشة / CMYK للطباعة', 'Colour mode correct: RGB for screen / CMYK for print'],
  ['الخطوط محوّلة Outlines أو مرفقة', 'Fonts outlined or packaged'], ['الـ Bleed وعلامات القص للمطبوعات', 'Bleed and crop marks for print'], ['دقة الصور مناسبة (300dpi للطباعة)', 'Image resolution fits (300 dpi for print)'],
  ['مراجعة الإملاء والأرقام وأرقام التواصل', 'Spelling, numbers and contact details proofread'], ['أسماء الملفات منظمة وواضحة', 'File names are tidy and clear'], ['نسخ المصدر (PSD / AI / Project) محفوظة', 'Source files (PSD / AI / project) saved'],
  ['نسخ التسليم جاهزة (PNG / JPG / PDF / MP4)', 'Delivery formats ready (PNG / JPG / PDF / MP4)'], ['اعتماد العميل النهائي مكتوب', 'Final client approval in writing']
];
function tDelivery(p, box){
  if (!p.delivery) p.delivery = { items: CHECKS.map(c => ({ id: U.uid('d'), text: T(c[0], c[1]), done: false })) };
  const d = p.delivery, st = () => { const n = d.items.filter(x => x.done).length; return { n, pct: d.items.length ? Math.round(n / d.items.length * 100) : 0 }; };
  const stepsWith = []; P().walk(p.steps, s => { const n = s.atts.filter(a => a.kind === 'image').length; if (n) stepsWith.push([s, n]); });
  const draw = () => {
    const g = st();
    box.innerHTML = '<div class="card st-card"><div class="st-h">' + I('check-c', 'sm') + '<b>' + esc(T('قائمة تجهيز التسليم', 'Delivery checklist')) + '</b><span class="grow"></span><span class="tag" ' + (g.pct === 100 ? 'style="background:var(--ok);color:#fff"' : '') + '>' + (g.pct === 100 ? esc(T('جاهز للتسليم ✓', 'Ready to deliver ✓')) : g.n + '/' + d.items.length) + '</span></div><div class="progress" style="margin-bottom:10px"><i style="width:' + g.pct + '%"></i></div>' +
      d.items.map(x => '<div class="chk ' + (x.done ? 'dn' : '') + '"><label class="row grow" style="cursor:pointer"><input type="checkbox" class="cb" data-ck="' + x.id + '" ' + (x.done ? 'checked' : '') + '><span dir="auto">' + esc(x.text) + '</span></label><button class="icon-btn sm danger" data-dd="' + x.id + '">' + I('x', 'sm') + '</button></div>').join('') +
      '<div class="row" style="margin-top:8px"><input type="text" id="dkNew" dir="auto" class="grow" placeholder="' + esc(T('بند جديد…', 'New item…')) + '"><button class="btn sm" data-a="add">' + I('plus', 'sm') + '</button></div></div>' +
      '<div class="card st-card"><div class="st-h">' + I('play', 'sm') + '<b>' + esc(T('ملف عرض للعميل', 'Client presentation file')) + '</b></div><div class="hint" style="margin-bottom:8px">' + esc(T('ملف PDF بمقاس A4 أفقي فيه التصميمات اللي تختارها (صفحة لكل تصميم)؛ تبعته للعميل يفتحه على أي جهاز (من غير تعليقات مباشرة — العميل يرد عليك برسالة).', 'One A4 landscape PDF with the designs you pick on an elegant backdrop; send it to the client to open on any device. There is no live commenting — the client replies by message.')) + '</div>' +
      (stepsWith.length ? stepsWith.map(([s, n]) => '<label class="row" style="cursor:pointer;margin-bottom:4px"><input type="checkbox" class="cb" data-ps="' + s.id + '" checked><span>' + esc(P().title(s)) + '</span><span class="hint">(' + n + ')</span></label>').join('') + '<div style="margin-top:10px"><button class="btn primary" data-a="pres">' + I('download', 'sm') + esc(T('إنشاء ملف العرض', 'Create presentation')) + '</button></div>' : '<div class="hint">' + esc(T('أرفق صور التصميمات في خطوات الخطة أولًا.', 'Attach design images to the plan steps first.')) + '</div>') + '</div>';
    wire();
  };
  const wire = () => {
    $$('[data-ck]', box).forEach(c => c.onchange = () => { d.items.find(x => x.id === c.dataset.ck).done = c.checked; MSA.save(); draw(); MSA.studio.refreshTabs && MSA.studio.refreshTabs(); });
    $$('[data-dd]', box).forEach(b => b.onclick = () => { d.items = d.items.filter(x => x.id !== b.dataset.dd); MSA.save(); draw(); });
    $('[data-a=add]', box).onclick = () => { const v = $('#dkNew', box).value.trim(); if (!v) return; d.items.push({ id: U.uid('d'), text: v, done: false }); MSA.save(); draw(); };
    $('#dkNew', box).onkeydown = e => { if (e.key === 'Enter') $('[data-a=add]', box).click(); };
    const pb = $('[data-a=pres]', box); if (pb) pb.onclick = async () => {
      const ids = $$('[data-ps]:checked', box).map(c => c.dataset.ps); pb.disabled = true; MSA.toast(T('جاري تجهيز الصور…', 'Preparing images…'));
      const slides = []; for (const [s] of stepsWith) { if (!ids.includes(s.id)) continue; for (const a of s.atts.filter(x => x.kind === 'image')) { const u = await imgData(a, 1800); if (u) slides.push({ t: P().title(s), u }); } }
      pb.disabled = false; if (!slides.length) return;
      const acc = idOf(p).colors.find(c => lum(c) > .22) || '#e8d5b0', prof = S().profile;
      const pgs = ['<div style="height:100%;background:#161616;color:#f2f2f0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:40px"><div style="font-size:60px;font-weight:700;color:' + acc + '">' + esc(brandName(p)) + '</div><div style="font-size:24px;opacity:.8">' + esc(p.name) + '</div><div style="font-size:16px;opacity:.6">' + esc(prof.name || '') + ' · ' + esc(prof.title || '') + '</div></div>']
        .concat(slides.map(s => '<div style="height:100%;background:#161616;color:#f2f2f0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:36px"><img src="' + s.u + '" alt="" style="max-width:1040px;max-height:610px;object-fit:contain;border-radius:8px"><div style="font-size:20px;opacity:.85">' + esc(s.t) + '</div></div>'));
      MSA.pdf.pages('presentation-' + slug(p.name) + '.pdf', pgs, { landscape: true, dir: en() ? 'ltr' : 'rtl' });
    };
  };
  draw();
}

/* =====================================================================
   LEARNING TABS
   ===================================================================== */
const LTABS = [['videos', 'play', 'الفيديوهات', 'Videos'], ['refs', 'image', 'المراجع', 'References'], ['trends', 'sparkles', 'الترندات', 'Trends'], ['plan', 'check-c', 'خطة التعلم', 'Learning plan']];
MSA.studio.LTABS = LTABS;
MSA.studio.learnTabBar = cur => '<div class="tabs-scroll stab">' + LTABS.map(x => '<button class="ttab ' + (x[0] === cur ? 'on' : '') + '" data-lt="' + x[0] + '">' + I(x[1], 'sm') + esc(T(x[2], x[3])) + '</button>').join('') + '</div>';
MSA.studio.renderLearn = function(tab, box){ ({ refs: b => MSA.refsView(b), trends: lTrends, plan: lPlan })[tab](box); };
const rootEl = box => box;

/* ---------- references (moodboard) ---------- */
let refTag = '', refQ = '';
function lRefs(box){
  const refs = S().refs = S().refs || [];
  const all = new Set(); refs.forEach(r => (r.tags || []).forEach(t => all.add(t)));
  const shown = refs.filter(r => (!refTag || (r.tags || []).includes(refTag)) && (!refQ || (r.title + ' ' + (r.tags || []).join(' ') + ' ' + (r.url || '')).toLowerCase().includes(refQ.toLowerCase())));
  const dom = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  const listAtt = id => refs.filter(r => r.att).map(r => r.att);
  box.innerHTML = '<div class="toolbar"><button class="btn primary" data-a="img">' + I('image', 'sm') + esc(T('إضافة صور', 'Add images')) + '</button><button class="btn" data-a="link">' + I('link', 'sm') + esc(T('إضافة رابط', 'Add link')) + '</button><div class="grow" style="min-width:140px"><input type="search" id="rfQ" value="' + esc(refQ) + '" placeholder="' + esc(T('بحث في المراجع…', 'Search references…')) + '"></div></div>' +
    (all.size ? '<div class="pchips" style="margin:10px 0"><button class="pchip ' + (!refTag ? 'on' : '') + '" data-tag="">' + esc(T('الكل', 'All')) + '</button>' + [...all].map(t => '<button class="pchip ' + (refTag === t ? 'on' : '') + '" data-tag="' + esc(t) + '">#' + esc(t) + '</button>').join('') + '</div>' : '') +
    (shown.length ? '<div class="ref-grid">' + shown.map(r => '<div class="card ref" data-id="' + r.id + '">' + (r.att ? MSA.attHTML(r.att, false) : '<a class="ref-link" data-open="' + esc(r.url) + '">' + MSA.conn.logo({ id: '', name: dom(r.url), url: r.url }) + '<span dir="ltr">' + esc(dom(r.url)) + '</span></a>') +
      '<div class="ref-b"><b dir="auto">' + esc(r.title || (r.att ? r.att.name : dom(r.url))) + '</b><div class="tags">' + (r.tags || []).map(t => '<span class="tag">#' + esc(t) + '</span>').join('') + '</div></div><div class="ref-a"><button class="icon-btn sm" data-ed="' + r.id + '">' + I('pencil', 'sm') + '</button><button class="icon-btn sm danger" data-rm="' + r.id + '">' + I('trash', 'sm') + '</button></div></div>').join('') + '</div>'
      : MSA.empty('image', refs.length ? T('مفيش نتائج', 'No matches') : T('مكتبة المراجع فاضية', 'Your reference library is empty'), refs.length ? '' : T('احفظ صور وروابط من Behance وPinterest وغيرها، ووسمها لتلاقيها بسرعة.', 'Save images and links from Behance, Pinterest and more, and tag them to find them fast.')));
  MSA.hydrateAtts(box);
  const redraw = () => lRefs(box);
  const parseTags = s => s.split(/[,،#\s]+/).map(x => x.trim()).filter(Boolean).slice(0, 8);
  const form = (r, done) => MSA.modal({ title: r.id ? T('تعديل المرجع', 'Edit reference') : T('إضافة رابط', 'Add link'),
    body: '<div class="field"><label class="f">' + esc(T('العنوان', 'Title')) + '</label><input type="text" id="rfT" dir="auto" value="' + esc(r.title || '') + '"></div>' + (r.att ? '' : '<div class="field"><label class="f">URL</label><input type="url" id="rfU" dir="ltr" placeholder="https://" value="' + esc(r.url || '') + '"></div>') +
      '<div class="field"><label class="f">' + esc(T('وسوم (مفصولة بمسافة أو فاصلة)', 'Tags (space or comma separated)')) + '</label><input type="text" id="rfG" dir="auto" value="' + esc((r.tags || []).join(' ')) + '"></div>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('حفظ', 'Save'), cls: 'primary', onClick: a => {
      const u = $('#rfU', a.el); let url = u ? u.value.trim() : r.url; if (!r.att && !url) { u.focus(); return; } if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
      done({ title: $('#rfT', a.el).value.trim(), url, tags: parseTags($('#rfG', a.el).value) }); a.close(); } }] });
  $('[data-a=img]', box).onclick = async () => { const a = await MSA.addFiles('image'); if (!a.length) return; a.forEach(x => refs.unshift({ id: U.uid('rf'), att: x, title: '', tags: refTag ? [refTag] : [], created: Date.now() })); MSA.save(); redraw(); };
  $('[data-a=link]', box).onclick = () => form({}, v => { refs.unshift(Object.assign({ id: U.uid('rf'), created: Date.now() }, v)); MSA.save(); redraw(); });
  $$('[data-ed]', box).forEach(b => b.onclick = () => { const r = refs.find(x => x.id === b.dataset.ed); form(r, v => { Object.assign(r, v); MSA.save(); redraw(); }); });
  $$('[data-rm]', box).forEach(b => b.onclick = async () => { const r = refs.find(x => x.id === b.dataset.rm); if (!await MSA.confirm(T('حذف هذا المرجع؟', 'Delete this reference?'), { danger: true, okLabel: T('حذف', 'Delete') })) return; if (r.att) await MSA.files.del(r.att.id); refs.splice(refs.indexOf(r), 1); MSA.save(); redraw(); });
  $$('[data-tag]', box).forEach(b => b.onclick = () => { refTag = b.dataset.tag; redraw(); });
  $('#rfQ', box).oninput = e => { refQ = e.target.value; clearTimeout(box._q); box._q = setTimeout(() => { redraw(); const i = $('#rfQ', box); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
  if (!box._refBound) { box._refBound = true; MSA.bindAtts(box, listAtt, () => {}); }
}

/* ---------- trends ---------- */
const SRC = [
  ['Pantone — Color of the Year', 'pantone.com', 'https://www.pantone.com/color-of-the-year', '#1a1a1a'], ['Pinterest Trends', 'trends.pinterest.com', 'https://trends.pinterest.com/', '#e60023'],
  ['Dribbble — Popular', 'dribbble.com', 'https://dribbble.com/shots/popular', '#ea4c89'], ['Behance — Discover', 'behance.net', 'https://www.behance.net/', '#1769ff'],
  ['Coolors — Trending palettes', 'coolors.co', 'https://coolors.co/palettes/trending', '#0066ff'], ['Google Fonts — Trending', 'fonts.google.com', 'https://fonts.google.com/?sort=popularity', '#4285f4'],
  ['Awwwards', 'awwwards.com', 'https://www.awwwards.com/', '#222222'], ['Canva — Design school', 'canva.com', 'https://www.canva.com/designschool/', '#00c4cc'],
  ['YouTube — Design trends', 'youtube.com', 'https://www.youtube.com/results?search_query=graphic+design+trends', '#ff0000'], ['Adobe — Blog', 'blog.adobe.com', 'https://blog.adobe.com/', '#fa0f00']
];
const NTAGS = [['لون', 'Colour'], ['خط', 'Type'], ['ستايل', 'Style'], ['أداة', 'Tool'], ['مونتاج', 'Video']];
function lTrends(box){
  const notes = S().trendNotes = S().trendNotes || [];
  box.innerHTML = '<div class="card st-card"><div class="st-h">' + I('sparkles', 'sm') + '<b>' + esc(T('مصادر الترندات', 'Trend sources')) + '</b></div><div class="hint" style="margin-bottom:8px">' + esc(T('روابط لأشهر مصادر الاتجاهات. افتحها مرة في الأسبوع وسجّل اللي لفت نظرك تحت. (البرنامج مش بيسحب أخبار تلقائيًا.)', 'Links to the main trend sources. Open them once a week and log what caught your eye below. (The app does not pull news automatically.)')) + '</div>' +
    '<div class="chips">' + SRC.map(s => '<button class="cchip" data-open="' + s[2] + '" style="--c:' + s[3] + '">' + MSA.conn.logo({ id: '', name: s[0], url: 'https://' + s[1], c: s[3] }) + esc(s[0]) + I('external', 'xs') + '</button>').join('') + '</div></div>' +
    '<div class="card st-card"><div class="st-h">' + I('pencil', 'sm') + '<b>' + esc(T('ملاحظات الأسبوع', 'This week’s notes')) + '</b></div><div class="row"><select id="tnTag" style="width:auto">' + NTAGS.map(x => '<option value="' + x[1] + '">' + esc(T(x[0], x[1])) + '</option>').join('') + '</select><input type="text" id="tnText" dir="auto" class="grow" placeholder="' + esc(T('لاحظت إيه؟ مثال: ألوان إيرثي دافئة رايجة', 'What did you notice? e.g. warm earthy palettes are trending')) + '"><button class="btn sm primary" data-a="add">' + I('plus', 'sm') + '</button></div>' +
    (notes.length ? '<div style="margin-top:10px">' + notes.map(n => '<div class="chk"><span class="tag">' + esc(NTAGS.find(x => x[1] === n.tag) ? T(NTAGS.find(x => x[1] === n.tag)[0], n.tag) : n.tag) + '</span><span class="grow" dir="auto">' + esc(n.text) + '</span><span class="hint">' + esc(n.date) + '</span><button class="icon-btn sm danger" data-d="' + n.id + '">' + I('x', 'sm') + '</button></div>').join('') + '</div>' : '') + '</div>';
  const add = () => { const v = $('#tnText', box).value.trim(); if (!v) return; notes.unshift({ id: U.uid('n'), tag: $('#tnTag', box).value, text: v, date: today() }); MSA.save(); lTrends(box); };
  $('[data-a=add]', box).onclick = add; $('#tnText', box).onkeydown = e => { if (e.key === 'Enter') add(); };
  $$('[data-d]', box).forEach(b => b.onclick = () => { S().trendNotes = notes.filter(n => n.id !== b.dataset.d); MSA.save(); lTrends(box); });
}

/* ---------- learning plan ---------- */
const IDEAS = [['Photoshop — الأدوات الذكية', 'Photoshop — AI tools'], ['Illustrator — تحويل لفيكتور', 'Illustrator — vectorizing'], ['After Effects — Expressions', 'After Effects — Expressions'], ['Premiere — المونتاج السريع', 'Premiere — fast editing'], ['DaVinci Resolve — تلوين', 'DaVinci Resolve — colour grading'], ['Figma — Auto Layout', 'Figma — Auto Layout'], ['كتابة Prompts للصور', 'Writing image prompts'], ['حركة الجرافيك للسوشيال', 'Motion graphics for social']];
function lPlan(box){
  const plan = S().learnPlan = S().learnPlan || [];
  const open = plan.filter(x => !x.done), done = plan.filter(x => x.done);
  const row = x => '<div class="chk ' + (x.done ? 'dn' : '') + '"><label class="row grow" style="cursor:pointer"><input type="checkbox" class="cb" data-ck="' + x.id + '" ' + (x.done ? 'checked' : '') + '><span dir="auto">' + esc(x.title) + '</span></label>' + (x.due ? '<span class="hint">' + esc(x.due) + '</span>' : '') +
    '<button class="icon-btn sm" data-yt="' + x.id + '" title="YouTube">' + I('play', 'sm') + '</button><button class="icon-btn sm danger" data-d="' + x.id + '">' + I('x', 'sm') + '</button></div>';
  const weekEnd = () => { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7); return U.dateKey(d); };
  box.innerHTML = '<div class="card st-card"><div class="st-h">' + I('check-c', 'sm') + '<b>' + esc(T('خطة التعلم', 'Learning plan')) + '</b><span class="grow"></span><span class="tag">' + done.length + '/' + plan.length + '</span></div>' +
    '<div class="row" style="margin-bottom:8px"><input type="text" id="lpT" dir="auto" class="grow" placeholder="' + esc(T('هتتعلم إيه؟ (أداة أو مهارة)', 'What will you learn? (tool or skill)')) + '"><input type="date" id="lpD" style="width:auto" value="' + weekEnd() + '"><button class="btn sm primary" data-a="add">' + I('plus', 'sm') + '</button></div>' +
    '<div class="chips" style="margin-bottom:10px">' + IDEAS.map((x, i) => '<button class="pchip" data-idea="' + i + '">+ ' + esc(T(x[0], x[1])) + '</button>').join('') + '</div>' +
    (open.length ? open.sort((a, b) => (a.due || 'z').localeCompare(b.due || 'z')).map(row).join('') : '<div class="hint">' + esc(T('مفيش حاجة مفتوحة — ضيف هدف الأسبوع.', 'Nothing open — add this week’s goal.')) + '</div>') +
    (done.length ? '<h3 class="st-mon">' + esc(T('اتعلّمت', 'Learned')) + '</h3>' + done.map(row).join('') : '') + '</div>';
  const add = (title, due) => { if (!title) return; plan.push({ id: U.uid('lp'), title, due: due || '', done: false }); MSA.save(); lPlan(box); };
  $('[data-a=add]', box).onclick = () => add($('#lpT', box).value.trim(), $('#lpD', box).value); $('#lpT', box).onkeydown = e => { if (e.key === 'Enter') $('[data-a=add]', box).click(); };
  $$('[data-idea]', box).forEach(b => b.onclick = () => add(T(IDEAS[b.dataset.idea][0], IDEAS[b.dataset.idea][1]), $('#lpD', box).value));
  $$('[data-ck]', box).forEach(c => c.onchange = () => { plan.find(x => x.id === c.dataset.ck).done = c.checked; MSA.save(); lPlan(box); });
  $$('[data-d]', box).forEach(b => b.onclick = () => { S().learnPlan = plan.filter(x => x.id !== b.dataset.d); MSA.save(); lPlan(box); });
  $$('[data-yt]', box).forEach(b => b.onclick = () => MSA.openLink('https://www.youtube.com/results?search_query=' + encodeURIComponent(plan.find(x => x.id === b.dataset.yt).title + ' tutorial')));
}
})();

