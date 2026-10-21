/* Clients sheet — an editable, Excel-like table of our clients in the app's own look (colours + logo),
   linked to projects (folders in Completed projects) and to pricing (work value in EGP). */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$, P = MSA.proj;
const T = (a, e) => MSA.T(a, e), esc = U.esc, S = () => MSA.state;
const en = () => S().settings.lang === 'en';

const TYPES = { text: ['نص', 'Text'], long: ['نص طويل', 'Long text'], email: ['إيميل', 'Email'], phone: ['هاتف', 'Phone'], date: ['تاريخ', 'Date'], number: ['رقم', 'Number'], select: ['قائمة', 'List'] };
const STAT = [['محتمل', 'Prospect', '#f0b43c'], ['نشط', 'Active', '#3ccf91'], ['منتهي', 'Finished', '#5b8def'], ['متوقف', 'Paused', '#8a8a86']];
const SERV = [['لوجو', 'Logo'], ['هوية بصرية', 'Brand identity'], ['سوشيال ميديا', 'Social media'], ['مونتاج فيديو', 'Video editing'], ['موشن جرافيك', 'Motion graphics'], ['مطبوعات', 'Print'], ['UI / UX', 'UI / UX'], ['أخرى', 'Other']];
const SRC = ['Behance', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Mostaql', 'Khamsat', 'Fiverr', 'Upwork', T('ترشيح من عميل', 'Referral'), T('أخرى', 'Other')];

function defCols(){
  const c = (id, a, e, type, w) => ({ id, name: T(a, e), type, w });
  return [c('name', 'اسم العميل', 'Client name', 'text', 210), c('company', 'الشركة / البراند', 'Company / brand', 'text', 190), c('email', 'الإيميل', 'Email', 'email', 220), c('phone', 'الهاتف', 'Phone', 'phone', 150),
    c('wa', 'واتساب', 'WhatsApp', 'phone', 150), c('city', 'المدينة / الدولة', 'City / country', 'text', 150), c('service', 'الخدمة المطلوبة', 'Service', 'select', 160), c('status', 'الحالة', 'Status', 'select', 120),
    c('source', 'المصدر', 'Source', 'select', 140), c('since', 'أول تعامل', 'First contact', 'date', 140), c('last', 'آخر تواصل', 'Last contact', 'date', 140), c('notes', 'ملاحظات', 'Notes', 'long', 260)];
}
function D(){
  const s = S(); if (!s.clients) s.clients = { cols: defCols(), rows: [], sort: null, q: '', stat: '', m2: 1 };
  const d = s.clients; d.cols = d.cols && d.cols.length ? d.cols : defCols(); d.rows = d.rows || [];
  if (!d.cols.some(c => c.id === 'name')) d.cols.unshift({ id: 'name', name: T('اسم العميل', 'Client name'), type: 'text', w: 210 });
  /* one-time migration: sheets saved before the “last contact” column existed get it (placed before Notes) */
  if (!d.m2) { d.m2 = 1; if (!d.cols.some(c => c.id === 'last')) { const at = d.cols.findIndex(c => c.id === 'notes'); d.cols.splice(at < 0 ? d.cols.length : at, 0, { id: 'last', name: T('آخر تواصل', 'Last contact'), type: 'date', w: 140 }); } }
  return d;
}
const norm = s => String(s || '').trim().toLowerCase();
const hue = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
const pillColor = v => { const k = norm(v), f = STAT.find(x => norm(x[0]) === k || norm(x[1]) === k); return f ? f[2] : 'hsl(' + hue(k) + ' 55% 52%)'; };

/* ---------- link with projects ---------- */
const clientOf = p => String(p.client || (p.time && p.time.client) || '').trim();
function projectsOf(name){ const k = norm(name); return k ? S().projects.filter(p => norm(clientOf(p)) === k) : []; }
function workValue(p){
  const tm = p.time; if (!tm) return 0; const hrs = (tm.entries || []).reduce((a, e) => a + e.min, 0) / 60;
  const v = (tm.fixed > 0 ? tm.fixed : hrs * (tm.rate || 0)) + (tm.extras || []).reduce((a, e) => a + e.amt, 0);
  return MSA.rates && MSA.rates.has(tm.cur || 'EGP') ? MSA.rates.toEGP(v, tm.cur || 'EGP') : v;
}
const clients = MSA.clients = {
  data: D, of: clientOf, projectsOf,
  names(){ const set = new Map(); D().rows.forEach(r => { const n = (r.c.name || '').trim(); if (n) set.set(norm(n), n); }); S().projects.forEach(p => { const n = clientOf(p); if (n && !set.has(norm(n))) set.set(norm(n), n); }); return [...set.values()].sort((a, b) => a.localeCompare(b, en() ? 'en' : 'ar')); },
  /* add a client row when a project mentions a new name */
  ensure(name, extra){
    name = String(name || '').trim(); if (!name) return null; const d = D(), k = norm(name);
    let r = d.rows.find(x => norm(x.c.name) === k);
    if (!r) { r = { id: U.uid('cl'), ts: Date.now(), c: { name, status: T('نشط', 'Active'), since: U.dateKey(new Date()) } }; Object.assign(r.c, extra || {}); d.rows.push(r); MSA.save(); }
    return r;
  },
  rename(from, to){ from = String(from || '').trim(); to = String(to || '').trim(); if (!from || !to) return; const k = norm(from);
    S().projects.forEach(p => { if (norm(clientOf(p)) === k) { p.client = to; if (p.time && norm(p.time.client) === k) p.time.client = to; } });
    D().rows.forEach(r => { if (norm(r.c.name) === k) r.c.name = to; }); MSA.save(); },
  /* pick / type a client name (with suggestions) */
  pick(cur, title){
    return new Promise(res => {
      let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      MSA.modal({ title: title || T('العميل', 'Client'), body: '<div class="field" style="margin:0"><label class="f">' + esc(T('اسم العميل (اختر أو اكتب اسمًا جديدًا)', 'Client name (pick one or type a new name)')) + '</label><input id="cpIn" type="text" dir="auto" list="cpList" autocomplete="off" value="' + esc(cur || '') + '"><datalist id="cpList">' + clients.names().map(n => '<option value="' + esc(n) + '">').join('') + '</datalist></div>',
        buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('حفظ', 'Save'), cls: 'primary', onClick: a => { fin($('#cpIn', a.el).value.trim()); a.close(); } }],
        onClose: () => fin(null), onMount: el => { const i = $('#cpIn', el); setTimeout(() => { i.focus(); i.select(); }, 30); i.addEventListener('keydown', e => { if (e.key === 'Enter') $('.btn.primary', el).click(); }); } });
    });
  }
};

