/* "ملفاتي" — a personal file manager: any file type, nested folders, colours, favourites, move / rename / delete, search.
   Blobs live in IndexedDB (MSA.files) so backup and sync include them; the tree lives in state.vault. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc, S = () => MSA.state;
const F = MSA.vault = {};
const COLORS = ['#5b8def', '#2fa66d', '#f0a030', '#e5484d', '#9b6bff', '#14b8a6', '#ec4899', '#f97316', '#eab308', '#8a8a86'];
const KINDS = () => [['', T('الكل', 'All')], ['fav', T('المفضلة', 'Favourites')], ['image', T('صور', 'Images')], ['video', T('فيديو', 'Video')], ['audio', T('صوت', 'Audio')], ['doc', T('مستندات', 'Documents')]];
let sel = new Set(), busy = false;

F.data = () => {
  const s = S(), v = s.vault = s.vault || {}; v.items = v.items || []; v.ui = v.ui || { cur: null, view: 'grid', sort: 'name', f: '', q: '' };
  if (v.ui.cur && !v.items.some(x => x.id === v.ui.cur && x.t === 'd')) v.ui.cur = null;
  return v;
};
const items = () => F.data().items, ui = () => F.data().ui;
const byId = id => items().find(x => x.id === id);
const kids = p => items().filter(x => (x.parent || null) === (p || null));
const isDesc = (id, anc) => { let c = byId(id); while (c) { if (c.id === anc) return true; c = c.parent ? byId(c.parent) : null; } return false; };
const subtree = id => { const out = [byId(id)]; kids(id).forEach(k => { out.push(...(k.t === 'd' ? subtree(k.id) : [k])); }); return out.filter(Boolean); };
const crumbs = id => { const o = []; let c = id ? byId(id) : null; while (c) { o.unshift(c); c = c.parent ? byId(c.parent) : null; } return o; };
const ext = n => { const m = /\.([A-Za-z0-9]{1,5})$/.exec(n || ''); return m ? m[1].toUpperCase() : ''; };
F.stats = () => { const f = items().filter(x => x.t === 'f'); return { files: f.length, folders: items().length - f.length, bytes: f.reduce((a, x) => a + ((x.a && x.a.size) || 0), 0), fav: items().filter(x => x.fav).length }; };
const when = ms => MSA.fmtDate ? MSA.fmtDate(ms) : new Date(ms).toLocaleDateString();

/* ---------- data operations ---------- */
F.newFolder = (name, parent, color) => { const x = { id: U.uid('vf'), t: 'd', name: String(name || '').trim() || T('مجلد جديد', 'New folder'), parent: parent || null, color: color || COLORS[0], fav: false, created: Date.now(), updated: Date.now() }; items().push(x); MSA.save(); return x; };
F.addFiles = async function(files, parent){
  const out = []; let fail = 0;
  for (const f of files) {
    try { const a = await MSA.files.put(f); const x = { id: U.uid('vf'), t: 'f', name: a.name, parent: parent || null, fav: false, created: Date.now(), updated: Date.now(), a }; items().push(x); out.push(x); }
    catch (e) { fail++; }
  }
  if (out.length) MSA.save();
  if (fail) MSA.toast(T('تعذّر رفع ' + fail + ' ملف', fail + ' file(s) could not be added'), 'err');
  return out;
};
F.move = (ids, parent) => { let n = 0; ids.forEach(id => { const x = byId(id); if (!x) return; if (x.t === 'd' && (id === parent || (parent && isDesc(parent, id)))) return; x.parent = parent || null; x.updated = Date.now(); n++; }); if (n) MSA.save(); return n; };
F.remove = async function(ids){
  const all = new Map(); ids.forEach(id => { const x = byId(id); if (x) subtree(id).forEach(y => all.set(y.id, y)); });
  for (const y of all.values()) if (y.t === 'f' && y.a) { try { await MSA.files.del(y.a.id); } catch (e) {} }
  const v = F.data(); v.items = v.items.filter(x => !all.has(x.id)); MSA.save(); return all.size;
};
F.rename = (id, name) => { const x = byId(id); name = String(name || '').trim(); if (!x || !name) return false; x.name = name; if (x.a) x.a.name = name; x.updated = Date.now(); MSA.save(); return true; };

