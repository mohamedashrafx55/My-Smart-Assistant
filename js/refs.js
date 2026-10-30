/* References (moodboard) with folders: new folder, rename, colour, copy / cut / paste, select, drag & drop, search, tags */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const t = (k, v) => MSA.t(k, v), T = (a, e) => MSA.T(a, e), esc = U.esc;
const COLORS = ['#5b8def', '#3ccf91', '#f0b43c', '#ef5b5b', '#a56bef', '#ff7ab8', '#2dd4d4', '#ff8a4c', '#8bc34a', '#9aa0a6', '#e8c547', '#6c7bff'];
const S = () => MSA.state;
const R = () => S().refs = S().refs || [];
const F = () => S().refFolders = S().refFolders || [];
let sel = new Set(), selMode = false, clip = null, query = '', sort = 'new', tag = '', box = null;

const folder = id => F().find(f => f.id === id);
const kids = pid => F().filter(f => (f.parent || null) === (pid || null));
const items = pid => R().filter(r => (r.folder || null) === (pid || null));
const chain = id => { const o = []; let f = id && folder(id); while (f) { o.unshift(f); f = f.parent && folder(f.parent); } return o; };
const isDesc = (id, anc) => { let f = folder(id); while (f) { if (f.id === anc) return true; f = f.parent && folder(f.parent); } return false; };
const collect = fid => { const a = [fid]; kids(fid).forEach(k => a.push(...collect(k.id))); return a; };
const FAV = '__fav', favMode = () => S().ui.refFolder === FAV;
const favStar = (on, act, id) => '<button class="icon-btn sm fav-btn ' + (on ? 'on' : '') + '" data-act="' + act + '" data-fid="' + id + '" title="' + esc(T(on ? 'إزالة من المفضلة' : 'إضافة للمفضلة', on ? 'Remove from favourites' : 'Add to favourites')) + '" aria-pressed="' + !!on + '">' + I('star', 'sm') + '</button>';
const cur = () => { const c = S().ui.refFolder; return c && folder(c) ? c : null; };
const dom = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u || ''; } };
const titleOf = r => r.title || (r.att ? r.att.name : dom(r.url));
const redraw = () => { MSA.save(); if (box && document.body.contains(box)) draw(box); };
const uniq = (base, parent, ex) => { const n = new Set(kids(parent).filter(f => f.id !== ex).map(f => f.name)); if (!n.has(base)) return base; let i = 1, c; do { c = base + ' ' + t('copySuffix') + (i > 1 ? ' ' + i : ''); i++; } while (n.has(c)); return c; };
function clone(fid, parent){
  const s = folder(fid), nf = { id: U.uid('d'), parent: parent || null, name: s.name, color: s.color, created: Date.now() }; F().push(nf);
  items(fid).forEach(r => R().push(Object.assign({}, r, { id: U.uid('rf'), folder: nf.id, created: Date.now() })));
  kids(fid).forEach(k => clone(k.id, nf.id)); return nf;
}
const selected = () => Array.from(sel).map(x => ({ k: x[0], id: x.slice(2) }));

