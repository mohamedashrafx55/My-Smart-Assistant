/* Business identity, price list (3 client tiers with market ranges) and quotes / invoices as branded PDFs.
   Lives inside the Money view as tabs: dues · price list · quotes & invoices · client profitability. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc, S = () => MSA.state;
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : 0; };
const fmt = n => { n = Math.round(num(n) * 100) / 100; return n.toLocaleString('en-US', { maximumFractionDigits: 2 }); };
const today = () => U.dateKey(new Date());
const P = MSA.pricing = {};

/* ---------------- business identity ---------------- */
P.biz = () => {
  const s = S(), b = s.biz = s.biz || {};
  if (!b.v) { Object.assign(b, { v: 1, name: '', tagline: '', logo: '', phone: '', email: '', wa: '', city: '', pay: '', terms: '', accent: '', valid: 14, deposit: 50, tax: 0 }, b); b.seq = b.seq || { quote: 0, invoice: 0 }; }
  b.seq = b.seq || { quote: 0, invoice: 0 };
  return b;
};
const bizName = () => P.biz().name || (S().profile.name || '');

function shrinkImage(file, max){
  return new Promise((res, rej) => {
    const fr = new FileReader(); fr.onerror = rej;
    fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)), w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
      res(c.toDataURL('image/png')); }; im.src = fr.result; };
    fr.readAsDataURL(file);
  });
}
P.identityModal = function(done){
  const b = P.biz(), prof = S().profile;
  const m = MSA.modal({
    title: T('هويتي التجارية (للعروض والفواتير)', 'My business identity (quotes & invoices)'), size: 'wide',
    body: '<div class="bz-logo"><div class="bz-pv" id="bzPv">' + (b.logo ? '<img src="' + b.logo + '" alt="">' : I('image')) + '</div><div class="grow"><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" id="bzUp">' + I('upload', 'sm') + esc(T('رفع اللوجو', 'Upload logo')) + '</button><button class="btn sm ghost" id="bzRm"' + (b.logo ? '' : ' hidden') + '>' + esc(T('حذف اللوجو', 'Remove')) + '</button></div><div class="hint" style="margin-top:6px">' + esc(T('PNG بخلفية شفافة أفضل. بيظهر أعلى كل عرض سعر وفاتورة.', 'A transparent PNG works best. Shown on top of every quote and invoice.')) + '</div><input type="file" id="bzFile" accept="image/*" hidden></div></div>' +
      '<div class="grid2"><div class="field"><label class="f">' + esc(T('الاسم التجاري', 'Business name')) + '</label><input id="bzName" dir="auto" value="' + esc(b.name || prof.name || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('الوصف تحت الاسم', 'Tagline')) + '</label><input id="bzTag" dir="auto" value="' + esc(b.tagline || prof.title || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('الهاتف', 'Phone')) + '</label><input id="bzPh" dir="ltr" value="' + esc(b.phone || prof.phone || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('الإيميل', 'Email')) + '</label><input id="bzMail" dir="ltr" value="' + esc(b.email || prof.email || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('المدينة / الدولة', 'City / country')) + '</label><input id="bzCity" dir="auto" value="' + esc(b.city || prof.location || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('لون المستند', 'Document colour')) + '</label><input type="color" id="bzAcc" value="' + (b.accent || '#5b8def') + '" style="height:42px;padding:2px"></div></div>' +
      '<div class="field"><label class="f">' + esc(T('بيانات الدفع (تظهر في الفاتورة)', 'Payment details (shown on invoices)')) + '</label><textarea id="bzPay" rows="3" dir="auto" placeholder="' + esc(T('مثال: فودافون كاش 010xxxxxxxx — إنستا باي — حساب بنكي…', 'e.g. Vodafone Cash, InstaPay, bank account…')) + '">' + esc(b.pay || '') + '</textarea></div>' +
      '<div class="field"><label class="f">' + esc(T('الشروط الافتراضية', 'Default terms')) + '</label><textarea id="bzTerms" rows="3" dir="auto" placeholder="' + esc(T('مثال: دفعة مقدمة 50% والباقي عند التسليم. عدد التعديلات المتضمنة: 3.', 'e.g. 50% upfront, the rest on delivery. Includes 3 revisions.')) + '">' + esc(b.terms || '') + '</textarea></div>' +
      '<div class="grid2"><div class="field"><label class="f">' + esc(T('صلاحية العرض (أيام)', 'Quote validity (days)')) + '</label><input type="number" id="bzValid" min="1" value="' + (b.valid || 14) + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('الدفعة المقدمة الافتراضية %', 'Default deposit %')) + '</label><input type="number" id="bzDep" min="0" max="100" value="' + (b.deposit == null ? 50 : b.deposit) + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('ضريبة افتراضية % (0 = بدون)', 'Default tax % (0 = none)')) + '</label><input type="number" id="bzTax" min="0" max="100" value="' + (b.tax || 0) + '"></div></div>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('حفظ', 'Save'), cls: 'primary', onClick: a => {
      const g = id => $('#' + id, a.el).value.trim();
      Object.assign(b, { name: g('bzName'), tagline: g('bzTag'), phone: g('bzPh'), email: g('bzMail'), city: g('bzCity'), accent: $('#bzAcc', a.el).value, pay: $('#bzPay', a.el).value.trim(), terms: $('#bzTerms', a.el).value.trim(), valid: Math.max(1, num(g('bzValid')) || 14), deposit: Math.max(0, Math.min(100, num(g('bzDep')))), tax: Math.max(0, Math.min(100, num(g('bzTax')))) });
      MSA.save(); a.close(); MSA.toast(T('اتحفظت هويتك التجارية', 'Business identity saved'), 'ok'); done && done();
    } }],
    onMount: el => {
      const f = $('#bzFile', el), pv = $('#bzPv', el), rm = $('#bzRm', el);
      $('#bzUp', el).onclick = () => f.click();
      f.onchange = async () => { const x = f.files[0]; if (!x) return; try { b.logo = await shrinkImage(x, 420); pv.innerHTML = '<img src="' + b.logo + '" alt="">'; rm.hidden = false; MSA.save(); } catch (e) { MSA.toast(T('تعذّر قراءة الصورة', 'Could not read the image'), 'err'); } };
      rm.onclick = () => { b.logo = ''; pv.innerHTML = I('image'); rm.hidden = true; MSA.save(); };
    }
  });
};

