/* Performance layer + covers.
   - small cached thumbnails (separate IndexedDB, never part of backups) so big photos/videos are never decoded just to draw a 78px tile
   - lazy loading: only tiles near the screen are loaded, a few at a time
   - covers: a chosen picture for a step (stage) and for a project (from the project's files or from the device)
   - note boxes grow to show all their text */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e);
const W = 480, SMALL = 70 * 1024;

/* ---------- thumbnail store ---------- */
const mem = new Map(), urls = new Map();
let dbp = null;
function open(){
  if (dbp) return dbp;
  dbp = new Promise(res => {
    try {
      const rq = indexedDB.open('msa_thumbs', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('th', { keyPath: 'id' });
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null);
    } catch (e) { res(null); }
  });
  return dbp;
}
async function dbGet(id){
  const db = await open(); if (!db) return mem.get(id) || null;
  return new Promise(r => { try { const q = db.transaction('th', 'readonly').objectStore('th').get(id); q.onsuccess = () => r(q.result || null); q.onerror = () => r(null); } catch (e) { r(null); } });
}
async function dbPut(rec){
  const db = await open(); if (!db) { mem.set(rec.id, rec); return; }
  return new Promise(r => { try { const t = db.transaction('th', 'readwrite'); t.objectStore('th').put(rec); t.oncomplete = () => r(); t.onerror = () => r(); t.onabort = () => r(); } catch (e) { r(); } });
}
async function dbDel(id){
  mem.delete(id);
  const db = await open(); if (!db) return;
  return new Promise(r => { try { const t = db.transaction('th', 'readwrite'); t.objectStore('th').delete(id); t.oncomplete = () => r(); t.onerror = () => r(); t.onabort = () => r(); } catch (e) { r(); } });
}
async function dbClear(){
  mem.clear();
  const db = await open(); if (!db) return;
  return new Promise(r => { try { const t = db.transaction('th', 'readwrite'); t.objectStore('th').clear(); t.oncomplete = () => r(); t.onerror = () => r(); t.onabort = () => r(); } catch (e) { r(); } });
}

/* ---------- generation (a small queue so the screen never freezes) ---------- */
const queue = []; let running = 0;
function enqueue(fn){
  return new Promise(res => { queue.push({ fn, res }); pump(); });
}
function pump(){
  while (running < 2 && queue.length) {
    const j = queue.shift(); running++;
    Promise.resolve().then(j.fn).catch(() => null).then(v => { running--; j.res(v); pump(); });
  }
}
function canvasBlob(cv){
  return new Promise(r => {
    const fin = () => cv.toBlob(b => r(b), 'image/jpeg', .8);
    try { cv.toBlob(b => { if (b && b.type === 'image/webp') r(b); else fin(); }, 'image/webp', .8); } catch (e) { fin(); }
  });
}
async function imgThumb(blob){
  let src = null, w = 0, h = 0;
  try { src = await createImageBitmap(blob, { resizeWidth: W, resizeQuality: 'medium' }); w = src.width; h = src.height; } catch (e) { src = null; }
  if (!src) {
    const u = URL.createObjectURL(blob);
    try {
      src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = u; });
      const k = Math.min(1, W / (src.naturalWidth || W)); w = Math.max(1, Math.round(src.naturalWidth * k)); h = Math.max(1, Math.round(src.naturalHeight * k));
    } finally { setTimeout(() => URL.revokeObjectURL(u), 500); }
  }
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(src, 0, 0, w, h);
  try { src.close && src.close(); } catch (e) {}
  return canvasBlob(cv);
}
function vidThumb(blob){
  return new Promise(res => {
    const u = URL.createObjectURL(blob), v = document.createElement('video');
    let done = false;
    const fin = b => { if (done) return; done = true; clearTimeout(tm); try { v.removeAttribute('src'); v.load(); } catch (e) {} URL.revokeObjectURL(u); res(b); };
    const tm = setTimeout(() => fin(null), 7000);
    v.muted = true; v.preload = 'auto'; v.playsInline = true;
    v.onerror = () => fin(null);
    v.onloadeddata = () => { try { v.currentTime = Math.min(1, (v.duration || 2) / 10); } catch (e) { fin(null); } };
    v.onseeked = async () => {
      try {
        const k = Math.min(1, W / (v.videoWidth || W)), w = Math.max(1, Math.round(v.videoWidth * k)), h = Math.max(1, Math.round(v.videoHeight * k));
        if (!v.videoWidth) return fin(null);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(v, 0, 0, w, h);
        fin(await canvasBlob(cv));
      } catch (e) { fin(null); }
    };
    v.src = u;
  });
}