/* ---------- helpers ---------- */
const colVal = (r, c) => (r.c[c.id] == null ? '' : String(r.c[c.id]));
function visibleRows(d){
  const q = norm(d.q); let rows = d.rows.filter(r => (!d.stat || norm(r.c.status) === norm(d.stat)) && (!q || d.cols.some(c => norm(r.c[c.id]).includes(q))));
  if (d.sort) { const c = d.cols.find(x => x.id === d.sort.col); if (c) { const dir = d.sort.dir === 'desc' ? -1 : 1; rows = rows.slice().sort((a, b) => { const x = colVal(a, c), y = colVal(b, c); if (c.type === 'number') return ((parseFloat(x) || 0) - (parseFloat(y) || 0)) * dir; return x.localeCompare(y, en() ? 'en' : 'ar', { numeric: true }) * dir; }); } }
  return rows;
}
const inputType = c => ({ email: 'email', date: 'date', number: 'number' })[c.type] || 'text';
const listFor = c => { if (c.type !== 'select') return ''; const id = c.id; if (id === 'status') return STAT.map(x => T(x[0], x[1])); if (id === 'service') return SERV.map(x => T(x[0], x[1])); if (id === 'source') return SRC; const set = new Set(); D().rows.forEach(r => { if (r.c[id]) set.add(r.c[id]); }); return [...set]; };
const waLink = v => 'https://wa.me/' + String(v).replace(/[^\d]/g, '').replace(/^0+/, v.trim().startsWith('01') ? '20' : '');