/* ---------------- price list ---------------- */
const TIERS = () => [['basic', T('عميل بسيط', 'Small client'), T('محل، تاجر، نشاط صغير', 'Shop, trader, small business')],
  ['mid', T('عميل متوسط', 'Mid client'), T('سوبر ماركت، ميني ماركت، مكاتب عمل', 'Supermarket, mini-market, offices')],
  ['pro', T('عميل محترف', 'Premium client'), T('شركات كبيرة ودولية', 'Large & international companies')]];
const CATS = () => [['design', T('تصميم', 'Design')], ['video', T('فيديو', 'Video')], ['other', T('أخرى', 'Other')]];
/* [category, name, unit/note, basic EGP, mid EGP, pro USD] — estimates, meant to be edited */
const SEED = [
  ['design', 'لوجو', '3 مفاهيم + ملفات نهائية', [800, 2000], [2500, 6000], [300, 1000]],
  ['design', 'هوية بصرية كاملة', 'لوجو + ألوان وخطوط + دليل استخدام', [2500, 6000], [7000, 18000], [1000, 4000]],
  ['design', 'تصميم سوشيال ميديا', 'التصميم الواحد', [80, 200], [200, 500], [25, 80]],
  ['design', 'باقة سوشيال شهرية', '12 تصميم في الشهر', [1200, 2500], [3000, 7000], [400, 1200]],
  ['design', 'بوستر / فلاير / إعلان مطبوع', 'تصميم واحد', [200, 600], [600, 1800], [80, 300]],
  ['design', 'منيو / بروشور', 'صفحتين إلى 4', [600, 1500], [1500, 4000], [250, 800]],
  ['design', 'بروفايل شركة', '10–20 صفحة', [2000, 4500], [5000, 12000], [600, 2500]],
  ['design', 'لافتة / بانر / رول أب', 'التصميم الواحد', [250, 700], [700, 2000], [100, 400]],
  ['design', 'تصميم عبوة (Packaging)', 'منتج واحد', [1500, 3500], [4000, 10000], [500, 2000]],
  ['video', 'مونتاج ريل / شورت', 'حتى 60 ثانية', [150, 400], [400, 900], [60, 200]],
  ['video', 'مونتاج فيديو يوتيوب', 'حتى 10 دقائق', [400, 1000], [1000, 2500], [150, 500]],
  ['video', 'مونتاج إعلان / فيديو تعريفي', '1–2 دقيقة', [600, 1500], [1800, 4500], [250, 900]],
  ['video', 'إعلان موشن جرافيك', '30 ثانية', [1500, 3500], [4000, 10000], [500, 2500]],
  ['video', 'باقة فيديوهات شهرية', '8 ريلز في الشهر', [1000, 2500], [2800, 6500], [350, 1200]],
  ['other', 'سعر الساعة (شغل مفتوح)', 'للساعة', [80, 150], [150, 300], [16, 35]],
  ['other', 'جولة تعديلات إضافية', 'للجولة', [100, 300], [300, 800], [40, 150]],
  ['other', 'تسليم مستعجل', 'زيادة على سعر الخدمة (30–50%)', [100, 400], [400, 1200], [50, 250]]
];
P.prices = () => {
  const s = S(), p = s.prices = s.prices || {};
  if (!p.items) { p.v = 1; p.cur = { basic: 'EGP', mid: 'EGP', pro: 'USD' }; p.stamp = today(); p.items = SEED.map(x => ({ id: U.uid('pr'), cat: x[0], name: x[1], note: x[2], r: { basic: x[3].slice(), mid: x[4].slice(), pro: x[5].slice() } })); }
  p.cur = p.cur || { basic: 'EGP', mid: 'EGP', pro: 'USD' };
  return p;
};
const mid = r => { const v = (num(r[0]) + num(r[1])) / 2; return v >= 1000 ? Math.round(v / 50) * 50 : v >= 100 ? Math.round(v / 10) * 10 : Math.round(v); };
P.suggest = (item, tier) => { const r = item.r && item.r[tier]; return r ? mid(r) : 0; };

