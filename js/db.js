/* Utilities, persistent state (localStorage) and file storage (IndexedDB) */
(function(){
const MSA = window.MSA = window.MSA || {};

/* ---------- utils ---------- */
const U = MSA.u = {
  uid(p){ return (p||'i') + Date.now().toString(36) + Math.random().toString(36).slice(2,7); },
  esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
  debounce(fn, ms){ let t; const d = function(){ clearTimeout(t); t = setTimeout(() => fn.apply(null, arguments), ms); }; d.flush = () => { clearTimeout(t); fn(); }; return d; },
  size(n){ if (n < 1024) return n + ' B'; if (n < 1048576) return (n/1024).toFixed(0) + ' KB'; if (n < 1073741824) return (n/1048576).toFixed(1) + ' MB'; return (n/1073741824).toFixed(2) + ' GB'; },
  kindOf(mime, name){
    mime = mime || ''; name = (name || '').toLowerCase();
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (/\.(png|jpe?g|gif|webp|svg|bmp|avif|heic)$/.test(name)) return 'image';
    if (/\.(mp4|mov|mkv|webm|avi|m4v)$/.test(name)) return 'video';
    if (/\.(mp3|wav|aac|m4a|ogg|flac)$/.test(name)) return 'audio';
    return 'doc';
  },
  pad(n){ return String(n).padStart(2,'0'); },
  dateKey(d){ return d.getFullYear() + '-' + U.pad(d.getMonth()+1) + '-' + U.pad(d.getDate()); },
  /* "2026-10-03T14:30" local datetime strings <-> ms */
  toMs(s){ if (!s) return null; const t = new Date(s).getTime(); return isNaN(t) ? null : t; },
  sanitize(html){
    const ALLOW = {B:1,STRONG:1,I:1,EM:1,U:1,S:1,UL:1,OL:1,LI:1,BR:1,P:1,DIV:1,SPAN:0,H3:1,A:1};
    const doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
    const root = doc.body.firstChild;
    (function walk(node){
      Array.from(node.childNodes).forEach(ch => {
        if (ch.nodeType === 3) return;
        if (ch.nodeType !== 1) { ch.remove(); return; }
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META)$/.test(ch.tagName)) { ch.remove(); return; }
        walk(ch);
        if (!ALLOW[ch.tagName]) { while (ch.firstChild) ch.parentNode.insertBefore(ch.firstChild, ch); ch.remove(); return; }
        Array.from(ch.attributes).forEach(a => {
          if (ch.tagName === 'A' && a.name === 'href' && /^(https?:|mailto:|tel:)/i.test(a.value)) return;
          ch.removeAttribute(a.name);
        });
        if (ch.tagName === 'A') { ch.setAttribute('target','_blank'); ch.setAttribute('rel','noopener noreferrer'); }
      });
    })(root);
    return root.innerHTML;
  },
  stripHtml(html){ const d = document.createElement('div'); d.innerHTML = U.sanitize(html); return (d.textContent || '').trim(); }
};

/* ---------- state ---------- */
const KEY = 'msa_state_v1';
function defaults(){
  return {
    v: 1,
    settings: { theme: 'dark', lang: 'ar', accent: '#5b8def', intro: true },
    profile: { name: 'Mohamed Ashraf', title: 'Graphic Designer & Video Editor', email: '', phone: '', whatsapp: '', location: '', website: '', bio: '', avatar: null },
    accounts: [],
    projects: [],
    learning: { folders: [], videos: [] },
    tasks: [],
    ui: { project: null, learnFolder: null, tasksView: 'list' },
    seeded: false
  };
}
function load(){
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw), d = defaults();
      return Object.assign(d, s, {
        settings: Object.assign(d.settings, s.settings), profile: Object.assign(d.profile, s.profile),
        learning: Object.assign(d.learning, s.learning), ui: Object.assign(d.ui, s.ui)
      });
    }
  } catch (e) { console.warn('state load failed', e); }
  return defaults();
}
MSA.state = load();
let frozen = false; /* set while a backup is being restored / data wiped, so the page-unload save cannot overwrite it */
const persist = () => { if (frozen) return; try { localStorage.setItem(KEY, JSON.stringify(MSA.state)); } catch (e) { if (e && (e.name === 'QuotaExceededError' || e.code === 22) && MSA.toast) MSA.toast('Storage is full — export a backup', 'err'); } };
const saveDeb = U.debounce(persist, 250);
MSA.save = () => saveDeb();
MSA.saveNow = () => { saveDeb.flush(); };
window.addEventListener('beforeunload', persist);
document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