function cellHTML(r, c){
  const v = colVal(r, c), a = 'data-r="' + r.id + '" data-c="' + c.id + '"';
  const lst = c.type === 'select' ? ' list="dl-' + c.id + '"' : '';
  let inner;
  if (c.type === 'long') inner = '<textarea ' + a + ' rows="1" dir="auto">' + esc(v) + '</textarea>';
  else inner = '<input ' + a + ' type="' + inputType(c) + '" value="' + esc(v) + '"' + lst + ' dir="' + (c.type === 'email' || c.type === 'phone' || c.type === 'number' ? 'ltr' : 'auto') + '" autocomplete="off"' + (c.type === 'select' && v ? ' style="--pc:' + pillColor(v) + '" class="pill"' : '') + '>';
  let act = '';
  if (v && c.type === 'email') act = '<button class="cs-go" data-open="mailto:' + esc(v) + '" tabindex="-1" title="' + esc(T('إرسال إيميل', 'Send email')) + '">' + I('mail', 'xs') + '</button>';
  else if (v && c.type === 'phone') act = '<button class="cs-go" data-open="' + (c.id === 'wa' ? esc(waLink(v)) : 'tel:' + esc(v)) + '" tabindex="-1" title="' + esc(c.id === 'wa' ? 'WhatsApp' : T('اتصال', 'Call')) + '">' + I(c.id === 'wa' ? 'link' : 'phone', 'xs') + '</button>';
  return '<td class="cs-td' + (c.id === 'name' ? ' cs-sticky' : '') + '">' + inner + act + '</td>';
}
function computed(name){
  const ps = projectsOf(name), done = ps.filter(p => p.status === 'done').length, val = ps.reduce((a, p) => a + workValue(p), 0);
  return { n: ps.length, done, val };
}

/* ---------- logo for PDF ---------- */
let logoUrl = null;
async function logoData(){
  if (logoUrl) return logoUrl;
  try { const r = await fetch('assets/img-e1e7e6d4.png'); const b = await r.blob(); logoUrl = await new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }); } catch (e) { logoUrl = ''; }
  return logoUrl;
}