/* resolves to { u, full } — a small picture URL when we could make one, else the original file URL */
const pend = new Map();
async function thumbUrl(id){
  if (urls.has(id)) return { u: urls.get(id), full: false };
  if (pend.has(id)) return pend.get(id);
  const p = (async () => {
    const hit = await dbGet(id);
    if (hit && hit.blob) { const u = URL.createObjectURL(hit.blob); urls.set(id, u); return { u, full: false }; }
    const rec = await MSA.files.get(id); if (!rec || !rec.blob) return null;
    const mime = rec.mime || (rec.blob && rec.blob.type) || '', size = rec.size || rec.blob.size || 0;
    const isImg = /^image\//.test(mime) || U.kindOf(mime, rec.name || '') === 'image', isVid = /^video\//.test(mime) || U.kindOf(mime, rec.name || '') === 'video';
    if ((isImg && size > SMALL && !/svg|gif/.test(mime)) || isVid) {
      const b = await enqueue(() => isVid ? vidThumb(rec.blob) : imgThumb(rec.blob));
      if (b && b.size) { dbPut({ id, blob: b }); const u = URL.createObjectURL(b); urls.set(id, u); return { u, full: false }; }
    }
    const u = await MSA.files.url(id); return u ? { u, full: true } : null;
  })().finally(() => pend.delete(id));
  pend.set(id, p); return p;
}
MSA.thumbs = { url: async id => { const r = await thumbUrl(id); return r && r.u; }, get: thumbUrl, drop: async id => { const u = urls.get(id); if (u) { URL.revokeObjectURL(u); urls.delete(id); } await dbDel(id); } };

/* keep thumbnails in step with the files */
const _del = MSA.files.del, _clear = MSA.files.clear;
MSA.files.del = async function(id){ try { await MSA.thumbs.drop(id); } catch (e) {} return _del.apply(this, arguments); };
MSA.files.clear = async function(){ try { urls.forEach(u => URL.revokeObjectURL(u)); urls.clear(); await dbClear(); } catch (e) {} return _clear.apply(this, arguments); };
/* a file that is replaced under the same id (covers) must lose its old thumbnail */
const _putRec = MSA.files.putRec;
MSA.files.putRec = async function(rec){ try { if (rec && rec.id) await MSA.thumbs.drop(rec.id); } catch (e) {} return _putRec.apply(this, arguments); };

/* new files: make their thumbnails in the background right after they are added, so the tiles are already light when they show */
const _addFiles = MSA.addFiles;
MSA.addFiles = async function(){
  const out = await _addFiles.apply(this, arguments);
  (out || []).forEach(a => { if (a && (a.kind === 'image' || a.kind === 'video')) setTimeout(() => thumbUrl(a.id), 50); });
  return out;
};

