/* Shared multi-select + right-click engine (Explorer / Drive style).
   MSA.multi.attach(host, cfg) makes the items of a list selectable (Ctrl/Cmd+click, Shift+click range, long-press on touch,
   a "Select" button, Ctrl+A / Esc / Del), shows a floating action bar for the selection and a right-click menu on items and background.
   cfg = { key, item (selector), idOf(el), objOf(id), entries(objs, el|null) -> menu entries, run(actionId, objs, el), bar:[ids],
           bgEntries(), bgRun(id), btnHost (selector for the Select button), label(obj) }
   Menu entries: { id, label, icon, key, danger, disabled, dot, sub:[entries] } or '-'. */
(function(){
const MSA = window.MSA, I = MSA.icon, U = MSA.u, esc = U.esc, T = (a, e) => MSA.T(a, e);
const sets = {};        /* key -> { ids:Set, mode:bool, view } */
let active = null;      /* the attached host currently on screen */
let bar = null, last = null, supp = 0;
const st = key => sets[key] || (sets[key] = { ids: new Set(), mode: false, view: MSA.view });
const isCtl = el => el && el.closest && el.closest('a,button,input,select,textarea,label,[contenteditable=true]');
const hostOk = h => h && h.isConnected && h._ms && sets[h._ms.cfg.key] && sets[h._ms.cfg.key].view === MSA.view;
const objs = (h) => { const c = h._ms.cfg; return Array.from(sets[c.key].ids).map(id => c.objOf(id)).filter(Boolean); };
const els = h => Array.from(h.querySelectorAll(h._ms.cfg.item));
const menu = (pt, entries, run) => { if (MSA.menu && entries.length) MSA.menu.show(pt, entries, run); };

function attach(host, cfg){
  const s = st(cfg.key); if (s.view !== MSA.view) { s.ids.clear(); s.mode = false; s.view = MSA.view; }
  if (!host._ms) { host._ms = { cfg }; install(host); } else host._ms.cfg = cfg;
  active = host; paint(host);
}
function paint(host){
  const c = host._ms.cfg, s = sets[c.key];
  const live = new Set(); els(host).forEach(el => { const id = c.idOf(el); if (id == null) return; live.add(id); el.classList.add('ms-item'); const on = s.ids.has(id); el.classList.toggle('ms-on', on); el.setAttribute('aria-selected', on ? 'true' : 'false'); });
  Array.from(s.ids).forEach(id => { if (!c.objOf(id)) s.ids.delete(id); });
  host.classList.toggle('ms-mode', s.mode || s.ids.size > 0);
  if (c.btnHost) {
    const bh = host.querySelector(c.btnHost);
    if (bh) { let b = bh.querySelector('.ms-tgl'); if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm ms-tgl'; bh.insertBefore(b, bh.firstChild); }
      const on = s.mode || s.ids.size > 0; b.classList.toggle('primary', on); b.innerHTML = I('checks', 'sm') + '<span>' + esc(on ? T('إلغاء التحديد', 'Cancel select') : T('تحديد', 'Select')) + '</span>'; b.dataset.msTgl = c.key; }
  }
  drawBar();
}
function drawBar(){
  const h = active; const ok = hostOk(h), s = ok && sets[h._ms.cfg.key], n = ok ? s.ids.size : 0;
  if (!n) { if (bar) { bar.remove(); bar = null; } return; }
  const c = h._ms.cfg, list = objs(h), ents = c.entries(list, null).filter(e => e !== '-');
  const pick = (c.bar || []).map(id => ents.find(e => e.id === id)).filter(Boolean);
  if (!bar) { bar = document.createElement('div'); bar.className = 'ms-bar'; bar.setAttribute('role', 'toolbar'); document.body.appendChild(bar); bar.addEventListener('click', onBar); }
  bar.innerHTML = '<b class="ms-n">' + esc(T(n + ' محدد', n + ' selected')) + '</b>' +
    '<button class="ms-b" data-ms="all" title="' + esc(T('تحديد الكل', 'Select all')) + '">' + I('checks', 'sm') + '</button>' +
    pick.map(e => '<button class="ms-b' + (e.danger ? ' danger' : '') + '" data-ms="a:' + esc(e.id) + '" title="' + esc(e.label) + '">' + (e.dot ? '<i class="fm-dot" style="background:' + esc(e.dot) + '"></i>' : I(e.icon || 'minus', 'sm')) + '<span class="ms-l">' + esc(e.label) + '</span></button>').join('') +
    '<button class="ms-b" data-ms="more" title="' + esc(T('المزيد', 'More')) + '">' + I('more', 'sm') + '</button>' +
    '<button class="ms-b" data-ms="clr" title="' + esc(T('إلغاء التحديد', 'Clear selection')) + '">' + I('x', 'sm') + '</button>';
}
function onBar(e){
  const b = e.target.closest('[data-ms]'); if (!b || !hostOk(active)) return; const h = active, c = h._ms.cfg, a = b.dataset.ms, r = b.getBoundingClientRect(), pt = { x: r.left, y: r.top };
  if (a === 'clr') { clear(c.key); return; }
  if (a === 'all') { selectAll(h); return; }
  const list = objs(h), ents = c.entries(list, null);
  const runIt = id => { c.run(id, objs(h), null); };
  if (a === 'more') { menuAt(pt, ents, runIt, true); return; }
  const en = ents.find(x => x !== '-' && 'a:' + x.id === a); if (!en) return;
  if (en.sub) menuAt(pt, en.sub, runIt, true); else runIt(en.id);
}
function menuAt(pt, entries, run, above){
  menu(pt, entries, run);
  const el = document.querySelector('.fm-ctx'); if (el && above) { const h = el.offsetHeight; el.style.top = Math.max(6, pt.y - h - 8) + 'px'; }
}
function toggle(h, id, on){
  const c = h._ms.cfg, s = sets[c.key]; const want = on == null ? !s.ids.has(id) : on; if (want) s.ids.add(id); else s.ids.delete(id); last = id; paint(h);
}
function range(h, id){
  const c = h._ms.cfg, s = sets[c.key], ids = els(h).map(c.idOf); const a = ids.indexOf(last), b = ids.indexOf(id);
  if (a < 0 || b < 0) { toggle(h, id, true); return; }
  ids.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(i => s.ids.add(i)); paint(h);
}
function selectAll(h){ const c = h._ms.cfg, s = sets[c.key]; els(h).forEach(el => { const id = c.idOf(el); if (id != null) s.ids.add(id); }); s.mode = true; paint(h); }
function clear(key){ const s = sets[key]; if (s) { s.ids.clear(); s.mode = false; } if (active && active._ms && active._ms.cfg.key === key && active.isConnected) paint(active); else drawBar(); }

function install(host){
  host.addEventListener('click', e => {
    const c = host._ms.cfg, s = sets[c.key];
    const tg = e.target.closest('.ms-tgl'); if (tg) { e.preventDefault(); e.stopPropagation(); if (s.mode || s.ids.size) { s.ids.clear(); s.mode = false; } else s.mode = true; paint(host); return; }
    if (supp > Date.now()) { e.preventDefault(); e.stopPropagation(); return; }
    const el = e.target.closest(c.item); if (!el || !host.contains(el)) return;
    const ctl = isCtl(e.target), inner = ctl && ctl !== el && el.contains(ctl);
    const mod = e.ctrlKey || e.metaKey, shift = e.shiftKey, selecting = s.ids.size > 0 || s.mode;
    if (!mod && !shift && !selecting) return;
    if (inner && !mod && !shift) return;
    const id = c.idOf(el); if (id == null) return;
    e.preventDefault(); e.stopPropagation();
    if (shift && last != null && !mod) range(host, id); else toggle(host, id);
  }, true);
  host.addEventListener('contextmenu', e => {
    const c = host._ms.cfg; if (e.defaultPrevented || e.target.closest('input,select,textarea,[contenteditable=true],.fm-ctx')) return;
    const el = e.target.closest(c.item), pt = { x: e.clientX, y: e.clientY }; if (!(el && host.contains(el)) && !c.bgEntries) return;
    e.preventDefault(); active = host;
    if (el && host.contains(el)) {
      const id = c.idOf(el), s = sets[c.key], o = c.objOf(id); if (!o) return;
      const list = (s.ids.has(id) && s.ids.size > 1) ? objs(host) : [o];
      menu(pt, c.entries(list, el), a => { if (a === 'sel') { toggle(host, id, true); sets[c.key].mode = true; paint(host); } else c.run(a, list, el); });
    } else if (c.bgEntries) menu(pt, c.bgEntries(), a => { if (a === 'all') selectAll(host); else c.bgRun(a); });
  });
  /* touch: long-press selects */
  let t0 = null, tm = 0, pos = null;
  host.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return; const c = host._ms.cfg, el = e.target.closest(c.item); if (!el || !host.contains(el)) return;
    pos = { x: e.clientX, y: e.clientY }; clearTimeout(tm);
    tm = setTimeout(() => { const id = c.idOf(el); if (id == null) return; supp = Date.now() + 700; try { getSelection().removeAllRanges(); } catch (x) {} try { navigator.vibrate && navigator.vibrate(15); } catch (x) {} sets[c.key].mode = true; toggle(host, id, true); }, 480);
  });
  const cancel = () => { clearTimeout(tm); };
  host.addEventListener('pointerup', cancel); host.addEventListener('pointercancel', cancel);
  host.addEventListener('pointermove', e => { if (pos && Math.hypot(e.clientX - pos.x, e.clientY - pos.y) > 9) cancel(); });
}
document.addEventListener('keydown', e => {
  const h = active; if (document.getElementById('msaBoard')) return;
  if (!hostOk(h) || document.querySelector('.overlay,.drawer-wrap,.fm-ctx')) { if (e.key === 'Escape') MSA.menu && MSA.menu.close && MSA.menu.close(); return; }
  if (e.target.closest && e.target.closest('input,select,textarea,[contenteditable=true]')) return;
  const c = h._ms.cfg, s = sets[c.key], mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'a' && !c.noKeys) { e.preventDefault(); selectAll(h); }
  else if (e.key === 'Escape' && (s.ids.size || s.mode)) { clear(c.key); }
  else if (e.key === 'Delete' && !c.noKeys && s.ids.size && c.entries(objs(h), null).some(x => x !== '-' && x.id === 'del')) { e.preventDefault(); c.run('del', objs(h), null); }
});
/* the bar/selection must not outlive the screen it belongs to */
setInterval(() => { if (bar && !hostOk(active)) { bar.remove(); bar = null; } }, 400);

