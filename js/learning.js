/* Menu 3 — Learning & development: video links with thumbnails, folders with colors, copy/cut/paste/rename/delete */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const t = (k, v) => MSA.t(k, v);
const COLORS = ['#5b8def', '#3ccf91', '#f0b43c', '#ef5b5b', '#a56bef', '#ff7ab8', '#2dd4d4', '#ff8a4c', '#8bc34a', '#9aa0a6', '#e8c547', '#6c7bff'];
const L = () => MSA.state.learning;
let sel = new Set();          // 'f:ID' | 'v:ID'
let selMode = false;
let clip = null;              // { mode:'copy'|'cut', items:[{k,id}] }
let query = '';
let sort = 'name';

/* ---------- link parsing ---------- */
function ytId(u){
  try {
    const x = new URL(u), h = x.hostname.replace(/^www\.|^m\.|^music\./, '');
    let id = null;
    if (h === 'youtu.be') id = x.pathname.slice(1).split('/')[0];
    else if (h.endsWith('youtube.com') || h.endsWith('youtube-nocookie.com')) {
      if (x.pathname === '/watch') id = x.searchParams.get('v');
      else { const m = x.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]+)/); if (m) id = m[2]; }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch (e) { return null; }
}
function hostOf(u){ try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } }
MSA.ytId = ytId;
const thumbOf = v => v.vid ? 'https://i.ytimg.com/vi/' + v.vid + '/hqdefault.jpg' : (v.thumb || '');
const titleOf = v => v.title || (v.pending ? t('loadingTitle') : (v.vid ? 'YouTube · ' + v.vid : hostOf(v.url)));
const triedMeta = new Set();