/* ---------- view ---------- */
function render(host){
  S().projects.forEach(p => { const n = clientOf(p); if (n) clients.ensure(n); });
  const d = D(), prof = S().profile, rows = visibleRows(d), money = n => MSA.rates ? MSA.rates.fmt(n, 0) : Math.round(n);
  const statuses = [...new Set(d.rows.map(r => (r.c.status || '').trim()).filter(Boolean))];
  const totalVal = d.rows.reduce((a, r) => a + computed(r.c.name).val, 0);
  const sortIcon = c => d.sort && d.sort.col === c.id ? (d.sort.dir === 'desc' ? ' ▼' : ' ▲') : '';
  const W = d.cols.reduce((a, c) => a + c.w, 0) + 44 + 3 * 110 + 78;
  host.innerHTML = '<div class="cs">' +
    '<div class="cs-band"><div class="cs-brand"><span class="cs-logo"><img src="assets/img-0fb45762.png" alt=""></span><div><h1>' + esc(T('قاعدة بيانات العملاء', 'Client database')) + '</h1><div class="cs-sub" dir="auto">' + esc(prof.name || '') + (prof.title ? ' · ' + esc(prof.title) : '') + '</div></div></div>' +
      '<div class="cs-kpis"><div><b>' + d.rows.length + '</b><span>' + esc(T('عميل', 'Clients')) + '</span></div><div><b>' + d.rows.filter(r => norm(r.c.status) === norm(T('نشط', 'Active')) || norm(r.c.status) === 'active' || norm(r.c.status) === 'نشط').length + '</b><span>' + esc(T('نشط', 'Active')) + '</span></div><div><b dir="ltr">' + money(totalVal) + '</b><span>' + esc(T('قيمة الشغل (جنيه)', 'Work value (EGP)')) + '</span></div></div></div>' +
    '<div class="row cs-tabs"><button class="btn sm" data-ca="projects">' + I('trophy', 'sm') + '<span>' + esc(T('المشاريع المكتملة', 'Completed projects')) + '</span></button><button class="btn sm primary" disabled>' + I('user', 'sm') + '<span>' + esc(T('العملاء', 'Clients')) + '</span></button></div>' +
    '<div class="cs-bar"><div class="cs-search">' + I('search', 'sm') + '<input type="search" id="csQ" dir="auto" value="' + esc(d.q) + '" placeholder="' + esc(T('ابحث في كل الأعمدة…', 'Search every column…')) + '"></div>' +
      '<div class="pchips"><button class="pchip' + (d.stat ? '' : ' on') + '" data-ca="stat" data-v="">' + esc(T('الكل', 'All')) + '</button>' + statuses.map(s => '<button class="pchip' + (norm(d.stat) === norm(s) ? ' on' : '') + '" data-ca="stat" data-v="' + esc(s) + '" style="--pc:' + pillColor(s) + '">' + esc(s) + '</button>').join('') + '</div>' +
      '<span class="grow"></span><button class="btn sm primary" data-ca="addrow">' + I('plus', 'sm') + '<span>' + esc(T('عميل جديد', 'New client')) + '</span></button><button class="btn sm" data-ca="addcol">' + I('plus', 'sm') + '<span>' + esc(T('عمود', 'Column')) + '</span></button>' +
      '<button class="btn sm" data-ca="imp" title="CSV">' + I('upload', 'sm') + '<span>' + esc(T('استيراد', 'Import')) + '</span></button><button class="btn sm" data-ca="csv" title="CSV / Excel">' + I('download', 'sm') + '<span>Excel / CSV</span></button><button class="btn sm" data-ca="pdf">' + I('download', 'sm') + '<span>PDF</span></button></div>' +
    '<div class="cs-wrap" id="csWrap"><table class="cs-tbl" style="width:' + W + 'px"><colgroup><col style="width:44px">' + d.cols.map(c => '<col style="width:' + c.w + 'px">').join('') + '<col style="width:110px"><col style="width:110px"><col style="width:110px"><col style="width:78px"></colgroup>' +
      '<thead><tr><th class="cs-n">#</th>' + d.cols.map(c => '<th class="' + (c.id === 'name' ? 'cs-sticky' : '') + '" data-col="' + c.id + '"><button class="cs-h" data-ca="sort" data-v="' + c.id + '"><span dir="auto">' + esc(c.name) + sortIcon(c) + '</span></button><button class="cs-m" data-ca="colmenu" data-v="' + c.id + '" aria-label="menu">' + I('more', 'xs') + '</button><i class="cs-rs" data-rs="' + c.id + '"></i></th>').join('') +
      '<th class="cs-calc">' + esc(T('المشاريع', 'Projects')) + '</th><th class="cs-calc">' + esc(T('المكتملة', 'Completed')) + '</th><th class="cs-calc">' + esc(T('القيمة (جنيه)', 'Value (EGP)')) + '</th><th></th></tr></thead><tbody>' +
      rows.map((r, i) => { const cp = computed(r.c.name); return '<tr data-row="' + r.id + '"><td class="cs-n">' + (i + 1) + '</td>' + d.cols.map(c => cellHTML(r, c)).join('') +
        '<td class="cs-calc">' + (cp.n ? '<button class="cs-link" data-ca="folder" data-v="' + esc(r.c.name) + '">' + cp.n + '</button>' : '<span class="muted">0</span>') + '</td><td class="cs-calc">' + cp.done + '</td><td class="cs-calc" dir="ltr">' + (cp.val ? money(cp.val) : '—') + '</td>' +
        '<td class="cs-x"><button class="icon-btn sm" data-ca="msg" data-v="' + r.id + '" title="' + esc(T('رسائل جاهزة', 'Ready messages')) + '" aria-label="messages">' + I('mail', 'xs') + '</button><button class="icon-btn sm danger" data-ca="delrow" data-v="' + r.id + '" aria-label="delete">' + I('trash', 'xs') + '</button></td></tr>'; }).join('') + '</tbody></table>' +
      (rows.length ? '' : '<div class="cs-empty">' + I('user') + '<div>' + esc(d.rows.length ? T('لا نتائج مطابقة', 'No matching clients') : T('الشيت فاضي — ابدأ بإضافة أول عميل', 'The sheet is empty — add your first client')) + '</div></div>') + '</div>' +
    d.cols.filter(c => c.type === 'select').map(c => '<datalist id="dl-' + c.id + '">' + listFor(c).map(v => '<option value="' + esc(v) + '">').join('') + '</datalist>').join('') +
    '<div class="cs-foot hint">' + esc(T('اكتب مباشرة في الخلايا (يُحفظ تلقائيًا) • الصق من Excel بـ Ctrl+V • Enter ينزل للخلية التالية • اسحب حافة العنوان لتغيير العرض. أعمدة المشاريع والقيمة تُحسب تلقائيًا من مشاريعك (باسم العميل نفسه) ومن تبويب التسعير.', 'Type straight into the cells (auto-saved) • paste from Excel with Ctrl+V • Enter moves down • drag a header edge to resize. Projects and value are calculated from your projects (same client name) and the pricing tab.')) + '</div></div>';
  wire(host);
}