P.renderPrices = function(host){
  const pr = P.prices(), tiers = TIERS(), q = (S().ui.priceQ || '').toLowerCase();
  const rows = pr.items.filter(x => !q || (x.name + ' ' + (x.note || '')).toLowerCase().includes(q));
  const cell = (x, t) => '<td class="pl-r"><div class="pl-pair"><input type="number" min="0" data-pi="' + x.id + '" data-t="' + t[0] + '" data-k="0" value="' + (x.r[t[0]][0] || '') + '" aria-label="min"><span>–</span><input type="number" min="0" data-pi="' + x.id + '" data-t="' + t[0] + '" data-k="1" value="' + (x.r[t[0]][1] || '') + '" aria-label="max"></div></td>';
  host.innerHTML = '<div class="pl"><div class="pl-head"><div><b>' + esc(T('قائمة أسعاري', 'My price list')) + '</b><div class="hint">' + esc(T('نطاقات تقديرية لسوق مصر (آخر مراجعة ' + pr.stamp + '). راجعها وعدّلها حسب خبرتك — بالنسبة لشركات كبيرة الأسعار بالدولار.', 'Estimated Egyptian-market ranges (last reviewed ' + pr.stamp + '). Review and edit them — premium clients are priced in USD.')) + '</div></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-pa="ident">' + I('user', 'sm') + esc(T('هويتي التجارية', 'My identity')) + '</button><button class="btn sm primary" data-pa="doc">' + I('file', 'sm') + esc(T('عرض سعر / فاتورة', 'New quote / invoice')) + '</button></div></div>' +
    '<div class="pl-tiers">' + tiers.map(t => '<div class="pl-tier"><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span><select data-cur="' + t[0] + '">' + ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP'].map(c => '<option' + (pr.cur[t[0]] === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></div>').join('') + '</div>' +
    '<div class="row" style="gap:8px;margin:10px 0"><div class="cs-search grow">' + I('search', 'sm') + '<input type="search" id="plQ" dir="auto" placeholder="' + esc(T('ابحث عن خدمة…', 'Search a service…')) + '" value="' + esc(S().ui.priceQ || '') + '"></div><button class="btn sm" data-pa="add">' + I('plus', 'sm') + esc(T('خدمة جديدة', 'New service')) + '</button></div>' +
    '<div class="pl-wrap"><table class="pl-tbl"><thead><tr><th>' + esc(T('الخدمة', 'Service')) + '</th>' + tiers.map(t => '<th>' + esc(t[1]) + ' <i>(' + pr.cur[t[0]] + ')</i></th>').join('') + '<th></th></tr></thead><tbody>' +
    CATS().map(c => { const list = rows.filter(x => x.cat === c[0]); return list.length ? '<tr class="pl-cat"><td colspan="5">' + esc(c[1]) + '</td></tr>' + list.map(x => '<tr data-id="' + x.id + '"><td><input class="pl-n" data-pf="name" data-pi="' + x.id + '" dir="auto" value="' + esc(x.name) + '"><input class="pl-o" data-pf="note" data-pi="' + x.id + '" dir="auto" value="' + esc(x.note || '') + '" placeholder="' + esc(T('وحدة / ملاحظة', 'Unit / note')) + '"></td>' + tiers.map(t => cell(x, t)).join('') + '<td><button class="icon-btn sm danger" data-pa="del" data-pi="' + x.id + '" aria-label="delete">' + I('trash', 'sm') + '</button></td></tr>').join('') : ''; }).join('') +
    '</tbody></table></div><div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button class="btn sm ghost" data-pa="reset">' + esc(T('رجوع للأسعار الافتراضية', 'Restore default prices')) + '</button><span class="hint">' + esc(T('الأسعار بتتحفظ تلقائيًا وبتظهر كنطاق مقترح لما تعمل عرض سعر.', 'Saved automatically and shown as a suggested range when you build a quote.')) + '</span></div></div>';
  host.onchange = e => {
    const t = e.target, id = t.dataset.pi, it = id && pr.items.find(x => x.id === id);
    if (t.dataset.cur) { pr.cur[t.dataset.cur] = t.value; MSA.save(); P.renderPrices(host); return; }
    if (t.id === 'plQ') return;
    if (!it) return;
    if (t.dataset.pf) { it[t.dataset.pf] = t.value.trim(); MSA.save(); return; }
    if (t.dataset.t) { const r = it.r[t.dataset.t]; r[+t.dataset.k] = num(t.value); if (r[0] > r[1] && r[1] > 0) r.reverse(); MSA.save(); const row = t.closest('tr'); $$('input[data-t="' + t.dataset.t + '"]', row).forEach((i, k) => { i.value = r[k] || ''; }); }
  };
  host.oninput = e => { if (e.target.id === 'plQ') { S().ui.priceQ = e.target.value; const pos = e.target.selectionStart; P.renderPrices(host); const i = $('#plQ', host); i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} } };
  host.onclick = async e => {
    const b = e.target.closest('[data-pa]'); if (!b) return; const a = b.dataset.pa;
    if (a === 'ident') P.identityModal(() => P.renderPrices(host));
    else if (a === 'doc') P.docModal({ type: 'quote' });
    else if (a === 'add') { pr.items.push({ id: U.uid('pr'), cat: 'design', name: T('خدمة جديدة', 'New service'), note: '', r: { basic: [0, 0], mid: [0, 0], pro: [0, 0] } }); MSA.save(); P.renderPrices(host); }
    else if (a === 'del') { const it = pr.items.find(x => x.id === b.dataset.pi); if (it && await MSA.confirm(T('حذف «' + it.name + '» من القائمة؟', 'Remove “' + it.name + '” from the list?'))) { pr.items = pr.items.filter(x => x !== it); MSA.save(); P.renderPrices(host); } }
    else if (a === 'reset') { if (await MSA.confirm(T('هترجع كل الأسعار للقيم الافتراضية وتتمسح تعديلاتك. متأكد؟', 'This restores every price to the defaults and discards your edits. Sure?'))) { delete S().prices; P.prices(); MSA.save(); P.renderPrices(host); } }
  };
};