/* ---------- view ---------- */
const folderSvg = c => '<svg viewBox="0 0 64 52" class="fm-fsvg" aria-hidden="true"><path d="M4 8a4 4 0 0 1 4-4h14l6 6h28a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="' + c + '" opacity=".55"/><path d="M4 18a4 4 0 0 1 4-4h48a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="' + c + '"/></svg>';
const KI = { image: 'image', video: 'video', audio: 'music', doc: 'doc' };
function shown(){
  const v = F.data(), q = (v.ui.q || '').trim().toLowerCase(), f = v.ui.f;
  let list;
  if (q || f) list = v.items.filter(x => (!q || x.name.toLowerCase().includes(q)) && (!f || (f === 'fav' ? x.fav : (x.t === 'f' && x.a && x.a.kind === f))));
  else list = kids(v.ui.cur);
  const s = v.ui.sort, dir = (a, b) => (a.t === b.t ? 0 : a.t === 'd' ? -1 : 1);
  return list.slice().sort((a, b) => dir(a, b) || (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || (s === 'date' ? b.updated - a.updated : s === 'size' ? ((b.a && b.a.size) || 0) - ((a.a && a.a.size) || 0) : s === 'type' ? (ext(a.name) + '').localeCompare(ext(b.name)) : a.name.localeCompare(b.name, MSA.state.settings.lang === 'en' ? 'en' : 'ar', { numeric: true })));
}
function cardHTML(x, list){
  const isD = x.t === 'd', n = isD ? kids(x.id).length : 0, k = x.a && x.a.kind;
  const th = isD ? folderSvg(x.color || COLORS[0]) : (k === 'image' ? '<img data-thumb="' + x.a.id + '" alt="">' : k === 'video' ? '<video data-thumb="' + x.a.id + '" muted preload="metadata"></video>' : '<div class="fm-ico">' + I(KI[k] || 'doc', 'lg') + '</div>');
  return '<div class="fm-card' + (sel.has(x.id) ? ' sel' : '') + (isD ? ' dir' : '') + '" data-id="' + x.id + '" draggable="true" tabindex="0" role="button" aria-label="' + esc(x.name) + '">' +
    '<button class="fm-chk" data-fa="chk" aria-label="select">' + (sel.has(x.id) ? I('check', 'sm') : '') + '</button>' +
    '<button class="fm-star' + (x.fav ? ' on' : '') + '" data-fa="fav" aria-label="favourite" title="' + esc(T('المفضلة', 'Favourite')) + '">' + I('star', 'sm') + '</button>' +
    '<div class="fm-th">' + th + (!isD && ext(x.name) ? '<span class="fm-ext">' + esc(ext(x.name)) + '</span>' : '') + '</div>' +
    '<div class="fm-nm" dir="auto">' + esc(x.name) + '</div>' +
    '<div class="fm-mt">' + (isD ? esc(T(n + ' عنصر', n + ' item(s)')) : esc(U.size((x.a && x.a.size) || 0))) + ' · ' + esc(when(x.updated)) + '</div>' +
    '<button class="fm-more" data-fa="more" aria-label="more">' + I('more', 'sm') + '</button></div>';
}
function render(host){
  const v = F.data(), u = v.ui, list = shown(), st = F.stats(), path = crumbs(u.cur), flat = !!(u.q || u.f);
  host.innerHTML = '<div class="fm">' +
    '<div class="fm-head"><div class="fm-title">' + I('folder', 'lg') + '<div><h1>' + esc(T('ملفاتي', 'My files')) + '</h1><div class="sub">' + esc(T(st.files + ' ملف · ' + st.folders + ' مجلد · ' + U.size(st.bytes), st.files + ' files · ' + st.folders + ' folders · ' + U.size(st.bytes))) + '</div></div></div>' +
      '<div class="row fm-acts"><button class="btn primary" data-fa="up">' + I('upload', 'sm') + '<span>' + esc(T('رفع ملفات', 'Upload')) + '</span></button><button class="btn" data-fa="newf">' + I('folder-plus', 'sm') + '<span>' + esc(T('مجلد جديد', 'New folder')) + '</span></button></div></div>' +
    '<div class="fm-crumbs">' + (flat ? '<span class="muted">' + esc(T('نتائج البحث / التصفية', 'Search / filter results')) + '</span>' : '<button data-fa="go" data-id="">' + I('home', 'sm') + esc(T('ملفاتي', 'My files')) + '</button>' + path.map(c => '<span class="sep">›</span><button data-fa="go" data-id="' + c.id + '" dir="auto">' + esc(c.name) + '</button>').join('')) + '</div>' +
    '<div class="fm-bar"><div class="cs-search grow">' + I('search', 'sm') + '<input type="search" id="fmQ" dir="auto" placeholder="' + esc(T('ابحث في كل ملفاتك…', 'Search all your files…')) + '" value="' + esc(u.q || '') + '"></div>' +
      '<select id="fmSort" aria-label="sort">' + [['name', T('الاسم', 'Name')], ['date', T('الأحدث', 'Newest')], ['size', T('الحجم', 'Size')], ['type', T('النوع', 'Type')]].map(o => '<option value="' + o[0] + '"' + (u.sort === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>' +
      '<div class="seg" id="fmView"><button data-v="grid" class="' + (u.view !== 'list' ? 'on' : '') + '" aria-label="grid">' + I('grid', 'sm') + '</button><button data-v="list" class="' + (u.view === 'list' ? 'on' : '') + '" aria-label="list">' + I('list', 'sm') + '</button></div></div>' +
    '<div class="pchips" style="margin:6px 0 10px">' + KINDS().map(k => '<button class="pchip' + (u.f === k[0] ? ' on' : '') + '" data-fa="f" data-v="' + k[0] + '">' + (k[0] === 'fav' ? I('star', 'xs') : '') + esc(k[1]) + '</button>').join('') + '</div>' +
    (sel.size ? '<div class="fm-sel"><b>' + esc(T(sel.size + ' محدد', sel.size + ' selected')) + '</b><button class="btn sm" data-fa="bmove">' + I('folder', 'sm') + esc(T('نقل', 'Move')) + '</button><button class="btn sm" data-fa="bfav">' + I('star', 'sm') + esc(T('مفضلة', 'Favourite')) + '</button><button class="btn sm" data-fa="bdl">' + I('download', 'sm') + esc(T('تنزيل', 'Download')) + '</button><button class="btn sm danger" data-fa="bdel">' + I('trash', 'sm') + esc(T('حذف', 'Delete')) + '</button><span class="grow"></span><button class="btn sm ghost" data-fa="bclr">' + esc(T('إلغاء التحديد', 'Clear')) + '</button></div>' : '') +
    (list.length ? '<div class="fm-grid ' + (u.view === 'list' ? 'list' : '') + '" id="fmGrid">' + list.map(x => cardHTML(x, list)).join('') + '</div>'
      : '<div class="fm-empty" id="fmGrid">' + MSA.empty('folder', flat ? T('لا نتائج', 'No results') : T('المجلد فاضي', 'This folder is empty'), flat ? '' : T('اضغط «رفع ملفات» أو اسحب ملفاتك هنا، وأنشئ مجلدات لتنظيمها.', 'Tap “Upload” or drag files here, and create folders to organise them.')) + '</div>') +
    '<div class="fm-drop" id="fmDrop" hidden>' + I('upload', 'lg') + '<b>' + esc(T('أفلت الملفات هنا', 'Drop files here')) + '</b></div></div>';
  MSA.hydrateAtts(host);
  wire(host, list);
}
const redo = () => { MSA.save(); MSA.rerender(true); };

function pickFolder(title, exclude, cur, done){
  const folders = items().filter(x => x.t === 'd' && !exclude.some(id => id === x.id || isDesc(x.id, id)));
  const depth = x => crumbs(x.id).length - 1, ord = [];
  const walk = (p, d) => kids(p).filter(k => k.t === 'd' && folders.includes(k)).sort((a, b) => a.name.localeCompare(b.name)).forEach(k => { ord.push([k, d]); walk(k.id, d + 1); });
  walk(null, 0); let pick = cur === undefined ? null : cur;
  const m = MSA.modal({ title, size: 'sm', body: '<div class="fm-pick"><button class="fm-pk" data-p="">' + I('home', 'sm') + esc(T('ملفاتي (الرئيسية)', 'My files (root)')) + '</button>' + ord.map(([k, d]) => '<button class="fm-pk" data-p="' + k.id + '" style="padding-inline-start:' + (10 + d * 18) + 'px"><span style="color:' + (k.color || COLORS[0]) + '">' + I('folder', 'sm') + '</span><span dir="auto">' + esc(k.name) + '</span></button>').join('') + '</div><button class="btn sm" id="fmPkNew" style="margin-top:10px">' + I('folder-plus', 'sm') + esc(T('مجلد جديد هنا', 'New folder here')) + '</button>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('نقل هنا', 'Move here'), cls: 'primary', onClick: a => { a.close(); done(pick); } }],
    onMount: el => {
      const paint = () => $$('.fm-pk', el).forEach(b => b.classList.toggle('on', (b.dataset.p || null) === pick));
      el.addEventListener('click', e => { const b = e.target.closest('.fm-pk'); if (b) { pick = b.dataset.p || null; paint(); } });
      $('#fmPkNew', el).onclick = async () => { const n = await askName(T('اسم المجلد', 'Folder name'), ''); if (n) { const f = F.newFolder(n, pick); m.close(); pickFolder(title, exclude, f.id, done); } };
      paint();
    } });
}
function askName(title, val){
  return new Promise(res => {
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    MSA.modal({ title, size: 'sm', onClose: () => fin(null), body: '<div class="field" style="margin:0"><input id="fmNm" dir="auto" value="' + esc(val) + '" autocomplete="off"></div>',
      buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('حفظ', 'Save'), cls: 'primary', onClick: a => { const v = $('#fmNm', a.el).value.trim(); if (!v) { $('#fmNm', a.el).focus(); return; } fin(v); a.close(); } }],
      onMount: el => { const i = $('#fmNm', el); setTimeout(() => { i.focus(); i.select(); }, 50); i.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const b = [...$$('button', el.closest('.modal') || el)].find(z => z.classList.contains('primary')); b && b.click(); } }; } });
  });
}
function folderDialog(x, parent, done){
  let color = (x && x.color) || COLORS[0];
  const m = MSA.modal({ title: x ? T('تعديل المجلد', 'Edit folder') : T('مجلد جديد', 'New folder'), size: 'sm',
    body: '<div class="field"><label class="f">' + esc(T('الاسم', 'Name')) + '</label><input id="fdN" dir="auto" value="' + esc(x ? x.name : '') + '" autocomplete="off"></div><div class="field"><label class="f">' + esc(T('اللون', 'Colour')) + '</label><div class="fm-cols" id="fdC">' + COLORS.map(c => '<button class="fm-col" data-c="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>').join('') + '<input type="color" id="fdCc" value="' + color + '" title="' + esc(T('لون مخصص', 'Custom colour')) + '"></div></div><div class="fm-prev" id="fdP"></div>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('حفظ', 'Save'), cls: 'primary', onClick: a => { const n = $('#fdN', a.el).value.trim() || T('مجلد جديد', 'New folder'); if (x) { x.name = n; x.color = color; x.updated = Date.now(); MSA.save(); } else F.newFolder(n, parent, color); a.close(); done && done(); } }],
    onMount: el => {
      const paint = () => { $('#fdP', el).innerHTML = folderSvg(color); $$('.fm-col', el).forEach(b => b.classList.toggle('on', b.dataset.c === color)); $('#fdCc', el).value = color; };
      el.addEventListener('click', e => { const b = e.target.closest('.fm-col'); if (b) { color = b.dataset.c; paint(); } });
      $('#fdCc', el).oninput = e => { color = e.target.value; paint(); };
      $('#fdN', el).onkeydown = e => { if (e.key === 'Enter') { const b = [...$$('.modal button', el)].find(z => z.classList.contains('primary')); b && b.click(); } };
      paint(); setTimeout(() => { const i = $('#fdN', el); i.focus(); i.select(); }, 60);
    } });
}
async function upload(files){
  if (!files || !files.length || busy) return; busy = true;
  MSA.toast(T('جاري رفع ' + files.length + ' ملف…', 'Adding ' + files.length + ' file(s)…'), 'ok', 1800);
  const out = await F.addFiles(files, ui().cur); busy = false;
  if (out.length) MSA.toast(T('اتضاف ' + out.length + ' ملف', out.length + ' file(s) added'), 'ok');
  if (MSA.view === 'files') MSA.rerender(true);
}
async function download(ids){
  for (const id of ids) { const x = byId(id); if (x && x.t === 'f') { await MSA.downloadAtt(x.a); await new Promise(r => setTimeout(r, 250)); } else if (x && x.t === 'd') await download(kids(x.id).map(k => k.id)); }
}
async function del(ids){
  const n = ids.reduce((a, id) => a + subtree(id).length, 0), one = ids.length === 1 && byId(ids[0]);
  const msg = one ? T('حذف «' + one.name + '»' + (one.t === 'd' ? ' وكل اللي جواه' : '') + '؟ لا يمكن التراجع.', 'Delete “' + one.name + '”' + (one.t === 'd' ? ' and everything inside' : '') + '? This cannot be undone.') : T('حذف ' + n + ' عنصر؟ لا يمكن التراجع.', 'Delete ' + n + ' item(s)? This cannot be undone.');
  if (!await MSA.confirm(msg, { danger: true })) return false;
  await F.remove(ids); ids.forEach(id => sel.delete(id)); return true;
}
/* ---------- right-click menu (like Drive / Explorer) ---------- */
let clip = null; /* {ids, mode:'copy'|'cut'} */
const isText = x => x.t === 'f' && x.a && (/^text\//.test(x.a.mime || '') || /^(txt|md|csv|json|log|srt|vtt|xml|html?|css|js)$/i.test(ext(x.name)));
const isPdf = x => x.t === 'f' && x.a && (x.a.mime === 'application/pdf' || ext(x.name) === 'PDF');
const printable = x => x.t === 'f' && x.a && (x.a.kind === 'image' || isPdf(x) || isText(x));
const uniqueName = (n, parent) => { const sib = new Set(kids(parent).map(k => k.name)); if (!sib.has(n)) return n; const m = /^(.*?)(\.[A-Za-z0-9]{1,5})?$/.exec(n), base = m[1], ex = m[2] || ''; for (let i = 1; i < 1000; i++) { const c = base + ' (' + (i === 1 ? T('نسخة', 'copy') : T('نسخة ', 'copy ') + i) + ')' + ex; if (!sib.has(c)) return c; } return n + Date.now(); };
async function cloneItem(x, parent){
  const c = { id: U.uid('vf'), t: x.t, name: uniqueName(x.name, parent), parent: parent || null, fav: false, created: Date.now(), updated: Date.now() };
  if (x.t === 'd') { c.color = x.color; items().push(c); for (const k of kids(x.id).slice()) await cloneItem(k, c.id); return c; }
  const rec = await MSA.files.get(x.a.id); if (!rec) return null;
  c.a = await MSA.files.put(new File([rec.blob], c.name, { type: rec.mime || x.a.mime || '' })); items().push(c); return c;
}
async function pasteInto(parent){
  if (!clip || !clip.ids.length) return 0;
  const ids = clip.ids.filter(id => byId(id)); let n = 0;
  if (clip.mode === 'cut') { n = F.move(ids, parent); clip = null; }
  else { for (const id of ids) { const c = await cloneItem(byId(id), parent); if (c) n++; } MSA.save(); }
  return n;
}
function propsDialog(x){
  const isD = x.t === 'd', all = isD ? subtree(x.id).filter(y => y.id !== x.id) : [], files = all.filter(y => y.t === 'f'), bytes = files.reduce((a, y) => a + ((y.a && y.a.size) || 0), 0);
  const path = ['ملفاتي'].concat(crumbs(x.parent).map(c => c.name)).join(' / ');
  const row = (k, v) => '<div class="row" style="justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line,rgba(128,128,128,.2))"><span class="muted">' + esc(k) + '</span><b dir="auto" style="text-align:end;word-break:break-all">' + esc(v) + '</b></div>';
  MSA.modal({ title: T('خصائص', 'Properties'), size: 'sm', buttons: [{ label: T('إغلاق', 'Close'), cls: 'primary', onClick: a => a.close() }],
    body: row(T('الاسم', 'Name'), x.name) + row(T('النوع', 'Type'), isD ? T('مجلد', 'Folder') : (ext(x.name) || (x.a && x.a.kind) || T('ملف', 'File'))) + row(T('المكان', 'Location'), path) +
      row(T('الحجم', 'Size'), U.size(isD ? bytes : ((x.a && x.a.size) || 0))) + (isD ? row(T('المحتوى', 'Contents'), T(files.length + ' ملف و ' + (all.length - files.length) + ' مجلد', files.length + ' file(s), ' + (all.length - files.length) + ' folder(s)')) : '') +
      row(T('تاريخ الإضافة', 'Created'), when(x.created)) + row(T('آخر تعديل', 'Modified'), when(x.updated)) });
}
async function printItems(list){
  const ps = list.filter(printable);
  if (!ps.length) { MSA.toast(T('الطباعة متاحة للصور وملفات PDF والنصوص. نزّل الملف وافتحه ببرنامجه للأنواع التانية.', 'Printing works for images, PDFs and text. Download other types and open them in their own app.'), 'err', 3500); return; }
  const pdf = ps.find(isPdf);
  const frame = document.createElement('iframe'); frame.style.cssText = 'position:fixed;inset-inline-end:0;bottom:0;width:0;height:0;border:0;opacity:0'; document.body.appendChild(frame);
  const cleanup = () => setTimeout(() => frame.remove(), 60000);
  try {
    if (pdf) { const u = await MSA.files.url(pdf.a.id); frame.onload = () => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) { MSA.toast(T('تعذّرت الطباعة من هنا — نزّل الملف واطبعه.', 'Could not print here — download the file and print it.'), 'err'); } }; frame.src = u; cleanup(); return; }
    let body = '';
    for (const x of ps) {
      if (x.a.kind === 'image') body += '<img src="' + await MSA.files.url(x.a.id) + '" style="max-width:100%;max-height:96vh;display:block;margin:0 auto;page-break-after:always">';
      else { const rec = await MSA.files.get(x.a.id); body += '<h4 style="font:600 14px sans-serif">' + esc(x.name) + '</h4><pre dir="auto" style="white-space:pre-wrap;font:13px/1.6 monospace;page-break-after:always">' + esc(await rec.blob.text()) + '</pre>'; }
    }
    frame.srcdoc = '<!doctype html><meta charset="utf-8"><title>' + esc(ps.length === 1 ? ps[0].name : 'My files') + '</title><body style="margin:0">' + body + '</body>';
    frame.onload = () => { const w = frame.contentWindow, imgs = Array.from(w.document.images), go = () => { try { w.focus(); w.print(); } catch (e) { MSA.toast(T('تعذّرت الطباعة من هنا.', 'Could not print here.'), 'err'); } }; Promise.all(imgs.map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))).then(go); };
    cleanup();
  } catch (e) { frame.remove(); MSA.toast(T('تعذّرت الطباعة.', 'Print failed.'), 'err'); }
  if (ps.length < list.length) MSA.toast(T('اتطبع المتاح بس (صور/PDF/نص).', 'Only printable files were sent (images/PDF/text).'), 'ok');
}
async function editText(x){
  const rec = await MSA.files.get(x.a.id); const txt = rec ? await rec.blob.text() : '';
  MSA.modal({ title: x.name, size: 'wide', body: '<textarea id="fmTx" dir="auto" rows="16" style="width:100%;font:14px/1.6 monospace;resize:vertical"></textarea>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('حفظ', 'Save'), cls: 'primary', onClick: async a => {
      const v = $('#fmTx', a.el).value, old = x.a.id; const na = await MSA.files.put(new File([v], x.name, { type: x.a.mime || 'text/plain' }));
      x.a = na; x.updated = Date.now(); try { await MSA.files.del(old); } catch (e) {} MSA.save(); a.close(); MSA.toast(T('اتحفظ', 'Saved'), 'ok'); MSA.rerender(true);
    } }], onMount: el => { const t = $('#fmTx', el); t.value = txt; setTimeout(() => t.focus(), 60); } });
}
async function newTextFile(parent){
  const n = await askName(T('اسم الملف النصي', 'Text file name'), T('ملف جديد.txt', 'New file.txt')); if (!n) return;
  const name = uniqueName(/\.[A-Za-z0-9]{1,5}$/.test(n) ? n : n + '.txt', parent);
  const out = await F.addFiles([new File([''], name, { type: 'text/plain' })], parent); MSA.rerender(true); if (out[0]) editText(out[0]);
}
const targets = x => (sel.has(x.id) && sel.size > 1) ? [...sel].map(byId).filter(Boolean) : [x];
function entriesFor(x){
  const ts = x ? targets(x) : [], one = ts.length === 1, isD = x && x.t === 'd', u = ui();
  const E = (id, label, icon, o) => Object.assign({ id, label, icon }, o || {});
  if (x) {
    const files = ts.filter(y => y.t === 'f');
    const L = [];
    if (one) L.push(E('open', isD ? T('فتح', 'Open') : T('معاينة', 'Preview'), isD ? 'folder-open' : 'eye', { key: 'Enter' }));
    if (one && isText(x)) L.push(E('edit', T('تحرير النص', 'Edit text'), 'pencil'));
    L.push('-');
    if (files.length || ts.some(y => y.t === 'd')) L.push(E('dl', T('تنزيل', 'Download'), 'download'));
    if (ts.some(printable)) L.push(E('print', T('طباعة', 'Print'), 'printer', { key: 'Ctrl+P' }));
    if (files.length && navigator.canShare) L.push(E('share', T('مشاركة', 'Share'), 'share'));
    L.push('-', E('cut', T('قص', 'Cut'), 'scissors', { key: 'Ctrl+X' }), E('copy', T('نسخ', 'Copy'), 'copy', { key: 'Ctrl+C' }));
    if (one && isD && clip) L.push(E('pasteIn', T('لصق داخل المجلد', 'Paste into folder'), 'paste', { key: 'Ctrl+V' }));
    L.push(E('dup', T('تكرار', 'Duplicate'), 'layers'), E('mv', T('نقل إلى…', 'Move to…'), 'folder'));
    if (one) L.push(E('ren', isD ? T('تعديل الاسم واللون', 'Rename & colour') : T('إعادة تسمية', 'Rename'), 'pencil', { key: 'F2' }));
    L.push(E('fav', ts.every(y => y.fav) ? T('إزالة من المفضلة', 'Remove from favourites') : T('إضافة للمفضلة', 'Add to favourites'), 'star'));
    if (!sel.has(x.id)) L.push(E('select', T('تحديد', 'Select'), 'check'));
    if (one) L.push(E('props', T('خصائص', 'Properties'), 'info', { key: 'Alt+Enter' }));
    L.push('-', E('del', ts.length > 1 ? T('حذف ' + ts.length + ' عنصر', 'Delete ' + ts.length + ' items') : T('حذف', 'Delete'), 'trash', { danger: true, key: 'Del' }));
    return L;
  }
  const L = [E('newf', T('مجلد جديد', 'New folder'), 'folder-plus'), E('newt', T('ملف نصي جديد', 'New text file'), 'file-plus'), E('up', T('رفع ملفات', 'Upload files'), 'upload'), '-'];
  L.push(E('paste', T('لصق', 'Paste'), 'paste', { key: 'Ctrl+V', disabled: !clip }), E('all', T('تحديد الكل', 'Select all'), 'checks', { key: 'Ctrl+A' }), '-');
  const srt = [['name', T('الاسم', 'Name')], ['date', T('التاريخ', 'Date')], ['size', T('الحجم', 'Size')], ['type', T('النوع', 'Type')]];
  L.push(E('sort', T('ترتيب حسب', 'Sort by'), 'list', { sub: srt.map(s => E('sort:' + s[0], s[1], u.sort === s[0] ? 'check' : '')) }),
    E('view', u.view === 'list' ? T('عرض شبكة', 'Grid view') : T('عرض قائمة', 'List view'), u.view === 'list' ? 'grid' : 'list'), E('refresh', T('تحديث', 'Refresh'), 'refresh', { key: 'F5' }));
  return L;
}
let ctxEl = null;
function closeCtx(){ if (ctxEl) { ctxEl.remove(); ctxEl = null; document.removeEventListener('mousedown', ctxOut, true); document.removeEventListener('keydown', ctxKey, true); window.removeEventListener('resize', closeCtx); window.removeEventListener('blur', closeCtx); } }
const ctxOut = e => { if (ctxEl && !ctxEl.contains(e.target)) closeCtx(); };
const ctxKey = e => {
  if (!ctxEl) return; const bs = [...ctxEl.querySelectorAll('button:not(:disabled)')], i = bs.indexOf(document.activeElement);
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCtx(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); (bs[(i + 1) % bs.length] || bs[0]).focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); (bs[(i - 1 + bs.length) % bs.length] || bs[0]).focus(); }
};
function showCtx(pt, entries, run, title){
  closeCtx();
  const el = ctxEl = document.createElement('div'); el.className = 'fm-ctx'; el.setAttribute('role', 'menu'); el.dir = document.documentElement.dir || 'rtl';
  const draw = (list, back) => {
    el.innerHTML = (back ? '<button class="fm-ci" data-back="1">' + I('chev-r', 'sm flip') + '<span>' + esc(T('رجوع', 'Back')) + '</span></button><hr>' : '') +
      list.map(en => en === '-' ? '<hr>' : '<button class="fm-ci' + (en.danger ? ' danger' : '') + '" role="menuitem" data-m="' + en.id + '"' + (en.disabled ? ' disabled' : '') + '>' + (en.dot ? '<i class="fm-dot' + (en.icon === 'check' ? ' on' : '') + '" style="background:' + esc(en.dot) + '"></i>' : en.icon ? I(en.icon, 'sm') : '<span class="fm-ico0"></span>') + '<span>' + esc(en.label) + '</span>' + (en.sub ? I('chev-l', 'sm flip fm-sub') : en.key ? '<kbd>' + esc(en.key) + '</kbd>' : '') + '</button>').join('');
    el._list = list;
  };
  draw(entries);
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.back) { draw(entries); return; }
    const en = el._list.find(z => z !== '-' && z.id === b.dataset.m); if (!en) return;
    if (en.sub) { draw(en.sub, true); return; }
    closeCtx(); run(en.id);
  });
  el.addEventListener('contextmenu', e => e.preventDefault());
  document.body.appendChild(el);
  const w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight;
  let x = pt.x, y = pt.y; if (x + w > vw - 6) x = Math.max(6, x - w); if (y + h > vh - 6) y = Math.max(6, vh - h - 6); if (x < 6) x = 6;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  setTimeout(() => { document.addEventListener('mousedown', ctxOut, true); document.addEventListener('keydown', ctxKey, true); window.addEventListener('resize', closeCtx); window.addEventListener('blur', closeCtx); }, 0);
  const f = el.querySelector('button:not(:disabled)'); f && f.focus({ preventScroll: true });
  return el;
}
async function runAct(a, x, host){
  const u = ui(), ts = x ? targets(x) : [], one = ts.length === 1, re = () => MSA.rerender(true);
  if (a.startsWith('sort:')) { u.sort = a.slice(5); redo(); return; }
  if (a === 'open') openItem(x);
  else if (a === 'edit') editText(x);
  else if (a === 'dl') download(ts.map(y => y.id));
  else if (a === 'print') printItems(ts.flatMap(y => y.t === 'd' ? subtree(y.id).filter(z => z.t === 'f') : [y]));
  else if (a === 'share') { try { const fs = []; for (const y of ts.filter(z => z.t === 'f')) { const r = await MSA.files.get(y.a.id); if (r) fs.push(new File([r.blob], y.name, { type: r.mime || '' })); } if (navigator.canShare({ files: fs })) await navigator.share({ files: fs }); else MSA.toast(T('المشاركة مش متاحة هنا.', 'Sharing is not available here.'), 'err'); } catch (e) { if (e && e.name !== 'AbortError') MSA.toast(T('تعذّرت المشاركة.', 'Could not share.'), 'err'); } }
  else if (a === 'cut' || a === 'copy') { clip = { ids: ts.map(y => y.id), mode: a }; MSA.toast(T((a === 'cut' ? 'اتقص ' : 'اتنسخ ') + ts.length + ' عنصر — الصق في أي مجلد', (a === 'cut' ? 'Cut ' : 'Copied ') + ts.length + ' item(s) — paste into any folder'), 'ok', 1800); }
  else if (a === 'paste' || a === 'pasteIn') { const n = await pasteInto(a === 'pasteIn' ? x.id : u.cur); if (n) { MSA.toast(T('اتلصق ' + n + ' عنصر', n + ' pasted'), 'ok'); re(); } }
  else if (a === 'dup') { let n = 0; for (const y of ts) { const c = await cloneItem(y, y.parent); if (c) n++; } MSA.save(); sel.clear(); MSA.toast(T('اتعمل ' + n + ' نسخة', n + ' duplicated'), 'ok'); re(); }
  else if (a === 'mv') pickFolder(one ? T('نقل «' + x.name + '» إلى', 'Move “' + x.name + '” to') : T('نقل ' + ts.length + ' عنصر إلى', 'Move ' + ts.length + ' item(s) to'), ts.filter(y => y.t === 'd').map(y => y.id), one ? (x.parent || null) : undefined, p => { const n = F.move(ts.map(y => y.id), p); sel.clear(); MSA.toast(T('اتنقل ' + n + ' عنصر', n + ' moved'), 'ok'); re(); });
  else if (a === 'ren') { if (x.t === 'd') folderDialog(x, x.parent, re); else { const n = await askName(T('الاسم الجديد', 'New name'), x.name); if (n) { F.rename(x.id, n); re(); } } }
  else if (a === 'fav') { const on = !ts.every(y => y.fav); ts.forEach(y => { y.fav = on; }); redo(); }
  else if (a === 'select') { sel.add(x.id); render(host); }
  else if (a === 'props') propsDialog(x);
  else if (a === 'del') { if (await del(ts.map(y => y.id))) re(); }
  else if (a === 'newf') folderDialog(null, u.cur, re);
  else if (a === 'newt') newTextFile(u.cur);
  else if (a === 'up') upload(await MSA.pickFiles('', true));
  else if (a === 'all') { shown().forEach(y => sel.add(y.id)); render(host); }
  else if (a === 'view') { u.view = u.view === 'list' ? 'grid' : 'list'; redo(); }
  else if (a === 'refresh') re();
}
F.ctx = { entries: entriesFor, clip: () => clip, run: runAct };
MSA.menu = { show: showCtx, close: closeCtx };
function itemMenu(x, pt, host){
  host = host || document.getElementById('fmGrid') && document.getElementById('fmGrid').closest('.fm') && document.getElementById('fmGrid').parentNode;
  if (!pt) { const c = document.querySelector('.fm-card[data-id="' + x.id + '"]'), r = c ? c.getBoundingClientRect() : { left: innerWidth / 2 - 100, top: innerHeight / 3, width: 0 }; pt = { x: r.left + Math.min(r.width, 40), y: r.top + 24 }; }
  showCtx(pt, entriesFor(x), a => runAct(a, x, host));
}
function openItem(x){
  if (x.t === 'd') { const u = ui(); u.cur = x.id; u.q = ''; u.f = ''; sel.clear(); redo(); return; }
  const files = shown().filter(y => y.t === 'f').map(y => y.a); MSA.openAtt(x.a, files);
}
let curHost = null;
document.addEventListener('keydown', e => { if (!(e.target.closest && e.target.closest('input,select,textarea,button,[contenteditable=true]')) && curHost && MSA.view === 'files' && curHost.isConnected && !document.querySelector('.overlay,.fm-ctx') && curHost.onkeydown) curHost.onkeydown(e); });
function wire(host, list){
  curHost = host; const u = ui(), grid = $('#fmGrid', host);
  const q = $('#fmQ', host); q.oninput = e => { u.q = e.target.value; const pos = e.target.selectionStart; render(host); const i = $('#fmQ', host); i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} };
  $('#fmSort', host).onchange = e => { u.sort = e.target.value; redo(); };
  $('#fmView', host).onclick = e => { const b = e.target.closest('[data-v]'); if (b) { u.view = b.dataset.v; redo(); } };
  host.onclick = async e => {
    const b = e.target.closest('[data-fa]'), card = e.target.closest('.fm-card'), x = card && byId(card.dataset.id);
    if (!b) { if (x) { if (sel.size) { sel.has(x.id) ? sel.delete(x.id) : sel.add(x.id); render(host); } else openItem(x); } return; }
    const a = b.dataset.fa;
    if (a === 'up') upload(await MSA.pickFiles('', true));
    else if (a === 'newf') folderDialog(null, u.cur, () => MSA.rerender(true));
    else if (a === 'go') { u.cur = b.dataset.id || null; u.q = ''; u.f = ''; sel.clear(); redo(); }
    else if (a === 'f') { u.f = b.dataset.v; sel.clear(); redo(); }
    else if (a === 'chk' && x) { sel.has(x.id) ? sel.delete(x.id) : sel.add(x.id); render(host); }
    else if (a === 'fav' && x) { x.fav = !x.fav; x.updated = x.updated; redo(); }
    else if (a === 'more' && x) { const r = b.getBoundingClientRect(); itemMenu(x, { x: r.left, y: r.bottom }, host); }
    else if (a === 'bclr') { sel.clear(); render(host); }
    else if (a === 'bfav') { const all = [...sel].map(byId).filter(Boolean), on = !all.every(y => y.fav); all.forEach(y => { y.fav = on; }); redo(); }
    else if (a === 'bdl') download([...sel]);
    else if (a === 'bmove') pickFolder(T('نقل ' + sel.size + ' عنصر إلى', 'Move ' + sel.size + ' item(s) to'), [...sel].filter(id => (byId(id) || {}).t === 'd'), undefined, p => { const n = F.move([...sel], p); sel.clear(); MSA.toast(T('اتنقل ' + n + ' عنصر', n + ' moved'), 'ok'); MSA.rerender(true); });
    else if (a === 'bdel') { if (await del([...sel])) MSA.rerender(true); }
  };
  host.oncontextmenu = e => {
    if (e.target.closest('input,select,textarea')) return;
    e.preventDefault(); const c = e.target.closest('.fm-card'), pt = { x: e.clientX, y: e.clientY };
    if (c) { const x = byId(c.dataset.id); if (!x) return; if (!sel.has(x.id) && sel.size) { sel.clear(); render(host); } showCtx(pt, entriesFor(x), a => runAct(a, x, host)); }
    else showCtx(pt, entriesFor(null), a => runAct(a, null, host));
  };
  host.onkeydown = e => {
    if (e.target.closest && e.target.closest('input,select,textarea')) return;
    const c = e.target.closest && e.target.closest('.fm-card'), x = c && byId(c.dataset.id), mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (mod && k === 'a') { e.preventDefault(); runAct('all', null, host); return; }
    if (mod && k === 'v') { if (clip) { e.preventDefault(); runAct(x && x.t === 'd' && !sel.size ? 'pasteIn' : 'paste', x, host); } return; }
    if (mod && (k === 'c' || k === 'x') && (x || sel.size)) { e.preventDefault(); const t = x || byId([...sel][0]); runAct(k === 'c' ? 'copy' : 'cut', t, host); return; }
    if (mod && k === 'p' && (x || sel.size)) { e.preventDefault(); runAct('print', x || byId([...sel][0]), host); return; }
    if (e.key === 'F5') { e.preventDefault(); MSA.rerender(true); return; }
    if (e.key === 'Escape' && sel.size) { sel.clear(); render(host); return; }
    if (!x) return;
    if (e.key === 'Enter' && e.altKey) { e.preventDefault(); propsDialog(x); }
    else if (e.key === 'Enter') openItem(x);
    else if (e.key === 'Delete') runAct('del', x, host);
    else if (e.key === 'F2') { e.preventDefault(); runAct('ren', x, host); }
    else if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); const r = c.getBoundingClientRect(); itemMenu(x, { x: r.left + 20, y: r.top + 20 }, host); }
  };
  /* drag & drop: files from the computer upload; cards drag into folders / breadcrumbs */
  const drop = $('#fmDrop', host); let dc = 0;
  const hasFiles = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  host.ondragenter = e => { if (hasFiles(e)) { dc++; drop.hidden = false; } };
  host.ondragleave = e => { if (hasFiles(e) && --dc <= 0) { dc = 0; drop.hidden = true; } };
  host.ondragover = e => { if (hasFiles(e) || e.dataTransfer.types.includes('text/msa-fm')) e.preventDefault(); };
  host.ondragstart = e => { const c = e.target.closest('.fm-card'); if (!c) return; const ids = sel.has(c.dataset.id) ? [...sel] : [c.dataset.id]; e.dataTransfer.setData('text/msa-fm', JSON.stringify(ids)); e.dataTransfer.effectAllowed = 'move'; };
  host.ondrop = e => {
    e.preventDefault(); dc = 0; drop.hidden = true;
    if (hasFiles(e) && e.dataTransfer.files.length) { upload([...e.dataTransfer.files]); return; }
    const raw = e.dataTransfer.getData('text/msa-fm'); if (!raw) return;
    const tgt = e.target.closest('.fm-card.dir, [data-fa=go]'); if (!tgt) return;
    const parent = tgt.classList.contains('fm-card') ? tgt.dataset.id : (tgt.dataset.id || null);
    const n = F.move(JSON.parse(raw), parent); if (n) { sel.clear(); MSA.toast(T('اتنقل ' + n + ' عنصر', n + ' moved'), 'ok'); MSA.rerender(true); }
  };
}
MSA.views.files = { render };
F.open = () => { const u = ui(); sel.clear(); MSA.go('files'); };

/* header button: icon only, the name shows as a tooltip */
function addButton(){
  const g = document.getElementById('btnGuide'); if (!g || document.getElementById('btnFiles')) return;
  const b = document.createElement('button'); b.id = 'btnFiles'; b.className = 'icon-btn'; b.type = 'button';
  const lbl = T('ملفاتي', 'My files'); b.setAttribute('aria-label', lbl); b.title = lbl; b.innerHTML = I('folder', 'lg');
  b.addEventListener('click', () => F.open()); g.insertAdjacentElement('afterend', b);
}
addButton();
document.addEventListener('DOMContentLoaded', addButton);
const relabel = () => { const b = document.getElementById('btnFiles'); if (b) { const l = T('ملفاتي', 'My files'); b.title = l; b.setAttribute('aria-label', l); } };
try { new MutationObserver(relabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] }); } catch (e) {}
document.addEventListener('DOMContentLoaded', relabel); setTimeout(relabel, 800);
})();