function wire(host){
  const d = D(), root = $('.cs', host), wrap = $('#csWrap', host);
  const redo = () => { const sx = wrap.scrollLeft, sy = wrap.scrollTop; render(host); const w = $('#csWrap', host); if (w) { w.scrollLeft = sx; w.scrollTop = sy; } };
  const rowOf = id => d.rows.find(r => r.id === id);
  /* edit cells */
  root.addEventListener('input', e => {
    const el = e.target; if (el.id === 'csQ') { d.q = el.value; clearTimeout(root._q); root._q = setTimeout(() => { redo(); const i = $('#csQ', host); i.focus(); i.setSelectionRange(i.value.length, i.value.length); MSA.save(); }, 260); return; }
    if (!el.dataset.r) return; const r = rowOf(el.dataset.r); if (!r) return; if (el.dataset.prev == null) el.dataset.prev = r.c[el.dataset.c] || '';
    r.c[el.dataset.c] = el.value; MSA.save(); if (el.tagName === 'TEXTAREA') autoH(el);
  });
  root.addEventListener('change', e => {
    const el = e.target; if (!el.dataset.r) return; const r = rowOf(el.dataset.r); if (!r) return; const prev = el.dataset.prev; delete el.dataset.prev;
    if (el.dataset.c === 'name' && prev != null && norm(prev) !== norm(el.value)) { const n = projectsOf(prev).length; if (n) { clients.rename(prev, el.value.trim()); MSA.toast(T('تم تحديث اسم العميل في ' + n + ' مشروع', 'Client name updated in ' + n + ' project(s)'), 'ok'); } r.c.name = el.value.trim(); }
    if (el.dataset.c === 'name') { const tr = el.closest('tr'), cp = computed(r.c.name), cells = $$('.cs-calc', tr); if (cells.length >= 3) { cells[0].innerHTML = cp.n ? '<button class="cs-link" data-ca="folder" data-v="' + esc(r.c.name) + '">' + cp.n + '</button>' : '<span class="muted">0</span>'; cells[1].textContent = cp.done; cells[2].textContent = cp.val && MSA.rates ? MSA.rates.fmt(cp.val, 0) : '—'; } }
    else if (el.classList.contains('pill') || el.getAttribute('list')) { el.classList.toggle('pill', !!el.value); el.style.setProperty('--pc', pillColor(el.value)); }
  });
  const autoH = el => { el.style.height = 'auto'; el.style.height = Math.min(160, el.scrollHeight) + 'px'; };
  root.addEventListener('focusin', e => { if (e.target.tagName === 'TEXTAREA') autoH(e.target); });
  root.addEventListener('focusout', e => { if (e.target.tagName === 'TEXTAREA') e.target.style.height = ''; });
  /* keyboard: Enter / arrows move between rows */
  root.addEventListener('keydown', e => {
    const el = e.target; if (!el.dataset || !el.dataset.r) return; if (el.tagName === 'TEXTAREA' && e.key === 'Enter' && e.shiftKey) return;
    const dir = e.key === 'Enter' ? 1 : (e.key === 'ArrowDown' && el.tagName !== 'TEXTAREA' ? 1 : (e.key === 'ArrowUp' && el.tagName !== 'TEXTAREA' ? -1 : 0)); if (!dir) return;
    e.preventDefault(); const all = $$('[data-c="' + el.dataset.c + '"]', root), i = all.indexOf(el), nx = all[i + dir]; if (nx) { nx.focus(); nx.select && nx.select(); }
  });
  /* paste a block copied from Excel / Sheets */
  root.addEventListener('paste', e => {
    const el = e.target; if (!el.dataset || !el.dataset.r) return; const txt = (e.clipboardData || window.clipboardData).getData('text'); if (!/[\t\n]/.test(txt.replace(/[\r\n]+$/, ''))) return;
    e.preventDefault(); const grid = txt.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map(l => l.split('\t'));
    const vis = visibleRows(d), r0 = vis.findIndex(r => r.id === el.dataset.r), c0 = d.cols.findIndex(c => c.id === el.dataset.c); if (r0 < 0 || c0 < 0) return;
    grid.forEach((line, i) => { let r = vis[r0 + i]; if (!r) { r = { id: U.uid('cl'), ts: Date.now(), c: {} }; d.rows.push(r); vis.push(r); } line.forEach((v, j) => { const c = d.cols[c0 + j]; if (c) r.c[c.id] = v.trim(); }); });
    MSA.save(); redo(); MSA.toast(T('تم لصق ' + grid.length + ' صف', grid.length + ' row(s) pasted'), 'ok');
  });
  /* column resize */
  root.addEventListener('pointerdown', e => {
    const h = e.target.closest('[data-rs]'); if (!h) return; e.preventDefault(); const c = d.cols.find(x => x.id === h.dataset.rs), x0 = e.clientX, w0 = c.w, rtl = getComputedStyle(root).direction === 'rtl';
    const mv = ev => { c.w = Math.max(80, Math.min(600, Math.round(w0 + (rtl ? -(ev.clientX - x0) : ev.clientX - x0)))); const i = d.cols.indexOf(c); const cols = $$('col', root); cols[i + 1].style.width = c.w + 'px'; $('.cs-tbl', root).style.width = (d.cols.reduce((a, q) => a + q.w, 0) + 44 + 3 * 110 + 78) + 'px'; };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); MSA.save(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-ca]'); if (!b) return; const a = b.dataset.ca, v = b.dataset.v;
    if (a === 'projects') { S().ui.doneClient = null; MSA.go('done'); }
    else if (a === 'stat') { d.stat = v; MSA.save(); redo(); }
    else if (a === 'addrow') { const r = { id: U.uid('cl'), ts: Date.now(), c: { status: T('محتمل', 'Prospect'), since: U.dateKey(new Date()) } }; d.rows.push(r); d.q = ''; d.stat = ''; if (d.sort) d.sort = null; MSA.save(); redo(); const el = $('[data-r="' + r.id + '"][data-c="name"]', host); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } }
    else if (a === 'delrow') { const r = rowOf(v); if (!r) return; if (!await MSA.confirm(T('حذف العميل «' + (r.c.name || '') + '» من الشيت؟ (مشاريعه لا تُحذف)', 'Delete “' + (r.c.name || '') + '” from the sheet? (their projects stay)'), { danger: true, okLabel: T('حذف', 'Delete') })) return; if (r.ident && r.ident.logos) MSA.files.delMany(r.ident.logos); d.rows = d.rows.filter(x => x.id !== v); MSA.save(); redo(); }
    else if (a === 'sort') { d.sort = d.sort && d.sort.col === v ? (d.sort.dir === 'asc' ? { col: v, dir: 'desc' } : null) : { col: v, dir: 'asc' }; MSA.save(); redo(); }
    else if (a === 'msg') { const r = rowOf(v); if (r && MSA.plus) MSA.plus.messages({ client: r.c.name || '', kind: 'follow' }); }
    else if (a === 'folder') { S().ui.doneClient = v; S().ui.doneOpen = null; MSA.save(); MSA.go('done'); }
    else if (a === 'addcol') addCol(redo);
    else if (a === 'colmenu') colMenu(b, v, redo);
    else if (a === 'csv') exportCsv();
    else if (a === 'imp') importCsv(redo);
    else if (a === 'pdf') exportPdf();
  });
}