async function fetchMeta(v){
  const getJson = async url => { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); };
  let j = null;
  try { j = await getJson('https://noembed.com/embed?url=' + encodeURIComponent(v.url)); } catch (e) {}
  if (!j || !j.title) { try { j = await getJson('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(v.url)); } catch (e) {} }
  v.pending = false;
  if (j && j.title) {
    v.retry = false;
    if (!v.titleSet) { v.title = j.title; v.author = j.author_name || ''; }
    if (j.thumbnail_url && !v.vid) v.thumb = j.thumbnail_url;
  } else v.retry = true;      // offline or blocked: retried the next time this list opens
  MSA.save();
  /* patch the card in place — a full re-render would close menus the user has open */
  if (MSA.view === 'learn') {
    const card = document.querySelector('.vcard[data-id="' + v.id + '"]');
    if (card) {
      const tt = $('.vtitle', card); if (tt) tt.textContent = titleOf(v);
      const sub = $('.vsub', card); if (sub && !query.trim()) sub.textContent = v.author || MSA.fmtDate(v.created);
      const th = thumbOf(v), vt = $('.vthumb', card); if (vt && th) vt.style.backgroundImage = 'url("' + th + '")';
    }
  }
}

/* ---------- tree helpers ---------- */
const folder = id => L().folders.find(f => f.id === id);
const kids = pid => L().folders.filter(f => (f.parent || null) === (pid || null));
const vids = pid => L().videos.filter(v => (v.folder || null) === (pid || null));
const chain = id => { const out = []; let f = id && folder(id); while (f) { out.unshift(f); f = f.parent && folder(f.parent); } return out; };
const isDesc = (id, anc) => { let f = folder(id); while (f) { if (f.id === anc) return true; f = f.parent && folder(f.parent); } return false; };
function collect(fid){ const fs = [fid]; kids(fid).forEach(k => fs.push(...collect(k.id))); return fs; }
function delFolder(fid){ const ids = collect(fid); L().videos = L().videos.filter(v => !ids.includes(v.folder)); L().folders = L().folders.filter(f => !ids.includes(f.id)); }
function cloneFolder(fid, parent){
  const src = folder(fid), nf = { id: U.uid('d'), parent: parent || null, name: src.name, color: src.color, created: Date.now() };
  L().folders.push(nf);
  vids(fid).forEach(v => L().videos.push(Object.assign({}, v, { id: U.uid('v'), folder: nf.id, created: Date.now() })));
  kids(fid).forEach(k => cloneFolder(k.id, nf.id));
  return nf;
}
function uniqueName(base, parent, exclude){
  const names = new Set([...kids(parent).filter(f => f.id !== exclude).map(f => f.name)]);
  if (!names.has(base)) return base;
  let n = 1, cand; do { cand = base + ' ' + t('copySuffix') + (n > 1 ? ' ' + n : ''); n++; } while (names.has(cand));
  return cand;
}
const curId = () => { const c = MSA.state.ui.learnFolder; return c && folder(c) ? c : null; };

/* ---------- actions ---------- */
function afterChange(){ MSA.save(); MSA.updateCounts(); MSA.rerender(); }
function selectedItems(){ return Array.from(sel).map(x => ({ k: x[0], id: x.slice(2) })); }
async function newFolder(){
  const name = await MSA.ask({ title: t('newFolder'), placeholder: t('folderName') }); if (!name) return;
  L().folders.push({ id: U.uid('d'), parent: curId(), name, color: COLORS[L().folders.length % COLORS.length], created: Date.now() });
  afterChange();
}
function addLinks(){
  MSA.modal({
    title: t('addVideoLinks'),
    body: '<div class="field"><label class="f">' + U.esc(t('pasteLinks')) + '</label><textarea id="lnk" style="min-height:120px" placeholder="https://www.youtube.com/watch?v=...&#10;https://youtu.be/..."></textarea></div><div class="hint">' + U.esc(t('linksHint')) + '</div>',
    buttons: [{ label: t('cancel'), cls: 'ghost', onClick: a => a.close() }, { label: t('add'), cls: 'primary', icon: 'plus', onClick: a => {
      const urls = $('#lnk', a.el).value.split(/[\s,]+/).map(s => s.trim()).filter(s => /^(https?:\/\/|www\.|youtu)/i.test(s));
      if (!urls.length) { $('#lnk', a.el).focus(); return; }
      urls.forEach(u => { if (!/^https?:/i.test(u)) u = 'https://' + u; const v = { id: U.uid('v'), folder: curId(), url: u, vid: ytId(u), title: '', pending: true, note: '', created: Date.now() }; L().videos.push(v); fetchMeta(v); });
      a.close(); afterChange(); MSA.toast(t('linksAdded', { n: urls.length }));
    } }],
    onMount: el => setTimeout(() => $('#lnk', el).focus(), 30)
  });
}
function openVideo(v){
  const yt = v.vid;
  const player = yt
    ? '<div style="position:relative;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden"><iframe src="https://www.youtube-nocookie.com/embed/' + yt + '?autoplay=1&rel=0" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'
    : '<div class="vthumb" style="border-radius:12px;background-image:url(\'' + U.esc(thumbOf(v)) + '\')"><span class="host">' + U.esc(hostOf(v.url)) + '</span></div>';
  MSA.modal({
    title: titleOf(v), size: 'wide',
    body: player + '<div class="row" style="margin:12px 0"><button class="btn primary" id="vOpen">' + I('external', 'sm') + U.esc(t(yt ? 'openYoutube' : 'openLink')) + '</button><button class="btn" id="vCopy">' + I('copy', 'sm') + U.esc(t('copyLink')) + '</button></div>' +
      '<div class="field" style="margin:0"><label class="f">' + U.esc(t('lessonNotes')) + '</label><textarea id="vNote" placeholder="' + U.esc(t('lessonNotesPh')) + '">' + U.esc(v.note || '') + '</textarea></div>',
    footer: false,
    onMount: el => {
      $('#vOpen', el).onclick = () => MSA.openLink(v.url);
      $('#vCopy', el).onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(v.url) : Promise.reject()).then(() => MSA.toast(t('copied')), () => MSA.toast(v.url)); };
      $('#vNote', el).addEventListener('input', e => { v.note = e.target.value; MSA.save(); });
    }
  });
}
async function renameItem(k, id){
  const o = k === 'f' ? folder(id) : L().videos.find(v => v.id === id); if (!o) return;
  const key = k === 'f' ? 'name' : 'title';
  const v = await MSA.ask({ title: t('rename'), value: k === 'f' ? o.name : titleOf(o) }); if (!v) return;
  o[key] = v; if (k === 'v') o.titleSet = true; afterChange();
}
function colorize(items){
  const fs = items.filter(i => i.k === 'f').map(i => folder(i.id)).filter(Boolean); if (!fs.length) return;
  MSA.modal({ title: t('folderColor'), body: '<div class="swatches" id="sws">' + COLORS.map(c => '<button class="sw ' + (fs[0].color === c ? 'on' : '') + '" data-c="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>').join('') + '<label class="sw" style="display:grid;place-items:center;background:var(--panel2);cursor:pointer" title="' + U.esc(t('custom')) + '">' + I('palette', 'sm') + '<input type="color" id="cust" style="position:absolute;opacity:0;width:0;height:0"></label></div>', footer: false,
    onMount: (el, api) => {
      const apply = c => { fs.forEach(f => f.color = c); api.close(); afterChange(); };
      $$('[data-c]', el).forEach(b => b.onclick = () => apply(b.dataset.c));
      $('#cust', el).onchange = e => apply(e.target.value);
      $('label.sw', el).onclick = () => $('#cust', el).click();
    } });
}
async function deleteItems(items){
  if (!items.length) return;
  if (!await MSA.confirm(items.length === 1 ? t('delItemQ') : t('delItemsQ', { n: items.length }), { danger: true, okLabel: t('delete') })) return;
  items.forEach(i => { if (i.k === 'f') delFolder(i.id); else L().videos = L().videos.filter(v => v.id !== i.id); });
  sel.clear(); selMode = false; afterChange();
}
function setClip(mode, items){ if (!items.length) return; clip = { mode, items }; MSA.toast(t(mode === 'copy' ? 'copiedItems' : 'cutItems', { n: items.length })); MSA.rerender(); }
function pasteInto(pid){
  if (!clip) return; pid = pid || null; let n = 0;
  clip.items.forEach(i => {
    if (i.k === 'f') {
      const f = folder(i.id); if (!f) return;
      if (clip.mode === 'cut') { if (pid && (pid === f.id || isDesc(pid, f.id))) return; f.parent = pid; n++; }
      else { const cp = cloneFolder(f.id, pid); cp.name = uniqueName(f.name, pid, cp.id); n++; }
    } else {
      const v = L().videos.find(x => x.id === i.id); if (!v) return;
      if (clip.mode === 'cut') { v.folder = pid; n++; } else { L().videos.push(Object.assign({}, v, { id: U.uid('v'), folder: pid, created: Date.now() })); n++; }
    }
  });
  if (clip.mode === 'cut') clip = null;
  sel.clear(); selMode = false; afterChange(); MSA.toast(t('pasted', { n }));
}
function moveItems(items, pid){
  clip = { mode: 'cut', items }; const keep = clip; pasteInto(pid); clip = null;
}