/* ---------------- documents (quotes & invoices) ---------------- */
const DOCS = () => { const s = S(); s.docs = s.docs || []; return s.docs; };
const KIND = k => k === 'invoice' ? [T('فاتورة', 'Invoice'), 'INV'] : [T('عرض سعر', 'Quotation'), 'QT'];
const STATUS = () => ({ draft: T('مسودة', 'Draft'), sent: T('اتبعت', 'Sent'), accepted: T('اتقبل', 'Accepted'), paid: T('مدفوع', 'Paid') });
const docTotals = d => {
  const sub = (d.lines || []).reduce((a, l) => a + num(l.qty) * num(l.price), 0), disc = sub * num(d.discount) / 100, base = sub - disc, tax = base * num(d.tax) / 100, total = base + tax;
  return { sub, disc, tax, total, deposit: total * num(d.deposit) / 100 };
};
P.docTotals = docTotals;
function nextNo(kind){ const b = P.biz(); b.seq[kind] = (b.seq[kind] || 0) + 1; return KIND(kind)[1] + '-' + new Date().getFullYear() + '-' + String(b.seq[kind]).padStart(4, '0'); }

function docCss(acc){
  return '.pg{padding:0}.dh{display:flex;align-items:center;justify-content:space-between;gap:18px;padding-bottom:16px;border-bottom:3px solid ' + acc + ';margin-bottom:18px}.dh img{max-height:70px;max-width:180px;object-fit:contain}.dh .bn{font-size:20px;font-weight:800}.dh .bt{color:#6b6b66;font-size:13px}' +
    '.dt{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}.dt h1{font-size:30px;margin:0;color:' + acc + '}.dt .no{color:#6b6b66;font-size:13px}.meta{font-size:13px;color:#444}.meta b{color:#1d1d1c}' +
    '.cl{background:#f6f7f9;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:14px}.cl b{color:#6b6b66;font-weight:600;margin-inline-end:6px}' +
    'table.it{width:100%;border-collapse:collapse;font-size:14px}table.it th{background:' + acc + ';color:#fff;padding:9px 10px;text-align:start;font-weight:600}table.it td{padding:9px 10px;border-bottom:1px solid #e7e7e3;vertical-align:top}table.it tr:nth-child(even) td{background:#fafafa}.sn{color:#777;font-size:12px}' +
    '.tt{margin:14px 0 0;margin-inline-start:auto;width:300px;font-size:14px}.tt div{display:flex;justify-content:space-between;padding:5px 2px}.tt .g{border-top:2px solid ' + acc + ';margin-top:4px;padding-top:8px;font-size:18px;font-weight:800;color:' + acc + '}' +
    '.bx{border:1px solid #e1e1dc;border-radius:10px;padding:12px 14px;margin-top:16px;font-size:13.5px;white-space:pre-wrap}.bx b{display:block;margin-bottom:4px;color:' + acc + '}.ft{margin-top:24px;text-align:center;color:#8a8a85;font-size:12px}.st{display:inline-block;background:' + acc + ';color:#fff;border-radius:999px;padding:2px 12px;font-size:12px}';
}
P.docHtml = d => {
  const b = P.biz(), acc = b.accent || '#5b8def', k = KIND(d.type), t = docTotals(d), cur = d.cur || 'EGP', rtl = !(S().settings.lang === 'en');
  const logo = b.logo ? '<img src="' + b.logo + '" alt="">' : '';
  const contact = [b.phone, b.email, b.city].filter(Boolean).join(' · ');
  const proj = d.projectId && S().projects.find(p => p.id === d.projectId), paid = proj && MSA.plus && MSA.plus.pay && MSA.plus.pay.cur(proj) === cur ? MSA.plus.pay.paid(proj) : 0;
  const due = d.type === 'invoice' ? (d.due ? '<div><b>' + esc(T('تاريخ الاستحقاق', 'Due date')) + ':</b> <span dir="ltr">' + esc(d.due) + '</span></div>' : '') : '<div><b>' + esc(T('ساري حتى', 'Valid until')) + ':</b> <span dir="ltr">' + esc(d.valid || '') + '</span></div>';
  return '<div class="pg"><div class="dh"><div>' + (logo || '<div class="bn">' + esc(bizName()) + '</div>') + (logo ? '<div class="bn" style="margin-top:4px">' + esc(bizName()) + '</div>' : '') + (b.tagline ? '<div class="bt" dir="auto">' + esc(b.tagline) + '</div>' : '') + '</div><div class="meta" style="text-align:end" dir="auto">' + esc(contact) + '</div></div>' +
    '<div class="dt"><div><h1>' + esc(k[0]) + '</h1><div class="no" dir="ltr">' + esc(d.no) + '</div></div><div class="meta"><div><b>' + esc(T('التاريخ', 'Date')) + ':</b> <span dir="ltr">' + esc(d.date) + '</span></div>' + due + '</div></div>' +
    '<div class="cl"><b>' + esc(T('العميل', 'Client')) + ':</b>' + esc(d.client || '—') + (proj ? '<br><b>' + esc(T('المشروع', 'Project')) + ':</b>' + esc(proj.name) : '') + (d.subject ? '<br><b>' + esc(T('الموضوع', 'Subject')) + ':</b>' + esc(d.subject) : '') + '</div>' +
    '<table class="it"><thead><tr><th>' + esc(T('البند', 'Item')) + '</th><th>' + esc(T('الكمية', 'Qty')) + '</th><th>' + esc(T('السعر', 'Price')) + '</th><th>' + esc(T('الإجمالي', 'Total')) + '</th></tr></thead><tbody>' +
    (d.lines || []).map(l => '<tr><td dir="auto">' + esc(l.name) + (l.note ? '<div class="sn">' + esc(l.note) + '</div>' : '') + '</td><td dir="ltr">' + fmt(l.qty) + '</td><td dir="ltr">' + fmt(l.price) + '</td><td dir="ltr">' + fmt(num(l.qty) * num(l.price)) + '</td></tr>').join('') + '</tbody></table>' +
    '<div class="tt"><div><span>' + esc(T('المجموع', 'Subtotal')) + '</span><span dir="ltr">' + fmt(t.sub) + '</span></div>' + (num(d.discount) ? '<div><span>' + esc(T('خصم', 'Discount')) + ' ' + fmt(d.discount) + '%</span><span dir="ltr">-' + fmt(t.disc) + '</span></div>' : '') + (num(d.tax) ? '<div><span>' + esc(T('ضريبة', 'Tax')) + ' ' + fmt(d.tax) + '%</span><span dir="ltr">' + fmt(t.tax) + '</span></div>' : '') +
    '<div class="g"><span>' + esc(T('الإجمالي', 'Total')) + '</span><span dir="ltr">' + fmt(t.total) + ' ' + esc(cur) + '</span></div>' +
    (d.type === 'invoice' && paid > 0 ? '<div><span>' + esc(T('المدفوع', 'Paid')) + '</span><span dir="ltr">-' + fmt(paid) + '</span></div><div style="font-weight:700"><span>' + esc(T('المتبقي', 'Balance due')) + '</span><span dir="ltr">' + fmt(Math.max(0, t.total - paid)) + ' ' + esc(cur) + '</span></div>' : '') +
    (d.type === 'quote' && num(d.deposit) > 0 ? '<div style="color:#6b6b66"><span>' + esc(T('دفعة مقدمة', 'Deposit')) + ' ' + fmt(d.deposit) + '%</span><span dir="ltr">' + fmt(t.deposit) + ' ' + esc(cur) + '</span></div>' : '') + '</div>' +
    (d.notes ? '<div class="bx"><b>' + esc(T('شروط وملاحظات', 'Terms & notes')) + '</b>' + esc(d.notes) + '</div>' : '') +
    (b.pay && d.type === 'invoice' ? '<div class="bx"><b>' + esc(T('بيانات الدفع', 'Payment details')) + '</b>' + esc(b.pay) + '</div>' : '') +
    '<div class="ft">' + esc(T('شكرًا لتعاملكم معنا', 'Thank you for your business')) + (rtl ? '' : '') + '</div></div>';
};
const fname = d => (KIND(d.type)[1] + '-' + (d.client || 'client') + '-' + d.no).replace(/[^\w؀-ۿ\-]+/g, '_') + '.pdf';
P.docPdf = d => MSA.pdf.flow(fname(d), P.docHtml(d), { css: docCss(P.biz().accent || '#5b8def'), dir: S().settings.lang === 'en' ? 'ltr' : 'rtl' });