/* ---------- columns ---------- */
function addCol(redo){
  const d = D();
  MSA.modal({ title: T('عمود جديد', 'New column'), body: '<div class="field"><label class="f">' + esc(T('اسم العمود', 'Column name')) + '</label><input id="acN" type="text" dir="auto"></div><div class="field" style="margin:0"><label class="f">' + esc(T('النوع', 'Type')) + '</label><select id="acT">' + Object.keys(TYPES).map(k => '<option value="' + k + '">' + esc(T(TYPES[k][0], TYPES[k][1])) + '</option>').join('') + '</select></div>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('إضافة', 'Add'), cls: 'primary', onClick: a => { const n = $('#acN', a.el).value.trim(); if (!n) { $('#acN', a.el).focus(); return; } d.cols.push({ id: U.uid('k'), name: n, type: $('#acT', a.el).value, w: 160 }); MSA.save(); a.close(); redo(); } }],
    onMount: el => setTimeout(() => $('#acN', el).focus(), 30) });
}
function colMenu(btn, id, redo){
  const d = D(), c = d.cols.find(x => x.id === id), i = d.cols.indexOf(c), rc = btn.getBoundingClientRect();
  const mv = k => { const j = i + k; if (j < 0 || j >= d.cols.length) return; d.cols.splice(i, 1); d.cols.splice(j, 0, c); MSA.save(); redo(); };
  MSA.ctx(rc.left, rc.bottom + 4, [
    { icon: 'pencil', label: T('تغيير الاسم', 'Rename'), onClick: async () => { const v = await MSA.ask({ title: T('اسم العمود', 'Column name'), value: c.name }); if (v) { c.name = v; MSA.save(); redo(); } } },
    '-',
    ...Object.keys(TYPES).map(k => ({ icon: c.type === k ? 'check' : 'circle', label: T('النوع: ', 'Type: ') + T(TYPES[k][0], TYPES[k][1]), onClick: () => { c.type = k; MSA.save(); redo(); } })),
    '-',
    { icon: 'chev-u', label: T('ترتيب تصاعدي', 'Sort ascending'), onClick: () => { d.sort = { col: id, dir: 'asc' }; MSA.save(); redo(); } },
    { icon: 'chev-d', label: T('ترتيب تنازلي', 'Sort descending'), onClick: () => { d.sort = { col: id, dir: 'desc' }; MSA.save(); redo(); } },
    { icon: 'arrow-l', label: T('تحريك لليسار', 'Move left'), onClick: () => mv(-1) }, { icon: 'arrow-r', label: T('تحريك لليمين', 'Move right'), onClick: () => mv(1) },
    '-',
    ...(id === 'name' ? [] : [{ icon: 'trash', label: T('حذف العمود', 'Delete column'), danger: true, onClick: async () => { if (!await MSA.confirm(T('حذف العمود «' + c.name + '» وبياناته؟', 'Delete the column “' + c.name + '” and its data?'), { danger: true, okLabel: T('حذف', 'Delete') })) return; d.cols.splice(i, 1); d.rows.forEach(r => delete r.c[id]); MSA.save(); redo(); } }])
  ]);
}