/* ---------- render ---------- */
function folderCard(f, q){
  const cnt = kids(f.id).length + vids(f.id).length, k = 'f:' + f.id, on = sel.has(k), cut = clip && clip.mode === 'cut' && clip.items.some(i => i.id === f.id);
  const pathStr = q ? chain(f.parent).map(x => x.name).join(' / ') : '';
  return '<div class="card fold ' + (on ? 'is-sel ' : '') + (cut ? 'is-cut' : '') + '" draggable="true" data-kind="f" data-id="' + f.id + '" data-drop="' + f.id + '" style="--fc:' + f.color + '">' +
    '<div class="fi">' + I('folder') + '</div><div class="grow"><div class="ft">' + U.esc(f.name) + '</div><div class="fs">' + U.esc(pathStr ? pathStr : t('itemsCount', { n: cnt })) + '</div></div>' +
    '<input type="checkbox" class="cb selbox ' + (on ? 'on' : '') + '" data-act="sel" ' + (on ? 'checked' : '') + ' aria-label="select"></div>';
}
function videoCard(v, q){
  const k = 'v:' + v.id, on = sel.has(k), cut = clip && clip.mode === 'cut' && clip.items.some(i => i.id === v.id), th = thumbOf(v);
  return '<div class="card vcard ' + (on ? 'is-sel ' : '') + (cut ? 'is-cut' : '') + '" draggable="true" data-kind="v" data-id="' + v.id + '">' +
    '<div class="vthumb" style="' + (th ? 'background-image:url(\'' + U.esc(th) + '\')' : 'background:linear-gradient(135deg,#2c3e50,#4b6a88)') + '">' + (th ? '' : I('video', 'lg')) +
    '<span class="play">' + I('play') + '</span><span class="host">' + U.esc(hostOf(v.url)) + '</span></div>' +
    '<input type="checkbox" class="cb selbox ' + (on ? 'on' : '') + '" data-act="sel" ' + (on ? 'checked' : '') + ' aria-label="select">' +
    '<div class="vbody"><div class="vtitle">' + U.esc(titleOf(v)) + '</div><div class="vsub">' + U.esc(q ? chain(v.folder).map(x => x.name).join(' / ') || t('learn.root') : (v.author || MSA.fmtDate(v.created))) + '</div></div></div>';
}
const cmp = (a, b) => sort === 'new' ? (b.created || 0) - (a.created || 0) : String(a.name || titleOf(a)).localeCompare(String(b.name || titleOf(b)), MSA.state.settings.lang);