/* the builder */
P.docModal = function(init, onSave){
  const b = P.biz(), pr = P.prices(), tiers = TIERS();
  const d = Object.assign({ id: U.uid('dc'), type: 'quote', client: '', projectId: '', tier: 'mid', cur: '', lines: [], discount: 0, tax: b.tax || 0, deposit: b.deposit == null ? 50 : b.deposit, notes: b.terms || '', subject: '', status: 'draft', date: today() }, JSON.parse(JSON.stringify(init || {})));
  if (!d.cur) d.cur = pr.cur[d.tier] || 'EGP';
  const addDays = (k, n) => { const x = new Date(k + 'T00:00'); x.setDate(x.getDate() + n); return U.dateKey(x); };
  if (!d.valid) d.valid = addDays(d.date, b.valid || 14); if (!d.due) d.due = addDays(d.date, 7);
  const isNew = !DOCS().some(x => x.id === d.id);
  const projects = S().projects.slice().sort((a, c) => (c.created || 0) - (a.created || 0));
  const m = MSA.modal({
    title: T('عرض سعر / فاتورة', 'Quote / invoice'), size: 'wide',
    body: '<div class="dc-top"><div class="seg" id="dcType"><button data-v="quote">' + esc(T('عرض سعر', 'Quote')) + '</button><button data-v="invoice">' + esc(T('فاتورة', 'Invoice')) + '</button></div>' +
      '<button class="btn sm ghost" id="dcIdent">' + I('user', 'sm') + esc(T('هويتي (لوجو/دفع)', 'My identity')) + '</button></div>' +
      '<div class="grid2"><div class="field"><label class="f">' + esc(T('العميل', 'Client')) + '</label><input id="dcClient" dir="auto" list="dcCl" autocomplete="off" value="' + esc(d.client) + '"><datalist id="dcCl">' + (MSA.clients ? MSA.clients.names().map(n => '<option value="' + esc(n) + '">').join('') : '') + '</datalist></div>' +
      '<div class="field"><label class="f">' + esc(T('المشروع (اختياري)', 'Project (optional)')) + '</label><select id="dcProj"><option value="">—</option>' + projects.map(p => '<option value="' + p.id + '"' + (p.id === d.projectId ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="f">' + esc(T('فئة العميل', 'Client tier')) + '</label><select id="dcTier">' + tiers.map(t => '<option value="' + t[0] + '"' + (t[0] === d.tier ? ' selected' : '') + '>' + esc(t[1] + ' — ' + t[2]) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="f">' + esc(T('العملة', 'Currency')) + '</label><select id="dcCur">' + ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP'].map(c => '<option' + (c === d.cur ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></div></div>' +
      '<div class="field"><label class="f">' + esc(T('الموضوع (اختياري)', 'Subject (optional)')) + '</label><input id="dcSub" dir="auto" value="' + esc(d.subject) + '"></div>' +
      '<div class="dc-add"><select id="dcSvc"><option value="">' + esc(T('+ أضف خدمة من قائمة أسعاري…', '+ Add a service from my price list…')) + '</option>' + CATS().map(c => '<optgroup label="' + esc(c[1]) + '">' + pr.items.filter(x => x.cat === c[0]).map(x => '<option value="' + x.id + '">' + esc(x.name) + '</option>').join('') + '</optgroup>').join('') + '</select><button class="btn sm" id="dcFree">' + I('plus', 'sm') + esc(T('بند حر', 'Custom line')) + '</button></div>' +
      '<div id="dcLines"></div>' +
      '<div class="grid2"><div class="field"><label class="f">' + esc(T('خصم %', 'Discount %')) + '</label><input type="number" id="dcDisc" min="0" max="100" value="' + (d.discount || 0) + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('ضريبة %', 'Tax %')) + '</label><input type="number" id="dcTax" min="0" max="100" value="' + (d.tax || 0) + '"></div>' +
      '<div class="field" id="dcDepF"><label class="f">' + esc(T('دفعة مقدمة %', 'Deposit %')) + '</label><input type="number" id="dcDep" min="0" max="100" value="' + (d.deposit || 0) + '"></div>' +
      '<div class="field"><label class="f" id="dcDueL"></label><input type="date" id="dcDue"></div></div>' +
      '<div class="field"><label class="f">' + esc(T('شروط وملاحظات', 'Terms & notes')) + '</label><textarea id="dcNotes" rows="3" dir="auto">' + esc(d.notes) + '</textarea></div>' +
      '<div class="dc-tot" id="dcTot"></div>',
    buttons: [
      { label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() },
      { label: T('حفظ', 'Save'), onClick: a => { if (!commit(a)) return; a.close(); MSA.toast(T('اتحفظ في «عروض وفواتير»', 'Saved in “Quotes & invoices”'), 'ok'); onSave && onSave(); } },
      { label: T('حفظ وتنزيل PDF', 'Save & download PDF'), cls: 'primary', onClick: a => { if (!commit(a)) return; P.docPdf(d); a.close(); onSave && onSave(); } }
    ],
    onMount: el => {
      const lines = $('#dcLines', el), tot = $('#dcTot', el);
      const range = l => { const it = pr.items.find(x => x.id === l.svc); const r = it && it.r[d.tier]; return r && (r[0] || r[1]) ? r : null; };
      const draw = () => {
        $$('#dcType button', el).forEach(x => x.classList.toggle('on', x.dataset.v === d.type));
        $('#dcDepF', el).hidden = d.type !== 'quote';
        $('#dcDueL', el).textContent = d.type === 'quote' ? T('ساري حتى', 'Valid until') : T('تاريخ الاستحقاق', 'Due date');
        $('#dcDue', el).value = d.type === 'quote' ? d.valid : d.due;
        lines.innerHTML = d.lines.length ? '<div class="dc-ls">' + d.lines.map((l, i) => { const r = range(l), p = num(l.price), warn = r && p > 0 && (p < r[0] || p > r[1]);
          return '<div class="dc-l" data-i="' + i + '"><input class="dc-n" data-f="name" dir="auto" value="' + esc(l.name) + '" placeholder="' + esc(T('البند', 'Item')) + '"><input type="number" data-f="qty" min="0" step="any" value="' + l.qty + '" aria-label="qty"><input type="number" data-f="price" min="0" step="any" value="' + (l.price || '') + '" aria-label="price"><b class="dc-s" dir="ltr">' + fmt(num(l.qty) * p) + '</b><button class="icon-btn sm danger" data-x="' + i + '" aria-label="x">' + I('x', 'sm') + '</button>' +
            (r ? '<div class="dc-r' + (warn ? ' w' : '') + '">' + esc(T('نطاق السوق: ', 'Market range: ')) + fmt(r[0]) + '–' + fmt(r[1]) + ' ' + esc(d.cur) + (warn ? ' · ' + esc(p < r[0] ? T('أقل من النطاق', 'below range') : T('أعلى من النطاق', 'above range')) : '') + '</div>' : '') + '</div>'; }).join('') + '</div>'
          : '<div class="hint" style="margin:8px 0">' + esc(T('ضيف خدمات من قائمة الأسعار أو بند حر.', 'Add services from your price list or a custom line.')) + '</div>';
        totals();
      };
      const totals = () => { const t = docTotals(d); tot.innerHTML = '<div><span>' + esc(T('المجموع', 'Subtotal')) + '</span><b dir="ltr">' + fmt(t.sub) + '</b></div>' + (d.discount ? '<div><span>' + esc(T('خصم', 'Discount')) + '</span><b dir="ltr">-' + fmt(t.disc) + '</b></div>' : '') + (d.tax ? '<div><span>' + esc(T('ضريبة', 'Tax')) + '</span><b dir="ltr">' + fmt(t.tax) + '</b></div>' : '') + '<div class="g"><span>' + esc(T('الإجمالي', 'Total')) + '</span><b dir="ltr">' + fmt(t.total) + ' ' + esc(d.cur) + '</b></div>' + (d.type === 'quote' && d.deposit ? '<div class="hint"><span>' + esc(T('الدفعة المقدمة', 'Deposit')) + '</span><span dir="ltr">' + fmt(t.deposit) + ' ' + esc(d.cur) + '</span></div>' : ''); };
      el.addEventListener('click', async e => {
        const ty = e.target.closest('#dcType [data-v]'); if (ty) { d.type = ty.dataset.v; draw(); return; }
        const x = e.target.closest('[data-x]'); if (x) { if (!await MSA.confirmDel(T('حذف هذا السطر؟', 'Delete this line?'))) return; d.lines.splice(+x.dataset.x, 1); draw(); return; }
      });
      $('#dcIdent', el).onclick = () => P.identityModal();
      $('#dcFree', el).onclick = () => { d.lines.push({ name: '', qty: 1, price: 0, note: '' }); draw(); const l = $$('.dc-n', el); l[l.length - 1] && l[l.length - 1].focus(); };
      $('#dcSvc', el).onchange = e => { const it = pr.items.find(x => x.id === e.target.value); if (!it) return; d.lines.push({ name: it.name, qty: 1, price: P.suggest(it, d.tier), note: it.note || '', svc: it.id }); e.target.value = ''; draw(); };
      lines.addEventListener('input', e => { const r = e.target.closest('[data-i]'); if (!r || !e.target.dataset.f) return; const l = d.lines[+r.dataset.i]; l[e.target.dataset.f] = e.target.dataset.f === 'name' ? e.target.value : num(e.target.value); if (e.target.dataset.f !== 'name') { $('.dc-s', r).textContent = fmt(num(l.qty) * num(l.price)); totals(); } });
      lines.addEventListener('change', e => { if (e.target.dataset.f === 'price') draw(); });
      $('#dcTier', el).onchange = e => { d.tier = e.target.value; d.cur = pr.cur[d.tier] || d.cur; $('#dcCur', el).value = d.cur; d.lines.forEach(l => { const it = l.svc && pr.items.find(x => x.id === l.svc); if (it) l.price = P.suggest(it, d.tier); }); draw(); };
      $('#dcCur', el).onchange = e => { d.cur = e.target.value; draw(); };
      $('#dcDisc', el).oninput = e => { d.discount = Math.max(0, Math.min(100, num(e.target.value))); totals(); };
      $('#dcTax', el).oninput = e => { d.tax = Math.max(0, Math.min(100, num(e.target.value))); totals(); };
      $('#dcDep', el).oninput = e => { d.deposit = Math.max(0, Math.min(100, num(e.target.value))); totals(); };
      $('#dcDue', el).onchange = e => { if (d.type === 'quote') d.valid = e.target.value; else d.due = e.target.value; };
      $('#dcProj', el).onchange = e => { d.projectId = e.target.value; const p = S().projects.find(x => x.id === d.projectId); if (p && !$('#dcClient', el).value.trim()) { $('#dcClient', el).value = MSA.clients.of(p); } };
      draw();
    }
  });
  function commit(a){
    d.client = $('#dcClient', a.el).value.trim(); d.subject = $('#dcSub', a.el).value.trim(); d.notes = $('#dcNotes', a.el).value.trim();
    d.lines = d.lines.filter(l => (l.name || '').trim() || num(l.price));
    if (!d.lines.length) { MSA.toast(T('ضيف بند واحد على الأقل', 'Add at least one line'), 'err'); return false; }
    if (!d.client) { MSA.toast(T('اكتب اسم العميل', 'Enter the client name'), 'err'); $('#dcClient', a.el).focus(); return false; }
    const list = DOCS(), old = list.findIndex(x => x.id === d.id);
    if (old < 0 || list[old].type !== d.type) d.no = nextNo(d.type); else d.no = list[old].no;
    if (isNew || old < 0) list.unshift(d); else list[old] = d;
    if (d.client && MSA.clients) MSA.clients.ensure(d.client);
    MSA.save(); return true;
  }
};
P.fromProject = function(p, kind){
  const tm = p.time || {}, hrs = ((tm.entries || []).reduce((a, e) => a + (e.min || 0), 0)) / 60, lines = [];
  if (tm.fixed > 0) lines.push({ name: T('رسوم المشروع', 'Project fee'), qty: 1, price: tm.fixed, note: '' });
  else if (hrs > 0 && tm.rate > 0) lines.push({ name: T('ساعات التصميم / المونتاج', 'Design / editing hours'), qty: Math.round(hrs * 100) / 100, price: tm.rate, note: '' });
  (tm.extras || []).forEach(e => lines.push({ name: e.name, qty: 1, price: e.amt, note: '' }));
  P.docModal({ type: kind || 'quote', client: (MSA.clients && MSA.clients.of(p)) || '', projectId: p.id, cur: tm.cur || 'EGP', lines, subject: p.name, notes: tm.notes || P.biz().terms || '' });
};

P.renderDocs = function(host){
  const list = DOCS(), st = STATUS(), pf = S().ui.docF || '';
  const shown = list.filter(x => !pf || x.type === pf);
  host.innerHTML = '<div class="dl"><div class="pl-head"><div><b>' + esc(T('عروض الأسعار والفواتير', 'Quotes & invoices')) + '</b><div class="hint">' + esc(T('كل مستند بترقيم تلقائي ولوجو وبياناتك. غيّر الحالة بعد ما تبعته.', 'Every document is auto-numbered with your logo and details. Update its status after sending.')) + '</div></div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-da="ident">' + I('user', 'sm') + esc(T('هويتي التجارية', 'My identity')) + '</button><button class="btn sm primary" data-da="new">' + I('plus', 'sm') + esc(T('مستند جديد', 'New document')) + '</button></div></div>' +
    '<div class="pchips" style="margin:10px 0">' + [['', T('الكل', 'All')], ['quote', T('عروض', 'Quotes')], ['invoice', T('فواتير', 'Invoices')]].map(x => '<button class="pchip' + (pf === x[0] ? ' on' : '') + '" data-da="f" data-v="' + x[0] + '">' + esc(x[1]) + '</button>').join('') + '</div>' +
    (shown.length ? '<div class="dl-list">' + shown.map(x => { const t = docTotals(x); return '<div class="dl-row" data-id="' + x.id + '"><div class="dl-m"><b dir="ltr">' + esc(x.no) + '</b><span class="pill-s dl-k">' + esc(KIND(x.type)[0]) + '</span><span dir="auto" class="dl-c">' + esc(x.client) + '</span><span class="muted" dir="ltr">' + esc(x.date) + '</span></div><div class="dl-a"><b dir="ltr">' + fmt(t.total) + ' ' + esc(x.cur) + '</b><select data-da="status" aria-label="status">' + Object.keys(st).map(k => '<option value="' + k + '"' + (x.status === k ? ' selected' : '') + '>' + esc(st[k]) + '</option>').join('') + '</select>' +
      '<button class="btn sm" data-da="pdf">' + I('download', 'sm') + 'PDF</button><button class="btn sm" data-da="edit">' + I('pencil', 'sm') + '</button>' + (x.type === 'quote' ? '<button class="btn sm" data-da="inv" title="' + esc(T('حوّل لفاتورة', 'Make invoice')) + '">' + esc(T('→ فاتورة', '→ Invoice')) + '</button>' : '') + '<button class="btn sm" data-da="msg" title="' + esc(T('رسالة للعميل', 'Message')) + '">' + I('mail', 'sm') + '</button><button class="icon-btn sm danger" data-da="del" aria-label="delete">' + I('trash', 'sm') + '</button></div></div>'; }).join('') + '</div>'
      : MSA.empty('file', T('مفيش مستندات لسه', 'No documents yet'), T('اضغط «مستند جديد» وابدأ بعرض سعر من قائمة أسعارك.', 'Tap “New document” and start a quote from your price list.'))) + '</div>';
  host.onchange = e => { const s = e.target.closest('[data-da=status]'); if (!s) return; const d = list.find(x => x.id === s.closest('[data-id]').dataset.id); if (d) { d.status = s.value; MSA.save(); } };
  host.onclick = async e => {
    const b = e.target.closest('[data-da]'); if (!b || b.tagName === 'SELECT') return; const a = b.dataset.da, row = b.closest('[data-id]'), d = row && list.find(x => x.id === row.dataset.id);
    if (a === 'ident') P.identityModal(); else if (a === 'new') P.docModal({ type: 'quote' }, () => P.renderDocs(host));
    else if (a === 'f') { S().ui.docF = b.dataset.v; MSA.save(); P.renderDocs(host); }
    else if (!d) return;
    else if (a === 'pdf') P.docPdf(d);
    else if (a === 'edit') P.docModal(d, () => P.renderDocs(host));
    else if (a === 'inv') { const c = JSON.parse(JSON.stringify(d)); c.id = U.uid('dc'); c.type = 'invoice'; c.status = 'draft'; c.date = today(); delete c.no; delete c.due; delete c.valid; P.docModal(c, () => P.renderDocs(host)); }
    else if (a === 'msg') { if (MSA.plus && MSA.plus.messages) MSA.plus.messages({ client: d.client, pid: d.projectId || undefined, kind: d.type === 'quote' ? 'quote' : 'pay' }); }
    else if (a === 'del') { if (await MSA.confirm(T('حذف ' + d.no + '؟', 'Delete ' + d.no + '?'))) { list.splice(list.indexOf(d), 1); MSA.save(); P.renderDocs(host); } }
  };
};

/* ---------------- Money view: tabs ---------------- */
function wrapMoney(){
  const V = MSA.views.money; if (!V || V._tabs) return; V._tabs = 1;
  const base = V.render;
  const TABS = () => [['due', T('المستحقات', 'Dues'), 'check-c'], ['prices', T('قائمة الأسعار', 'Price list'), 'tag'], ['docs', T('عروض وفواتير', 'Quotes & invoices'), 'file'], ['profit', T('ربحية العملاء', 'Profitability'), 'chart']];
  const bar = tab => '<div class="mny-tabs" role="tablist">' + TABS().map(t => '<button role="tab" class="pchip' + (tab === t[0] ? ' on' : '') + '" data-mt="' + t[0] + '">' + I(t[2], 'sm') + '<span>' + esc(t[1]) + '</span></button>').join('') + '</div>';
  V.render = function(host){
    let tab = S().ui.moneyTab || 'due'; if (tab === 'profit' && !(MSA.profit && MSA.profit.render)) tab = 'due';
    if (!host._mt) { host._mt = 1; host.addEventListener('click', e => { const b = e.target.closest('[data-mt]'); if (!b) return; S().ui.moneyTab = b.dataset.mt; MSA.save(); MSA.rerender(true); }); }
    if (tab === 'due') { base.call(this, host); const r = host.firstElementChild; if (r) r.insertAdjacentHTML('afterbegin', bar(tab)); return; }
    host.innerHTML = '<div class="mny">' + bar(tab) + '<div id="mtBody"></div></div>';
    const body = $('#mtBody', host); host.onclick = null; host.onchange = null; host.oninput = null;
    const target = body;
    if (tab === 'prices') P.renderPrices(target); else if (tab === 'docs') P.renderDocs(target); else if (MSA.profit) MSA.profit.render(target);
  };
}
wrapMoney();
})();