/* ---------- CSV in / out (opens in Excel; UTF-8 with BOM keeps Arabic intact) ---------- */
function toCsv(rows, cols){ const q = v => { v = String(v == null ? '' : v); return /[",\n\r;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }; return '﻿' + [cols.map(c => q(c.name)).join(',')].concat(rows.map(r => cols.map(c => q(r.c[c.id])).join(','))).join('\r\n'); }
function parseCsv(text){
  text = text.replace(/^﻿/, ''); const first = text.split(/\r?\n/)[0] || ''; const sep = (first.split('\t').length > first.split(',').length) ? '\t' : (first.split(';').length > first.split(',').length ? ';' : ',');
  const out = []; let row = [], cur = '', inQ = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch; }
    else if (ch === '"') inQ = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); out.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch; }
  if (cur !== '' || row.length) { row.push(cur); out.push(row); } return out.filter(r => r.some(x => x.trim() !== ''));
}
function exportCsv(){
  const d = D(), blob = new Blob([toCsv(visibleRows(d), d.cols)], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'clients-' + U.dateKey(new Date()) + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  MSA.toast(T('تم تصدير الشيت — يفتح في Excel', 'Sheet exported — opens in Excel'), 'ok');
}
async function importCsv(redo){
  const [f] = await MSA.pickFiles('.csv,.tsv,.txt,text/csv', false); if (!f) return;
  const rows = parseCsv(await f.text()); if (rows.length < 2) { MSA.toast(T('الملف فاضي', 'The file is empty'), 'err'); return; }
  const d = D(), head = rows[0].map(h => h.trim()), map = head.map(h => { const c = d.cols.find(x => norm(x.name) === norm(h)); if (c) return c; const n = { id: U.uid('k'), name: h || '—', type: 'text', w: 160 }; d.cols.push(n); return n; });
  let n = 0; rows.slice(1).forEach(line => { const r = { id: U.uid('cl'), ts: Date.now(), c: {} }; line.forEach((v, j) => { if (map[j] && v.trim() !== '') r.c[map[j].id] = v.trim(); }); if (Object.keys(r.c).length) { d.rows.push(r); n++; } });
  MSA.save(); redo(); MSA.toast(T('تم استيراد ' + n + ' عميل', n + ' client(s) imported'), 'ok');
}

/* ---------- branded PDF (A4 landscape) ---------- */
async function exportPdf(){
  const d = D(), rows = visibleRows(d), prof = S().profile, acc = S().settings.accent || '#5b8def', logo = await logoData();
  const cols = d.cols.filter(c => c.type !== 'long' || c.id === 'notes').slice(0, 9);
  const th = '<tr>' + cols.map(c => '<th>' + esc(c.name) + '</th>').join('') + '<th>' + esc(T('المشاريع', 'Projects')) + '</th></tr>';
  const body = '<div class="pg"><div class="hd"><div style="display:flex;align-items:center;gap:14px">' + (logo ? '<img src="' + logo + '" alt="" style="height:54px">' : '') + '<div><h1 style="color:' + acc + ';margin:0">' + esc(T('قاعدة بيانات العملاء', 'Client database')) + '</h1><div class="muted">' + esc(prof.name || '') + ' · ' + esc(prof.title || '') + '</div></div></div><div style="text-align:end" class="muted">' + esc(U.dateKey(new Date())) + '<br>' + rows.length + ' ' + esc(T('عميل', 'clients')) + '</div></div>' +
    '<table class="cst"><thead>' + th + '</thead><tbody>' + rows.map(r => '<tr>' + cols.map(c => '<td>' + esc(colVal(r, c)) + '</td>').join('') + '<td dir="ltr">' + computed(r.c.name).n + '</td></tr>').join('') + '</tbody></table></div>';
  const css = '.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid ' + acc + ';padding-bottom:12px;margin-bottom:14px}.muted{color:#777;font-size:12px}.cst{width:100%;border-collapse:collapse;font-size:11px}.cst th{background:' + acc + ';color:#fff;padding:7px 8px;text-align:start}.cst td{padding:6px 8px;border-bottom:1px solid #e6e6e2;vertical-align:top}.cst tr:nth-child(even) td{background:#f6f6f3}';
  MSA.pdf.flow('clients-' + U.dateKey(new Date()) + '.pdf', body, { css, dir: en() ? 'ltr' : 'rtl', landscape: true });
}

MSA.views.clients = { render };
})();