function renderVideos(host){
  L().videos.forEach(v => { if ((v.pending || v.retry) && !triedMeta.has(v.id)) { triedMeta.add(v.id); v.pending = true; fetchMeta(v); } });
  const cid = curId(), q = query.trim().toLowerCase();
  let fs, vs;
  if (q) { fs = L().folders.filter(f => f.name.toLowerCase().includes(q)); vs = L().videos.filter(v => (titleOf(v) + ' ' + v.url + ' ' + (v.note || '')).toLowerCase().includes(q)); }
  else { fs = kids(cid); vs = vids(cid); }
  fs = fs.slice().sort(cmp); vs = vs.slice().sort(cmp);
  const path = chain(cid);
  const crumbs = '<div class="crumbs"><button data-act="crumb" data-id="" data-drop="" class="' + (!cid ? 'last' : '') + '">' + I('grad', 'sm') + ' ' + U.esc(t('learn.root')) + '</button>' +
    path.map((f, i) => I('chev-r', 'chev') + '<button data-act="crumb" data-id="' + f.id + '" data-drop="' + f.id + '" class="' + (i === path.length - 1 ? 'last' : '') + '">' + U.esc(f.name) + '</button>').join('') + '</div>';
  const nsel = sel.size;
  let html = '<div class="page-head"><div><h1>' + I('grad', 'lg') + U.esc(t('nav.learn')) + '</h1><div class="sub">' + U.esc(t('learn.sub')) + '</div></div></div>' + crumbs +
    '<div class="toolbar" style="margin-top:14px"><button class="btn primary" data-act="addlinks">' + I('link', 'sm') + U.esc(t('addVideoLinks')) + '</button>' +
    '<button class="btn" data-act="newfolder">' + I('folder-plus', 'sm') + U.esc(t('newFolder')) + '</button>' +
    (clip ? '<button class="btn" data-act="paste">' + I('paste', 'sm') + U.esc(t('paste')) + ' (' + clip.items.length + ')</button>' : '') +
    '<button class="btn ' + (selMode ? 'primary' : '') + '" data-act="selmode">' + I('check-c', 'sm') + U.esc(t('select')) + '</button>' +
    '<div class="grow" style="min-width:140px;position:relative"><input type="search" id="lq" value="' + U.esc(query) + '" placeholder="' + U.esc(t('search')) + '" style="padding-inline-start:36px"><span style="position:absolute;top:50%;transform:translateY(-50%);inset-inline-start:11px;opacity:.55;display:grid">' + I('search', 'sm') + '</span></div>' +
    '<select id="lsort" style="width:auto"><option value="name" ' + (sort === 'name' ? 'selected' : '') + '>' + U.esc(t('sortName')) + '</option><option value="new" ' + (sort === 'new' ? 'selected' : '') + '>' + U.esc(t('sortNew')) + '</option></select></div>';
  if (nsel) {
    const one = nsel === 1, hasF = selectedItems().some(i => i.k === 'f');
    html += '<div class="sel-bar"><b style="margin-inline-end:6px">' + U.esc(t('selected', { n: nsel })) + '</b>' +
      (one ? '<button class="btn sm" data-act="s-rename">' + I('pencil', 'sm') + U.esc(t('rename')) + '</button>' : '') +
      '<button class="btn sm" data-act="s-copy">' + I('copy', 'sm') + U.esc(t('copy')) + '</button>' +
      '<button class="btn sm" data-act="s-cut">' + I('scissors', 'sm') + U.esc(t('cut')) + '</button>' +
      (hasF ? '<button class="btn sm" data-act="s-color">' + I('palette', 'sm') + U.esc(t('folderColor')) + '</button>' : '') +
      '<button class="btn sm danger" data-act="s-del">' + I('trash', 'sm') + U.esc(t('delete')) + '</button>' +
      '<button class="btn sm ghost" data-act="s-clear" style="margin-inline-start:auto">' + I('x', 'sm') + '</button></div>';
  }
  if (!fs.length && !vs.length) html += MSA.empty(q ? 'search' : 'folder-open', q ? t('noResults') : t('learn.empty'), q ? '' : t('learn.emptySub'));
  else {
    if (fs.length) html += (q ? '<h3 style="margin:6px 0 10px;font-size:14px" class="muted">' + U.esc(t('folders')) + '</h3>' : '') + '<div class="lgrid ' + (selMode ? 'sel-mode' : '') + '" style="margin-bottom:22px">' + fs.map(f => folderCard(f, q)).join('') + '</div>';
    if (vs.length) html += (q || fs.length ? '<h3 style="margin:6px 0 10px;font-size:14px" class="muted">' + U.esc(t('videos')) + '</h3>' : '') + '<div class="lgrid ' + (selMode ? 'sel-mode' : '') + '">' + vs.map(v => videoCard(v, q)).join('') + '</div>';
  }
  host.innerHTML = html;
  bind(host);
}