/* ---------- lazy hydration of attachment tiles ---------- */
const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { io.unobserve(en.target); load(en.target); } }), { rootMargin: '500px' }) : null;
async function load(el){
  if (!el.isConnected || el.dataset.thd) return; el.dataset.thd = '1';
  const id = el.dataset.thumb, isVid = el.tagName === 'VIDEO';
  const r = await thumbUrl(id);
  if (!el.isConnected) return;
  if (!r) { const w = el.closest('.att'); if (w) w.style.opacity = .4; return; }
  if (isVid && !r.full) {
    const im = new Image(); im.className = el.className; im.alt = ''; im.decoding = 'async'; im.dataset.thumb = id; im.dataset.thd = '1'; im.src = r.u; el.replaceWith(im);
  } else { el.decoding = 'async'; el.src = isVid ? r.u + '#t=0.1' : r.u; }
}
MSA.hydrateAtts = function(root){
  $$('[data-thumb]', root).forEach(el => { if (el.src || el.dataset.thd) return; if (io) io.observe(el); else load(el); });
  $$('textarea[data-note]', root).forEach(grow);
};

/* ---------- notes: show everything that was written ---------- */
function grow(ta){
  if (!ta || !ta.isConnected) return;
  ta.style.height = 'auto'; const h = ta.scrollHeight; if (h > 0) ta.style.height = (h + 2) + 'px';
}
MSA.growNote = grow;
document.addEventListener('input', e => { const ta = e.target; if (ta && ta.matches && ta.matches('textarea[data-note]')) grow(ta); });
window.addEventListener('resize', U.debounce ? U.debounce(() => $$('textarea[data-note]').forEach(grow), 150) : () => {});

/* ---------- covers ---------- */
let covSet = null;
const _save = MSA.save; MSA.save = function(){ covSet = null; return _save.apply(this, arguments); };
function stepCovers(){
  if (covSet) return covSet; covSet = new Set();
  const P = MSA.proj; (MSA.state.projects || []).forEach(p => P.walk(p.steps, s => { if (s.cover && s.cover.att) covSet.add(s.cover.att); }));
  return covSet;
}
const isVisual = a => a && (a.kind === 'image' || a.kind === 'video' || (a.kind === 'link' && (a.cover || a.thumb)));
const COV = MSA.cover = {
  /* the attachment-like object to draw for a step / project, or null for "automatic" */
  step(s, atts){ const c = s && s.cover; if (!c) return null; if (c.dev) return { id: s.id + '_sc', kind: 'image', name: 'cover' }; return (atts || s.atts || []).find(a => a.id === c.att) || null; },
  proj(p){ const c = p && p.cover; if (!c) return null; if (c.dev) return { id: p.id + '_pc', kind: 'image', name: 'cover' }; return MSA.proj.allAtts(p.steps).find(a => a.id === c.att) || null; },
  isStep: id => stepCovers().has(id),
  /* files to delete together with a step / project */
  extra(o){ return o && o.cover && o.cover.dev ? [{ id: o.id + (o.steps ? '_pc' : '_sc') }] : []; },
  extraAll(list){ const out = []; MSA.proj.walk(list, s => out.push(...COV.extra(s))); return out; },
  async saveDevice(owner, suffix, file){
    await MSA.files.putRec({ id: owner.id + suffix, name: 'cover', mime: file.type || 'image/jpeg', size: file.size || 0, blob: file, created: Date.now() });
  },
  setStepByAtt(attId){
    const P = MSA.proj; let hit = null; (MSA.state.projects || []).forEach(p => P.walk(p.steps, s => { if (!hit && s.atts.some(a => a.id === attId)) hit = s; }));
    if (!hit) return;
    if (hit.cover && hit.cover.att === attId) { delete hit.cover; MSA.toast(T('رجّع الغلاف تلقائي', 'Cover back to automatic')); }
    else { if (hit.cover && hit.cover.dev) MSA.files.del(hit.id + '_sc'); hit.cover = { att: attId }; MSA.toast(T('اتحددت صورة الغلاف', 'Cover set'), 'ok'); }
    MSA.save(); MSA.rerender(true);
  }
};