/* ---------- files (IndexedDB with in-memory fallback) ---------- */
const mem = new Map();
let dbp = null;
function open(){
  if (dbp) return dbp;
  dbp = new Promise(res => {
    try {
      const rq = indexedDB.open('msa_files', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('files', { keyPath: 'id' });
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
  return dbp;
}
function tx(db, mode, fn){
  return new Promise((res, rej) => {
    const t = db.transaction('files', mode), st = t.objectStore('files'); let out;
    const r = fn(st); if (r) r.onsuccess = () => { out = r.result; };
    t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
}
const urlCache = new Map();
MSA.files = {
  async put(file){
    const rec = { id: U.uid('f'), name: file.name || 'file', mime: file.type || '', size: file.size || 0, blob: file, created: Date.now() };
    const db = await open();
    if (db) await tx(db, 'readwrite', st => st.put(rec)); else mem.set(rec.id, rec);
    return { id: rec.id, name: rec.name, mime: rec.mime, size: rec.size, kind: U.kindOf(rec.mime, rec.name) };
  },
  async get(id){ const db = await open(); return db ? tx(db, 'readonly', st => st.get(id)) : mem.get(id); },
  async url(id){
    if (urlCache.has(id)) return urlCache.get(id);
    const rec = await MSA.files.get(id); if (!rec) return null;
    const u = URL.createObjectURL(rec.blob); urlCache.set(id, u); return u;
  },
  async del(id){
    const u = urlCache.get(id); if (u) { URL.revokeObjectURL(u); urlCache.delete(id); }
    const db = await open(); if (db) await tx(db, 'readwrite', st => st.delete(id)); else mem.delete(id);
  },
  async delMany(list){ for (const a of (list || [])) { try { await MSA.files.del(a.id); } catch (e) {} } },
  async ids(){ const db = await open(); return db ? tx(db, 'readonly', st => st.getAllKeys()) : Array.from(mem.keys()); },
  async putRec(rec){ const db = await open(); if (db) await tx(db, 'readwrite', st => st.put(rec)); else mem.set(rec.id, rec); },
  async all(){ const db = await open(); return db ? tx(db, 'readonly', st => st.getAll()) : Array.from(mem.values()); },
  async clear(){ const db = await open(); if (db) await tx(db, 'readwrite', st => st.clear()); mem.clear(); urlCache.forEach(u => URL.revokeObjectURL(u)); urlCache.clear(); }
};

/* ---------- backup ---------- */
const b64 = blob => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
/* opts.maxFile / opts.maxTotal (bytes) keep the periodic "light" backup small: bigger files (videos) are listed in `skipped`
   instead of being packed. With no options everything is included, exactly like before. */
MSA.exportAll = async function(opts){
  opts = opts || {}; const files = [], skipped = []; let tot = 0;
  for (const f of await MSA.files.all()) {
    const sz = f.size || (f.blob && f.blob.size) || 0;
    if ((opts.maxFile && sz > opts.maxFile) || (opts.maxTotal && tot + sz > opts.maxTotal)) { skipped.push({ id: f.id, name: f.name, size: sz }); continue; }
    tot += sz; files.push({ id: f.id, name: f.name, mime: f.mime, size: f.size, data: await b64(f.blob) });
  }
  MSA.lastExportSkipped = skipped.length;
  return JSON.stringify({ app: 'my-smart-assistant', version: 1, exported: new Date().toISOString(), skipped: skipped.length ? skipped : undefined, state: (() => { const st = JSON.parse(JSON.stringify(MSA.state)); if (st.connectors) { delete st.connectors.claude; delete st.connectors.keys; } return st; })(), files });
};
MSA.importAll = async function(text){
  const d = JSON.parse(text);
  if (!d || d.app !== 'my-smart-assistant' || !d.state) throw new Error('bad backup');
  await MSA.files.clear();
  for (const f of d.files || []) {
    const blob = await (await fetch(f.data)).blob();
    const rec = { id: f.id, name: f.name, mime: f.mime, size: f.size, blob: new Blob([blob], { type: f.mime }), created: Date.now() };
    const db = await open(); if (db) await tx(db, 'readwrite', st => st.put(rec)); else mem.set(rec.id, rec);
  }
  frozen = true; localStorage.setItem(KEY, JSON.stringify(d.state));
};
MSA.resetAll = async function(){ frozen = true; await MSA.files.clear(); localStorage.removeItem(KEY); };
})();

