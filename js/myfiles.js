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
function itemMenu(x){
  const isD = x.t === 'd';
  const m = MSA.modal({ title: x.name, size: 'sm', footer: false,
    body: '<div class="fm-menu">' + (isD ? '<button data-m="open">' + I('folder-open', 'sm') + esc(T('فتح', 'Open')) + '</button>' : '<button data-m="open">' + I('eye', 'sm') + esc(T('معاينة', 'Preview')) + '</button><button data-m="dl">' + I('download', 'sm') + esc(T('تنزيل', 'Download')) + '</button>') +
      '<button data-m="fav">' + I('star', 'sm') + esc(x.fav ? T('إزالة من المفضلة', 'Remove from favourites') : T('إضافة للمفضلة', 'Add to favourites')) + '</button><button data-m="ren">' + I('pencil', 'sm') + esc(isD ? T('تعديل الاسم واللون', 'Rename & colour') : T('إعادة تسمية', 'Rename')) + '</button><button data-m="mv">' + I('folder', 'sm') + esc(T('نقل إلى…', 'Move to…')) + '</button><button data-m="del" class="danger">' + I('trash', 'sm') + esc(T('حذف', 'Delete')) + '</button></div>' });
  m.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-m]'); if (!b) return; const a = b.dataset.m; m.close();
    if (a === 'open') openItem(x); else if (a === 'dl') MSA.downloadAtt(x.a);
    else if (a === 'fav') { x.fav = !x.fav; redo(); }
    else if (a === 'ren') { if (isD) folderDialog(x, x.parent, () => MSA.rerender(true)); else { const n = await askName(T('الاسم الجديد', 'New name'), x.name); if (n) { F.rename(x.id, n); MSA.rerender(true); } } }
    else if (a === 'mv') pickFolder(T('نقل «' + x.name + '» إلى', 'Move “' + x.name + '” to'), [x.id], x.parent || null, p => { F.move([x.id], p); MSA.rerender(true); });
    else if (a === 'del') { if (await del([x.id])) MSA.rerender(true); }
  });
}
function openItem(x){
  if (x.t === 'd') { const u = ui(); u.cur = x.id; u.q = ''; u.f = ''; sel.clear(); redo(); return; }
  const files = shown().filter(y => y.t === 'f').map(y => y.a); MSA.openAtt(x.a, files);
}
function wire(host, list){
  const u = ui(), grid = $('#fmGrid', host);
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
    else if (a === 'more' && x) itemMenu(x);
    else if (a === 'bclr') { sel.clear(); render(host); }
    else if (a === 'bfav') { const all = [...sel].map(byId).filter(Boolean), on = !all.every(y => y.fav); all.forEach(y => { y.fav = on; }); redo(); }
    else if (a === 'bdl') download([...sel]);
    else if (a === 'bmove') pickFolder(T('نقل ' + sel.size + ' عنصر إلى', 'Move ' + sel.size + ' item(s) to'), [...sel].filter(id => (byId(id) || {}).t === 'd'), undefined, p => { const n = F.move([...sel], p); sel.clear(); MSA.toast(T('اتنقل ' + n + ' عنصر', n + ' moved'), 'ok'); MSA.rerender(true); });
    else if (a === 'bdel') { if (await del([...sel])) MSA.rerender(true); }
  };
  host.oncontextmenu = e => { const c = e.target.closest('.fm-card'); if (c) { e.preventDefault(); const x = byId(c.dataset.id); x && itemMenu(x); } };
  host.onkeydown = e => { const c = e.target.closest && e.target.closest('.fm-card'); if (!c) return; const x = byId(c.dataset.id); if (!x) return; if (e.key === 'Enter') openItem(x); else if (e.key === 'Delete') del([x.id]).then(ok => ok && MSA.rerender(true)); else if (e.key === 'F2') itemMenu(x); };
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