/* picker: items = the owner's pictures/videos; resolves {att} | {file} | {none:true} | null */
COV.pick = function(o){
  return new Promise(res => {
    let out = null;
    const items = (o.items || []).filter(isVisual);
    const tile = a => '<button type="button" class="cvp-i' + (o.current && o.current.att === a.id ? ' on' : '') + '" data-id="' + a.id + '" title="' + U.esc(a.name || '') + '">' +
      (a.kind === 'link' ? MSA.linkCover(a) : '<' + (a.kind === 'video' ? 'video muted playsinline' : 'img') + ' data-thumb="' + a.id + '" alt=""></' + (a.kind === 'video' ? 'video' : 'img') + '>') + '<i>' + I('check', 'sm') + '</i></button>';
    MSA.modal({
      title: o.title || T('اختيار صورة الغلاف', 'Choose a cover'), size: 'wide',
      body: '<div class="hint" style="margin-bottom:10px" dir="auto">' + U.esc(items.length ? T('اختار صورة من ملفات الخلية/المشروع، أو ارفع صورة من جهازك.', 'Pick one of the pictures here, or upload one from your device.') : T('مفيش صور هنا — ارفع صورة من جهازك.', 'No pictures here — upload one from your device.')) + '</div>' +
        (items.length ? '<div class="cvp-g">' + items.map(tile).join('') + '</div>' : ''),
      buttons: [
        { label: T('تلقائي', 'Automatic'), cls: 'ghost', onClick: a => { out = { none: true }; a.close(); } },
        { label: T('من الجهاز…', 'From device…'), onClick: async a => { const fs = await MSA.pickFiles('image/*', false); const f = fs && fs[0]; if (!f) return; out = { file: f }; a.close(); } },
        { label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }
      ],
      onMount: (el, api) => { MSA.hydrateAtts(el); el.addEventListener('click', e => { const b = e.target.closest('.cvp-i'); if (!b) return; out = { att: b.dataset.id }; api.close(); }); },
      onClose: () => res(out)
    });
  });
};
COV.pickStep = async function(p, s, done){
  const r = await COV.pick({ title: T('غلاف الخلية: ', 'Cell cover: ') + MSA.proj.title(s), items: s.atts, current: s.cover });
  if (!r) return;
  if (r.none) { if (s.cover && s.cover.dev) await MSA.files.del(s.id + '_sc'); delete s.cover; }
  else if (r.att) { if (s.cover && s.cover.dev) await MSA.files.del(s.id + '_sc'); s.cover = { att: r.att }; }
  else if (r.file) { await COV.saveDevice(s, '_sc', r.file); s.cover = { dev: true }; }
  MSA.save(); done && done();
};
COV.pickProj = async function(p, done){
  const r = await COV.pick({ title: T('غلاف المشروع: ', 'Project cover: ') + p.name, items: MSA.proj.allAtts(p.steps), current: p.cover });
  if (!r) return;
  if (r.none) { if (p.cover && p.cover.dev) await MSA.files.del(p.id + '_pc'); delete p.cover; }
  else if (r.att) { if (p.cover && p.cover.dev) await MSA.files.del(p.id + '_pc'); p.cover = { att: r.att }; }
  else if (r.file) { await COV.saveDevice(p, '_pc', r.file); p.cover = { dev: true }; }
  MSA.save(); done && done();
};

/* star button on picture tiles (the stage's cover) */
const _att = MSA.attHTML;
MSA.attHTML = function(a, removable){
  let h = _att(a, removable);
  if (removable && (a.kind === 'image' || a.kind === 'video')) {
    const on = COV.isStep(a.id);
    h = h.replace(/<\/div>$/, '<button class="cvb' + (on ? ' on' : '') + '" data-cov-att="' + a.id + '" title="' + U.esc(on ? T('إلغاء الغلاف', 'Remove as cover') : T('تعيين كغلاف للخلية', 'Set as cell cover')) + '" aria-label="cover">' + I('star', 'sm') + '</button></div>');
  }
  return h;
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-cov-att]'); if (!b) return;
  e.stopPropagation(); e.preventDefault(); COV.setStepByAtt(b.dataset.covAtt);
}, true);
})();