/* toast with an Undo button; onExpire runs when the window passes without Undo */
function undoToast(msg, onUndo, onExpire, ms){
  const root = document.getElementById('toastRoot'); if (!root) { onExpire && onExpire(); return; }
  const el = document.createElement('div'); el.className = 'toast ok ms-undo'; el.innerHTML = I('check-c') + '<span></span><button class="btn sm">' + esc(T('تراجع', 'Undo')) + '</button>'; el.querySelector('span').textContent = msg;
  let done = false; const fin = (undo) => { if (done) return; done = true; clearTimeout(tm); el.remove(); if (undo) onUndo(); else onExpire && onExpire(); };
  el.querySelector('button').onclick = () => fin(true); const tm = setTimeout(() => fin(false), ms || 8000);
  root.appendChild(el);
  window.addEventListener('pagehide', () => fin(false), { once: true });
}
const dotColors = ['#e5484d', '#f59e0b', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
const dotNames = [['أحمر', 'Red'], ['برتقالي', 'Orange'], ['أصفر', 'Yellow'], ['أخضر', 'Green'], ['سماوي', 'Cyan'], ['أزرق', 'Blue'], ['بنفسجي', 'Purple'], ['وردي', 'Pink']];
const colorSub = (cur, prefix) => [{ id: prefix + ':', label: T('بدون لون', 'No colour'), icon: cur === '' ? 'check' : '' }].concat(dotColors.map((c, i) => ({ id: prefix + ':' + c, label: T(dotNames[i][0], dotNames[i][1]), dot: c, icon: cur === c ? 'check' : '' })));

MSA.multi = { attach, clear, selectAll: selectAll, ids: key => Array.from((sets[key] || { ids: [] }).ids), count: key => (sets[key] ? sets[key].ids.size : 0), undoToast, colorSub, COLORS: dotColors, bar: () => bar };
})();