async function newFolder(){
  const name = await MSA.ask({ title: t('newFolder'), placeholder: t('folderName') }); if (!name) return;
  F().push({ id: U.uid('d'), parent: cur(), name, color: COLORS[F().length % COLORS.length], created: Date.now() }); redraw();
}
const parseTags = s => s.split(/[,،#\s]+/).map(x => x.trim()).filter(Boolean).slice(0, 8);
function form(r, done){
  MSA.modal({ title: r.id ? T('تعديل المرجع', 'Edit reference') : T('إضافة رابط', 'Add link'),
    body: '<div class="field"><label class="f">' + esc(T('العنوان', 'Title')) + '</label><input type="text" id="rfT" dir="auto" value="' + esc(r.title || '') + '"></div>' + (r.att ? '' : '<div class="field"><label class="f">URL</label><input type="url" id="rfU" dir="ltr" placeholder="https://" value="' + esc(r.url || '') + '"></div>') +
      '<div class="field"><label class="f">' + esc(T('وسوم (مفصولة بمسافة أو فاصلة)', 'Tags (space or comma separated)')) + '</label><input type="text" id="rfG" dir="auto" value="' + esc((r.tags || []).join(' ')) + '"></div>',
    buttons: [{ label: t('cancel'), cls: 'ghost', onClick: a => a.close() }, { label: t('save'), cls: 'primary', onClick: a => {
      const u = $('#rfU', a.el); let url = u ? u.value.trim() : r.url; if (!r.att && !url) { u.focus(); return; } if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
      done({ title: $('#rfT', a.el).value.trim(), url, tags: parseTags($('#rfG', a.el).value) }); a.close(); } }] });
}
async function rename(k, id){
  if (k === 'f') { const f = folder(id); const v = await MSA.ask({ title: t('rename'), value: f.name }); if (v) { f.name = v; redraw(); } }
  else { const r = R().find(x => x.id === id); form(r, v => { Object.assign(r, v); redraw(); }); }
}
function colorize(list){
  const fs = list.filter(i => i.k === 'f').map(i => folder(i.id)).filter(Boolean); if (!fs.length) return;
  MSA.modal({ title: t('folderColor'), footer: false, body: '<div class="swatches">' + COLORS.map(c => '<button class="sw ' + (fs[0].color === c ? 'on' : '') + '" data-c="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>').join('') + '</div>',
    onMount: (el, api) => $$('[data-c]', el).forEach(b => b.onclick = () => { fs.forEach(f => f.color = b.dataset.c); api.close(); redraw(); }) });
}
async function del(list){
  if (!list.length) return;
  if (!await MSA.confirm(list.length === 1 ? t('delItemQ') : t('delItemsQ', { n: list.length }), { danger: true, okLabel: t('delete') })) return;
  for (const i of list) {
    if (i.k === 'f') { const ids = collect(i.id); for (const r of R().filter(r => ids.includes(r.folder))) if (r.att) { try { await MSA.files.del(r.att.id); } catch (e) {} } S().refs = R().filter(r => !ids.includes(r.folder)); S().refFolders = F().filter(f => !ids.includes(f.id)); }
    else { const r = R().find(x => x.id === i.id); if (r && r.att) { try { await MSA.files.del(r.att.id); } catch (e) {} } S().refs = R().filter(x => x.id !== i.id); }
  }
  sel.clear(); selMode = false; redraw();
}
function setClip(mode, list){ if (!list.length) return; clip = { mode, items: list }; MSA.toast(t(mode === 'copy' ? 'copiedItems' : 'cutItems', { n: list.length })); redraw(); }
function paste(pid){
  if (!clip) return; pid = pid || null; let n = 0;
  clip.items.forEach(i => {
    if (i.k === 'f') { const f = folder(i.id); if (!f) return; if (clip.mode === 'cut') { if (pid && (pid === f.id || isDesc(pid, f.id))) return; f.parent = pid; n++; } else { const c = clone(f.id, pid); c.name = uniq(f.name, pid, c.id); n++; } }
    else { const r = R().find(x => x.id === i.id); if (!r) return; if (clip.mode === 'cut') { r.folder = pid; n++; } else { R().push(Object.assign({}, r, { id: U.uid('rf'), folder: pid, created: Date.now() })); n++; } }
  });
  if (clip.mode === 'cut') clip = null; sel.clear(); selMode = false; redraw(); MSA.toast(t('pasted', { n }));
}
const move = (list, pid) => { const c = clip; clip = { mode: 'cut', items: list }; paste(pid); clip = c && c.mode === 'copy' ? c : null; };
const enter = id => { S().ui.refFolder = id || null; query = ''; sel.clear(); redraw(); };

const cmp = (a, b) => sort === 'new' ? (b.created || 0) - (a.created || 0) : String(a.name || titleOf(a)).localeCompare(String(b.name || titleOf(b)), S().settings.lang);
function folderCard(f, q){
  const cnt = kids(f.id).length + items(f.id).length, k = 'f:' + f.id, on = sel.has(k), cut = clip && clip.mode === 'cut' && clip.items.some(i => i.id === f.id);
  return '<div class="card fold ' + (on ? 'is-sel ' : '') + (cut ? 'is-cut' : '') + '" draggable="true" data-kind="f" data-id="' + f.id + '" data-drop="' + f.id + '" style="--fc:' + f.color + '"><div class="fi">' + I('folder') + '</div><div class="grow"><div class="ft">' + esc(f.name) + '</div><div class="fs">' + esc(q ? chain(f.parent).map(x => x.name).join(' / ') : t('itemsCount', { n: cnt })) + '</div></div>' +
    '<input type="checkbox" class="cb selbox ' + (on ? 'on' : '') + '" data-act="sel" ' + (on ? 'checked' : '') + ' aria-label="select"></div>';
}
function refCard(r, q){
  const k = 'r:' + r.id, on = sel.has(k), cut = clip && clip.mode === 'cut' && clip.items.some(i => i.id === r.id);
  return '<div class="card ref ' + (on ? 'is-sel ' : '') + (cut ? 'is-cut' : '') + '" draggable="true" data-kind="r" data-id="' + r.id + '">' +
    '<input type="checkbox" class="cb selbox ' + (on ? 'on' : '') + '" data-act="sel" ' + (on ? 'checked' : '') + ' aria-label="select">' +
    (r.att ? MSA.attHTML(r.att, false) : '<a class="ref-link" data-open="' + esc(r.url) + '">' + MSA.conn.logo({ id: '', name: dom(r.url), url: r.url }) + '<span dir="ltr">' + esc(dom(r.url)) + '</span></a>') +
    '<div class="ref-b"><div class="row" style="gap:4px;align-items:flex-start"><b dir="auto" class="grow">' + esc(titleOf(r)) + '</b>' + favStar(r.fav, 'fav', r.id) + '</div>' + (q ? '<span class="hint">' + esc(chain(r.folder).map(x => x.name).join(' / ') || t('learn.root')) + '</span>' : '') + '<div class="tags">' + (r.tags || []).map(x => '<span class="tag">#' + esc(x) + '</span>').join('') + '</div></div></div>';
}

function draw(b){
  box = b; const cid = cur(), q = query.trim().toLowerCase();
  const all = new Set(); R().forEach(r => (r.tags || []).forEach(x => all.add(x)));
  let fs, rs;
  if (q) { fs = F().filter(f => f.name.toLowerCase().includes(q)); rs = R().filter(r => (titleOf(r) + ' ' + (r.tags || []).join(' ') + ' ' + (r.url || '')).toLowerCase().includes(q)); } else { fs = kids(cid); rs = items(cid); }
  if (favMode()) { fs = []; rs = R().filter(r => r.fav && (!q || (titleOf(r) + ' ' + (r.tags || []).join(' ') + ' ' + (r.url || '')).toLowerCase().includes(q))); }
  if (tag) { rs = (favMode() ? rs : (q ? rs : R())).filter(r => (r.tags || []).includes(tag)); fs = []; }
  fs = fs.slice().sort(cmp); rs = rs.slice().sort(cmp);
  const path = favMode() ? [{ id: FAV, name: '★ ' + T('المفضلة', 'Favourites') }] : chain(cid), nsel = sel.size;
  let html = '<div class="crumbs"><button data-act="crumb" data-id="" data-drop="" class="' + (!cid && !favMode() ? 'last' : '') + '">' + I('image', 'sm') + ' ' + esc(T('المراجع', 'References')) + '</button>' + path.map((f, i) => I('chev-r', 'chev') + '<button data-act="crumb" data-id="' + f.id + '" data-drop="' + f.id + '" class="' + (i === path.length - 1 ? 'last' : '') + '">' + esc(f.name) + '</button>').join('') + '</div>' +
    '<div class="toolbar" style="margin-top:12px"><button class="btn primary" data-act="img">' + I('image', 'sm') + esc(T('إضافة صور', 'Add images')) + '</button><button class="btn" data-act="link">' + I('link', 'sm') + esc(T('إضافة رابط', 'Add link')) + '</button>' +
    '<button class="btn" data-act="newfolder">' + I('folder-plus', 'sm') + esc(t('newFolder')) + '</button>' +
    (clip ? '<button class="btn" data-act="paste">' + I('paste', 'sm') + esc(t('paste')) + ' (' + clip.items.length + ')</button>' : '') +
    '<button class="btn ' + (selMode ? 'primary' : '') + '" data-act="selmode">' + I('check-c', 'sm') + esc(t('select')) + '</button>' +
    '<div class="grow" style="min-width:140px;position:relative"><input type="search" id="rfQ" value="' + esc(query) + '" placeholder="' + esc(t('search')) + '" style="padding-inline-start:36px"><span style="position:absolute;top:50%;transform:translateY(-50%);inset-inline-start:11px;opacity:.55;display:grid">' + I('search', 'sm') + '</span></div>' +
    '<select id="rfS" style="width:auto"><option value="name" ' + (sort === 'name' ? 'selected' : '') + '>' + esc(t('sortName')) + '</option><option value="new" ' + (sort === 'new' ? 'selected' : '') + '>' + esc(t('sortNew')) + '</option></select></div>' +
    (all.size ? '<div class="pchips" style="margin:10px 0"><button class="pchip ' + (!tag ? 'on' : '') + '" data-tag="">' + esc(T('الكل', 'All')) + '</button>' + [...all].map(x => '<button class="pchip ' + (tag === x ? 'on' : '') + '" data-tag="' + esc(x) + '">#' + esc(x) + '</button>').join('') + '</div>' : '');
  if (nsel) { const one = nsel === 1, hasF = selected().some(i => i.k === 'f');
    html += '<div class="sel-bar"><b style="margin-inline-end:6px">' + esc(t('selected', { n: nsel })) + '</b>' + (one ? '<button class="btn sm" data-act="s-rename">' + I('pencil', 'sm') + esc(t('rename')) + '</button>' : '') +
      '<button class="btn sm" data-act="s-copy">' + I('copy', 'sm') + esc(t('copy')) + '</button><button class="btn sm" data-act="s-cut">' + I('scissors', 'sm') + esc(t('cut')) + '</button>' + (hasF ? '<button class="btn sm" data-act="s-color">' + I('palette', 'sm') + esc(t('folderColor')) + '</button>' : '') +
      '<button class="btn sm danger" data-act="s-del">' + I('trash', 'sm') + esc(t('delete')) + '</button><button class="btn sm ghost" data-act="s-clear" style="margin-inline-start:auto">' + I('x', 'sm') + '</button></div>'; }
  if (favMode() && !rs.length) html += MSA.empty('star', T('لا توجد مراجع مفضلة بعد', 'No favourite references yet'), T('اضغط ★ على أي صورة أو رابط ليظهر هنا.', 'Press ★ on any image or link to see it here.'));
  else if (!fs.length && !rs.length && !(!cid && !q && !tag)) html += MSA.empty(q || tag ? 'search' : 'image', q || tag ? t('noResults') : T('مكتبة المراجع فاضية', 'Your reference library is empty'), q || tag ? '' : T('أنشئ مجلدات (لكل مشروع أو ستايل) واحفظ فيها صور وروابط من Behance وPinterest.', 'Create folders (per project or style) and save images and links from Behance and Pinterest.'));
  else {
    const favCard = !cid && !favMode() && !q && !tag ? '<div class="card fold favfold" data-favfolder="1" style="--fc:var(--warn);cursor:pointer"><div class="fi">' + I('star') + '</div><div class="grow"><div class="ft">★ ' + esc(T('المفضلة', 'Favourites')) + '</div><div class="fs">' + esc(t('itemsCount', { n: R().filter(r => r.fav).length })) + '</div></div></div>' : '';
    if (fs.length || favCard) html += '<div class="lgrid ' + (selMode ? 'sel-mode' : '') + '" style="margin-bottom:20px">' + favCard + fs.map(f => folderCard(f, q)).join('') + '</div>';
    if (!fs.length && !rs.length) html += MSA.empty('image', T('مكتبة المراجع فاضية', 'Your reference library is empty'), T('أنشئ مجلدات (لكل مشروع أو ستايل) واحفظ فيها صور وروابط من Behance وPinterest.', 'Create folders (per project or style) and save images and links from Behance and Pinterest.'));
    if (rs.length) html += '<div class="ref-grid ' + (selMode ? 'sel-mode' : '') + '">' + rs.map(r => refCard(r, q)).join('') + '</div>';
  }
  b.innerHTML = html; MSA.hydrateAtts(b); bind(b);
}

function itemFrom(el){ const c = el.closest('[data-kind]'); return c ? { k: c.dataset.kind, id: c.dataset.id } : null; }
function bind(b){
  const toggle = it => { const k = it.k + ':' + it.id; sel.has(k) ? sel.delete(k) : sel.add(k); redraw(); };
  const menu = (it, x, y) => {
    const list = sel.has(it.k + ':' + it.id) ? selected() : [{ k: it.k, id: it.id }], one = list.length === 1, isF = it.k === 'f', r = !isF && R().find(v => v.id === it.id), m = [];
    if (one) m.push({ icon: isF ? 'folder-open' : 'external', label: t('open'), onClick: () => isF ? enter(it.id) : (r.url ? MSA.openLink(r.url) : $('[data-kind="r"][data-id="' + it.id + '"] .att', b) && $('[data-kind="r"][data-id="' + it.id + '"] .att', b).click()) });
    if (one) m.push({ icon: 'pencil', label: isF ? t('rename') : T('تعديل', 'Edit'), onClick: () => rename(it.k, it.id) });
    if (!isF && one) m.push({ icon: 'star', label: r.fav ? T('إزالة من المفضلة', 'Remove from favourites') : T('إضافة للمفضلة', 'Add to favourites'), onClick: () => { r.fav = !r.fav; if (!r.fav) delete r.fav; redraw(); } });
    m.push({ icon: 'copy', label: t('copy'), onClick: () => setClip('copy', list) }, { icon: 'scissors', label: t('cut'), onClick: () => setClip('cut', list) });
    if (clip && isF && one) m.push({ icon: 'paste', label: t('pasteHere'), onClick: () => paste(it.id) });
    if (list.some(i => i.k === 'f')) m.push({ icon: 'palette', label: t('folderColor'), onClick: () => colorize(list) });
    m.push('-', { icon: 'trash', label: t('delete'), danger: true, onClick: () => del(list) }); MSA.ctx(x, y, m);
  };
  MSA.on(b, {
    img: async () => { const a = await MSA.addFiles('image'); if (!a.length) return; a.forEach(x => R().unshift({ id: U.uid('rf'), att: x, title: '', tags: tag ? [tag] : [], folder: cur(), created: Date.now() })); redraw(); },
    link: () => form({}, v => { R().unshift(Object.assign({ id: U.uid('rf'), folder: cur(), created: Date.now() }, v)); redraw(); }),
    fav: el => { const r = R().find(x => x.id === el.dataset.fid); if (!r) return; r.fav = !r.fav; if (!r.fav) delete r.fav; redraw(); MSA.toast(r.fav ? T('أُضيف للمفضلة ★', 'Added to favourites ★') : T('أُزيل من المفضلة', 'Removed from favourites'), 'ok'); },
    newfolder: newFolder, paste: () => paste(cur()),
    selmode: () => { selMode = !selMode; if (!selMode) sel.clear(); redraw(); },
    crumb: el => enter(el.dataset.id),
    sel: (el, e) => { e.stopPropagation(); toggle(itemFrom(el)); },
    's-rename': () => { const i = selected()[0]; rename(i.k, i.id); }, 's-copy': () => setClip('copy', selected()), 's-cut': () => setClip('cut', selected()),
    's-color': () => colorize(selected()), 's-del': () => del(selected()), 's-clear': () => { sel.clear(); selMode = false; redraw(); }
  });
  b.addEventListener('click', e => {
    const tg = e.target.closest('[data-tag]'); if (tg) { tag = tg.dataset.tag; redraw(); return; }
    if (e.target.closest('[data-favfolder]')) { enter(FAV); return; }
    if (e.target.closest('[data-act],input,select,[data-open]')) return;
    const it = itemFrom(e.target); if (!it) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || selMode) { toggle(it); return; }
    if (it.k === 'f') enter(it.id);
  });
  b.addEventListener('contextmenu', e => { const it = itemFrom(e.target); if (!it) return; e.preventDefault(); menu(it, e.clientX, e.clientY); });
  const q = $('#rfQ', b); q.addEventListener('input', e => { query = e.target.value; const p = e.target.selectionStart; draw(b); const n = $('#rfQ', b); n.focus(); n.setSelectionRange(p, p); });
  $('#rfS', b).addEventListener('change', e => { sort = e.target.value; redraw(); });
  let lp = null;
  b.addEventListener('touchstart', e => { const it = itemFrom(e.target); if (!it) return; const c = e.touches[0]; lp = setTimeout(() => { lp = null; menu(it, c.clientX, c.clientY); }, 600); }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(n => b.addEventListener(n, () => { if (lp) { clearTimeout(lp); lp = null; } }, { passive: true }));
  b.addEventListener('dragstart', e => { const it = itemFrom(e.target); if (!it) return; const list = sel.has(it.k + ':' + it.id) ? selected() : [{ k: it.k, id: it.id }]; e.dataTransfer.setData('text/msa-ref', JSON.stringify(list)); e.dataTransfer.effectAllowed = 'move'; });
  const dt = e => e.target.closest('[data-drop]');
  b.addEventListener('dragover', e => { const d = dt(e); if (d) { e.preventDefault(); d.classList.add('drop-hot'); } });
  b.addEventListener('dragleave', e => { const d = dt(e); if (d) d.classList.remove('drop-hot'); });
  b.addEventListener('drop', e => { const d = dt(e); if (!d) return; e.preventDefault(); d.classList.remove('drop-hot'); try { move(JSON.parse(e.dataTransfer.getData('text/msa-ref')), d.dataset.drop || null); } catch (err) {} });
  if (!b._attB) { b._attB = true; MSA.bindAtts(b, () => R().filter(r => r.att).map(r => r.att), () => {}); }
}
document.addEventListener('keydown', e => {
  if (MSA.view !== 'learn' || S().ui.ltab !== 'refs' || e.target.closest('input,textarea,select,[contenteditable]') || $('#overlayRoot').children.length) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'c' && sel.size) { e.preventDefault(); setClip('copy', selected()); }
  else if (mod && e.key.toLowerCase() === 'x' && sel.size) { e.preventDefault(); setClip('cut', selected()); }
  else if (mod && e.key.toLowerCase() === 'v' && clip) { e.preventDefault(); paste(cur()); }
  else if (e.key === 'Delete' && sel.size) del(selected());
  else if (e.key === 'F2' && sel.size === 1) { const i = selected()[0]; rename(i.k, i.id); }
  else if (e.key === 'Escape' && sel.size) { sel.clear(); selMode = false; redraw(); }
});
MSA.refsView = draw;
})();