function itemFrom(el){ const c = el.closest('[data-kind]'); return c ? { k: c.dataset.kind, id: c.dataset.id, el: c } : null; }
function bind(host){
  const toggleSel = it => { const k = it.k + ':' + it.id; sel.has(k) ? sel.delete(k) : sel.add(k); MSA.rerender(); };
  const itemMenu = (it, x, y) => {
    const items = sel.has(it.k + ':' + it.id) ? selectedItems() : [{ k: it.k, id: it.id }];
    const one = items.length === 1, isF = it.k === 'f';
    const m = [];
    if (one) m.push({ icon: isF ? 'folder-open' : 'play', label: t('open'), onClick: () => isF ? enter(it.id) : openVideo(L().videos.find(v => v.id === it.id)) });
    if (one) m.push({ icon: 'pencil', label: t('rename'), onClick: () => renameItem(it.k, it.id) });
    m.push({ icon: 'copy', label: t('copy'), onClick: () => setClip('copy', items) }, { icon: 'scissors', label: t('cut'), onClick: () => setClip('cut', items) });
    if (clip && isF && one) m.push({ icon: 'paste', label: t('pasteHere'), onClick: () => pasteInto(it.id) });
    if (items.some(i => i.k === 'f')) m.push({ icon: 'palette', label: t('folderColor'), onClick: () => colorize(items) });
    if (!isF && one) m.push({ icon: 'external', label: t('openLink'), onClick: () => MSA.openLink(L().videos.find(v => v.id === it.id).url) });
    m.push('-', { icon: 'trash', label: t('delete'), danger: true, onClick: () => deleteItems(items) });
    MSA.ctx(x, y, m);
  };
  const enter = id => { MSA.state.ui.learnFolder = id || null; query = ''; sel.clear(); MSA.save(); MSA.rerender(false); };
  MSA.on(host, {
    addlinks: addLinks, newfolder: newFolder, paste: () => pasteInto(curId()),
    selmode: () => { selMode = !selMode; if (!selMode) sel.clear(); MSA.rerender(); },
    crumb: el => enter(el.dataset.id),
    sel: (el, e) => { e.stopPropagation(); const it = itemFrom(el); toggleSel(it); },
    's-rename': () => { const i = selectedItems()[0]; renameItem(i.k, i.id); },
    's-copy': () => setClip('copy', selectedItems()), 's-cut': () => setClip('cut', selectedItems()),
    's-color': () => colorize(selectedItems()), 's-del': () => deleteItems(selectedItems()),
    's-clear': () => { sel.clear(); selMode = false; MSA.rerender(); }
  });
  host.addEventListener('click', e => {
    if (e.target.closest('[data-act]')) return;
    const it = itemFrom(e.target); if (!it) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || selMode) { toggleSel(it); return; }
    if (it.k === 'f') enter(it.id); else openVideo(L().videos.find(v => v.id === it.id));
  });
  host.addEventListener('contextmenu', e => { const it = itemFrom(e.target); if (!it) return; e.preventDefault(); itemMenu(it, e.clientX, e.clientY); });
  const lq = $('#lq', host); if (lq) lq.addEventListener('input', e => { query = e.target.value; const pos = e.target.selectionStart; MSA.rerender(false); const n = $('#lq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } });
  const ls = $('#lsort', host); if (ls) ls.addEventListener('change', e => { sort = e.target.value; MSA.rerender(); });
  /* long-press for touch -> context menu */
  let lp = null;
  host.addEventListener('touchstart', e => { const it = itemFrom(e.target); if (!it) return; const tc = e.touches[0]; lp = setTimeout(() => { lp = null; itemMenu(it, tc.clientX, tc.clientY); }, 600); }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(n => host.addEventListener(n, () => { if (lp) { clearTimeout(lp); lp = null; } }, { passive: true }));
  /* drag & drop move */
  host.addEventListener('dragstart', e => {
    const it = itemFrom(e.target); if (!it) return;
    const items = sel.has(it.k + ':' + it.id) ? selectedItems() : [{ k: it.k, id: it.id }];
    e.dataTransfer.setData('text/msa', JSON.stringify(items)); e.dataTransfer.effectAllowed = 'move';
  });
  const dropTarget = e => e.target.closest('[data-drop]');
  host.addEventListener('dragover', e => { const d = dropTarget(e); if (d) { e.preventDefault(); d.classList.add('drop-hot'); } });
  host.addEventListener('dragleave', e => { const d = dropTarget(e); if (d) d.classList.remove('drop-hot'); });
  host.addEventListener('drop', e => {
    const d = dropTarget(e); if (!d) return; e.preventDefault(); d.classList.remove('drop-hot');
    try { moveItems(JSON.parse(e.dataTransfer.getData('text/msa')), d.dataset.drop || null); } catch (err) {}
  });
}

/* keyboard shortcuts while this view is open */
document.addEventListener('keydown', e => {
  if (MSA.view !== 'learn' || e.target.closest('input,textarea,select,[contenteditable]') || $('#overlayRoot').children.length) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'c' && sel.size) { e.preventDefault(); setClip('copy', selectedItems()); }
  else if (mod && e.key.toLowerCase() === 'x' && sel.size) { e.preventDefault(); setClip('cut', selectedItems()); }
  else if (mod && e.key.toLowerCase() === 'v' && clip) { e.preventDefault(); pasteInto(curId()); }
  else if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); kids(curId()).forEach(f => sel.add('f:' + f.id)); vids(curId()).forEach(v => sel.add('v:' + v.id)); MSA.rerender(); }
  else if (e.key === 'Delete' && sel.size) deleteItems(selectedItems());
  else if (e.key === 'F2' && sel.size === 1) { const i = selectedItems()[0]; renameItem(i.k, i.id); }
  else if (e.key === 'Escape' && sel.size) { sel.clear(); selMode = false; MSA.rerender(); }
});

const ltab = () => MSA.state.ui.ltab || 'videos';
function render(host){
  if (!host._ltBound) { host._ltBound = true; host.addEventListener('click', e => { const b = e.target.closest('[data-lt]'); if (b) { MSA.state.ui.ltab = b.dataset.lt; MSA.save(); MSA.rerender(false); } }); }
  if (ltab() === 'videos') { renderVideos(host); host.insertAdjacentHTML('afterbegin', MSA.studio.learnTabBar('videos')); const h = host.querySelector('.page-head'); if (h) host.insertBefore(host.firstChild, h.nextSibling); return; }
  host.innerHTML = '<div class="page-head"><div><h1>' + I('grad', 'lg') + U.esc(t('nav.learn')) + '</h1><div class="sub">' + U.esc(t('learn.sub')) + '</div></div></div>' + MSA.studio.learnTabBar(ltab()) + '<div id="ltHost"></div>';
  MSA.studio.renderLearn(ltab(), host.querySelector('#ltHost'));
}
MSA.views.learn = { render };
})();

